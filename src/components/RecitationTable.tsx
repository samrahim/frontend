import { Box, Button, Divider, Flex, useThemeUI } from "theme-ui";
import i18n from "../i18n/i18n";
import { useEffect, useMemo, useState } from "react";
import { RecitationWhereInput, useRecitationsQuery } from "../graphql";
import theme from "../theme/theme";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { t } from "i18next";
import { useNavigate } from "react-router-dom";
import { Row } from "jspdf-autotable";

interface RecitationRecord {
  id: string;
  studentName: string;
  surah: string;
  type: "NEW_RECITATION" | "REPEATING";
  evaluation: string;
  date: string;
  fromAyah: number;
  toAyah: number;
  updatedAt: string;
}

interface RecitationTableProps {
  limit?: number;
  searchTerm?: string;
}
export function RecitationTable({ searchTerm = "" }: RecitationTableProps) {
  const PAGE_SIZE = 10;
  const [cursor, setCursor] = useState<string | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const buildSearchWhere = (term: string): RecitationWhereInput | undefined => {
    if (!term.trim()) return undefined;
    const words = term
      .trim()
      .split(/\s+/)
      .filter((w) => w.length > 0);

    if (words.length === 0) return undefined;
    return {
      or: [
        { hasStudentWith: [{ firstNameContainsFold: words[0] }] },
        { hasStudentWith: [{ lastNameContainsFold: words[0] }] },
      ],
    };
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "";

    const [year, month, day] = dateStr.split("T")[0].split("-");

    return `${day}-${month}-${year}`;
  };
  const {
    data: recitationQueryData,

    loading,
  } = useRecitationsQuery({
    variables: {
      first: PAGE_SIZE,
      after: cursor,
      where: buildSearchWhere(searchTerm),
    },
  });
  useEffect(() => {
    setCursor(null);
    setHistory([]);
  }, [searchTerm]);

  // FIX 1: Memoize data transformations
  const recitationRecords = useMemo(() => {
    return (
      recitationQueryData?.recitations?.edges?.map((edge: any) => ({
        id: edge?.node?.id ?? "",
        studentName: `${edge?.node?.student?.firstName ?? ""} ${
          edge?.node?.student?.lastName ?? ""
        }`,
        surah: edge?.node?.surah ?? "",
        type: (edge?.node?.type ?? "NEW_RECITATION") as
          | "NEW_RECITATION"
          | "REPEATING",
        evaluation: edge?.node?.evaluation ?? "",
        fromAyah: edge.node.fromAyah ?? 0,
        toAyah: edge.node.toAyah ?? 0,
        date: edge?.node?.createdAt ?? "",
        updatedAt: edge?.node?.updatedAt ?? "",
      })) ?? []
    );
  }, [recitationQueryData]);

  const pageInfo = recitationQueryData?.recitations?.pageInfo;

  const handleNext = () => {
    if (pageInfo?.hasNextPage && pageInfo.endCursor) {
      setHistory((prev) => [...prev, cursor ?? ""]);
      setCursor(pageInfo.endCursor);
    }
  };

  const handlePrevious = () => {
    const prev = history[history.length - 1];
    setHistory((h) => h.slice(0, -1));
    setCursor(prev || null);
  };
  const navigate = useNavigate();

  const isRTL = i18n.dir() === "rtl";

  // FIX 2: Memoize table columns so they maintain a stable reference
  const columns = useMemo(() => {
    const columnHelper = createColumnHelper<RecitationRecord>();
    return [
      columnHelper.accessor("studentName", {
        header: () => t("recitation.student"),
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor("date", {
        header: () => t("recitation.date"),
        cell: (info) => formatDate(info.getValue()),
      }),
      columnHelper.accessor("surah", {
        header: () => t("recitation.surah"),
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor("fromAyah", {
        header: () => t("recitation.fromAyah"),
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor("toAyah", {
        header: () => t("recitation.toAyah"),
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor("evaluation", {
        header: () => t("recitation.evaluation"),
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor("updatedAt", {
        header: () => t("recitation.updatedAt"),
        cell: (info) => {
          const { date, updatedAt } = info.row.original;
          return new Date(updatedAt).getTime() === new Date(date).getTime()
            ? "-"
            : formatDate(info.getValue());
        },
      }),
      columnHelper.display({
        id: "actions",
        header: () => t("common.actions"),
        cell: (info) => (
          <Flex sx={{ gap: 2 }}>
            <Button
              onClick={() =>
                navigate(`/recitations/edit/${info.row.original.id}`)
              }
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
    ];
  }, [t]); // Depend on translation hook 't' if languages can switch dynamically
  const totalColumns = columns.length;
  const table = useReactTable({
    data: recitationRecords,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

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
          {loading && recitationRecords.length === 0 ? (
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
                  Loading recitation...
                </Box>
              </td>
            </Box>
          ) : recitationRecords.length === 0 ? (
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
                  {t("recitation.noRecords")}
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

      <Flex sx={{ justifyContent: "space-between", alignItems: "center" }}>
        <Button onClick={handlePrevious} disabled={history.length === 0}>
          {t("common.previous")}
        </Button>

        <Button onClick={handleNext} disabled={!pageInfo?.hasNextPage}>
          {t("common.next")}
        </Button>
      </Flex>
    </Box>
  );
}
