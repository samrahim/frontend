import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { PageLayout } from "../components/PageLayout";
import { Layout } from "../components/Layout";
import { Box, Button, Input } from "theme-ui";
import { RecitationTable } from "../components/RecitationTable";

export function RecitationTracking() {
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
        title={t("navigation.recitationTracking")}
        description={t("recitation.description")}
        icon="🎙️"
        actions={
          <Button onClick={() => navigate("/createrecitation")}>
            {t("recitation.registerNew")}
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
            value={searchTerm} // ✅ Fixed: Point to searchTerm
            onChange={(e) => {
              setSearchTerm(e.target.value); // ✅ Fixed: Update searchTerm
            }}
          />
        </Box>
        <RecitationTable searchTerm={debouncedSearch} />
      </PageLayout>
    </Layout>
  );
}
