import { useState, useMemo, useCallback } from "react";
import Modal from "react-modal";
import { useTranslation } from "react-i18next";
import {
  Box,
  Flex,
  Grid,
  Heading,
  Text,
  Button,
  Input,
  Label,
  Checkbox,
  Spinner,
  Alert,
} from "theme-ui";
import {
  useStudentsTableQuery,
  useCreateBulkCourseEnrollmentsMutation,
  useBillingPreviewLazyQuery,
  StudentWhereInput,
} from "../../graphql/generated";

interface StudentEnrollmentModalProps {
  groupId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  enrolledStudentIds?: string[];
}

const formatDate = (value: string | Date): string => {
  const d = new Date(value);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
};
const toRFC3339Nano = (dateString: string): string => {
  const date = new Date(`${dateString}T00:00:00`);
  return date.toISOString().replace("Z", "000000Z");
};

const cellSx = {
  textAlign: "left",
  p: 2,
  borderBottom: "1px solid",
  borderColor: "muted",
  color: "text",
} as const;

const fieldSx = {
  color: "text",
  bg: "background",
  borderColor: "muted",
  borderRadius: "6px",
  p: 2,
  "&::placeholder": { color: "text", opacity: 0.5 },
  "&:focus": { borderColor: "primary", outline: "none" },
} as const;

