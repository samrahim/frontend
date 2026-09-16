import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  ColumnDef,
} from "@tanstack/react-table";
import {
  OrderDirection,
  StudentOrderField,
  useStudentsTableQuery,
  type StudentWhereInput,
} from "../../graphql/generated";
import type { StudentOrder } from "../../graphql/generated";
import { Avatar, Button, Divider, Input, Box, Flex, Text } from "theme-ui";
import { t } from "i18next";
import i18n from "../../i18n/i18n";

interface Student {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  picture?: string;
  createdAt: string;
  creator?: {
    firstName?: string;
    lastName?: string;
  };
}

interface StudentTableProps {
  limit?: number;
  groupId?: string;
  gender?: string;
  searchTerm?: string;
}

const columnHelper = createColumnHelper<Student>();

export function StudentTable({
  limit = 10,
  gender,
  groupId,
  searchTerm = "",
}: StudentTableProps) {
  const [offset, setOffset] = useState(0);
  const navigate = useNavigate();
  const [orderBy, setOrderBy] = useState<StudentOrder>({
    direction: OrderDirection.Desc,
    field: StudentOrderField.CreatedAt,
  });

  const isRTL = i18n.dir() === "rtl";
  // Build multi-field search query with better word matching
  const buildSearchWhere = (
    term: string,
    gender?: string,
    groupId?: string
  ): StudentWhereInput | undefined => {
    const andConditions: StudentWhereInput[] = [];

    // 🔍 SEARCH
    if (term && term.trim() !== "") {
      const words = term
        .trim()
        .split(/\s+/)
        .filter((w) => w.length > 0);

      words.forEach((word) => {
        andConditions.push({
          or: [
            { firstNameContainsFold: word },
            { lastNameContainsFold: word },
            { phoneContainsFold: word },
          ],
        });
      });
    }

    // 👤 GENDER FILTER (Use genderEQ or gender: gender based on your schema)
    if (gender && gender !== "ALL") {
      andConditions.push({
        gender: gender as any, // Or { gender: gender as any } if not using EQ suffix
      });
    }

    // 👥 GROUP FILTER (Use idEQ inside relation filter)
    if (groupId) {
      andConditions.push({
        hasEnrollWith: [
          {
            hasGroupWith: [
              {
                id: groupId,
              },
            ],
          },
        ],
      });
    }

    if (andConditions.length === 0) return undefined;

    return {
      and: andConditions,
    };
  };
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "";

    const [year, month, day] = dateStr.split("T")[0].split("-");

    return `${day}-${month}-${year}`;
  };
  const { data, loading, error } = useStudentsTableQuery({
    variables: {
      offset,
      limit,
      orderBy: orderBy as any,
      where: buildSearchWhere(searchTerm, gender, groupId),
      withTotalCount: true,
    },
  });

  const students = useMemo(
    () =>
      (data?.studentsTable?.edges?.map((edge) => edge?.node) as Student[]) ||
      [],
    [data]
  );
  const totalCount = data?.studentsTable?.totalCount ?? 0;
  const totalPages = Math.ceil(totalCount / limit);
  const currentPage = Math.floor(offset / limit) + 1;

  const handlePreviousPage = () => {
    if (offset - limit >= 0) {
      setOffset(offset - limit);
    }
  };

  const handleNextPage = () => {
    if (offset + limit < totalCount) {
      setOffset(offset + limit);
    }
  };
  useEffect(() => {
    setOffset(0);
  }, [searchTerm, gender, groupId]);
  const handleSort = (column: StudentOrderField) => {
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

  const columns = useMemo(
    () =>
      [
        columnHelper.accessor("firstName", {
          header: () => (
            <Box
              onClick={() => handleSort(StudentOrderField.FirstName)}
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
              {orderBy.field === StudentOrderField.FirstName &&
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
        // columnHelper.accessor("email", {
        //   header: () => t("students.email"),
        //   cell: (info) => <Text>{info.getValue() || "-"}</Text>,
        // }),
        // columnHelper.accessor("phone", {
        //   header: () => t("students.phone"),
        //   cell: (info) => <Text>{info.getValue() || "-"}</Text>,
        // }),
        columnHelper.accessor("createdAt", {
          header: () => (
            <Box
              onClick={() => handleSort(StudentOrderField.CreatedAt)}
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
              {orderBy.field === StudentOrderField.CreatedAt &&
                (orderBy.direction === OrderDirection.Desc ? "↓" : "↑")}
            </Box>
          ),
          cell: (info) => <Text>{formatDate(info.getValue())} </Text>,
        }),
        columnHelper.accessor("creator", {
          header: () => t("students.createdBy"),
          cell: (info) => (
            <Text>
              {info.getValue()
                ? `${info.getValue()?.firstName} ${info.getValue()?.lastName}`
                : "-"}
            </Text>
          ),
        }),
        columnHelper.display({
          id: "actions",
          header: () => t("common.actions"),
          cell: (info) => (
            <Flex sx={{ gap: 2 }}>
              <Button
                onClick={() => navigate(`/students/${info.row.original.id}`)}
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
              <Button
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
                  "&:hover": {
                    opacity: 0.8,
                  },
                }}
                onClick={() =>
                  navigate(`/students/edit/${info.row.original.id}`)
                }
              >
                {t("common.edit")}
              </Button>
            </Flex>
          ),
        }),
      ] as const,
    [orderBy]
  ) as ColumnDef<Student>[];

  const table = useReactTable({
    data: students,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (error) {
    return (
      <Box sx={{ p: 3, color: "danger" }}>
        Error loading students: {error.message}
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
          {loading && students.length === 0 ? (
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
                  Loading students...
                </Box>
              </td>
            </Box>
          ) : students.length === 0 ? (
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
                  no students found...
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
          {totalCount} students
        </Text>
        <Flex sx={{ justifyContent: "space-between", alignItems: "center" }}>
          <Button
            onClick={handlePreviousPage}
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
            onClick={handleNextPage}
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
