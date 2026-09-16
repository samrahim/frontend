import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Flex, Text, Button, Avatar, Divider } from "theme-ui";
import {
  OrderDirection,
  TeacherOrderField,
  useTeachersTableQuery,
  type TeacherWhereInput,
} from "../../graphql/generated";
import { Teacher } from "../../graphql/generated";
import type { TeacherOrder } from "../../graphql/generated";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { t } from "i18next";
import i18n from "../../i18n/i18n";
import theme from "../../theme/theme";

interface TeachersTableProps {
  limit?: number;
  searchTerm?: string;
}
const columnHelper = createColumnHelper<Teacher>();

export function TeachersTable({
  limit = 10,
  searchTerm = "",
}: TeachersTableProps) {
  const [offset, setOffset] = useState(0);
  const navigate = useNavigate();
  const [orderBy, setOrderBy] = useState<TeacherOrder>({
    direction: OrderDirection.Desc,
    field: TeacherOrderField.CreatedAt,
  });

  // 💡 Reset page offset to 0 whenever search changes to avoid blank pages
  useEffect(() => {
    setOffset(0);
  }, [searchTerm]);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "";

    const [year, month, day] = dateStr.split("T")[0].split("-");

    return `${day}-${month}-${year}`;
  };

  // 💡 Added `orderBy` to the dependency array below to prevent infinite layout calculations
  const columns = useMemo(
    () => [
      columnHelper.accessor("firstName", {
        header: () => (
          <Box
            onClick={() => handleSort(TeacherOrderField.FirstName)}
            sx={{
              cursor: "pointer",
              userSelect: "none",
              display: "flex",
              alignItems: "center",
              gap: 1,
              "&:hover": { opacity: 0.8 },
            }}
          >
            {t("teachers.name")}{" "}
            {orderBy.field === TeacherOrderField.FirstName &&
              (orderBy.direction === OrderDirection.Desc ? "↓" : "↑")}
          </Box>
        ),
        cell: (info) => (
          <Flex sx={{ alignItems: "center", gap: 2 }}>
            {info.row.original.picture && (
              <Avatar
                src={info.row.original.picture}
                sx={{
                  backgroundColor: "white",
                  width: "32px",
                  height: "32px",
                }}
              />
            )}
            <Text>
              {info.row.original.firstName} {info.row.original.lastName}
            </Text>
          </Flex>
        ),
      }),
      columnHelper.accessor("phone", {
        header: () => t("students.phone"),
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor("email", {
        header: () => t("students.email"),
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor("createdAt", {
        header: () => (
          <Box
            onClick={() => handleSort(TeacherOrderField.CreatedAt)}
            sx={{
              cursor: "pointer",
              userSelect: "none",
              display: "flex",
              alignItems: "center",
              gap: 1,
              "&:hover": { opacity: 0.8 },
            }}
          >
            {t("teachers.createdAt")}{" "}
            {orderBy.field === TeacherOrderField.CreatedAt &&
              (orderBy.direction === OrderDirection.Desc ? "↓" : "↑")}
          </Box>
        ),
        cell: (info) => <Text>{formatDate(info.getValue())} </Text>,
      }),
      columnHelper.accessor("creator", {
        header: () => t("teachers.createdBy"),
        cell: (info) => {
          const creator = info.getValue();
          if (!creator) return "-";
          return `${creator.firstName} ${creator.lastName}`;
        },
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
    [t, orderBy]
  );

  const buildSearchWhere = (term: string): TeacherWhereInput | undefined => {
    if (!term || term.trim() === "") return undefined;

    const words = term
      .trim()
      .split(/\s+/)
      .filter((w) => w.length > 0);

    if (words.length === 0) return undefined;

    if (words.length === 1) {
      return {
        or: [
          { firstNameContainsFold: words[0] },
          { lastNameContainsFold: words[0] },
          { phoneContainsFold: words[0] },
        ],
      };
    }

    const wordConditions: TeacherWhereInput[] = words.map((word) => ({
      or: [
        { firstNameContainsFold: word },
        { lastNameContainsFold: word },
        { phoneContainsFold: word },
      ],
    }));

    return {
      and: wordConditions,
    };
  };

  const { data, loading, error } = useTeachersTableQuery({
    variables: {
      offset,
      limit,
      orderBy: orderBy as any,
      where: buildSearchWhere(searchTerm),
      withTotalCount: true,
    },
  });

  const teachers = useMemo(() => {
    return (
      data?.teachersTable?.edges
        ?.map((edge) => edge!.node)
        .filter((teacher): teacher is Teacher => teacher != null) || []
    );
  }, [data]);

  const table = useReactTable({
    data: teachers,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const totalCount = data?.teachersTable?.totalCount ?? 0;
  const totalPages = Math.ceil(totalCount / limit) || 1;
  const currentPage = Math.floor(offset / limit) + 1;

  const handleSort = (column: TeacherOrderField) => {
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

  const handleView = (teacher: Teacher) => {
    if (teacher.id) {
      navigate(`/teachers/${teacher.id}`);
    }
  };

  const handleEdit = (teacher: Teacher) => {
    navigate(`/teachers/edit/${teacher.id}`);
  };

  if (error) {
    return (
      <Box sx={{ p: 4, bg: "background", color: "text" }}>
        <Text sx={{ color: "danger" }}>
          Error loading teachers: {error.message}
        </Text>
      </Box>
    );
  }

  const isRTL = i18n.dir() === "rtl";

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
          {loading && teachers.length === 0 ? (
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
                  Loading teachers...
                </Box>
              </td>
            </Box>
          ) : teachers.length === 0 ? (
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
                  {t("teachers.noTeachers")}
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
          {totalCount} teachers
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
