import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { PageLayout } from "../components/PageLayout";
import { GroupsTable } from "../components/GroupComponents/GroupsTable";
import { Layout } from "../components/Layout";

import { useEffect, useState } from "react";

import { Box, Button, Input, Text } from "theme-ui";

export function GroupsPage() {
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
        title={t("groups.title")}
        description={t("groups.description")}
        icon="👫"
        actions={
          <Button onClick={() => navigate("/groups/create")}>
            {t("groups.createButton")}
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
            placeholder="Search Groups..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </Box>

        <GroupsTable limit={10} searchTerm={debouncedSearch} />
      </PageLayout>
    </Layout>
  );
}
