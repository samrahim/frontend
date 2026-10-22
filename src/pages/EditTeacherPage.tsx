import { useNavigate, useParams } from "react-router-dom";
import { gql } from "@apollo/client";
import { Box, Button, Card, Flex, Input, Label, Select, Text } from "theme-ui";
import {
  TeacherGender,
  useGetTeacherDetailsQuery,
  useUpdateTeacherMutation,
  useStopTeacherMutation,
  TeacherPaymentType,
  TeacherPaymentFrequency,
} from "../graphql";
import { useEffect, useMemo, useState } from "react";
import { Layout } from "../components/Layout";
import { LuContact, LuUser } from "react-icons/lu";
import { t } from "i18next";
import PhoneInputSource from "react-phone-input-2";
import "react-phone-input-2/lib/style.css"; // تأكد أيضاً من استيراد الـ CSS إذا لم تكن قد استوردته مسبقاً
const PhoneInput = (PhoneInputSource as any).default || PhoneInputSource;
import {
  ColumnDef,
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";

interface FormAssignment {
  id: string;
  subjectName: string;
  groupName: string;
  isStopped: boolean;
}
interface TeacherForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  gender: TeacherGender;
  dateOfBirth: string;

  address: string;
  assignments: FormAssignment[];
  paymentType: TeacherPaymentType | "";
  paymentFrequency: TeacherPaymentFrequency | "";
  paymentAnchorDate: string; // YYYY-MM-DD or ""
  paymentAmount: number; // string so it can be empty
}

const TeacherEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data, loading, error, refetch } = useGetTeacherDetailsQuery({
    variables: { id: id || "" },
    skip: !id,
  });

  const teacher =
    data?.node && data.node.__typename === "Teacher" ? data.node : null;
  const hasPayrolls = (teacher?.payrolls?.length ?? 0) > 0;
  const isOnceLocked =
    hasPayrolls && teacher?.paymentType === TeacherPaymentType.Once;

  const typeLocked = hasPayrolls;
  const allPaymentLocked = isOnceLocked;

  const switchableFreqs = [
    TeacherPaymentFrequency.Weekly,
    TeacherPaymentFrequency.Biweekly,
    TeacherPaymentFrequency.Monthly,
  ];
  const frequencyOptions = hasPayrolls
    ? switchableFreqs
    : Object.values(TeacherPaymentFrequency);
  const frequencyLocked =
    allPaymentLocked ||
    (hasPayrolls &&
      !!teacher?.paymentFrequency &&
      !switchableFreqs.includes(teacher.paymentFrequency));

  const [form, setForm] = useState<TeacherForm>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    gender: TeacherGender.Male,
    dateOfBirth: "",
    paymentAmount: 0,
    address: "",
    assignments: [],
    paymentAnchorDate: "",
    paymentFrequency: TeacherPaymentFrequency.Biweekly,
    paymentType: TeacherPaymentType.Hourly,
  });

  const toInputDate = (iso?: string | null) => {
    if (!iso) return "";
    const d = new Date(iso);
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${d.getFullYear()}-${m}-${day}`;
  };

  const mapTeacherToForm = (teacher: any): TeacherForm => ({
    firstName: teacher.firstName || "",
    lastName: teacher.lastName || "",
    email: teacher.email || "",
    phone: teacher.phone || "",
    gender: teacher.gender ?? TeacherGender.Male,
    dateOfBirth: teacher.dateOfBirth ? teacher.dateOfBirth.split("T")[0] : "",
    address: teacher.address || "",
    paymentType: teacher.paymentType ?? "",
    paymentFrequency: teacher.paymentFrequency ?? "",
    paymentAnchorDate: toInputDate(teacher.paymentAnchorDate),
    paymentAmount: teacher.paymentAmount ? teacher.paymentAmount : 0,
    assignments: (teacher.assignments || []).map((a: any) => ({
      id: a.id,
      subjectName: a.subject?.name || "",
      groupName: a.group?.name || "",
      isStopped: Boolean(a.stoppedAt),
    })),
  });
  useEffect(() => {
    if (teacher) setForm(mapTeacherToForm(teacher));
  }, [teacher]);

  const isDirty = useMemo(() => {
    if (!teacher) return false;
    const original = mapTeacherToForm(teacher);
    // Layer A: Profile Fields Check
    const teacherChanged =
      form.firstName !== original.firstName ||
      form.lastName !== original.lastName ||
      form.email !== original.email ||
      form.phone !== original.phone ||
      form.gender !== original.gender ||
      form.address !== original.address ||
      form.dateOfBirth !== original.dateOfBirth ||
      form.paymentType !== original.paymentType ||
      form.paymentFrequency !== original.paymentFrequency ||
      form.paymentAnchorDate !== original.paymentAnchorDate ||
      form.paymentAmount !== original.paymentAmount;

    // Layer B: Deep Assignment Comparison
    // const baselineAssignments = (teacher.assignments || []).map((a) => ({
    //   id: a.id,
    //   subjectName: a.subject?.name || "",
    //   groupName: a.group?.name || "",
    //   isStopped: Boolean(a.stoppedAt),
    // }));

    // const assignmentsChanged =
    // JSON.stringify(form.assignments) !== JSON.stringify(baselineAssignments);

    return teacherChanged;
  }, [form, teacher]);

  const [updateTeacher, { loading: updating }] = useUpdateTeacherMutation();
  const [stopTeacher, { loading: stoppingAssignment }] =
    useStopTeacherMutation();
  const [paymentError, setPaymentError] = useState("");
  const handleSave = async () => {
    if (!id || !teacher) return;
    setPaymentError("");

    const filled = [
      form.paymentType,
      form.paymentFrequency,
      form.paymentAnchorDate,
      form.paymentAmount,
    ].filter((v) => v !== "").length;

    // all-or-nothing: partial config would be silently ignored by the cron
    if (filled !== 0 && filled !== 4) {
      setPaymentError(
        "Fill all payment fields (type, frequency, start date, amount) or leave them all empty."
      );
      return;
    }
    if (filled === 4 && Number(form.paymentAmount) <= 0) {
      setPaymentError("Amount must be greater than 0.");
      return;
    }

    const paymentInput =
      filled === 4 && !allPaymentLocked
        ? {
            paymentType: form.paymentType as TeacherPaymentType,
            paymentFrequency: form.paymentFrequency as TeacherPaymentFrequency,
            // noon local time: stays on the same calendar day in any timezone
            paymentAnchorDate: new Date(
              `${form.paymentAnchorDate}T12:00:00`
            ).toISOString(),
            paymentAmount: Number(form.paymentAmount),
          }
        : {};

    try {
      const response = await updateTeacher({
        variables: {
          id: teacher.id,
          input: {
            firstName: form.firstName,
            lastName: form.lastName,
            dateOfBirth: form.dateOfBirth
              ? new Date(form.dateOfBirth).toISOString()
              : null,
            email: form.email,
            phone: form.phone,
            gender: form.gender,
            address: form.address,
            ...paymentInput,
          },
        },
      });
      if (response.data) refetch();
    } catch (e: any) {
      // backend validation errors (locked fields) appear here
      setPaymentError(e?.message || "Failed to save changes");
    }
  };
  const handleDiscard = () => teacher && setForm(mapTeacherToForm(teacher));

  const handleToggleStopAssignment = async (assignmentId: string) => {
    console.log("Attempting to stop assignment with ID:", assignmentId);
    try {
      await stopTeacher({
        variables: { id: assignmentId },
        onCompleted: () => {
          // Update the local form state to reflect the stopped assignment
          setForm((prevForm) => ({
            ...prevForm,
            assignments: prevForm.assignments.map((item) =>
              item.id === assignmentId ? { ...item, isStopped: true } : item
            ),
          }));
          // refetch(); // Refresh the data to reflect the stopped assignment
        },
        onError: (error) => {
          console.error("Failed to stop assignment:", error);
        },
      });
    } catch (error) {
      console.error("Failed to stop assignment:", error);
    }
  };

  const bgColor = "var(--theme-ui-colors-background)";
  const textColor = "var(--theme-ui-colors-text)";

  // Strongly typed column definitions mapping against our localized form state definition
  const columnHelper = createColumnHelper<FormAssignment>();
  const columns = useMemo(
    () => [
      columnHelper.accessor("subjectName", {
        header: "Subject",
        cell: (info) => info.getValue() || "N/A",
      }),
      columnHelper.accessor("groupName", {
        header: "Group",
        cell: (info) => info.getValue() || "N/A",
      }),
      columnHelper.accessor("isStopped", {
        header: "Status",
        cell: (info) => {
          const isStopped = info.getValue();
          return isStopped ? "❌ Inactive" : "✅ Active";
        },
      }),
      columnHelper.accessor("id", {
        header: "Actions",
        cell: (info) => {
          const row = info.row.original;
          return (
            <Button
              variant="secondary"
              onClick={() => handleToggleStopAssignment(row.id)} // Fixed execution invocation
              disabled={row.isStopped || stoppingAssignment}
              sx={{
                cursor: "pointer",
                fontSize: 1,
                py: 1,
                px: 2,
                bg: row.isStopped ? "muted" : "orange",
                color: row.isStopped ? "text" : "white",
              }}
            >
              {row.isStopped
                ? "Stopped"
                : stoppingAssignment
                ? "Stopping..."
                : "Stop"}
            </Button>
          );
        },
      }),
    ],
    []
  );

  // Fixed: Connect table mapping directly to form state array to show reactive UI updates
  const table = useReactTable({
    data: form.assignments,
    columns: columns as ColumnDef<FormAssignment>[],
    getCoreRowModel: getCoreRowModel(),
  });

  if (loading)
    return (
      <Layout>
        <Text p={4}>Loading...</Text>
      </Layout>
    );
  if (error)
    return (
      <Layout>
        <Text p={4}>Error loading teacher data.</Text>
      </Layout>
    );
  if (!teacher)
    return (
      <Layout>
        <Text p={4}>Teacher data record not found.</Text>
      </Layout>
    );

  return (
    <Layout>
      <Box sx={{ maxWidth: "800px", mx: "auto", p: 3, position: "relative" }}>
        <Flex sx={{ alignItems: "center", gap: 3, mb: 4 }}>
          <Button
            onClick={() => navigate("/teachers")}
            sx={{ bg: "muted", color: "text", cursor: "pointer" }}
          >
            {t("common.back")}
          </Button>
          <Text as="h1" sx={{ fontSize: 5, fontWeight: "bold" }}>
            {t("teachers.edit")}
          </Text>
        </Flex>

        {isDirty && (
          <Flex
            sx={{
              width: "100%",
              justifyContent: "flex-end",
              gap: 3,
              alignItems: "center",
              p: 2,
              mb: 3,
            }}
          >
            <Text sx={{ color: "orange", fontWeight: "medium", fontSize: 1 }}>
              You have unsaved changes
            </Text>
            <Button
              onClick={handleDiscard}
              sx={{
                bg: "transparent",
                border: "1px solid",
                borderColor: "border",
                color: "text",
                cursor: "pointer",
                "&:hover": { bg: "muted" },
              }}
            >
              Discard
            </Button>
            <Button
              onClick={handleSave}
              sx={{
                bg: "primary",
                color: "white",
                px: 4,
                cursor: "pointer",
                fontWeight: "bold",
                "&:disabled": { opacity: 0.6 },
              }}
            >
              {updating ? "Saving Changes..." : "Save Changes"}
            </Button>
          </Flex>
        )}

        <Box
          sx={{
            p: [3, 4],
            borderRadius: "xl",
            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
            border: "1px solid",
            borderColor: "border",
            bg: "background",
            mb: 4,
          }}
        >
          {/* PERSONAL INFO CONTAINER */}
          <Box
            sx={{
              mb: 5,
              pb: 3,
              borderBottom: "1px solid",
              borderColor: "border",
            }}
          >
            <Flex sx={{ alignItems: "center", gap: 3, mb: 4 }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  p: 2,
                  bg: "muted",
                  borderRadius: "md",
                  color: "primary",
                }}
              >
                <LuUser size={28} />
              </Box>
              <Text
                as="h2"
                sx={{ fontSize: 4, fontWeight: "bold", color: "text" }}
              >
                {t("students.personalInformation")}
              </Text>
            </Flex>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: ["1fr", "1fr 1fr"],
                columnGap: 4,
                rowGap: 3,
              }}
            >
              {/* First Name */}
              <Box>
                <Label htmlFor="firstName" sx={{ fontWeight: "bold", mb: 2 }}>
                  {t("students.firstName")}
                </Label>
                <Box sx={{ position: "relative", width: "100%" }}>
                  <Box
                    sx={{
                      position: "absolute",
                      top: "50%",
                      left: 3,
                      transform: "translateY(-50%)",
                      display: "flex",
                      alignItems: "center",
                      pointerEvents: "none",
                      color: "primary",
                    }}
                  >
                    <LuUser size={22} />
                  </Box>
                  <Input
                    id="firstName"
                    name="firstName"
                    value={form.firstName}
                    placeholder="e.g. Ahmed"
                    onChange={(e) =>
                      setForm({ ...form, firstName: e.target.value })
                    }
                    sx={{ pl: "40px !important", width: "100%" }}
                    required
                  />
                </Box>
              </Box>

              {/* Last Name */}
              <Box>
                <Label htmlFor="lastName" sx={{ fontWeight: "bold", mb: 2 }}>
                  {t("students.lastName")}
                </Label>
                <Box sx={{ position: "relative", width: "100%" }}>
                  <Box
                    sx={{
                      position: "absolute",
                      top: "50%",
                      left: 3,
                      transform: "translateY(-50%)",
                      display: "flex",
                      alignItems: "center",
                      pointerEvents: "none",
                      color: "primary",
                    }}
                  >
                    <LuUser size={22} />
                  </Box>
                  <Input
                    id="lastName"
                    name="lastName"
                    value={form.lastName}
                    placeholder="e.g. Benali"
                    onChange={(e) =>
                      setForm({ ...form, lastName: e.target.value })
                    }
                    sx={{ pl: "40px !important", width: "100%" }}
                    required
                  />
                </Box>
              </Box>

              {/* Email Address */}
              <Box>
                <Label htmlFor="email" sx={{ fontWeight: "bold", mb: 2 }}>
                  {t("students.email")}
                </Label>
                <Box sx={{ position: "relative", width: "100%" }}>
                  <Box
                    sx={{
                      position: "absolute",
                      top: "50%",
                      left: 3,
                      transform: "translateY(-50%)",
                      display: "flex",
                      alignItems: "center",
                      pointerEvents: "none",
                      color: "primary",
                    }}
                  >
                    <LuContact size={22} />
                  </Box>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={form.email}
                    placeholder="e.g. Ahmed@email.com"
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                    sx={{ pl: "40px !important", width: "100%" }}
                    required
                  />
                </Box>
              </Box>

              {/* Phone Input */}
              <Box>
                <Label htmlFor="phone" sx={{ fontWeight: "bold", mb: 2 }}>
                  {t("students.phone")}
                  <Text as="span" sx={{ color: "indigo", ml: 1 }}>
                    *
                  </Text>
                </Label>
                <Box
                  sx={{
                    width: "100%",
                    "& .react-tel-input": { width: "100%" },
                    "& .form-control": {
                      width: "100% !important",
                      height: "42px !important",
                      backgroundColor: `${bgColor} !important`,
                      color: `${textColor} !important`,
                      border: "1px solid !important",
                      borderColor: "border !important",
                      borderRadius: "6px !important",
                      paddingLeft: "58px !important",
                    },
                  }}
                >
                  <PhoneInput
                    placeholder="6XX XXX XXX"
                    country={"dz"}
                    value={form.phone}
                    onChange={(phone) =>
                      setForm({ ...form, phone: "+" + phone })
                    }
                    enableSearch={true}
                  />
                </Box>
              </Box>

              {/* Date Of Birth */}
              <Box>
                <Label htmlFor="dateOfBirth" sx={{ fontWeight: "bold", mb: 2 }}>
                  {t("students.dateOfBirth")}
                  <Text as="span" sx={{ color: "indigo", ml: 1 }}>
                    *
                  </Text>
                </Label>
                <Input
                  type="date"
                  id="dateOfBirth"
                  name="dateOfBirth"
                  value={form.dateOfBirth}
                  onChange={(e) =>
                    setForm({ ...form, dateOfBirth: e.target.value })
                  }
                  onClick={(e) => e.currentTarget.showPicker?.()}
                  max={new Date().toISOString().split("T")[0]}
                  required
                  sx={{
                    height: "42px",
                    borderColor: "border",
                    width: "100%",
                    cursor: "pointer",
                  }}
                />
              </Box>

              {/* Gender Selection */}
              <Box>
                <Label sx={{ fontWeight: "bold", mb: 2 }}>
                  {t("students.gender")}
                </Label>
                <Flex sx={{ gap: 2, height: "42px" }}>
                  {Object.values(TeacherGender).map((g) => (
                    <Box
                      key={g}
                      onClick={() => setForm({ ...form, gender: g })}
                      sx={{
                        flex: 1,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        border: "1px solid",
                        borderColor: form.gender === g ? "primary" : "border",
                        bg: form.gender === g ? "muted" : "transparent",
                        borderRadius: "md",
                        cursor: "pointer",
                        fontWeight: form.gender === g ? "bold" : "normal",
                        transition: "all 0.2s",
                      }}
                    >
                      {t(`students.${g.toLowerCase()}`)}
                    </Box>
                  ))}
                </Flex>
              </Box>
            </Box>
          </Box>
        </Box>

        <Card
          sx={{
            p: 4,
            mb: 4,
            bg: "background",
            border: "1px solid",
            borderColor: "border",
            borderRadius: "lg",
          }}
        >
          <Text sx={{ fontSize: 3, fontWeight: "bold", mb: 2 }}>
            {t("paymentSettings.title")}
          </Text>

          {!teacher.paymentType && (
            <Text
              sx={{ color: "orange", fontSize: 1, mb: 3, display: "block" }}
            >
              {t("paymentSettings.notConfigured")}
            </Text>
          )}
          {isOnceLocked && (
            <Text
              sx={{ color: "orange", fontSize: 1, mb: 3, display: "block" }}
            >
              {t("paymentSettings.onceLocked")}
            </Text>
          )}
          {hasPayrolls && !isOnceLocked && (
            <Text sx={{ fontSize: 1, mb: 3, display: "block", opacity: 0.8 }}>
              {t("paymentSettings.futureOnly")}
            </Text>
          )}

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: ["1fr", "1fr 1fr"],
              columnGap: 4,
              rowGap: 3,
            }}
          >
            {/* Payment Type */}
            <Box
              onClick={() => {
                if (typeLocked) {
                  alert(t("paymentSettings.alerts.typeLocked"));
                }
              }}
            >
              <Label sx={{ fontWeight: "bold", mb: 2 }}>
                {t("paymentSettings.typeLabel")}
              </Label>
              <Select
                value={form.paymentType}
                disabled={typeLocked}
                onChange={(e) =>
                  setForm({
                    ...form,
                    paymentType: e.target.value as TeacherPaymentType | "",
                  })
                }
                sx={{ cursor: typeLocked ? "not-allowed" : "pointer" }}
              >
                <option value="">{t("paymentSettings.notSet")}</option>
                {Object.values(TeacherPaymentType).map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </Select>
            </Box>

            {/* Frequency */}
            <Box
              onClick={() => {
                if (frequencyLocked) {
                  alert(t("paymentSettings.alerts.frequencyLocked"));
                }
              }}
            >
              <Label sx={{ fontWeight: "bold", mb: 2 }}>
                {t("paymentSettings.frequencyLabel")}
              </Label>
              <Select
                value={form.paymentFrequency}
                disabled={frequencyLocked}
                onChange={(e) =>
                  setForm({
                    ...form,
                    paymentFrequency: e.target.value as
                      | TeacherPaymentFrequency
                      | "",
                  })
                }
                sx={{ cursor: frequencyLocked ? "not-allowed" : "pointer" }}
              >
                {!hasPayrolls && (
                  <option value="">{t("paymentSettings.notSet")}</option>
                )}
                {frequencyOptions.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </Select>
            </Box>

            {/* Start Date / Payment Date */}
            <Box
              onClick={() => {
                if (allPaymentLocked) {
                  alert(t("paymentSettings.alerts.dateLocked"));
                }
              }}
            >
              <Label sx={{ fontWeight: "bold", mb: 2 }}>
                {form.paymentType === TeacherPaymentType.Once
                  ? t("paymentSettings.paymentDateLabel")
                  : t("paymentSettings.startDateLabel")}
              </Label>
              <Input
                type="date"
                value={form.paymentAnchorDate}
                disabled={allPaymentLocked}
                onChange={(e) =>
                  setForm({ ...form, paymentAnchorDate: e.target.value })
                }
                onClick={(e) => {
                  if (!allPaymentLocked) e.currentTarget.showPicker?.();
                }}
                sx={{ cursor: allPaymentLocked ? "not-allowed" : "pointer" }}
              />
            </Box>

            {/* Amount */}
            <Box
              onClick={() => {
                if (allPaymentLocked) {
                  alert(t("paymentSettings.alerts.amountLocked"));
                }
              }}
            >
              <Label sx={{ fontWeight: "bold", mb: 2 }}>
                {form.paymentType === TeacherPaymentType.Hourly
                  ? t("paymentSettings.pricePerHour")
                  : form.paymentType === TeacherPaymentType.Once
                  ? t("paymentSettings.fixedAmount")
                  : t("paymentSettings.pricePerSession")}
              </Label>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={form.paymentAmount}
                disabled={allPaymentLocked}
                onChange={(e) =>
                  setForm({ ...form, paymentAmount: Number(e.target.value) })
                }
                sx={{ cursor: allPaymentLocked ? "not-allowed" : "pointer" }}
              />
            </Box>
          </Box>

          {!hasPayrolls &&
            form.paymentAnchorDate &&
            form.paymentType !== TeacherPaymentType.Once && (
              <Text sx={{ fontSize: 1, mt: 3, display: "block", opacity: 0.8 }}>
                {t("paymentSettings.firstPayrollNote")}
              </Text>
            )}

          {paymentError && (
            <Text sx={{ color: "red", fontSize: 1, mt: 3, display: "block" }}>
              {paymentError}
            </Text>
          )}
        </Card>
        {/* Dynamic Assignments Table Card */}
        <Card
          sx={{
            p: 4,
            mb: 4,
            bg: "background",
            border: "1px solid",
            borderColor: "border",
            borderRadius: "lg",
          }}
        >
          <Text sx={{ fontSize: 3, fontWeight: "bold", mb: 3 }}>
            Assignments ({form.assignments.length})
          </Text>

          <Box sx={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                {table.getHeaderGroups().map((hg) => (
                  <tr key={hg.id}>
                    {hg.headers.map((h) => (
                      <th key={h.id} style={{ textAlign: "left", padding: 8 }}>
                        {flexRender(h.column.columnDef.header, h.getContext())}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>

              <tbody>
                {table.getRowModel().rows.map((row) => (
                  <tr key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} style={{ padding: 8 }}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </Box>
        </Card>
      </Box>
    </Layout>
  );
};

export default TeacherEditPage;
