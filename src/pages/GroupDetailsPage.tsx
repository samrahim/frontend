import { useEffect, useState } from "react";
import { useMutation } from "@apollo/client";
import { useNavigate, useParams } from "react-router-dom";
import {
  UpdateGroupDocument,
  useGetGroupDetailsCompleteQuery,
  useUpdateCourseEnrollmentMutation,
} from "../graphql/generated";
import { Layout } from "../components/Layout";
import {
  Badge,
  Box,
  Button,
  Card,
  Flex,
  Heading,
  Input,
  Label,
  Text,
} from "theme-ui";

import { InfoItem } from "../components/InfoItem";
import {
  LuCalendar,
  LuClock3,
  LuDollarSign,
  LuGraduationCap,
  LuUser,
  LuUsers,
  LuWallet,
} from "react-icons/lu";
import TeachingAssignmentsCard from "../components/groupTeachingCard";
import { StudentEnrollmentModal } from "../components/StudentComponents/StudentEnrollmentModal";
import { t } from "i18next";

const DEFAULT_GROUP_COLOR = "#4CAF50";

const hexToInt = (hex: string): number => {
  const cleanHex = hex.replace("#", "");
  return parseInt(cleanHex, 16) || 0;
};

const intToHex = (colorInt: number | null | undefined): string => {
  if (colorInt === null || colorInt === undefined) return DEFAULT_GROUP_COLOR;
  return `#${colorInt.toString(16).padStart(6, "0")}`;
};

