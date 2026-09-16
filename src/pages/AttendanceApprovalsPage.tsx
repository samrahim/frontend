import React, { useState, useEffect } from "react";
import {
  Box,
  Flex,
  Text,
  Heading,
  Button,
  Card,
  Checkbox,
  Divider,
  Alert,
  Input,
} from "theme-ui";
import {
  useGetPendingAttendanceSessionsQuery,
  useUpdateattendacesMutation,
  GetPendingAttendanceSessionsCountDocument,
} from "../graphql/generated";
import { PageLayout } from "../components/PageLayout";
import { Layout } from "../components/Layout";
import { t } from "i18next";

interface AttendanceRecord {
  id: string;
  isPresent: boolean;
  reason: string;
  studentName: string;
}

interface PendingSession {
  id: string;
  groupName: string;
  teacherName: string;
  startAt: string;
  records: AttendanceRecord[];
}

export function AttendanceApprovalsPage() {
  const [selectedSessionIds, setSelectedSessionIds] = useState<string[]>([]);
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(
    null
  );

  // Local state holding current session & attendance modifications
  const [sessionsMap, setSessionsMap] = useState<
    Record<string, PendingSession>
  >({});

  const { data, loading, error, refetch } =
    useGetPendingAttendanceSessionsQuery({
      variables: { first: 20 },
      fetchPolicy: "network-only",
    });

  const [updateAttendances, { loading: isApproving }] =
    useUpdateattendacesMutation({});

  // Sync incoming GraphQL data into local editable state
  useEffect(() => {
    if (!data?.sessions?.edges) return;

    const nextMap: Record<string, PendingSession> = {};

    data.sessions.edges.forEach((edge) => {
      const session = edge?.node;
      if (!session) return;

      const sId = String(session.id);
      const groupName = session.schedule?.group?.name ?? "Unnamed Group";
      const teacher = session.schedule?.assignment?.teacher;
      const teacherName = teacher
        ? `${teacher.firstName ?? ""} ${teacher.lastName ?? ""}`.trim()
        : "Unknown Teacher";

      nextMap[sId] = {
        id: sId,
        groupName,
        teacherName,
        startAt: session.startAt ?? "",
        records: (session.attendance ?? []).map((att) => ({
          id: String(att?.id),
          isPresent: !!att?.isPresent,
          reason: att?.reason ?? "",
          studentName: `${att?.student?.firstName ?? ""} ${
            att?.student?.lastName ?? ""
          }`.trim(),
        })),
      };
    });

    setSessionsMap(nextMap);
  }, [data]);

  const sessions = Object.values(sessionsMap);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedSessionIds(sessions.map((s) => s.id));
    } else {
      setSelectedSessionIds([]);
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedSessionIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Modify local state for presence toggle
  const handleTogglePresence = (sessionId: string, recordId: string) => {
    setSessionsMap((prev) => {
      const session = prev[sessionId];
      if (!session) return prev;

      return {
        ...prev,
        [sessionId]: {
          ...session,
          records: session.records.map((rec) =>
            rec.id === recordId ? { ...rec, isPresent: !rec.isPresent } : rec
          ),
        },
      };
    });
  };

  // Modify local state for reasons
  const handleReasonChange = (
    sessionId: string,
    recordId: string,
    value: string
  ) => {
    setSessionsMap((prev) => {
      const session = prev[sessionId];
      if (!session) return prev;

      return {
        ...prev,
        [sessionId]: {
          ...session,
          records: session.records.map((rec) =>
            rec.id === recordId ? { ...rec, reason: value } : rec
          ),
        },
      };
    });
  };

  // Submit current state values to mutation
  const handleApproveSessions = async (sessionIdsToApprove: string[]) => {
    try {
      const targetSessions = sessions.filter((s) =>
        sessionIdsToApprove.includes(s.id)
      );

      const inputs = targetSessions.flatMap((session) =>
        session.records.map((rec) => ({
          id: rec.id,
          isPresent: rec.isPresent,
          reason: rec.reason.trim() || null,
        }))
      );

      if (inputs.length === 0) return;

      await updateAttendances({ variables: { inputs } });

      setSelectedSessionIds((prev) =>
        prev.filter((id) => !sessionIdsToApprove.includes(id))
      );
      // refetch();
    } catch (err) {
      console.error("Failed to approve sessions:", err);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "";
    const parsedDate = new Date(dateStr);
    if (isNaN(parsedDate.getTime())) return dateStr;
    return parsedDate.toLocaleDateString(undefined, {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <PageLayout title={t("attendance.attendanceApprovals")}>
        <Flex
          sx={{
            justifyContent: "center",
            alignItems: "center",
            minHeight: "50vh",
          }}
        >
          <Box
            sx={{
              width: "44px",
              height: "44px",
              border: "4px solid rgba(17, 75, 61, 0.2)",
              borderTopColor: "#114b3d",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
              "@keyframes spin": {
                "0%": { transform: "rotate(0deg)" },
                "100%": { transform: "rotate(360deg)" },
              },
            }}
          />
        </Flex>
      </PageLayout>
    );
  }

  if (error) {
    return (
      <PageLayout title={t("attendance.attendanceApprovals")}>
        <Box sx={{ p: 3 }}>
          <Alert variant="error" sx={{ mb: 2 }}>
            Failed to load pending attendance sessions: {error.message}
          </Alert>
          <Button onClick={() => refetch()}>Retry</Button>
        </Box>
      </PageLayout>
    );
  }

  return (
    <Layout>
      <PageLayout title={t("attendance.attendanceApprovals")}>
        <Box sx={{ bg: "#f7f5f0", minHeight: "100vh", p: [2, 4] }}>
          {/* Header Bar */}
          <Flex
            sx={{
              justifyContent: "space-between",
              alignItems: "center",
              mb: 3,
            }}
          >
            <Box>
              <Text sx={{ fontSize: 1, color: "gray" }}>
                {t("attendance.sessionsWaitingApproval", {
                  count: sessions.length,
                })}
              </Text>
            </Box>

            {selectedSessionIds.length > 0 && (
              <Button
                onClick={() => handleApproveSessions(selectedSessionIds)}
                disabled={isApproving}
                sx={{
                  bg: "#114b3d",
                  cursor: "pointer",
                  borderRadius: "8px",
                  fontWeight: "bold",
                  px: 3,
                  py: 2,
                }}
              >
                {isApproving
                  ? "Approving..."
                  : `Approve Selected (${selectedSessionIds.length})`}
              </Button>
            )}
          </Flex>

          {sessions.length === 0 ? (
            <Card
              sx={{
                p: 4,
                textAlign: "center",
                borderRadius: "16px",
                bg: "#ffffff",
              }}
            >
              <Heading as="h3" sx={{ fontSize: 3, mb: 1 }}>
                {t("attendance.allCaughtUp")}
              </Heading>
              <Text sx={{ fontSize: 1, color: "gray" }}>
                {t("attendance.noApproval")}
              </Text>
            </Card>
          ) : (
            <>
              <Flex sx={{ alignItems: "center", mb: 2, px: 1 }}>
                <Checkbox
                  checked={
                    selectedSessionIds.length === sessions.length &&
                    sessions.length > 0
                  }
                  onChange={(e) => handleSelectAll(e.target.checked)}
                />
                <Text
                  sx={{ fontSize: 1, fontWeight: "bold", color: "gray", ml: 2 }}
                >
                  {t("attendance.selectAllPending")}
                </Text>
              </Flex>

              <Flex sx={{ flexDirection: "column", gap: 3 }}>
                {sessions.map((session) => {
                  const isSelected = selectedSessionIds.includes(session.id);
                  const isExpanded = expandedSessionId === session.id;

                  const presentCount = session.records.filter(
                    (a) => a.isPresent
                  ).length;
                  const totalCount = session.records.length;

                  return (
                    <Card
                      key={session.id}
                      sx={{
                        p: 3,
                        borderRadius: "16px",
                        bg: "#ffffff",
                        border: "1px solid #E5E7EB",
                      }}
                    >
                      <Flex
                        sx={{
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <Flex sx={{ alignItems: "center", gap: 3 }}>
                          <Checkbox
                            checked={isSelected}
                            onChange={() => handleToggleSelect(session.id)}
                          />
                          <Box>
                            <Text
                              sx={{
                                fontWeight: "bold",
                                fontSize: 2,
                                display: "block",
                              }}
                            >
                              {session.groupName}
                            </Text>
                            <Text sx={{ fontSize: 1, color: "gray" }}>
                              {t("attendance.teacherSessionInfo", {
                                teacherName: session.teacherName,
                                date: formatDate(session.startAt),
                              })}
                            </Text>
                          </Box>
                        </Flex>

                        <Flex sx={{ alignItems: "center", gap: 2 }}>
                          <Box
                            sx={{
                              px: 2,
                              py: 1,
                              borderRadius: "12px",
                              fontSize: 0,
                              fontWeight: "bold",
                              bg:
                                presentCount === totalCount
                                  ? "#dcfce7"
                                  : "#fef3c7",
                              color:
                                presentCount === totalCount
                                  ? "#166534"
                                  : "#92400e",
                            }}
                          >
                            {t("attendance.attendanceStatus", {
                              presentCount: presentCount,
                              totalCount: totalCount,
                            })}
                          </Box>

                          <Button
                            disabled={isApproving}
                            onClick={() => handleApproveSessions([session.id])}
                            sx={{
                              bg: "transparent",
                              color: "#114b3d",
                              border: "1px solid #114b3d",
                              borderRadius: "8px",
                              cursor: "pointer",
                              px: 3,
                              py: 1,
                              fontWeight: "bold",
                            }}
                          >
                            {t("attendance.approve")}
                          </Button>

                          <Button
                            onClick={() =>
                              setExpandedSessionId(
                                isExpanded ? null : session.id
                              )
                            }
                            sx={{
                              bg: "transparent",
                              color: "gray",
                              cursor: "pointer",
                              p: 1,
                            }}
                          >
                            {isExpanded ? "▲" : "▼"}
                          </Button>
                        </Flex>
                      </Flex>

                      {isExpanded && (
                        <Box sx={{ mt: 3 }}>
                          <Divider sx={{ my: 2 }} />
                          <Text
                            sx={{
                              fontWeight: "bold",
                              fontSize: 1,
                              mb: 2,
                              display: "block",
                            }}
                          >
                            {t("attendance.currentRecordsEditable")}
                          </Text>

                          <Box
                            sx={{
                              display: "grid",
                              gridTemplateColumns:
                                "repeat(auto-fill, minmax(260px, 1fr))",
                              gap: 2,
                            }}
                          >
                            {session.records.map((att) => (
                              <Box
                                key={att.id}
                                sx={{
                                  p: 2,
                                  borderRadius: "8px",
                                  bg: att.isPresent ? "#f0fdf4" : "#fef2f2",
                                  border: `1px solid ${
                                    att.isPresent ? "#bbf7d0" : "#fecaca"
                                  }`,
                                }}
                              >
                                <Flex
                                  sx={{
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    mb: 1.5,
                                  }}
                                >
                                  <Text
                                    sx={{
                                      fontSize: 1,
                                      fontWeight: "bold",
                                    }}
                                  >
                                    {att.studentName}
                                  </Text>

                                  <Button
                                    type="button"
                                    onClick={() =>
                                      handleTogglePresence(session.id, att.id)
                                    }
                                    sx={{
                                      fontSize: 0,
                                      py: 1,
                                      px: 2,
                                      cursor: "pointer",
                                      borderRadius: "6px",
                                      fontWeight: "bold",
                                      bg: att.isPresent ? "#166534" : "#991b1b",
                                      color: "#ffffff",
                                    }}
                                  >
                                    {att.isPresent
                                      ? t("attendance.present")
                                      : t("attendance.absent")}
                                  </Button>
                                </Flex>

                                {!att.isPresent && (
                                  <Input
                                    placeholder={t(
                                      "attendance.reasonPlaceHolder"
                                    )}
                                    value={att.reason}
                                    onChange={(e) =>
                                      handleReasonChange(
                                        session.id,
                                        att.id,
                                        e.target.value
                                      )
                                    }
                                    sx={{
                                      fontSize: 0,
                                      bg: "#ffffff",
                                      borderColor: "#d1d5db",
                                      borderRadius: "6px",
                                      p: 1.5,
                                    }}
                                  />
                                )}
                              </Box>
                            ))}
                          </Box>
                        </Box>
                      )}
                    </Card>
                  );
                })}
              </Flex>
            </>
          )}
        </Box>
      </PageLayout>
    </Layout>
  );
}
