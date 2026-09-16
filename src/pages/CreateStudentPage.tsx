import { PageLayout } from "../components/PageLayout";
import { Layout } from "../components/Layout";
import { CreateStudentForm } from "../components/StudentComponents/CreateStudentForm";
import { t } from "i18next";

export function CreateStudentPage() {
  return (
    <Layout>
      <PageLayout
        title={t("students.title")}
        description={t("students.adddescription")}
        icon="➕"
      >
        <CreateStudentForm />
      </PageLayout>
    </Layout>
  );
}
