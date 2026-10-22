import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  TeacherPayroll,
  TeacherPayrollStatus,
  TeacherPayrollWhereInput,
  usePayrollsQuery,
} from "../graphql";
import { Box, Button, Divider, Flex, Text } from "theme-ui";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { t } from "i18next";
import i18n from "../i18n/i18n";

interface PayrollsTableProps {
  limit?: number;
  searchTerm?: string;
  statusFilter?: TeacherPayrollStatus | "ALL";
}

const columnHelper = createColumnHelper<TeacherPayroll>();

export function PayrollsTable({
  limit = 10,
  searchTerm = "",
  statusFilter = "ALL",
}: PayrollsTableProps) {
  const [offset, setOffset] = useState(0);
  const navigate = useNavigate();

  // Reset offset when either search or status filter changes
  useEffect(() => {
    setOffset(0);
  }, [searchTerm, statusFilter]);

  const buildSearchWhere = (
    term: string,
    status?: TeacherPayrollStatus | "ALL"
  ): TeacherPayrollWhereInput => {
    const conditions: TeacherPayrollWhereInput[] = [];

    // Add status condition if selected
    if (status && status !== "ALL") {
      conditions.push({ status });
    }

    // Add search term condition
    if (term && term.trim() !== "") {
      const words = term
        .trim()
        .split(/\s+/)
        .filter((w) => w.length > 0);

      if (words.length > 0) {
        const getWordCondition = (word: string): TeacherPayrollWhereInput => ({
          or: [{ noteContainsFold: word }],
        });

        if (words.length === 1) {
          conditions.push(getWordCondition(words[0]));
        } else {
          conditions.push({
            and: words.map((word) => getWordCondition(word)),
          });
        }
      }
    }

    if (conditions.length === 0) return {};
    if (conditions.length === 1) return conditions[0];

    return {
      and: conditions,
    };
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "";
    const [year, month, day] = dateStr.split("T")[0].split("-");
    return `${day}-${month}-${year}`;
  };

  const { data, loading, error } = usePayrollsQuery({
    variables: {
      offset,
      limit,
      where: buildSearchWhere(searchTerm, statusFilter),
    },
  });

  const handleView = (teacherpayroll: TeacherPayroll) => {
    navigate(`/payroll/${teacherpayroll.id}`);
  };

  const handleEdit = (teacherpayroll: TeacherPayroll) => {
    navigate(`/editpayroll/${teacherpayroll.id}`);
  };

  const columns = useMemo(
    () => [
      columnHelper.accessor("teacher.firstName", {
        header: () => (
          <Box
            sx={{
              cursor: "pointer",
              userSelect: "none",
              display: "flex",
              alignItems: "center",
              gap: 1,
              "&:hover": { opacity: 0.8 },
            }}
          >
            {t("students.name")}{" "}
          </Box>
        ),
        cell: (info) => (
          <Flex sx={{ alignItems: "center", gap: 2 }}>
            <Text>
              {info.row.original.teacher.firstName}{" "}
              {info.row.original.teacher.lastName}
            </Text>
          </Flex>
        ),
      }),

      columnHelper.accessor("periodStart", {
        header: () => (
          <Box
            sx={{
              cursor: "pointer",
              userSelect: "none",
              display: "flex",
              alignItems: "center",
              gap: 1,
              "&:hover": { opacity: 0.8 },
            }}
          >
            {t("teachers.startPeriod")}{" "}
          </Box>
        ),
        cell: (info) => <Text>{formatDate(info.getValue())} </Text>,
      }),

      columnHelper.accessor("periodEnd", {
        header: () => (
          <Box
            sx={{
              cursor: "pointer",
              userSelect: "none",
              display: "flex",
              alignItems: "center",
              gap: 1,
              "&:hover": { opacity: 0.8 },
            }}
          >
            {t("teachers.endPeriod")}{" "}
          </Box>
        ),
        cell: (info) => <Text>{formatDate(info.getValue())} </Text>,
      }),

      columnHelper.accessor("createdAt", {
        header: () => (
          <Box
            sx={{
              cursor: "pointer",
              userSelect: "none",
              display: "flex",
              alignItems: "center",
              gap: 1,
              "&:hover": { opacity: 0.8 },
            }}
          >
            {t("students.createdAt")}{" "}
          </Box>
        ),
        cell: (info) => <Text>{formatDate(info.getValue())} </Text>,
      }),

      columnHelper.accessor("grossAmount", {
        header: () => (
          <Box
            sx={{
              cursor: "pointer",
              userSelect: "none",
              display: "flex",
              alignItems: "center",
              gap: 1,
              "&:hover": { opacity: 0.8 },
            }}
          >
            {t("teachers.grossAmount")}{" "}
          </Box>
        ),
        cell: (info) => <Text>{info.getValue()} </Text>,
      }),

      columnHelper.display({
        id: "actions",
        header: () => t("common.actions"),
        cell: (info) => (
          <Flex sx={{ gap: 2 }}>
            <Button
              onClick={() => handleView(info.row.original)}
              sx={{
                px: 3,
                py: 2,
                bg: "primary",
                color: "white",
                fontSize: 0,
                fontWeight: 500,
                cursor: "pointer",
                borderRadius: "md",
                border: "none",
                "&:hover": { opacity: 0.8 },
              }}
            >
              {t("common.view")}
            </Button>
            <Button
              onClick={() => handleEdit(info.row.original)}
              disabled={info.row.original.status === "PAID"}
              sx={{
                px: 3,
                py: 2,
                bg: "secondary",
                color: "white",
                fontSize: 0,
                fontWeight: 500,
                cursor: "pointer",
                borderRadius: "md",
                border: "none",
                "&:hover": { opacity: 0.8 },
              }}
            >
              {t("common.edit")}
            </Button>
          </Flex>
        ),
      }),
    ],
    [t]
  );

  const teacherspayrolls = useMemo(() => {
    return (
      data?.payrolls?.edges
        ?.map((edge) => edge!.node)
        .filter(
          (teacherPayroll): teacherPayroll is TeacherPayroll =>
            teacherPayroll != null
        ) || []
    );
  }, [data]);

  const table = useReactTable({
    data: teacherspayrolls,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });
  const isRTL = i18n.dir() === "rtl";

  if (error) {
    return (
      <Box sx={{ p: 4, bg: "background", color: "text" }}>
        <Text sx={{ color: "danger" }}>
          Error loading teachers: {error.message}
        </Text>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        overflowX: "auto",
        mb: 2,
        mt: 4,
        direction: isRTL ? "rtl" : "ltr",
        flex: 1,
        width: "100%",
        bg: "tableBackground",
        p: 3,
        borderRadius: "md",
        border: "1px solid",
        borderColor: "border",
      }}
    >
      <Box
        as="table"
        sx={{
          width: "100%",
          borderCollapse: "collapse",
        }}
      >
        <Box as="thead">
          {table.getHeaderGroups().map((headerGroup) => (
            <Box as="tr" key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <Box
                  as="th"
                  key={header.id}
                  sx={{
                    bg: "tableHeaderBackground",
                    color: "tableHeaderText",
                    p: 3,
                    borderBottom: "2px solid",
                    borderColor: "tableBorder",
                    textAlign: isRTL ? "right" : "left",
                  }}
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                </Box>
              ))}
            </Box>
          ))}
        </Box>
        <Box as="tbody">
          {loading && teacherspayrolls.length === 0 ? (
            <Box as="tr">
              <Box
                sx={{
                  p: 3,
                  textAlign: "center",
                  borderBottom: "1px solid",
                  borderColor: "tableBorder",
                  color: "tableText",
                }}
              >
                Loading teachers...
              </Box>
            </Box>
          ) : teacherspayrolls.length === 0 ? (
            <Box as="tr">
              <Box
                sx={{
                  p: 3,
                  textAlign: "center",
                  borderBottom: "1px solid",
                  borderColor: "tableBorder",
                  color: "tableText",
                }}
              >
                {t("teachers.noPayroll")}
              </Box>
            </Box>
          ) : (
            table.getRowModel().rows.map((row) => (
              <Box
                as="tr"
                key={row.id}
                sx={{
                  opacity: loading ? 0.6 : 1,
                  transition: "opacity 0.2s ease, background-color 0.2s ease",
                  "&:hover": { bg: "tableRowHover" },
                  "&:nth-of-type(odd)": { bg: "tableRowStripe" },
                }}
              >
                {row.getVisibleCells().map((cell) => (
                  <Box
                    as="td"
                    key={cell.id}
                    sx={{
                      p: 3,
                      borderBottom: "1px solid",
                      borderColor: "tableBorder",
                      textAlign: isRTL ? "right" : "left",
                      fontSize: 2,
                      color: "tableText",
                    }}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </Box>
                ))}
              </Box>
            ))
          )}
        </Box>
      </Box>

      <Divider sx={{ my: 3 }} />
    </Box>
  );
}
