import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { Layout } from "../components/Layout";
import { PageLayout } from "../components/PageLayout";
import { StudentTable } from "../components/StudentComponents/StudentTable";

import {
  useGroupsTableQuery,
  useExportStudentExcelLazyQuery,
} from "../graphql";

import { useNavigate } from "react-router-dom";
import { Box, Button, Flex, Input, Select } from "theme-ui";

export function StudentsPage() {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);
  const [selectedGroup, setSelectedGroup] = useState<string | undefined>();
  const [selectedGender, setSelectedGender] = useState<string | undefined>();

  // 🔹 Fetch groups
  const {
    data: groupsData,
    loading: loadingGroups,
    error: groupsError,
  } = useGroupsTableQuery({
    variables: {
      offset: 0,
      limit: 100,
      withTotalCount: true,
    },
  });
  const [exportExcel, { loading: exporting }] =
    useExportStudentExcelLazyQuery();
  const navigate = useNavigate();
  const handleExport = async () => {
    try {
      const { data } = await exportExcel();

      if (data?.exportExcel) {
        const fileUrl = `http://localhost:8081${data.exportExcel}`;

        // safer (handles spaces)
        const encodedUrl = encodeURI(fileUrl);

        // open or download
        window.open(encodedUrl, "_blank");
      }
    } catch (err) {
      console.error("Export failed", err);
    }
  };

  // 🔹 Safe extraction
  const groups =
    groupsData?.groupsTable?.edges?.map((e) => e?.node).filter(Boolean) || [];

  return (
    <Layout>
      <PageLayout
        title={t("students.title")}
        description={t("students.description")}
        icon="👥"
        actions={
          <>
            <Button
              sx={{
                marginRight: 2,
              }}
              onClick={() => navigate("/student/create")}
            >
              {t("students.createStudent")}
            </Button>

            <Button onClick={handleExport}>
              {exporting ? "Exporting..." : "Export Excel"}
            </Button>
          </>
        }
      >
        {/* 🔹 Toolbar */}
        <Flex
          sx={{
            gap: 3,
            flexWrap: "wrap",
            alignItems: "flex-end",
            p: 3,
            bg: "muted",
            borderRadius: 8,
            border: "1px solid",
            borderColor: "border",
          }}
        >
          {/* Left - Search */}
          <Box sx={{ flex: "1 1 320px", maxWidth: 420 }}>
            <Input
              placeholder={t("students.searchPlaceholder")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </Box>

          {/* Right - Filters */}
          <Flex
            sx={{
              gap: 2,
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <Select
              style={{
                width: 200,
              }}
              onChange={(e) => {
                console.log(e.target.value);
                console.log("value changed");

                setSelectedGroup(e.target.value || undefined);
              }}
            >
              <option value="">{t("students.allGrps")}</option>
              {loadingGroups && <option>Loading...</option>}

              {groupsError && <option disabled>Error loading groups</option>}
              {!loadingGroups &&
                !groupsError &&
                groups.map((g: any) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
            </Select>

            <Select
              style={{ width: 200 }}
              value={selectedGender || ""}
              onChange={(e) => {
                const val = e.target.value;
                setSelectedGender(
                  val === "" || val === "ALL" ? undefined : val
                );
              }}
              className="filter-select"
            >
              <option value="">{t("students.allGenders")}</option>
              <option value="MALE">{t("students.male")}</option>
              <option value="FEMALE">{t("students.female")}</option>
            </Select>
          </Flex>
        </Flex>
        {/* 🔹 Students Table */}
        <StudentTable
          limit={10}
          groupId={selectedGroup}
          gender={selectedGender}
          searchTerm={debouncedSearch}
        />
      </PageLayout>
    </Layout>
  );
}