export function StudentEnrollmentModal({
  groupId,
  isOpen,
  onClose,
  onSuccess,
  enrolledStudentIds = [],
}: StudentEnrollmentModalProps) {
  const { t } = useTranslation();
  const [step, setStep] = useState<"select" | "preview">("select");
  const [partialPrices, setPartialPrices] = useState<Record<number, number>>(
    {}
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(
    new Set()
  );
  const [startDate, setStartDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [endDate, setEndDate] = useState<string>("");
  const [discount, setDiscount] = useState<number>(0);

  const [
    fetchPreview,
    { data: previewData, loading: previewLoading, error: previewError },
  ] = useBillingPreviewLazyQuery({ fetchPolicy: "network-only" });

  const periods = previewData?.billingPreview?.periods ?? [];

  const buildWhereClause = useCallback((): StudentWhereInput | undefined => {
    if (!searchQuery.trim()) return undefined;
    const searchTerm = searchQuery.trim();
    return {
      or: [
        { firstNameContainsFold: searchTerm },
        { lastNameContainsFold: searchTerm },
        { emailContainsFold: searchTerm },
      ],
    };
  }, [searchQuery]);

  const { data: studentsData, loading: studentsLoading } =
    useStudentsTableQuery({
      variables: {
        offset: 0,
        limit: 10,
        where: buildWhereClause(),
        withTotalCount: true,
      },
      skip: !isOpen,
    });

  const [createBulkEnrollments, { loading: enrollLoading }] =
    useCreateBulkCourseEnrollmentsMutation();

  const filteredStudents = useMemo(() => {
    if (!studentsData?.studentsTable?.edges) return [];
    return studentsData.studentsTable.edges
      .map((edge) => edge?.node)
      .filter(
        (student): student is NonNullable<typeof student> =>
          student !== null &&
          student !== undefined &&
          !enrolledStudentIds.includes(student.id)
      );
  }, [studentsData, enrolledStudentIds]);

  const handleSelectStudent = useCallback((studentId: string) => {
    setSelectedStudentIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(studentId)) newSet.delete(studentId);
      else newSet.add(studentId);
      return newSet;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    if (selectedStudentIds.size === filteredStudents.length) {
      setSelectedStudentIds(new Set());
    } else {
      setSelectedStudentIds(new Set(filteredStudents.map((s) => s.id)));
    }
  }, [filteredStudents, selectedStudentIds.size]);

  const resetAndClose = () => {
    setStep("select");
    setPartialPrices({});
    onClose();
  };

  const handlePreview = async () => {
    if (selectedStudentIds.size === 0) {
      alert(
        t("enrollment.selectStudents") || "Please select at least one student"
      );
      return;
    }
    if (!startDate) {
      alert(t("enrollment.selectStartDate") || "Please select a start date");
      return;
    }

    const { data } = await fetchPreview({
      variables: {
        groupID: groupId,
        startAt: toRFC3339Nano(startDate),
        discount: discount,
      },
    });

    const defaults: Record<number, number> = {};
    data?.billingPreview?.periods.forEach((p, i) => {
      if (p.isPartial) defaults[i] = p.amount;
    });
    setPartialPrices(defaults);
    setStep("preview");
  };

  const handleEnroll = async () => {
    if (selectedStudentIds.size === 0) {
      alert(
        t("enrollment.selectStudents") || "Please select at least one student"
      );
      return;
    }

    try {
      const fragmentPrice = periods.find((p) => p.isPartial)
        ? partialPrices[periods.findIndex((p) => p.isPartial)] ??
          periods.find((p) => p.isPartial)!.amount
        : null;
      const enrollmentInputs = Array.from(selectedStudentIds).map(
        (studentId) => ({
          groupID: groupId,
          studentID: studentId,
          startAt: toRFC3339Nano(startDate),
          endAt: endDate ? toRFC3339Nano(endDate) : undefined,
          discount: discount / 100,
          creatorID: "1",
        })
      );
      await createBulkEnrollments({
        variables: {
          inputs: enrollmentInputs,
          fragmentPrice,
        },
      });
      setSelectedStudentIds(new Set());
      setSearchQuery("");
      setDiscount(0);
      setStep("select");
      setPartialPrices({});
      onSuccess?.();
      onClose();
      alert(t("enrollment.success") || "Students enrolled successfully!");
    } catch (error) {
      console.error("Error enrolling students:", error);
      alert(
        t("common.errorOccurred") ||
          "An error occurred while enrolling students"
      );
    }
  };

  const total = periods.reduce(
    (sum, p, i) =>
      sum + (p.isPartial ? partialPrices[i] ?? p.amount : p.amount),
    0
  );

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={resetAndClose}
      ariaHideApp={false}
      style={{
        overlay: {
          backgroundColor: "rgba(0, 0, 0, 0.65)",
          backdropFilter: "blur(4px)",
          zIndex: 1000,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        },
        content: {
          position: "relative",
          inset: "auto",
          width: "100%",
          maxWidth: "640px",
          margin: "0 16px",
          padding: 0,
          border: "none",
          background: "transparent",
          borderRadius: "12px",
          overflow: "visible",
        },
      }}
    >
      <Flex
        sx={{
          flexDirection: "column",
          maxHeight: "90vh",
          bg: "background",
          color: "text",
          borderRadius: "12px",
          borderColor: "muted",
          borderStyle: "solid",
          borderWidth: "1px",
          boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.4)",
        }}
      >
        {/* Header */}
        <Flex
          sx={{
            alignItems: "center",
            justifyContent: "space-between",
            p: 4,
            pb: 3,
          }}
        >
          <Heading as="h2" sx={{ color: "text", fontSize: 4 }}>
            {step === "select"
              ? t("dashboard.enrollStudent")
              : "Billing Preview"}
          </Heading>
          <Button
            onClick={resetAndClose}
            aria-label="Close"
            sx={{
              bg: "muted",
              color: "text",
              cursor: "pointer",
              px: 2,
              py: 0,
              fontSize: 4,
              lineHeight: 1.4,
              borderRadius: "6px",
              "&:hover": { opacity: 0.85 },
            }}
          >
            ×
          </Button>
        </Flex>

        {/* Body */}
        <Box sx={{ px: 4, pb: 3, overflowY: "auto", flex: 1 }}>
          {step === "select" && (
            <>
              <Grid columns={[1, 3]} gap={3} sx={{ mb: 3 }}>
                <Box>
                  <Label
                    htmlFor="start-date"
                    sx={{ fontWeight: "bold", color: "text" }}
                  >
                    Start Date
                  </Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    sx={fieldSx}
                  />
                </Box>
                <Box>
                  <Label
                    htmlFor="end-date"
                    sx={{ fontWeight: "bold", color: "text" }}
                  >
                    End Date (Optional)
                  </Label>
                  <Input
                    id="end-date"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    sx={fieldSx}
                  />
                </Box>
                <Box>
                  <Label
                    htmlFor="discount"
                    sx={{ fontWeight: "bold", color: "text" }}
                  >
                    Discount (%)
                  </Label>
                  <Input
                    id="discount"
                    type="number"
                    min={0}
                    max={100}
                    value={discount}
                    onChange={(e) =>
                      setDiscount(
                        Math.min(
                          100,
                          Math.max(0, parseInt(e.target.value) || 0)
                        )
                      )
                    }
                    sx={fieldSx}
                  />
                </Box>
              </Grid>

              <Input
                type="text"
                placeholder={
                  t("students.searchPlaceholder") ||
                  "Search students by name or email..."
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                sx={fieldSx}
              />

              <Text
                sx={{
                  fontSize: 1,
                  color: "text",
                  opacity: 0.7,
                  my: 2,
                  display: "block",
                }}
              >
                {searchQuery.trim() ? (
                  <>
                    Showing search results for "<strong>{searchQuery}</strong>"
                  </>
                ) : (
                  "Showing first 10 students • Search to find more"
                )}
              </Text>

              <Label
                sx={{
                  alignItems: "center",
                  mb: 2,
                  cursor: "pointer",
                  color: "text",
                }}
              >
                <Checkbox
                  checked={
                    filteredStudents.length > 0 &&
                    selectedStudentIds.size === filteredStudents.length
                  }
                  onChange={handleSelectAll}
                />
                {filteredStudents.length > 0
                  ? `Select All (${filteredStudents.length})`
                  : "No students available"}
              </Label>

              <Box
                sx={{
                  border: "1px solid",
                  borderColor: "muted",
                  borderRadius: "6px",
                  maxHeight: 260,
                  overflowY: "auto",
                }}
              >
                {studentsLoading ? (
                  <Flex sx={{ p: 3, justifyContent: "center" }}>
                    <Spinner size={24} />
                  </Flex>
                ) : filteredStudents.length > 0 ? (
                  filteredStudents.map((student) => (
                    <Box
                      key={student.id}
                      sx={{
                        px: 2,
                        borderBottom: "1px solid",
                        borderColor: "muted",
                        "&:last-of-type": { borderBottom: "none" },
                        "&:hover": { bg: "muted" },
                      }}
                    >
                      <Label
                        sx={{
                          alignItems: "center",
                          py: 2,
                          cursor: "pointer",
                          color: "text",
                        }}
                      >
                        <Checkbox
                          checked={selectedStudentIds.has(student.id)}
                          onChange={() => handleSelectStudent(student.id)}
                        />
                        <Flex sx={{ flexDirection: "column" }}>
                          <Text sx={{ fontWeight: "bold", color: "text" }}>
                            {student.firstName} {student.lastName}
                          </Text>
                          <Text
                            sx={{ fontSize: 1, color: "text", opacity: 0.7 }}
                          >
                            {student.email}
                          </Text>
                        </Flex>
                      </Label>
                    </Box>
                  ))
                ) : (
                  <Text
                    sx={{
                      p: 3,
                      textAlign: "center",
                      color: "text",
                      opacity: 0.7,
                      display: "block",
                    }}
                  >
                    {enrolledStudentIds.length > 0
                      ? "All available students are already enrolled"
                      : "No students found"}
                  </Text>
                )}
              </Box>

              <Text sx={{ mt: 2, color: "text", display: "block" }}>
                <strong>{selectedStudentIds.size}</strong> student(s) selected
              </Text>
            </>
          )}

          {step === "preview" && (
            <Box>
              {previewLoading && (
                <Flex sx={{ p: 3, justifyContent: "center" }}>
                  <Spinner size={24} />
                </Flex>
              )}
              {previewError && (
                <Alert variant="error">{previewError.message}</Alert>
              )}

              {periods.length > 0 && (
                <>
                  <Text sx={{ fontSize: 1, color: "text", opacity: 0.7 }}>
                    Group ends:{" "}
                    {formatDate(previewData!.billingPreview.groupEndDate)}
                  </Text>

                  <Box
                    as="table"
                    sx={{ width: "100%", borderCollapse: "collapse", my: 3 }}
                  >
                    <thead>
                      <tr>
                        {["Period", "Type", "Amount"].map((h) => (
                          <Box
                            as="th"
                            key={h}
                            sx={{
                              ...cellSx,
                              bg: "muted",
                              borderBottomWidth: "2px",
                            }}
                          >
                            {h}
                          </Box>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {periods.map((p, i) => (
                        <tr key={i}>
                          <Box as="td" sx={cellSx}>
                            {formatDate(p.start)} – {formatDate(p.end)}
                          </Box>
                          <Box as="td" sx={cellSx}>
                            {p.isPartial ? "Partial" : "Full"}
                          </Box>
                          <Box as="td" sx={cellSx}>
                            {p.isPartial ? (
                              <Input
                                type="number"
                                min={0}
                                sx={{ ...fieldSx, width: 110 }}
                                value={partialPrices[i] ?? p.amount}
                                onChange={(e) =>
                                  setPartialPrices((prev) => ({
                                    ...prev,
                                    [i]: Math.max(
                                      0,
                                      parseFloat(e.target.value) || 0
                                    ),
                                  }))
                                }
                              />
                            ) : (
                              p.amount
                            )}
                          </Box>
                        </tr>
                      ))}
                    </tbody>
                  </Box>

                  <Text
                    sx={{
                      textAlign: "right",
                      fontSize: 2,
                      color: "text",
                      display: "block",
                    }}
                  >
                    Total per student: <strong>{total}</strong>
                  </Text>
                </>
              )}
            </Box>
          )}
        </Box>

        {/* Footer */}
        <Flex sx={{ justifyContent: "flex-end", gap: 2, p: 4, pt: 3 }}>
          {step === "select" ? (
            <>
              <Button
                variant="secondary"
                onClick={resetAndClose}
                sx={{
                  bg: "muted",
                  color: "text",
                  cursor: "pointer",
                  px: 3,
                  py: 2,
                  borderRadius: "6px",
                  "&:hover": { opacity: 0.85 },
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handlePreview}
                disabled={selectedStudentIds.size === 0 || previewLoading}
                sx={{
                  bg: "primary",
                  color: "background",
                  px: 3,
                  py: 2,
                  borderRadius: "6px",
                  cursor:
                    selectedStudentIds.size === 0 ? "not-allowed" : "pointer",
                  opacity: selectedStudentIds.size === 0 ? 0.5 : 1,
                  "&:hover": {
                    opacity: selectedStudentIds.size === 0 ? 0.5 : 0.9,
                  },
                }}
              >
                {previewLoading ? "Loading..." : "Preview"}
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="secondary"
                onClick={() => setStep("select")}
                disabled={enrollLoading}
                sx={{
                  bg: "muted",
                  color: "text",
                  cursor: "pointer",
                  px: 3,
                  py: 2,
                  borderRadius: "6px",
                  "&:hover": { opacity: 0.85 },
                }}
              >
                Back
              </Button>
              <Button
                onClick={handleEnroll}
                disabled={enrollLoading || periods.length === 0}
                sx={{
                  bg: "primary",
                  color: "background",
                  px: 3,
                  py: 2,
                  borderRadius: "6px",
                  cursor: enrollLoading ? "not-allowed" : "pointer",
                  opacity: enrollLoading || periods.length === 0 ? 0.5 : 1,
                  "&:hover": { opacity: enrollLoading ? 0.5 : 0.9 },
                }}
              >
                {enrollLoading
                  ? "Enrolling..."
                  : `Confirm & Enroll ${selectedStudentIds.size} Student(s)`}
              </Button>
            </>
          )}
        </Flex>
      </Flex>
    </Modal>
  );
}
