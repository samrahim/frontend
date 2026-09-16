import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { Box, Button, Flex, Input } from "theme-ui";

import { Layout } from "../components/Layout";
import { PageLayout } from "../components/PageLayout";

import { useNavigate } from "react-router-dom";
import { HifdhTable } from "../components/hifdhTable";

export function HifdhTracking() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // ✅ Keep only these two state variables
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
        title={t("navigation.hifdhTracking")}
        description={t("hifdh.description")}
        icon="📖"
        actions={
          <Button onClick={() => navigate("/createhifdh")}>
            {t("hifdh.registerNew")}
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
            placeholder={t("common.searchByName")}
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
            }}
          />
        </Box>
        <HifdhTable searchTerm={debouncedSearch}></HifdhTable>
      </PageLayout>
    </Layout>
  );
}
