import { Box, Button, Divider, Flex, useThemeUI } from "theme-ui";
import i18n from "../i18n/i18n";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useHifdhsQuery } from "../graphql";

interface HifdhRecord {
  id: string;
  studentName: string;
  surah: string;
  type: "NEW_HIFDH" | "REPEATING";
  evaluation: string;
  date: string;
  fromAyah: number;
  toAyah: number;
  updatedAt: string;
}

export function HifdhTable() {
  const { t } = useTranslation();
  const themeUI = useThemeUI();
  const theme = themeUI.theme;

  const [search, setSearch] = useState("");

  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);

    return () => clearTimeout(handler);
  }, [search]);
  // Query for hifdh records
  const buildWhere = () => {
    if (!debouncedSearch.trim()) return undefined;
    const term = debouncedSearch.trim();
    return {
      or: [
        { hasStudentWith: [{ firstNameContainsFold: term }] },
        { hasStudentWith: [{ lastNameContainsFold: term }] },
      ],
    };
  };
  const PAGE_SIZE = 10;
  const [cursor, setCursor] = useState<string | null>(null);
  const {
    data: hifddhQueryData,
    error,
    loading,
  } = useHifdhsQuery({
    variables: {
      first: PAGE_SIZE,
      after: cursor,
      where: buildWhere(),
    },
  });
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "";

    const [year, month, day] = dateStr.split("T")[0].split("-");

    return `${day}-${month}-${year}`;
  };
  const hifdhRecords = useMemo(
    () =>
      hifddhQueryData?.hifdhs?.edges?.map((edge) => ({
        id: edge?.node?.id ?? "",
        studentName: `${edge?.node?.student?.firstName ?? ""} ${
          edge?.node?.student?.lastName ?? ""
        }`,
        surah: edge?.node?.surah ?? "",
        type: (edge?.node?.type ?? "NEW_HIFDH") as "NEW_HIFDH" | "REPEATING",
        evaluation: edge?.node?.evaluation ?? "",
        fromAyah: edge?.node?.fromAyah ?? 0,
        toAyah: edge?.node?.toAyah ?? 0,
        date: edge?.node?.createdAt ?? "",
        updatedAt: edge?.node?.updatedAt ?? "",
      })) ?? [],
    [hifddhQueryData]
  );

  const navigate = useNavigate();
  // Table columns

  const columns = useMemo(() => {
    const columnHelper = createColumnHelper<HifdhRecord>();
    return [
      columnHelper.accessor("studentName", {
        header: t("recitation.student"),
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor("date", {
        header: t("recitation.date"),
        cell: (info) => {
          const { date, updatedAt } = info.row.original;
          return new Date(updatedAt).getTime() === new Date(date).getTime()
            ? "-"
            : formatDate(info.getValue());
        },
      }),
      columnHelper.accessor("surah", {
        header: t("recitation.surah"),
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor("fromAyah", {
        header: t("recitation.fromAyah"),
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor("toAyah", {
        header: t("recitation.toAyah"),
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor("evaluation", {
        header: t("recitation.evaluation"),
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor("updatedAt", {
        header: t("recitation.updatedAt"),
        cell: (info) => {
          const { date, updatedAt } = info.row.original;
          return new Date(updatedAt).getTime() === new Date(date).getTime()
            ? "-"
            : formatDate(info.getValue());
        },
      }),
      columnHelper.display({
        id: "actions",
        header: t("common.actions"),
        cell: (info) => (
          <Flex sx={{ gap: 2 }}>
            <Button
              onClick={() => navigate(`/hifdhs/edit/${info.row.original.id}`)}
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
              Edit
            </Button>
          </Flex>
        ),
      }),
    ];
  }, [t]);
  const table = useReactTable({
    data: hifdhRecords,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const [history, setHistory] = useState<string[]>([]);
  const resetPagination = () => {
    setCursor(null);
    setHistory([]);
  };
  const isRTL = i18n.dir() === "rtl";
  const totalColumns = columns.length;

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
                    bg: "tableHeaderBackground", // ✅ Changed from 'muted' to use specific theme header colors
                    color: "tableHeaderText", // ✅ High contrast context coloring
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
          {loading && hifdhRecords.length === 0 ? (
            <Box as="tr">
              <td
                colSpan={totalColumns}
                style={{ padding: "0" }} // Resets default padding if needed
              >
                <Box
                  sx={{
                    p: 3,
                    textAlign: "center",
                    borderBottom: "1px solid",
                    borderColor: "tableBorder",
                    color: "tableText",
                  }}
                >
                  Loading hifdh records...
                </Box>
              </td>
            </Box>
          ) : hifdhRecords.length === 0 ? (
            <Box as="tr">
              <td
                colSpan={totalColumns}
                style={{ padding: "0" }} // Resets default padding if needed
              >
                <Box
                  sx={{
                    p: 3,
                    textAlign: "center",
                    borderBottom: "1px solid",
                    borderColor: "tableBorder",
                    color: "tableText",
                  }}
                >
                  {t("hifdh.noRecords")}
                </Box>
              </td>
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
                  // Optional stripes using theme properties:
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
                      color: "tableText", // ✅ Swapped global text for specialized tableText token
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

      {/* Pagination */}
      <Divider sx={{ my: 3 }} />
    </Box>
  );
}
