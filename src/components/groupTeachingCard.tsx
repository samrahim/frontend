import { useMemo, useState } from "react";
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

import {
  LuBookOpen,
  LuCalendarDays,
  LuChevronDown,
  LuChevronUp,
  LuMail,
  LuPencil,
  LuMapPin, // 👈 Imported MapPin icon for the classroom
} from "react-icons/lu";
import AssignTeacherDialog from "./AddSessionDialog";
import {
  Group,
  Teacher,
  TeachingAssignment,
  useGetSubjectsQuery,
  useReplaceTeacherAssignmentMutation,
  useTeachersTableQuery,
} from "../graphql/generated";
import { t } from "i18next";

interface TeachingAssignmentsCardProps {
  group: Group;
  onUpdated?: () => Promise<any> | void;
}

const recurrenceLabel = (rrule: string) => {
  if (!rrule) return "";

  const map: Record<string, string> = {
    MO: "Monday",
    TU: "Tuesday",
    WE: "Wednesday",
    TH: "Thursday",
    FR: "Friday",
    SA: "Saturday",
    SU: "Sunday",
  };

  const byDayMatch = rrule.match(/BYDAY=([^;]+)/);

  if (byDayMatch) {
    return byDayMatch[1]
      .split(",")
      .map((d) => map[d] ?? d)
      .join(", ");
  }

  const freqMatch = rrule.match(/FREQ=([^;]+)/);
  if (freqMatch && freqMatch[1] === "DAILY") {
    return t("common.daily");
  }

  return "";
};

const formatTime = (dateStr?: string) =>
  dateStr ? dateStr.split("T")[1]?.slice(0, 5) : "";