const GroupDetailsPage: React.FC = () => {
  const [enrollmentModalOpen, setEnrollmentModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [stopEnrollmentModalOpen, setStopEnrollmentModalOpen] = useState(false);
  const [enrollmentToStop, setEnrollmentToStop] = useState<any>(null);

  const [selectedEnrollment, setSelectedEnrollment] = useState<any>(null);
  const [groupName, setGroupName] = useState("");
  const [groupColor, setGroupColor] = useState(DEFAULT_GROUP_COLOR);
  const { id } = useParams<{ id: string }>();

  const {
    data: groupDetails,
    loading,
    error,
    refetch,
  } = useGetGroupDetailsCompleteQuery({
    variables: { id: id || "" },

    skip: !id,
  });
  const group = groupDetails?.groupDetails;
  const navigate = useNavigate();
  const [showAllStudents, setShowAllStudents] = useState(false);
  const [updateGroup, { loading: updatingGroup }] =
    useMutation(UpdateGroupDocument);
  const [updateCourseEnrollment, { loading: updatingEnrollment }] =
    useUpdateCourseEnrollmentMutation();

  useEffect(() => {
    if (!group) return;
    setGroupName(group.name || "");
    setGroupColor(intToHex(group.color));
  }, [group]);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "";

    const [year, month, day] = dateStr.split("T")[0].split("-");

    return `${day}-${month}-${year}`;
  };

  const visibleStudents = showAllStudents
    ? group?.course
    : group?.course?.slice(0, 5);

  const formatDateTime = (dateStr?: string | null) => {
    if (!dateStr) return "N/A";

    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) return "N/A";

    return date.toLocaleString();
  };

  const openEditModal = () => {
    setGroupName(group?.name || "");
    setGroupColor(intToHex(group?.color));
    setEditModalOpen(true);
  };

  const handleSaveGroup = async () => {
    const trimmedName = groupName.trim();

    if (!group?.id) return;
    if (!trimmedName) {
      window.alert("Group name is required");
      return;
    }

    try {
      await updateGroup({
        variables: {
          id: group.id,
          input: {
            name: trimmedName,
            color: hexToInt(groupColor),
          },
        },
      });

      setEditModalOpen(false);
    } catch (saveError) {
      console.error("Failed to update group:", saveError);
      window.alert("Failed to update group. Please try again.");
    }
  };

  const openStopEnrollmentModal = (enrollment: any) => {
    setEnrollmentToStop(enrollment);
    setStopEnrollmentModalOpen(true);
  };

  const [showStoppedreason, setshowSteoppedReason] = useState(false);

  const openEnrollmentDetailsModal = (enrollment: any) => {
    setSelectedEnrollment(enrollment);
    setshowSteoppedReason(true);
  };

  const [stopNote, setNote] = useState("");

  const handleStopEnrollment = async () => {
    if (!enrollmentToStop?.id) return;

    try {
      await updateCourseEnrollment({
        variables: {
          id: enrollmentToStop.id,
          input: {
            stopped: true,
            endAt: new Date().toISOString(),
            note: stopNote,
          },
        },
      });
      setNote("");
      setStopEnrollmentModalOpen(false);
      setEnrollmentToStop(null);
    } catch (stopError) {
      console.error("Failed to stop enrollment:", stopError);
      window.alert("Failed to stop the student. Please try again.");
    }
  };

  if (loading) {
    return (
      <Layout>
        <Box sx={{ p: 4, textAlign: "center" }}>
          <Text>Loading group details...</Text>
        </Box>
      </Layout>
    );
  }
  if (error) {
    return (
      <Layout>
        <Box sx={{ p: 4 }}>
          <Text sx={{ color: "danger", mb: 3 }}>
            Error loading group: {error.message}
          </Text>

          <Button onClick={() => navigate("/groups")} sx={{ bg: "primary" }}>
            {t("common.back")}
          </Button>
        </Box>
      </Layout>
    );
  }

  if (!groupDetails?.groupDetails) {
    return (
      <Layout>
        <Box sx={{ p: 4 }}>
          <Text sx={{ color: "danger", mb: 3 }}>Group not found</Text>

          <Button onClick={() => navigate("/groups")} sx={{ bg: "primary" }}>
            {t("common.back")}
          </Button>
        </Box>
      </Layout>
    );
  }

  return (
    <Layout>
      <Box
        sx={{
          p: 4,

          margin: 6,

          gap: 3,

          borderColor: "border",
        }}
      >
        <Flex
          sx={{
            alignItems: "center",
            px: 6,
            gap: 4,
          }}
        >
          <Button
            onClick={() => navigate("/groups")}
            sx={{ bg: "muted", color: "text" }}
          >
            {t("common.back")}
          </Button>

          <Text as="h1" sx={{ fontSize: 5, fontWeight: "bold" }}>
            {t("session.groupDetails")}
          </Text>
        </Flex>

        <Card
          sx={{
            p: 4,

            margin: 6,

            display: "flex",

            flexDirection: "column",

            gap: 3, // Spacing between card items

            bg: "tableBackground",

            borderRadius: "lg",

            border: "1px solid",

            borderColor: "border",

            boxShadow: "sm",
          }}
        >
          <Flex
            sx={{
              justifyContent: "space-between",

              alignItems: "flex-start",
            }}
          >
            <Flex sx={{ gap: 3 }}>
              <Flex
                sx={{
                  width: 64,

                  height: 64,

                  borderRadius: "50%",

                  bg: "primary",

                  color: "white",

                  alignItems: "center",

                  justifyContent: "center",

                  fontSize: 4,

                  fontWeight: "bold",

                  flexShrink: 0,
                }}
              >
                {group?.name.charAt(0).toUpperCase()}
              </Flex>

              <Box>
                <Flex sx={{ alignItems: "center", gap: 2, mb: 2 }}>
                  <Text sx={{ fontSize: 4, fontWeight: "bold" }}>
                    {group?.name}
                  </Text>
                </Flex>

                <Flex
                  sx={{
                    gap: 4,

                    alignItems: "center",

                    flexWrap: "wrap",
                  }}
                >
                  <Flex sx={{ alignItems: "center", gap: 1 }}>
                    <LuCalendar />

                    <Text>
                      {group?.academicYear != null
                        ? group?.academicYear.name.toString()
                        : "N/A"}
                    </Text>
                  </Flex>

                  <Flex sx={{ alignItems: "center", gap: 1 }}>
                    <LuGraduationCap />

                    <Text>
                      {group?.assignments != null
                        ? group?.assignments.length
                        : 0}{" "}
                      Teachers
                    </Text>
                  </Flex>

                  <Flex sx={{ alignItems: "center", gap: 1 }}>
                    <LuUsers />

                    <Text>{group?.course?.length} Students</Text>
                  </Flex>
                </Flex>
              </Box>
            </Flex>

            <Button
              sx={{
                bg: "primary",

                color: "white",

                px: 3,

                py: 2,

                fontWeight: "bold",
                cursor: "pointer",
              }}
              onClick={openEditModal}
            >
              Edit
            </Button>
          </Flex>

          {/* ================= Divider ================= */}

          <Box
            sx={{
              mt: 4,

              mb: 4,

              borderBottom: "1px solid",

              borderColor: "border",
            }}
          />

          {/* ================= Details ================= */}

          <Flex
            sx={{
              flexWrap: "wrap",

              gap: 4,

              justifyContent: "space-between",
            }}
          >
            <InfoItem
              icon={<LuGraduationCap />}
              title="Academic Year"
              value={` ${group?.academicYear?.name.toString()}` || ""}
            />

            <InfoItem
              icon={<LuUser />}
              title="Created By"
              value={` ${group?.creator.firstName} ${group?.creator.lastName}`}
            />

            <InfoItem
              icon={<LuClock3 />}
              title="Created At"
              value={formatDate(group?.createdAt) || "N/A"}
            />

            <InfoItem
              icon={<LuDollarSign />}
              title="Price / Unit"
              value={`$${group?.pricePerUnit} / ${group?.billingUnit}`}
            />

            <InfoItem
              icon={<LuWallet />}
              title="Expected Revenue per student"
              value={`$${group?.expected}`}
            />
          </Flex>
        </Card>
        <Card
          sx={{
            p: 4,

            margin: 6,

            display: "flex",

            flexDirection: "column",

            gap: 3, // Spacing between card items

            bg: "tableBackground",

            borderRadius: "lg",

            border: "1px solid",

            borderColor: "border",

            boxShadow: "sm",
          }}
        >
          <Flex
            sx={{
              justifyContent: "space-between",

              alignItems: "flex-start",

              mb: 3,
            }}
          >
            <Box>
              <Heading
                sx={{
                  fontSize: 3,
                  m: 0,
                  color: "text",
                }}
              >
                Enrolled Students
              </Heading>

              <Text
                sx={{
                  color: "textSecondary", // or "muted" if your theme changes it
                  fontSize: 1,
                  mt: 1,
                }}
              >
                {group?.course?.length ?? 0} students enrolled
              </Text>
            </Box>
            <Text
              onClick={() => {
                setEnrollmentModalOpen(true);
              }}
              sx={{
                color: "primary",

                cursor: "pointer",

                fontWeight: "bold",

                fontSize: 1,

                "&:hover": {
                  textDecoration: "underline",
                },
              }}
            >
              + Enroll
            </Text>
          </Flex>
          {visibleStudents?.map((enrollment) => (
            <Flex
              key={enrollment.id}
              sx={{
                justifyContent: "space-between",

                alignItems: "center",

                py: 3,

                borderBottom: "1px solid",

                borderColor: "border",
              }}
            >
              <Flex sx={{ gap: 3, alignItems: "center" }}>
                <Flex
                  sx={{
                    width: 42,

                    height: 42,

                    borderRadius: "50%",

                    bg: "primary",

                    color: "white",

                    alignItems: "center",

                    justifyContent: "center",

                    fontWeight: "bold",

                    flexShrink: 0,
                  }}
                >
                  {enrollment.student?.firstName.charAt(0)}
                </Flex>

                <Box>
                  <Text
                    sx={{
                      fontWeight: "bold",
                      color: "text",
                    }}
                  >
                    {enrollment.student?.firstName}{" "}
                    {enrollment.student?.lastName}
                  </Text>

                  <Text
                    sx={{
                      fontSize: 1,
                      color: "textSecondary",
                    }}
                  >
                    {` ${enrollment.student?.email}`}
                  </Text>
                </Box>
              </Flex>

              <Flex>
                {enrollment.stopped && (
                  <Badge
                    variant={"danger"}
                    onClick={(e) => {
                      console.log("clicked");
                      openEnrollmentDetailsModal(enrollment);
                    }}
                  >
                    {"Stopped"}
                  </Badge>
                )}
                {!enrollment.stopped && (
                  <Button
                    variant="danger"
                    onClick={() => openStopEnrollmentModal(enrollment)}
                    sx={{ ml: 2, flexShrink: 0 }}
                  >
                    Stop
                  </Button>
                )}
                <Button
                  variant="info"
                  onClick={() =>
                    navigate(
                      `/studentEnrollmentCard/${groupDetails.groupDetails.id}/${enrollment.student?.id}`
                    )
                  }
                  sx={{ ml: 2, flexShrink: 0 }}
                >
                  Details
                </Button>
              </Flex>
            </Flex>
          ))}

          {group?.course && group?.course?.length > 5 && (
            <Text
              onClick={() => setShowAllStudents(!showAllStudents)}
              sx={{
                color: "primary",

                cursor: "pointer",

                fontWeight: "bold",

                fontSize: 1,

                "&:hover": {
                  textDecoration: "underline",
                },
              }}
            >
              {showAllStudents ? "Show less" : "View all"}
            </Text>
          )}
        </Card>
        <TeachingAssignmentsCard
          group={group}
          onUpdated={() => {}}
        ></TeachingAssignmentsCard>
        <StudentEnrollmentModal
          groupId={group?.id || ""}
          isOpen={enrollmentModalOpen}
          onClose={async () => {
            await refetch();
            setEnrollmentModalOpen(false);
          }}
          onSuccess={() => {}}
          enrolledStudentIds={
            group?.course?.map((e: any) => e.student?.id).filter(Boolean) || []
          }
        />

        {editModalOpen && (
          <Box
            sx={{
              position: "fixed",
              inset: 0,
              bg: "rgba(15, 23, 42, 0.55)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              p: 3,
              zIndex: 1000,
            }}
            onClick={() => setEditModalOpen(false)}
          >
            <Card
              sx={{
                width: "100%",
                maxWidth: 520,
                p: 4,
                bg: "tableBackground",
                borderRadius: "lg",
                border: "1px solid",
                borderColor: "border",
                boxShadow: "lg",
              }}
              onClick={(event) => event.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-labelledby="edit-group-title"
            >
              <Flex
                sx={{
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 3,
                }}
              >
                <Heading id="edit-group-title" sx={{ fontSize: 3, m: 0 }}>
                  Edit Group
                </Heading>

                <Button
                  variant="secondary"
                  onClick={() => setEditModalOpen(false)}
                  sx={{ px: 3 }}
                >
                  Close
                </Button>
              </Flex>

              <Box sx={{ display: "grid", gap: 3 }}>
                <Box>
                  <Label htmlFor="group-name" sx={{ mb: 2, display: "block" }}>
                    Group name
                  </Label>
                  <Input
                    id="group-name"
                    value={groupName}
                    onChange={(event) => setGroupName(event.target.value)}
                    placeholder="Enter group name"
                  />
                </Box>

                <Box>
                  <Label htmlFor="group-color" sx={{ mb: 2, display: "block" }}>
                    Group color
                  </Label>
                  <Flex sx={{ alignItems: "center", gap: 3 }}>
                    <Input
                      id="group-color"
                      type="color"
                      value={groupColor}
                      onChange={(event) => setGroupColor(event.target.value)}
                      sx={{ width: 72, height: 48, p: 0, cursor: "pointer" }}
                    />
                    <Text sx={{ color: "textSecondary", fontSize: 1 }}>
                      {groupColor.toUpperCase()}
                    </Text>
                  </Flex>
                </Box>

                <Flex sx={{ gap: 2, justifyContent: "flex-end", pt: 2 }}>
                  <Button
                    variant="secondary"
                    onClick={() => setEditModalOpen(false)}
                    disabled={updatingGroup}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleSaveGroup} disabled={updatingGroup}>
                    {updatingGroup ? "Saving..." : "Save changes"}
                  </Button>
                </Flex>
              </Box>
            </Card>
          </Box>
        )}

        {stopEnrollmentModalOpen && enrollmentToStop && (
          <Box
            sx={{
              position: "fixed",
              inset: 0,
              bg: "rgba(15, 23, 42, 0.55)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              p: 3,
              zIndex: 1000,
            }}
            onClick={() => setStopEnrollmentModalOpen(false)}
          >
            <Card
              sx={{
                width: "100%",
                maxWidth: 520,
                p: 4,
                bg: "tableBackground",
                borderRadius: "lg",
                border: "1px solid",
                borderColor: "border",
                boxShadow: "lg",
              }}
              onClick={(event) => event.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-labelledby="stop-enrollment-title"
            >
              <Heading id="stop-enrollment-title" sx={{ fontSize: 3, mb: 2 }}>
                Stop student enrollment?
              </Heading>

              <Text sx={{ color: "textSecondary", mb: 3 }}>
                This will stop {enrollmentToStop.student?.firstName}{" "}
                {enrollmentToStop.student?.lastName} from this group and set the
                end date to now.
              </Text>
              <Input
                value={stopNote}
                onChange={(e) => {
                  setNote(e.target.value);
                }}
              ></Input>
              <Flex sx={{ gap: 2, justifyContent: "flex-end", pt: 2 }}>
                <Button
                  variant="secondary"
                  onClick={() => setStopEnrollmentModalOpen(false)}
                  disabled={updatingEnrollment}
                >
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  onClick={handleStopEnrollment}
                  disabled={updatingEnrollment}
                >
                  {updatingEnrollment ? "Stopping..." : "Stop student"}
                </Button>
              </Flex>
            </Card>
          </Box>
        )}
        {showStoppedreason && selectedEnrollment && (
          <Box
            sx={{
              position: "fixed",
              inset: 0,
              bg: "rgba(15, 23, 42, 0.55)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              p: 3,
              zIndex: 1000,
            }}
            onClick={() => setshowSteoppedReason(false)}
          >
            <Card
              sx={{
                width: "100%",
                maxWidth: 520,
                p: 4,
                bg: "tableBackground",
                borderRadius: "lg",
                border: "1px solid",
                borderColor: "border",
                boxShadow: "lg",
              }}
              onClick={(event) => event.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-labelledby="stopped-reason-title"
            >
              <Flex
                sx={{
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 3,
                }}
              >
                <Heading id="stopped-reason-title" sx={{ fontSize: 3, m: 0 }}>
                  Stopped Enrollment Details
                </Heading>
                <Button
                  variant="secondary"
                  onClick={() => setshowSteoppedReason(false)}
                  sx={{ px: 3, cursor: "pointer" }}
                >
                  Close
                </Button>
              </Flex>

              <Box sx={{ display: "grid", gap: 3 }}>
                <Box>
                  <Text sx={{ fontWeight: "bold", mb: 1 }}>Student:</Text>
                  <Text sx={{ color: "textSecondary" }}>
                    {selectedEnrollment.student?.firstName}{" "}
                    {selectedEnrollment.student?.lastName}
                  </Text>
                </Box>

                <Box>
                  <Text sx={{ fontWeight: "bold", mb: 1 }}>Stopped At:</Text>
                  <Text sx={{ color: "textSecondary" }}>
                    {formatDateTime(selectedEnrollment.endAt)}
                  </Text>
                </Box>

                <Box>
                  <Text sx={{ fontWeight: "bold", mb: 1 }}>Reason / Note:</Text>
                  <Text
                    sx={{
                      color: "textSecondary",
                      bg: "muted",
                      p: 3,
                      borderRadius: "md",
                      fontStyle: selectedEnrollment.note ? "normal" : "italic",
                    }}
                  >
                    {selectedEnrollment.note || "No note provided."}
                  </Text>
                </Box>
              </Box>

              <Flex sx={{ justifyContent: "flex-end", pt: 3 }}>
                <Button
                  onClick={() => setshowSteoppedReason(false)}
                  sx={{ cursor: "pointer" }}
                >
                  Done
                </Button>
              </Flex>
            </Card>
          </Box>
        )}
      </Box>
    </Layout>
  );
};

export default GroupDetailsPage;
