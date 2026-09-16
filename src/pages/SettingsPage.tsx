import { useState } from "react";
import { PageLayout } from "../components/PageLayout";
import { Layout } from "../components/Layout";
import { Box, Text, Button, Flex, Message } from "theme-ui";

import { SubjectComponent } from "../components/SubjectComponent";
import { WithDrawsTypesComponent } from "../components/WithDrawComponent";
import { ClassRoomComponent } from "../components/ClassRooms";
import { t } from "i18next";
import { AcademicSubscriptionProvider } from "../contexts/AcademicSubscriptionProvider";
import { FinanceSubscriptionProvider } from "../contexts/FinanceSubscriptionProvider";
import { SchoolInfosComponent } from "../components/schoolInfo";
import { ParentRelationComponent } from "../components/ParentRelations";
import { FamilyMemberSubscriptionProvider } from "../contexts/FamilyMumberSubscriptionProvider";

type TabType =
  | "subjects"
  | "withdraws_types"
  | "classrooms"
  | "schoolInfo"
  | "parentrelation";

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabType>("subjects");

  const renderContent = () => {
    switch (activeTab) {
      case "subjects":
        return <SubjectComponent></SubjectComponent>;
      case "withdraws_types":
        return (
          <FinanceSubscriptionProvider>
            <WithDrawsTypesComponent></WithDrawsTypesComponent>
          </FinanceSubscriptionProvider>
        );
      case "classrooms":
        return (
          <AcademicSubscriptionProvider>
            <ClassRoomComponent></ClassRoomComponent>
          </AcademicSubscriptionProvider>
        );
      case "schoolInfo":
        return (
          <AcademicSubscriptionProvider>
            <SchoolInfosComponent></SchoolInfosComponent>
          </AcademicSubscriptionProvider>
        );

      case "parentrelation":
        return (
          <FamilyMemberSubscriptionProvider>
            <ParentRelationComponent></ParentRelationComponent>
          </FamilyMemberSubscriptionProvider>
        );
    }
  };

  const TabButton = ({ tab, label }: { tab: TabType; label: string }) => (
    <Button
      variant={activeTab === tab ? "primary" : "secondary"}
      onClick={() => setActiveTab(tab)}
      sx={{
        borderRadius: "md",
        px: 3,
        py: 2,
        cursor: "pointer",
      }}
    >
      {label}
    </Button>
  );

  return (
    <Layout>
      <PageLayout
        title={t("settings.title")}
        description={t("settings.description")}
        icon="⚙️"
      >
        <Box
          sx={{ bg: "background", p: 4, borderRadius: "lg", boxShadow: "sm" }}
        >
          {/* Tabs */}
          <Flex sx={{ gap: 2, mb: 4 }}>
            <TabButton tab="subjects" label={t("navigation.subjects")} />
            <TabButton tab="classrooms" label={t("navigation.classes")} />
            <TabButton
              tab="withdraws_types"
              label={t("navigation.withdrawTypes")}
            />
            <TabButton tab="schoolInfo" label={t("navigation.schoolInfo")} />
            <TabButton
              tab="parentrelation"
              label={t("navigation.parentrelation")}
            />
          </Flex>

          {/* Content */}
          <Box
            sx={{
              bg: "muted",
              p: 4,
              borderRadius: "md",
              minHeight: "150px",
            }}
          >
            {renderContent()}
          </Box>
        </Box>
      </PageLayout>
    </Layout>
  );
}
