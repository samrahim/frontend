import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
  Group,
  GroupOrder,
  GroupOrderField,
  OrderDirection,
  useGroupsTableQuery,
  type GroupWhereInput,
} from "../../graphql/generated";
import { Box, Flex, Text, Button, Divider } from "theme-ui";
import {
  ColumnDef,
  createColumnHelper,
  useReactTable,
  flexRender,
  getCoreRowModel,
} from "@tanstack/react-table";
import i18n from "../../i18n/i18n";
import theme from "../../theme/theme";

interface GroupsTableProps {
  limit?: number;
  searchTerm?: string;
}
const columnHelper = createColumnHelper<Group>();

export function GroupsTable({ limit = 10, searchTerm = "" }: GroupsTableProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [offset, setOffset] = useState(0);
  const [orderBy, setOrderBy] = useState<GroupOrder>({
    field: GroupOrderField.CreatedAt,
    direction: OrderDirection.Desc,
  });
  const isRTL = i18n.dir() === "rtl";
  //columns

  const columns = useMemo(
    () =>
      [
        columnHelper.accessor("name", {
          header: () => (
            <Box
              onClick={() => handleSort(GroupOrderField.Name)}
              sx={{
                cursor: "pointer",
                userSelect: "none",
                display: "flex",
                alignItems: "center",
                gap: 1,
                "&:hover": { opacity: 0.8 },
              }}
            >
              {t("groups.name")}{" "}
              {orderBy.field === GroupOrderField.Name &&
                (orderBy.direction === OrderDirection.Desc ? "↓" : "↑")}
            </Box>
          ),
          cell: (info) => (
            <Flex sx={{ alignItems: "center", gap: 2 }}>
              <Text>{info.row.original.name}</Text>
            </Flex>
          ),
        }),
        columnHelper.accessor("createdAt", {
          header: () => (
            <Box
              onClick={() => handleSort(GroupOrderField.CreatedAt)}
              sx={{
                cursor: "pointer",
                userSelect: "none",
                display: "flex",
                alignItems: "center",
                gap: 1,
                "&:hover": { opacity: 0.8 },
              }}
            >
              {t("groups.createdAt")}{" "}
              {orderBy.field === GroupOrderField.CreatedAt &&
                (orderBy.direction === OrderDirection.Desc ? "↓" : "↑")}
            </Box>
          ),
          cell: (info) => <Text>{formatDate(info.getValue())}</Text>,
        }),
        columnHelper.accessor("creator", {
          header: () => t("groups.createdBy"),
          cell: (info) => (
            <Text>
              {info.getValue()
                ? `${info.getValue()?.firstName} ${info.getValue()?.lastName}`
                : "-"}
            </Text>
          ),
        }),
        columnHelper.accessor("billingUnit", {
          header: () => t("groups.billingUnit"),
          cell: (info) => <Text>{info.getValue() || "-"}</Text>,
        }),
        columnHelper.accessor("pricePerUnit", {
          header: () => t("groups.pricePerUnit"),
          cell: (info) => <Text>{info.getValue() || "-"}</Text>,
        }),

        columnHelper.display({
          id: "actions",
          header: () => t("common.actions"),
          cell: (info) => (
            <Flex sx={{ gap: 2 }}>
              <Button
                onClick={() => navigate(`/groups/${info.row.original.id}`)}
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
                  "&:hover": {
                    opacity: 0.8,
                  },
                }}
              >
                {t("common.view")}
              </Button>
            </Flex>
          ),
        }),
      ] as const,
    [orderBy]
  ) as ColumnDef<Group>[];

  // Build multi-field search query with better word matching
  const buildSearchWhere = (term: string): GroupWhereInput | undefined => {
    if (!term || term.trim() === "") return undefined;

    // Split search term into words
    const words = term
      .trim()
      .split(/\s+/)
      .filter((w) => w.length > 0);

    if (words.length === 0) return undefined;

    // If only one word, search group name with OR
    if (words.length === 1) {
      return {
        nameContainsFold: words[0],
      };
    }

    // If multiple words, each word must be found in the name (AND logic between words)
    const wordConditions: GroupWhereInput[] = words.map((word) => ({
      nameContainsFold: word,
    }));

    return {
      and: wordConditions,
    };
  };
  const buildWhere = (): GroupWhereInput | undefined => {
    const searchWhere = buildSearchWhere(searchTerm);

    const filters: GroupWhereInput[] = [];

    // ✅ Add search filter
    if (searchWhere) {
      filters.push(searchWhere);
    }

    if (filters.length === 0) return undefined;
    if (filters.length === 1) return filters[0];

    return {
      and: filters,
    };
  };

  const { data, loading, error } = useGroupsTableQuery({
    variables: {
      offset,
      limit,
      orderBy: orderBy as any,
      where: buildWhere(),
      withTotalCount: true,
    },
  });

  const groups = useMemo(() => {
    return (
      data?.groupsTable?.edges
        ?.map((edge) => edge!.node)
        .filter((group): group is Group => group != null) || []
    );
  }, [data]);

  const table = useReactTable({
    data: groups,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const totalCount = data?.groupsTable?.totalCount ?? 0;
  const totalPages = Math.ceil(totalCount / limit) || 1;
  const currentPage = Math.floor(offset / limit) + 1;

  const handleSort = (column: GroupOrderField) => {
    if (orderBy.field === column) {
      setOrderBy({
        field: column,
        direction:
          orderBy.direction === OrderDirection.Asc
            ? OrderDirection.Desc
            : OrderDirection.Asc,
      });
    } else {
      setOrderBy({
        field: column,
        direction: OrderDirection.Desc,
      });
    }
    setOffset(0);
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      setOffset(offset + limit);
    }
  };

  const handlePrev = () => {
    if (currentPage > 1) {
      setOffset(Math.max(0, offset - limit));
    }
  };

  const getCreatorName = (creator?: {
    firstName?: string;
    lastName?: string;
  }) => {
    if (!creator) return "Unknown";
    return (
      `${creator.firstName || ""} ${creator.lastName || ""}`.trim() || "Unknown"
    );
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "";

    const [year, month, day] = dateStr.split("T")[0].split("-");

    return `${day}-${month}-${year}`;
  };

  const handleView = (group?: any) => {
    if (group?.id) {
      navigate(`/groups/${group.id}`);
    }
  };

  const handleEdit = (group?: any) => {
    console.log("Edit group:", group);
    // TODO: Implement edit modal
  };
  const bgColor = theme?.colors?.background as string;

  const borderColor = theme?.colors?.border as string;

  const handleDelete = (group?: any) => {
    console.log("Delete group:", group);
    // TODO: Implement delete confirmation
  };

  if (error) {
    return (
      <Box sx={{ p: 3, color: "danger" }}>
        {t("common.error")}: {error.message}
      </Box>
    );
  }

  function handleAttendance(group: any): void {
    if (group?.id) {
      navigate(`/addattendancepage/${group.id}`);
    }
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
          {loading && groups.length === 0 ? (
            <Box as="tr">
              <td
                colSpan={totalCount}
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
                  Loading groups...
                </Box>
              </td>
            </Box>
          ) : groups.length === 0 ? (
            <Box as="tr">
              <td
                colSpan={totalCount}
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
                  {t("groups.noGroups")}
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

      <Divider sx={{ my: 3 }} />

      <Flex sx={{ flexDirection: "column", gap: 2, mt: 3 }}>
        <Text sx={{ fontSize: 0 }}>
          Showing {offset + 1} to {Math.min(offset + limit, totalCount)} of{" "}
          {totalCount} groups
        </Text>
        <Flex sx={{ justifyContent: "space-between", alignItems: "center" }}>
          <Button
            onClick={handlePrev}
            disabled={currentPage === 1}
            sx={{
              bg: currentPage === 1 ? "muted" : "primary",
              color: "white",
              border: "none",
              p: 2,
              borderRadius: "4px",
              cursor: currentPage === 1 ? "not-allowed" : "pointer",
              opacity: currentPage === 1 ? 0.5 : 1,
              transition: "all 0.2s ease",
              "&:hover":
                currentPage === 1
                  ? {}
                  : { opacity: 0.8, transform: "translateY(-2px)" },
            }}
          >
            {t("common.previous")}
          </Button>
          <Text sx={{ fontSize: 1, fontWeight: "bold" }}>
            Page {currentPage} of {totalPages}
          </Text>
          <Button
            onClick={handleNext}
            disabled={currentPage === totalPages}
            sx={{
              bg: currentPage === totalPages ? "muted" : "primary",
              color: "white",
              border: "none",
              p: 2,
              borderRadius: "4px",
              cursor: currentPage === totalPages ? "not-allowed" : "pointer",
              opacity: currentPage === totalPages ? 0.5 : 1,
              transition: "all 0.2s ease",
              "&:hover":
                currentPage === totalPages
                  ? {}
                  : { opacity: 0.8, transform: "translateY(-2px)" },
            }}
          >
            {t("common.next")}
          </Button>
        </Flex>
      </Flex>
    </Box>
  );
}
