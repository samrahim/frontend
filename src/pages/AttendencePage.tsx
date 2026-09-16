/** @jsxImportSource theme-ui */
import { Box, Button, Flex, Label, Text } from "theme-ui";
import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";

import {
  useAttendencesQuery,
  useGetGroupDetailsCompleteQuery,
  useGetSessionsQuery,
  useGroupsTableQuery,
  AttendancesUpdatedDocument,
  useUpdateattendacesMutation,
} from "../graphql";
import { Layout } from "../components/Layout";
import { AttendanceTable } from "../components/AttendanceTable";
import { PageLayout } from "../components/PageLayout";
import { useTranslation } from "react-i18next";
interface PendingAttendanceChange {
  attendanceId: string;
  isPresent: boolean;
  reason?: string;
}
export default function AttendanceScreen() {
  const [history, setHistory] = useState<string[]>([]);

  const [selectedGroup, setSelectedGroup] = useState<string>("");
  const [showGroups, setShowGroups] = useState(false);
  const [showsessions, setShowSession] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const [selectedSubject, setSelectedSubject] = useState<any>(null);
  const [showSubjectDropdown, setShowSubjectDropdown] = useState(false);

  const [sessionId, setSessionId] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const LIMIT = 10;
  const [updateAttendances] = useUpdateattendacesMutation();

  // --- 1. ERROR HANDLING IN BATCH UPDATE ---
  const handleBatchUpdateAttendance = async (
    changedItems: PendingAttendanceChange[]
  ) => {
    if (changedItems.length === 0) return;

    setErrorMsg(null);
    try {
      await updateAttendances({
        variables: {
          inputs: changedItems.map((item) => ({
            id: item.attendanceId,
            isPresent: item.isPresent,
            reason: item.reason || null, // Passes string if present, null if empty
          })),
        },
      });

      toast?.success?.("Attendance updated successfully!");
    } catch (error: any) {
      console.error("Failed to update attendance:", error);
      const userFriendlyMessage =
        error?.graphQLErrors?.[0]?.message ||
        error?.message ||
        "An unexpected error occurred while updating attendance.";

      setErrorMsg(userFriendlyMessage);
      toast?.error?.(userFriendlyMessage);
    }
  };
  const {
    data: groupsData,
    loading: groupsLoading,
    fetchMore,
  } = useGroupsTableQuery({
    variables: { offset: 0, limit: LIMIT, withTotalCount: true },
    notifyOnNetworkStatusChange: true,
  });

  const groups: any[] =
    groupsData?.groupsTable?.edges?.map((e) => e?.node).filter(Boolean) ?? [];
  const totalCount = groupsData?.groupsTable?.totalCount ?? 0;
  const hasMore = groups.length < totalCount;

  const loadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      await fetchMore({
        variables: {
          offset: groups.length,
          limit: LIMIT,
          withTotalCount: true,
        },
        updateQuery: (prev, { fetchMoreResult }) => {
          if (!fetchMoreResult) return prev;
          return {
            ...fetchMoreResult,
            groupsTable: {
              ...fetchMoreResult.groupsTable,
              edges: [
                ...(prev.groupsTable?.edges ?? []),
                ...(fetchMoreResult.groupsTable?.edges ?? []),
              ],
            },
          };
        },
      });
    } finally {
      setLoadingMore(false);
    }
  };

  const { data: groupDetailsData } = useGetGroupDetailsCompleteQuery({
    variables: { id: selectedGroup || "" },
    skip: !selectedGroup,
  });
  const subjects =
    groupDetailsData?.groupDetails?.assignments
      ?.map((a) => a?.subject)
      .filter(Boolean) ?? [];

  useEffect(() => {
    if (subjects.length === 1) {
      setSelectedSubject(subjects[0]);
    }
  }, [subjects.length]);

  const { data: sessionsData } = useGetSessionsQuery({
    variables: {
      where: {
        and: [
          {
            canceled: false,
          },
          {
            hasScheduleWith: [
              {
                hasGroupWith: [{ id: selectedGroup }],
                hasAssignmentWith: [
                  { hasSubjectWith: [{ id: selectedSubject?.id }] },
                ],
              },
            ],
          },
        ],
      },
    },
    skip: !selectedGroup || !selectedSubject,
  });

  const sessions = useMemo(() => {
    return (
      sessionsData?.sessions.edges
        ?.map((edge) => {
          const s = edge?.node;
          if (!s) return null;

          const dateObj = new Date(s.startAt);
          const date = s.startAt.split("T")[0];
          const dayName = dateObj.toLocaleDateString("en-US", {
            weekday: "long",
          });

          const startTime = s.startAt.split("T")[1]?.slice(0, 5);
          const endTime = s.endAt.split("T")[1]?.slice(0, 5);

          const label = `${dayName}, ${date} (${startTime} → ${endTime} — ${s.durationMin} min)`;

          return { id: s.id, label };
        })
        .filter(Boolean) ?? []
    );
  }, [sessionsData]);

  const handleGroupChange = (id: string) => {
    setSelectedGroup(id);
    setSelectedSubject(null);
    setSessionId("");
    setShowGroups(false);
    resetPagination();
  };

  const buildWhereFilter = () => {
    // 1. Specific Session Selected
    if (sessionId) {
      return { hasSessionWith: [{ id: sessionId }] };
    }

    // 2. Both Group and Subject Selected
    if (selectedGroup && selectedSubject?.id) {
      return {
        hasSessionWith: [
          {
            hasScheduleWith: [
              {
                hasGroupWith: [{ id: selectedGroup }],
                hasAssignmentWith: [
                  { hasSubjectWith: [{ id: selectedSubject.id }] },
                ],
              },
            ],
          },
        ],
      };
    }

    // 3. Only Group Selected
    if (selectedGroup) {
      return {
        hasSessionWith: [
          {
            hasScheduleWith: [{ hasGroupWith: [{ id: selectedGroup }] }],
          },
        ],
      };
    }

    return {};
  };
  const [cursor, setCursor] = useState<string | null | undefined>(null);

  const whereFilter = buildWhereFilter();

  // --- 2. QUERY & SUBSCRIPTION INTEGRATION ---
  const { data, loading, networkStatus, subscribeToMore } = useAttendencesQuery(
    {
      variables: { first: 10, after: cursor, where: whereFilter },
      notifyOnNetworkStatusChange: true,
    }
  );

  useEffect(() => {
    const unsubscribe = subscribeToMore({
      document: AttendancesUpdatedDocument,
      updateQuery: (prev, { subscriptionData }) => {
        if (!subscriptionData.data) return prev;
        const updatedAttendance = (subscriptionData.data as any)
          .attendancesUpdated;

        if (!updatedAttendance) return prev;

        // Map through existing table edges and update matching item
        const updatedEdges = prev.attendances.edges?.map((edge) => {
          if (edge?.node?.id === updatedAttendance.id) {
            return {
              ...edge,
              node: {
                ...edge?.node,
                ...updatedAttendance,
              },
            };
          }
          return edge;
        });

        return {
          ...prev,
          attendances: {
            ...prev.attendances,
            edges: updatedEdges,
          },
        };
      },
    });

    return () => unsubscribe();
  }, [subscribeToMore, cursor, whereFilter]);

  const showInitialLoading = loading && !data;

  const edges = data?.attendances?.edges ?? [];
  const pageInfo = data?.attendances?.pageInfo as
    | {
        hasNextPage?: boolean;
        endCursor?: string | null;
      }
    | undefined;

  const formatDate = (dateStr?: string) =>
    dateStr ? dateStr.split("T")[0] : "";
  const formatTime = (dateStr?: string) =>
    dateStr ? dateStr.split("T")[1]?.slice(0, 5) : "";

  const formattedData = edges.map((e) => {
    const node = e?.node;
    return {
      studentName: node?.student
        ? `${node.student.firstName ?? ""} ${
            node.student.lastName ?? ""
          }`.trim()
        : "",
      date: formatDate(node?.session?.startAt),
      startTime: formatTime(node?.session?.startAt),
      endTime: formatTime(node?.session?.endAt),
      isPresent: node?.isPresent,
      reason: node?.reason ?? "",
      id: node?.id,
      group: node?.session?.schedule?.group?.name ?? "",
      subject: node?.session?.schedule?.subject?.name ?? "",
    };
  });

  const resetPagination = () => {
    setCursor(null);
    setHistory([]);
  };
  const handleNext = () => {
    if (pageInfo?.hasNextPage) {
      setHistory((prev) => [...prev, cursor || ""]);
      setCursor(pageInfo.endCursor);
    }
  };

  const handlePrevious = () => {
    const prevCursor = history[history.length - 1];
    setHistory((prev) => prev.slice(0, -1));

    // نمرر null في حال كانت القيمة undefined
    setCursor(prevCursor ?? null);
  };

  const { t } = useTranslation();
  const selectedSessionLabel = sessions.find((s) => s?.id === sessionId)?.label;

  return (
    <Layout>
      <PageLayout
        title={t("attendance.title")}
        description={t("attendance.description")}
        icon="📋"
      >
        <Box p={3}>
          {/* Error Banner Alert */}
          {errorMsg && (
            <Box
              sx={{
                bg: "rgba(239, 68, 68, 0.15)",
                border: "1px solid",
                borderColor: "red",
                color: "red",
                p: 3,
                borderRadius: "md",
                mb: 3,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Text sx={{ fontSize: 1, fontWeight: "medium" }}>{errorMsg}</Text>
              <Button
                onClick={() => setErrorMsg(null)}
                sx={{
                  bg: "transparent",
                  color: "red",
                  cursor: "pointer",
                  p: 1,
                  fontSize: 1,
                }}
              >
                ✕
              </Button>
            </Box>
          )}

          {showInitialLoading && (
            <Text sx={{ fontSize: 0, mb: 2 }}>Loading...</Text>
          )}

          {/* Filters */}
          <Flex
            mb={3}
            sx={{
              gap: 3,
              flexWrap: "wrap",
              alignItems: "flex-end",
              p: 3,
              bg: "muted",
              borderRadius: 8,
              border: "1px solid",
              borderColor: "border",
            }}
          >
            {/* Group Picker */}
            <Box sx={{ position: "relative", minWidth: "180px" }}>
              <Label>{t("attendance.group")}</Label>
              <Box
                onClick={() => setShowGroups((prev) => !prev)}
                sx={{
                  border: "1px solid",
                  borderColor: "border",
                  borderRadius: "md",
                  p: 2,
                  cursor: "pointer",
                  bg: "background",
                }}
              >
                {selectedGroup
                  ? groups.find((g) => g.id === selectedGroup)?.name
                  : `${t("calendar.selectGroup")}`}
              </Box>
              {showGroups && (
                <Box
                  sx={{
                    position: "absolute",
                    top: "100%",
                    left: 0,
                    right: 0,
                    mt: 1,
                    border: "1px solid",
                    borderColor: "border",
                    borderRadius: "md",
                    maxHeight: "280px",
                    overflowY: "auto",
                    bg: "background",
                    zIndex: 999,
                  }}
                  onScroll={(e) => {
                    const target = e.currentTarget;
                    const reachedBottom =
                      target.scrollTop + target.clientHeight >=
                      target.scrollHeight - 20;
                    if (reachedBottom && !loadingMore && hasMore) loadMore();
                  }}
                >
                  {groups.map((g) => (
                    <Box
                      key={g.id}
                      onClick={() => handleGroupChange(g.id)}
                      sx={{
                        p: 2,
                        cursor: "pointer",
                        borderBottom: "1px solid",
                        borderColor: "border",
                        "&:hover": { bg: "muted" },
                      }}
                    >
                      {g.name}
                    </Box>
                  ))}
                  {(groupsLoading || loadingMore) && (
                    <Box sx={{ p: 2, textAlign: "center" }}>Loading...</Box>
                  )}
                </Box>
              )}
            </Box>

            {/* Subject Picker */}
            <Box sx={{ position: "relative", minWidth: "180px" }}>
              <Label>{t("groups.subject")}</Label>
              <Box
                onClick={() => {
                  if (selectedGroup && subjects.length > 1)
                    setShowSubjectDropdown((v) => !v);
                }}
                sx={{
                  p: 2,
                  border: "1px solid",
                  borderColor: "border",
                  borderRadius: "md",
                  cursor:
                    selectedGroup && subjects.length > 1
                      ? "pointer"
                      : "default",
                  bg: "background",
                  color: !selectedGroup ? "gray" : "text",
                }}
              >
                {selectedSubject
                  ? selectedSubject.name
                  : `${t("groups.selectSubject")}`}
              </Box>
              {showSubjectDropdown && (
                <Box
                  sx={{
                    position: "absolute",
                    top: "100%",
                    left: 0,
                    right: 0,
                    border: "1px solid",
                    borderColor: "border",
                    borderRadius: "md",
                    bg: "background",
                    mt: 1,
                    maxHeight: "180px",
                    overflowY: "auto",
                    zIndex: 999,
                  }}
                >
                  {subjects.map((subject: any) => (
                    <Box
                      key={subject.id}
                      onClick={() => {
                        setSelectedSubject(subject);
                        setSessionId("");
                        setShowSubjectDropdown(false);
                        resetPagination();
                      }}
                      sx={{
                        p: 2,
                        cursor: "pointer",
                        borderBottom: "1px solid",
                        borderColor: "border",
                        "&:hover": { bg: "muted" },
                      }}
                    >
                      {subject.name}
                    </Box>
                  ))}
                </Box>
              )}
            </Box>

            {/* Session Picker */}
            <Box sx={{ position: "relative", minWidth: "320px" }}>
              <Label>{t("groups.billingUnitSession")}</Label>
              <Box
                onClick={() => {
                  if (sessions.length > 0) setShowSession((v) => !v);
                }}
                sx={{
                  p: 2,
                  border: "1px solid",
                  borderColor: "border",
                  borderRadius: "md",
                  cursor: sessions.length > 0 ? "pointer" : "default",
                  bg: "background",
                  color: sessions.length === 0 ? "gray" : "text",
                }}
              >
                {sessionId
                  ? selectedSessionLabel
                  : `${t("attendance.selectSession")}`}
              </Box>
              {showsessions && sessions.length > 0 && (
                <Box
                  sx={{
                    position: "absolute",
                    top: "100%",
                    left: 0,
                    right: 0,
                    border: "1px solid",
                    borderColor: "border",
                    borderRadius: "md",
                    bg: "background",
                    mt: 1,
                    maxHeight: "320px",
                    overflowY: "auto",
                    zIndex: 999,
                  }}
                >
                  {sessions.map((session: any) => (
                    <Box
                      key={session.id}
                      onClick={() => {
                        setSessionId(session.id);
                        setShowSession(false);
                        resetPagination();
                      }}
                      sx={{
                        p: 2,
                        cursor: "pointer",
                        borderBottom: "1px solid",
                        borderColor: "border",
                        "&:hover": { bg: "muted" },
                      }}
                    >
                      {session.label}
                    </Box>
                  ))}
                </Box>
              )}
            </Box>

            {/* Clear Filters */}
            <Button
              onClick={() => {
                setSelectedGroup("");
                setSelectedSubject(null);
                setSessionId("");
                resetPagination();
              }}
              sx={{ bg: "red", alignSelf: "flex-end" }}
            >
              {t("attendance.clear")}
            </Button>
          </Flex>

          {/* Table */}
          <Box sx={{ position: "relative" }}>
            <AttendanceTable
              data={formattedData}
              loading={loading}
              onBatchUpdateAttendance={handleBatchUpdateAttendance}
            />
          </Box>

          {/* Pagination */}
          <Flex sx={{ justifyContent: "space-between", alignItems: "center" }}>
            <Button onClick={handlePrevious} disabled={history.length === 0}>
              {t("common.previous")}
            </Button>
            <Button onClick={handleNext} disabled={!pageInfo?.hasNextPage}>
              {t("common.next")}
            </Button>
          </Flex>
        </Box>
      </PageLayout>
    </Layout>
  );
}
