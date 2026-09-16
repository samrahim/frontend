import { PageLayout } from "../components/PageLayout";
import { TeachersTable } from "../components/TeacherComponents/TeachersTable";
import { Layout } from "../components/Layout";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";

import { Box, Button, Input } from "theme-ui";
import { useNavigate } from "react-router-dom";

export function TeachersPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);
  return (
    <Layout>
      <PageLayout
        title={t("teachers.title")}
        description={t("teachers.description")}
        icon="👨‍🏫"
        actions={
          <Button onClick={() => navigate("/teachers/create")}>
            {t("teachers.createTeacher")}
          </Button>
        }
      >
        <Box
          sx={{
            gap: 3,
            flexWrap: "wrap",
            alignItems: "flex-end",
            p: 3,
            mb: 3,
            bg: "muted",
            borderRadius: 8,
            border: "1px solid",
            borderColor: "border",
          }}
        >
          <Input
            sx={{
              width: 420,
            }}
            placeholder={t("teachers.searchPlaceholder")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </Box>

        <TeachersTable limit={10} searchTerm={debouncedSearch} />
      </PageLayout>
    </Layout>
  );
}