export default function TeachingAssignmentsCard({
  group,
  onUpdated,
}: TeachingAssignmentsCardProps) {
  const [expandedTeachers, setExpandedTeachers] = useState<string[]>([]);
  const [editAssignment, setEditAssignment] = useState<any>(null);
  const [selectedTeacher, setSelectedTeacher] = useState<any>(null);
  const [teacherSearch, setTeacherSearch] = useState("");
  const [showTeacherDropdown, setShowTeacherDropdown] = useState(false);

  const teachers = useMemo(() => {
    const map: Record<
      string,
      { teacher: Teacher | null; assignments: TeachingAssignment[] }
    > = {};

    group.assignments?.forEach((assignment: TeachingAssignment) => {
      const teacherId = assignment.teacher?.id ?? `deleted-${assignment.id}`;

      if (!map[teacherId]) {
        map[teacherId] = {
          teacher: assignment.teacher ?? null,
          assignments: [],
        };
      }

      map[teacherId].assignments.push(assignment);
    });

    return Object.values(map);
  }, [group.assignments]);

  const toggleTeacher = (teacherId: string) => {
    setExpandedTeachers((prev) =>
      prev.includes(teacherId)
        ? prev.filter((id) => id !== teacherId)
        : [...prev, teacherId]
    );
  };

  const { data: subjectsData } = useGetSubjectsQuery();
  const subjects =
    subjectsData?.subjects?.edges?.map((e) => e?.node).filter(Boolean) || [];

  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [replaceTeacherAssignment, { loading: savingTeacher }] =
    useReplaceTeacherAssignmentMutation();
  const searchFilter = teacherSearch.trim()
    ? {
        or: [
          { firstNameContains: teacherSearch },
          { lastNameContains: teacherSearch },
          { emailContains: teacherSearch },
        ],
      }
    : undefined;

  const { data: teachersData, loading: teachersLoading } =
    useTeachersTableQuery({
      variables: {
        offset: 0,
        limit: 10,
        where: teacherSearch.trim() ? searchFilter : undefined,
        withTotalCount: false,
      },
      skip: !editAssignment || !showTeacherDropdown,
    });

  const filteredTeachers = useMemo(
    () =>
      teachersData?.teachersTable?.edges
        ?.map((edge) => edge?.node)
        .filter(Boolean) || [],
    [teachersData]
  );

  const openEditTeacher = (assignment: any) => {
    setEditAssignment(assignment);
    setSelectedTeacher(assignment.teacher ?? null);
    setTeacherSearch("");
    setShowTeacherDropdown(false);
  };

  const handleEditTeacherSearch = (value: string) => {
    setTeacherSearch(value);
    setShowTeacherDropdown(!!value.trim());
  };

  const handleSelectTeacher = (teacher: any) => {
    setSelectedTeacher(teacher);
    setTeacherSearch("");
    setShowTeacherDropdown(false);
  };

  const handleSaveTeacher = async () => {
    if (!editAssignment?.id || !selectedTeacher?.id) return;

    await replaceTeacherAssignment({
      variables: {
        id: editAssignment.id,
        newTeacherId: selectedTeacher.id,
      },
      onCompleted: () => {
        // close the edit dialog
        setEditAssignment(null);
        setSelectedTeacher(null);
      },
      onError: (error) => {
        // TODO: handle error, maybe show a toast notification
      },
    });

    await onUpdated?.();
    setEditAssignment(null);
  };

  return (
    <Card
      sx={{
        p: 0,
        mt: 5,
        mx: 6,
        bg: "tableBackground",
        borderRadius: "lg",
        border: "1px solid",
        borderColor: "border",
        overflow: editAssignment ? "visible" : "hidden",
      }}
    >
      <Flex
        sx={{
          justifyContent: "space-between",
          alignItems: "center",
          p: 4,
          borderBottom: "1px solid",
          borderColor: "border",
        }}
      >
        <Box>
          <Heading sx={{ fontSize: 3 }}>Subjects</Heading>

          <Text
            sx={{
              color: "textSecondary",
              fontSize: 1,
              mt: 1,
            }}
          >
            {teachers.length} teachers assigned
          </Text>
        </Box>

        <Text
          onClick={() => setIsAssignOpen(true)}
          sx={{
            color: "primary",
            cursor: "pointer",
            fontWeight: "bold",
            fontSize: 1,
            display: "inline-block",
            "&:hover": { color: "primaryHover" },
          }}
        >
          + Assign
        </Text>
      </Flex>

      {teachers.map((teacherData) => {
        const teacher = teacherData.teacher;
        const teacherId =
          teacher?.id ?? `deleted-${teacherData.assignments[0].id}`;
        const opened = expandedTeachers.includes(teacherId);

        return (
          <Box
            key={teacherId}
            sx={{
              borderBottom: "1px solid",
              borderColor: "border",
            }}
          >
            <Flex
              onClick={() => toggleTeacher(teacherId)}
              sx={{
                p: 4,
                justifyContent: "space-between",
                alignItems: "center",
                cursor: "pointer",
                "&:hover": {
                  bg: "muted",
                },
              }}
            >
              <Flex sx={{ gap: 3 }}>
                <Flex
                  sx={{
                    width: 50,
                    height: 50,
                    borderRadius: "50%",
                    bg: teacher ? "primary" : "danger",
                    color: "white",
                    justifyContent: "center",
                    alignItems: "center",
                    fontWeight: "bold",
                    fontSize: 2,
                  }}
                >
                  {teacher
                    ? `${teacher.firstName[0]}${teacher.lastName[0]}`
                    : "?"}
                </Flex>

                <Box>
                  <Text sx={{ fontWeight: "bold", fontSize: 2 }}>
                    {teacher
                      ? `${teacher.firstName} ${teacher.lastName}`
                      : "Deleted Teacher"}
                  </Text>

                  <Flex
                    sx={{
                      color: "textSecondary",
                      fontSize: 1,
                      mt: 1,
                      gap: 2,
                      alignItems: "center",
                    }}
                  >
                    <LuMail size={14} />

                    <Text sx={{ fontSize: 1 }}>
                      {teacher?.email ?? "Teacher record no longer exists"}
                    </Text>
                  </Flex>
                </Box>
              </Flex>

              <Flex
                sx={{
                  gap: 3,
                  color: "textSecondary",
                }}
              >
                <Text sx={{ color: "textSecondary", fontSize: 1 }}>
                  {teacherData.assignments.length} Subjects
                </Text>

                {opened ? <LuChevronUp /> : <LuChevronDown />}
              </Flex>
            </Flex>

            {opened && (
              <Box
                sx={{
                  px: 4,
                  pb: 4,
                }}
              >
                {teacherData.assignments.map((assignment) => {
                  // Use assignment.schedules directly instead of filtering group.schedules
                  const schedules = assignment.schedules || [];
                  return (
                    <Card
                      key={assignment.id}
                      sx={{
                        mt: 3,
                        border: "1px solid",
                        borderColor: "border",
                        borderRadius: "lg",
                        overflow: "hidden",
                      }}
                    >
                      <Flex
                        sx={{
                          justifyContent: "space-between",
                          alignItems: "center",
                          bg: "muted",
                          p: 3,
                        }}
                      >
                        <Flex
                          sx={{
                            gap: 2,
                            alignItems: "center",
                          }}
                        >
                          <LuBookOpen />

                          <Text
                            sx={{
                              fontWeight: "bold",
                            }}
                          >
                            {assignment.subject.name}
                            {/* Display a question mark if the teacher is deleted */}
                            {assignment.stoppedAt != null && (
                              <Badge
                                sx={{
                                  ml: 1,
                                  bg: "danger",
                                  color: "white",
                                  fontSize: 0,
                                  px: 1,
                                  borderRadius: "sm",
                                }}
                              >
                                Stopped
                              </Badge>
                            )}
                          </Text>
                        </Flex>

                        <Badge>
                          {schedules.length} Schedule
                          {schedules.length > 1 ? "s" : ""}
                        </Badge>

                        {assignment.stoppedAt == null && (
                          <Button
                            variant="secondary"
                            onClick={() => openEditTeacher(assignment)}
                            sx={{
                              ml: 2,
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 1,
                            }}
                          >
                            <LuPencil size={14} />
                            Edit Teacher
                          </Button>
                        )}
                      </Flex>

                      {assignment.stoppedAt != null && (
                        <Flex sx={{ p: 3, gap: 3, flexDirection: "column" }}>
                          <Text sx={{ color: "textSecondary", fontSize: 1 }}>
                            Started on:{" "}
                            {new Date(
                              assignment.assignedAt
                            ).toLocaleDateString()}
                          </Text>
                          <Text sx={{ color: "textSecondary", fontSize: 1 }}>
                            Stopped on:{" "}
                            {new Date(
                              assignment.stoppedAt
                            ).toLocaleDateString()}
                          </Text>
                          <Text sx={{ color: "textSecondary", fontSize: 1 }}>
                            Stopped By:{" "}
                            {assignment.stoppedBy?.firstName +
                              " " +
                              assignment.stoppedBy?.lastName || "Unknown"}
                          </Text>
                        </Flex>
                      )}

                      {schedules.map((schedule: any) => {
                        const roomName =
                          schedule.room?.name ||
                          schedule.classroom?.name ||
                          "No Room Assigned";

                        return (
                          <Flex
                            key={schedule.id}
                            sx={{
                              justifyContent: "space-between",
                              alignItems: "center",
                              p: 3,
                              borderTop: "1px solid",
                              borderColor: "border",
                            }}
                          >
                            <Flex
                              sx={{
                                gap: 4,
                                alignItems: "center",
                              }}
                            >
                              <Flex
                                sx={{
                                  gap: 1,
                                  alignItems: "center",
                                  width: 150,
                                }}
                              >
                                <LuCalendarDays size={15} />

                                <Text>{recurrenceLabel(schedule.rrule)}</Text>
                              </Flex>

                              <Badge>{formatTime(schedule.startTime)}</Badge>

                              <Text>→</Text>

                              <Badge>{formatTime(schedule.endTime)}</Badge>
                            </Flex>

                            {/* Room display */}
                            <Flex
                              sx={{
                                gap: 1,
                                alignItems: "center",
                                color: "textSecondary",
                                fontSize: 1,
                                fontWeight: "medium",
                              }}
                            >
                              <LuMapPin size={16} />
                              <Text>{roomName}</Text>
                            </Flex>
                          </Flex>
                        );
                      })}
                    </Card>
                  );
                })}
              </Box>
            )}
          </Box>
        );
      })}

      <AssignTeacherDialog
        isOpen={isAssignOpen}
        onClose={() => setIsAssignOpen(false)}
        groupId={group.id}
        subjects={subjects}
      />

      {editAssignment && (
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
          onClick={() => setEditAssignment(null)}
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
            aria-labelledby="edit-teacher-title"
          >
            <Flex
              sx={{
                justifyContent: "space-between",
                alignItems: "center",
                mb: 3,
              }}
            >
              <Heading id="edit-teacher-title" sx={{ fontSize: 3, m: 0 }}>
                Edit Teacher
              </Heading>
              <Button
                variant="secondary"
                onClick={() => setEditAssignment(null)}
              >
                Close
              </Button>
            </Flex>

            <Text sx={{ mb: 2, color: "textSecondary" }}>
              {editAssignment.subject?.name}
            </Text>

            <Box sx={{ mb: 3 }}>
              <Text sx={{ fontSize: 1, color: "textSecondary", mb: 1 }}>
                Selected teacher
              </Text>
              <Box
                sx={{
                  p: 2,
                  borderRadius: "md",
                  bg: selectedTeacher ? "muted" : "background",
                  border: "1px solid",
                  borderColor: "border",
                }}
              >
                <Text sx={{ fontWeight: "bold" }}>
                  {selectedTeacher
                    ? `${selectedTeacher.firstName} ${selectedTeacher.lastName}`
                    : "No teacher selected yet"}
                </Text>
                {selectedTeacher?.email && (
                  <Text sx={{ fontSize: 0, color: "textSecondary" }}>
                    {selectedTeacher.email}
                  </Text>
                )}
              </Box>
            </Box>

            <Box sx={{ position: "relative" }}>
              <Label htmlFor="teacherSearch" sx={{ mb: 2, display: "block" }}>
                Search teacher
              </Label>
              <Input
                id="teacherSearch"
                value={teacherSearch}
                onChange={(event) =>
                  handleEditTeacherSearch(event.target.value)
                }
                onFocus={() => setShowTeacherDropdown(true)}
                placeholder="Search by name or email"
              />

              {showTeacherDropdown && (
                <Box
                  sx={{
                    position: "absolute",
                    top: "100%",
                    left: 0,
                    right: 0,
                    bg: "background",
                    border: "1px solid",
                    borderColor: "border",
                    borderRadius: "md",
                    mt: 1,
                    zIndex: 999,
                    maxHeight: "220px",
                    overflowY: "auto",
                    boxShadow: "md",
                  }}
                >
                  {teachersLoading && (
                    <Box sx={{ p: 2, textAlign: "center" }}>
                      <Text>Loading...</Text>
                    </Box>
                  )}

                  {!teachersLoading &&
                    filteredTeachers.map((teacher: any) => (
                      <Box
                        key={teacher.id}
                        as="button"
                        onMouseDown={(event) => {
                          event.preventDefault();
                          handleSelectTeacher(teacher);
                        }}
                        sx={{
                          p: 2,
                          cursor: "pointer",
                          borderBottom: "1px solid",
                          borderColor: "border",
                          "&:hover": { bg: "muted" },
                          width: "100%",
                          textAlign: "left",
                          bg:
                            selectedTeacher?.id === teacher.id
                              ? "muted"
                              : "background",
                        }}
                      >
                        <Text sx={{ fontWeight: "bold" }}>
                          {teacher.firstName} {teacher.lastName}
                        </Text>
                        <Text sx={{ fontSize: 0, color: "textSecondary" }}>
                          {teacher.email}
                        </Text>
                      </Box>
                    ))}

                  {!teachersLoading && filteredTeachers.length === 0 && (
                    <Box sx={{ p: 2, textAlign: "center" }}>
                      <Text>{t("teachers.noTeachers")}</Text>
                    </Box>
                  )}
                </Box>
              )}
            </Box>

            <Flex sx={{ gap: 2, justifyContent: "flex-end", mt: 4 }}>
              <Button
                variant="secondary"
                onClick={() => setEditAssignment(null)}
              >
                Cancel
              </Button>
              <Button onClick={handleSaveTeacher} disabled={savingTeacher}>
                {savingTeacher ? "Saving..." : "Save teacher"}
              </Button>
            </Flex>
          </Card>
        </Box>
      )}
    </Card>
  );
}
