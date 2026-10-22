import { useEffect, useState } from "react";
import { Box, Input, Select } from "@theme-ui/components";
import { PageLayout } from "../components/PageLayout";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import { Layout } from "../components/Layout";
import { PayrollsTable } from "../components/PayrollsTable";
import { TeacherPayrollStatus } from "../graphql";

export default function PayrollsScreen() {
  const { t } = useTranslation();

  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    TeacherPayrollStatus | "ALL"
  >("ALL");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  return (
    <Layout>
      <PageLayout
        title={t("teachers.payrolltitle")}
        description={t("teachers.payrolldescription")}
        icon="👨‍🏫"
      >
        <Box
          sx={{
            display: "flex",
            gap: 3,
            flexWrap: "wrap",
            alignItems: "center",
            p: 3,
            mb: 3,
            bg: "muted",
            borderRadius: 8,
            border: "1px solid",
            borderColor: "border",
          }}
        >
          <Input
            sx={{ width: 300 }}
            placeholder={t("teachers.searchPlaceholder")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <Select
            sx={{ width: 200 }}
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as TeacherPayrollStatus | "ALL")
            }
          >
            <option value="ALL">
              {t("common.allStatus") || "All Statuses"}
            </option>
            {Object.values(TeacherPayrollStatus).map((status) => (
              <option key={status} value={status}>
                {t(`teachers.${status.toLocaleLowerCase()}`)}
              </option>
            ))}
          </Select>
        </Box>

        <PayrollsTable
          limit={10}
          searchTerm={debouncedSearch}
          statusFilter={statusFilter}
        />
      </PageLayout>
    </Layout>
  );
}
