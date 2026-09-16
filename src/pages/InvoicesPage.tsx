import { Box, Flex, Input, Select } from "theme-ui";
import { Layout } from "../components/Layout";

import { PageLayout } from "../components/PageLayout";
import { InvoiceTable } from "../components/invoicesTable";
import { useEffect, useState } from "react";
import { useGroupsTableQuery } from "../graphql";
import i18n from "../i18n/i18n";
import { t } from "i18next";

export function InvoicesPage() {
  const [filters, setFilters] = useState({
    search: "",
    groupId: "",
    month: "",
  });
  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(filters["search"]);
    }, 300);

    return () => clearTimeout(timer);
  });
  const { data: groupsData } = useGroupsTableQuery({
    variables: {
      offset: 0,
      limit: 100,
      withTotalCount: false,
    },
  });
  const isArabic = i18n.language.startsWith("ar");

  const months = isArabic
    ? [
        "جانفي",
        "فيفري",
        "مارس",
        "أفريل",
        "ماي",
        "جوان",
        "جويلية",
        "أوت",
        "سبتمبر",
        "أكتوبر",
        "نوفمبر",
        "ديسمبر",
      ]
    : [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
      ];
  const currentYear = new Date().getFullYear();
  return (
    <Layout>
      <PageLayout
        title={t("invoices.title")}
        description={t("invoices.description")}
        icon="🧾"
      >
        <Box
          sx={{
            p: 3,
            mb: 3,
            bg: "muted",
            borderRadius: 8,
            border: "1px solid",
            borderColor: "border",
          }}
        >
          <Flex
            sx={{
              gap: 3,
              flexWrap: "wrap",
            }}
          >
            <Input
              placeholder={t("students.searchPlaceholder")}
              value={filters.search}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  search: e.target.value,
                }))
              }
              sx={{
                flex: ["1 1 100%", "2 1 50%"], // mobile / desktop
                minWidth: 240,
              }}
            />

            <Select
              value={filters.groupId}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  groupId: e.target.value,
                }))
              }
              sx={{
                flex: ["1 1 100%", "1 1 25%"],
                minWidth: 180,
              }}
            >
              <option value="">{t("students.allGrps")}</option>

              {groupsData?.groupsTable?.edges?.map((edge) => (
                <option key={edge?.node?.id} value={edge?.node?.id}>
                  {edge?.node?.name}
                </option>
              ))}
            </Select>

            <Select
              value={filters.month}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  month: e.target.value,
                }))
              }
              sx={{
                flex: ["1 1 100%", "1 1 25%"],
                minWidth: 180,
              }}
            >
              <option value="">{t("invoices.allmonths")}</option>

              {months.map((month, index) => (
                <option
                  key={index}
                  value={`${currentYear}-${String(index + 1).padStart(2, "0")}`}
                >
                  {month}
                </option>
              ))}
            </Select>
          </Flex>
        </Box>

        <InvoiceTable
          search={debouncedSearch}
          month={filters["month"]}
          groupId={filters["groupId"]}
        />
      </PageLayout>
    </Layout>
  );
}
