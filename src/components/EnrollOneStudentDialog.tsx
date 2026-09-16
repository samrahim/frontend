import { useEffect, useState } from "react";
import {
  useCreateBulkCourseEnrollmentsMutation,
  useGroupsTableQuery,
} from "../graphql";
import { useAuth } from "../contexts/AuthContext";
import { Box, Button, Input, Label, Flex, Text, Select } from "theme-ui";
import { useTranslation } from "react-i18next";

export function EnrollOneStudentModel({
  open,
  onClose,
  onCreated,
  studentId,
  studentEnrollements,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  studentId: string;
  studentEnrollements: string[];
}) {
  const { t } = useTranslation();
  const { user } = useAuth();

  // --- Form State ---
  const [groupId, setGroupId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [discount, setDiscount] = useState<number>(0);

  useEffect(() => {
    studentEnrollements.map((e) => {
      console.log(e);
    });
  });
  // --- GraphQL Queries & Mutations ---
  const LIMIT = 50;
  const { data: groupsData, loading: groupsLoading } = useGroupsTableQuery({
    variables: {
      offset: 0,
      limit: LIMIT,
      withTotalCount: true,
      where: {
        hasCourseWith: [
          {
            idNotIn: studentEnrollements,
          },
        ],
      },
    },
    notifyOnNetworkStatusChange: true,
  });

  const [createCourseEnrollment, { loading: isSubmitting }] =
    useCreateBulkCourseEnrollmentsMutation();

  if (!open) return null;

  // --- Helper Functions ---
  const toRFC3339Nano = (date: string) => {
    if (!date) return undefined;
    const d = new Date(`${date}T00:00:00`);
    return d.toISOString().replace("Z", "000000Z");
  };

  const handleSubmit = async () => {
    if (!groupId) {
      alert("Please select a group");
      return;
    }

    if (!studentId) {
      alert("Student ID is missing from URL parameters");
      return;
    }

    try {
      await createCourseEnrollment({
        variables: {
          inputs: [
            {
              studentID: studentId,
              groupID: groupId,
              creatorID: user?.id?.toString() || "",
              startAt: startDate ? toRFC3339Nano(startDate) : undefined,
              endAt: endDate ? toRFC3339Nano(endDate) : undefined,
              discount: discount ? discount / 100 : 0, // Convert percentage to decimal
            },
          ],
        },
        refetchQueries: ["GetStudentDetails"],
        awaitRefetchQueries: true,
      });

      onCreated();
      onClose();
    } catch (error) {
      console.error("Failed to enroll student:", error);
    }
  };

  // Safe extraction of group options from GraphQL
  const groupOptions: any[] =
    groupsData?.groupsTable?.edges?.map((e) => e?.node).filter(Boolean) ?? [];

  return (
    <Box
      sx={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        bg: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
      }}
    >
      <Box
        sx={{
          bg: "background",
          p: 4,
          borderRadius: "lg",
          width: "420px",
          boxShadow: "lg",
        }}
      >
        <Text as="h3" sx={{ mb: 3, fontSize: 3, fontWeight: "heading" }}>
          {t("enrollment.title", "Enroll Student in Group")}
        </Text>

        <Flex sx={{ flexDirection: "column", gap: 3 }}>
          {/* Select Group */}
          <Box>
            <Label htmlFor="groupId">
              {t("enrollment.group", "Select Group")}
              <Text as="span" sx={{ color: "red", ml: 1 }}>
                *
              </Text>
            </Label>
            <Select
              id="groupId"
              value={groupId}
              onChange={(e) => setGroupId(e.target.value)}
              disabled={groupsLoading}
            >
              <option value="">
                {groupsLoading ? "Loading groups..." : "-- Select Group --"}
              </option>
              {groupOptions.map((group: any) => (
                <option key={group.id} value={group.id}>
                  {group.name || group.title || `Group #${group.id}`}
                </option>
              ))}
            </Select>
          </Box>

          {/* Start Date */}
          <Box>
            <Label htmlFor="startDate">
              {t("enrollment.startDate", "Start Date")}
            </Label>
            <Input
              id="startDate"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </Box>

          {/* End Date */}
          <Box>
            <Label htmlFor="endDate">
              {t("enrollment.endDate", "End Date")}
            </Label>
            <Input
              id="endDate"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </Box>

          {/* Discount (%) */}
          <Box>
            <Label htmlFor="discount">
              {t("enrollment.discount", "Discount (%)")}
            </Label>
            <Input
              id="discount"
              type="number"
              min="0"
              max="100"
              placeholder="0"
              value={discount || ""}
              onChange={(e) => setDiscount(Number(e.target.value))}
            />
          </Box>

          {/* Actions */}
          <Flex sx={{ gap: 2, mt: 3, justifyContent: "flex-end" }}>
            <Button variant="secondary" onClick={onClose} type="button">
              {t("common.cancel", "Cancel")}
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? "Enrolling..." : "Enroll Student"}
            </Button>
          </Flex>
        </Flex>
      </Box>
    </Box>
  );
}
