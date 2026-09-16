import { useState, useMemo } from "react";
import { Badge, Box, Button, Card, Flex, Grid, Heading, Text } from "theme-ui";
import { Layout } from "../components/Layout";
import { PageLayout } from "../components/PageLayout";
import {
  LuDollarSign,
  LuGraduationCap,
  LuSchool,
  LuUsers,
  LuRefreshCw,
  LuTriangle,
} from "react-icons/lu";
import {
  useDashboardDataQuery,
  useGetSessionsQuery,
  useInvoicesQuery,
} from "../graphql";
import RecentInvoicesCard from "../components/InvoicesCard";
import QuickActionCard from "../components/QuickActionCard";
import { t } from "i18next";
import i18n from "../i18n/i18n";
import { useAuth } from "../contexts/AuthContext";

export function HomePage() {
  const { startOfDayIso, endOfDayIso } = useMemo(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const end = new Date();
    end.setHours(23, 59, 59, 999);

    return {
      startOfDayIso: start.toISOString(),
      endOfDayIso: end.toISOString(),
    };
  }, []);

  // 1. استخراج حالة error و refetch من الاستعلامات
  const {
    data,
    loading: loadingSessions,
    error: sessionsError,
    refetch: refetchSessions,
  } = useGetSessionsQuery({
    variables: {
      where: {
        startAtGTE: startOfDayIso,
        startAtLT: endOfDayIso,
      },
    },
    fetchPolicy: "cache-first",
  });

  const {
    data: dashboardInfo,
    loading: loadingInfo,
    error: infoError,
    refetch: refetchInfo,
  } = useDashboardDataQuery({
    fetchPolicy: "network-only",
  });

  const [showAll, setShowAll] = useState(false);
  const [firstCount, setFirstCount] = useState(5);

  const {
    data: invoices,
    error: invoicesError,
    refetch: refetchInvoices,
  } = useInvoicesQuery({
    variables: {
      where: {},
      first: firstCount,
    },
    fetchPolicy: "cache-first",
  });

  const formattedDate = useMemo(
    () =>
      new Intl.DateTimeFormat(i18n.language.startsWith("ar") ? "ar" : "en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      }).format(new Date()),
    []
  );

  const sortedSessions = useMemo(() => {
    const rawSessions = data?.sessions?.edges || [];
    const now = new Date();

    const order = {
      Ongoing: 0,
      Upcoming: 1,
      Completed: 2,
    };

    const parsed = rawSessions
      .map((edge) => {
        const session = edge?.node;
        if (!session) return null;

        const start = new Date(session.startAt);
        const end = new Date(session.endAt);

        let status: "Upcoming" | "Ongoing" | "Completed";
        if (now < start) {
          status = "Upcoming";
        } else if (now >= start && now <= end) {
          status = "Ongoing";
        } else {
          status = "Completed";
        }

        return { ...session, status };
      })
      .filter((s): s is NonNullable<typeof s> => s !== null);

    return parsed.sort((a, b) => {
      if (order[a.status] !== order[b.status]) {
        return order[a.status] - order[b.status];
      }
      return new Date(a.startAt).getTime() - new Date(b.startAt).getTime();
    });
  }, [data?.sessions?.edges]);

  const totalInvoices = invoices?.invoices.totalCount || 0;

  const handleViewAllToggle = (shouldShowAll: boolean) => {
    if (shouldShowAll) {
      setFirstCount(totalInvoices || 100);
    } else {
      setFirstCount(5);
    }
  };

  const displayedSessions = showAll
    ? sortedSessions
    : sortedSessions.slice(0, 5);

  const formatTime = (dateStr?: string) => {
    if (!dateStr) return "--:--";
    const d = new Date(dateStr);
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    return `${hours}:${minutes}`;
  };

  // 2. دالة لإعادة محاولة طلب البيانات لجميع الاستعلامات
  const handleReloadAll = () => {
    refetchInfo();
    refetchSessions();
    refetchInvoices();
  };

  // 3. التحقق مما إذا كان هناك خطأ في أي من الطلبات الأساسية
  const hasError = infoError || sessionsError || invoicesError;
  const { isLoading, isAuthenticated } = useAuth();

  // Prevent Apollo queries from running until Firebase resolves token state
  if (isLoading) {
    return <div>Loading authentication...</div>;
  }

  if (!isAuthenticated) {
    return <div>Unauthorized. Please log in again.</div>;
  }
  // 4. عرض واجهة الخطأ في حال الفشل
  if (hasError) {
    return (
      <Layout>
        <PageLayout
          title={t("navigation.dashboard")}
          description={formattedDate}
        >
          <Card
            sx={{
              p: 5,
              textAlign: "center",
              bg: "tableBackground",
              borderRadius: "lg",
              border: "1px solid",
              borderColor: "border",
              boxShadow: "sm",
              my: 4,
            }}
          >
            <Flex
              sx={{
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 3,
              }}
            >
              <LuTriangle size={48} color="#ef4444" />
              <Heading as="h3" sx={{ fontSize: 3, color: "text" }}>
                {t("Something went wrong while loading dashboard data")}
              </Heading>
              <Text sx={{ color: "gray", fontSize: 1, maxW: "400px" }}>
                {infoError?.message ||
                  sessionsError?.message ||
                  invoicesError?.message ||
                  "Unable to connect to the server. Please try again."}
              </Text>
              <Button
                onClick={handleReloadAll}
                sx={{
                  mt: 2,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 2,
                  bg: "primary",
                  color: "background",
                  cursor: "pointer",
                  px: 4,
                  py: 2,
                  borderRadius: "md",
                  fontWeight: "bold",
                  "&:hover": {
                    opacity: 0.9,
                  },
                }}
              >
                <LuRefreshCw size={18} />
                {t("Reload")}
              </Button>
            </Flex>
          </Card>
        </PageLayout>
      </Layout>
    );
  }

  if (loadingInfo || loadingSessions) {
    return <Box p={4}>Loading...</Box>;
  }

  return (
    <Layout>
      <PageLayout title={t("navigation.dashboard")} description={formattedDate}>
        <Grid columns={[1, 2]} gap={4} sx={{ mb: 4 }}>
          {/* Students */}
          <Card
            sx={{
              p: 4,
              display: "flex",
              flexDirection: "column",
              gap: 3,
              bg: "tableBackground",
              borderRadius: "lg",
              border: "1px solid",
              borderColor: "border",
              boxShadow: "sm",
            }}
          >
            <Box>
              <LuGraduationCap size={28} color="#3b82f6" />
            </Box>
            <Text sx={{ fontSize: 5, fontWeight: "bold", lineHeight: 1 }}>
              {dashboardInfo?.dashboardData.students}
            </Text>
            <Text sx={{ color: "gray", mt: 2, fontSize: 1 }}>
              {t("dashboard.totalStudents")}
            </Text>
          </Card>

          {/* Teachers */}
          <Card
            sx={{
              p: 4,
              display: "flex",
              flexDirection: "column",
              gap: 3,
              bg: "tableBackground",
              borderRadius: "lg",
              border: "1px solid",
              borderColor: "border",
              boxShadow: "sm",
            }}
          >
            <Box>
              <LuUsers size={28} color="#10b981" />
            </Box>
            <Text sx={{ fontSize: 5, fontWeight: "bold", lineHeight: 1 }}>
              {dashboardInfo?.dashboardData.teachers}
            </Text>
            <Text sx={{ color: "gray", mt: 2, fontSize: 1 }}>
              {t("dashboard.totalTeachers")}
            </Text>
          </Card>

          {/* Groups */}
          <Card
            sx={{
              p: 4,
              display: "flex",
              flexDirection: "column",
              gap: 3,
              bg: "tableBackground",
              borderRadius: "lg",
              border: "1px solid",
              borderColor: "border",
              boxShadow: "sm",
            }}
          >
            <Box>
              <LuSchool size={28} color="#8b5cf6" />
            </Box>
            <Text sx={{ fontSize: 5, fontWeight: "bold", lineHeight: 1 }}>
              {dashboardInfo?.dashboardData.groups}
            </Text>
            <Text sx={{ color: "gray", mt: 2, fontSize: 1 }}>
              {t("dashboard.totalGroups")}
            </Text>
          </Card>

          {/* Revenue */}
          <Card
            sx={{
              p: 4,
              display: "flex",
              flexDirection: "column",
              gap: 3,
              bg: "tableBackground",
              borderRadius: "lg",
              border: "1px solid",
              borderColor: "border",
              boxShadow: "sm",
            }}
          >
            <Box>
              <LuDollarSign size={28} color="#f59e0b" />
            </Box>
            <Text sx={{ fontSize: 5, fontWeight: "bold", lineHeight: 1 }}>
              {dashboardInfo?.dashboardData.amount}
            </Text>
            <Text sx={{ color: "gray", mt: 2, fontSize: 1 }}>
              {t("dashboard.Revenue")}
            </Text>
          </Card>
        </Grid>

        {/* Sessions Section */}
        <Card
          sx={{
            p: 4,
            display: "flex",
            flexDirection: "column",
            gap: 3,
            mb: 4,
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
              mb: 2,
            }}
          >
            <Box>
              <Heading
                sx={{ m: 0, fontSize: 3, fontWeight: "heading", color: "text" }}
              >
                {t("dashboard.today'sSchedule")}
              </Heading>
              <Text
                sx={{ fontSize: 1, color: "subtle", mt: 1, display: "block" }}
              >
                {sortedSessions.length} {t("dashboard.sessionsplanned")}
              </Text>
            </Box>

            {sortedSessions.length > 5 && (
              <Text
                onClick={() => setShowAll(!showAll)}
                sx={{
                  color: "primary",
                  cursor: "pointer",
                  fontSize: 1,
                  fontWeight: "bold",
                  "&:hover": { textDecoration: "underline" },
                }}
              >
                {showAll ? "Show less" : "View all"}
              </Text>
            )}
          </Flex>

          {displayedSessions.map((session) => {
            const isOngoing = session?.status === "Ongoing";
            const isUpcoming = session?.status === "Upcoming";

            return (
              <Flex
                key={session?.id}
                sx={{
                  justifyContent: "space-between",
                  alignItems: "center",
                  p: 3,
                  bg: isOngoing
                    ? (theme) =>
                        theme.colors?.background === "#102A25"
                          ? "muted"
                          : "primaryLight"
                    : "tableRowStripe",
                  border: "1px solid",
                  borderColor: isOngoing ? "primary" : "tableBorder",
                  borderRadius: "12px",
                  boxShadow: isOngoing
                    ? "0px 0px 12px rgba(60, 183, 165, 0.2)"
                    : "none",
                  transition: "all 0.2s ease-in-out",
                  "&:hover": {
                    borderColor: "subtle",
                    bg: "tableRowHover",
                  },
                }}
              >
                <Flex sx={{ alignItems: "center", flex: 1 }}>
                  <Box sx={{ width: "80px", pr: 2, textAlign: "center" }}>
                    <Text
                      sx={{
                        fontWeight: "heading",
                        fontSize: 2,
                        fontFamily: "mono",
                        color: isOngoing ? "primary" : "text",
                      }}
                    >
                      {formatTime(session?.startAt)}
                    </Text>
                  </Box>

                  <Box
                    sx={{
                      height: "40px",
                      borderLeft: "1px solid",
                      borderColor: isOngoing ? "primary" : "border",
                      mx: 3,
                    }}
                  />

                  <Box>
                    <Text
                      sx={{
                        fontWeight: "bold",
                        fontSize: 2,
                        color: isOngoing
                          ? (theme) =>
                              theme.colors?.background === "#102A25"
                                ? "text"
                                : "primaryDark"
                          : "text",
                        display: "block",
                      }}
                    >
                      {session?.schedule?.subject?.name} G
                      {session?.schedule?.group?.name} —{" "}
                    </Text>
                    <Text
                      sx={{
                        fontSize: 1,
                        color: isOngoing ? "primary" : "subtle",
                        mt: 0.5,
                        display: "block",
                      }}
                    >
                      {session?.schedule?.assignment?.teacher?.firstName
                        ? `Mr. ${session?.schedule?.assignment?.teacher?.firstName}`
                        : ""}{" "}
                      · {session?.schedule?.subject?.name}
                    </Text>
                  </Box>
                </Flex>

                <Badge
                  sx={{
                    px: 3,
                    py: 1.5,
                    borderRadius: "20px",
                    bg: isOngoing ? "primary" : "muted",
                    color: isOngoing ? "background" : "text",
                    fontWeight: "heading",
                    fontSize: 1,
                    border: isUpcoming ? "1px solid" : "none",
                    borderColor: "border",
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                  }}
                >
                  🕒{" "}
                  {session?.status === "Completed"
                    ? t("dashboard.Completed")
                    : session?.status === "Ongoing"
                    ? t("dashboard.Ongoing")
                    : t("dashboard.Upcoming")}
                </Badge>
              </Flex>
            );
          })}
        </Card>

        <RecentInvoicesCard
          invoicesData={invoices?.invoices}
          totalCount={totalInvoices}
          onViewAll={handleViewAllToggle}
        />
        <QuickActionCard />
      </PageLayout>
    </Layout>
  );
}
