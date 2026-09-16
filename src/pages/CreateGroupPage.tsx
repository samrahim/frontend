import { PageLayout } from "../components/PageLayout";
import { Layout } from "../components/Layout";
import { CreateGroupForm } from "../components/GroupComponents/CreateGroup/CreateGroupForm";
import { Button } from "theme-ui";
import { t } from "i18next";

export function CreateGroupPage() {
  return (
    <Layout>
      <PageLayout
        title={t("dashboard.createGroup")}
        description={t("groups.add")}
        actions={[
          <Button
            key="back-button" // ✅ زيد هذا
            onClick={() => window.history.back()}
            variant="secondary"
          >
            {t("common.back")}
          </Button>,
        ]}
      >
        <CreateGroupForm />
      </PageLayout>
    </Layout>
  );
}
