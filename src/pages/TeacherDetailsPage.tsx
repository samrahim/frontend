import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  ColumnDef,
} from "@tanstack/react-table";
import { TeacherGender, useGetTeacherDetailsQuery } from "../graphql/generated";
import { Layout } from "../components/Layout";
import { Box, Flex, Text, Button, Badge, Avatar, Card } from "theme-ui";
import { t } from "i18next";

const InfoField = ({ label, value }: { label: string; value?: any }) => (
  <Box
    sx={{
      p: 3,
      bg: "muted",
      borderRadius: "md",
      border: "1px solid",
      borderColor: "border",
    }}
  >
    <Text sx={{ fontSize: 0, color: "secondary", mb: 1, fontWeight: 600 }}>
      {` ${label} `}
    </Text>
    <Text sx={{ fontSize: 2, fontWeight: 600 }}>{value || "-"}</Text>
  </Box>
);

interface TeachingAssignment {
  id: string;
  subject?: { name?: string };
  group?: { name?: string };
  assignedAt: string;
  stoppedAt?: string;
  assignedBy?: { firstName?: string; lastName?: string };
}

const TeacherDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data, loading, error } = useGetTeacherDetailsQuery({
    variables: { id: id || "" },
    skip: !id,
  });

  const teacher =
    data?.node && data.node.__typename === "Teacher" ? data.node : null;

  const columnHelper = createColumnHelper<TeachingAssignment>();

  const columns = React.useMemo(
    () =>
      [
        columnHelper.accessor("subject", {
          header: t("groups.subject"),
          cell: (info) => <Text>{info.getValue()?.name || "-"}</Text>,
        }),
        columnHelper.accessor("group", {
          header: t("session.group"),
          cell: (info) => <Text>{info.getValue()?.name || "-"}</Text>,
        }),
        columnHelper.accessor("assignedAt", {
          header: t("students.createdAt"),
          cell: (info) => <Text>{formatDate(info.getValue())}</Text>,
        }),
        columnHelper.accessor("stoppedAt", {
          header: t("session.status"),
          cell: (info) =>
            info.getValue() ? (
              <Badge variant="danger">Stopped</Badge>
            ) : (
              <Badge variant="success">Active</Badge>
            ),
        }),
        columnHelper.accessor("assignedBy", {
          header: t("students.createdBy"),
          cell: (info) => {
            const v = info.getValue();
            return <Text>{v ? `${v.firstName} ${v.lastName}` : "-"}</Text>;
          },
        }),
      ] as const,
    [t]
  );

  const assignments = (teacher?.assignments as TeachingAssignment[]) || [];
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "";

    const [year, month, day] = dateStr.split("T")[0].split("-");

    return `${day}-${month}-${year}`;
  };

  const table = useReactTable({
    data: assignments,
    columns: columns as unknown as ColumnDef<TeachingAssignment>[],
    getCoreRowModel: getCoreRowModel(),
  });

  if (loading)
    return (
      <Layout>
        <Text p={4}>Loading...</Text>
      </Layout>
    );

  if (error)
    return (
      <Layout>
        <Text p={4} color="red">
          {error.message}
        </Text>
      </Layout>
    );

  if (!teacher)
    return (
      <Layout>
        <Text p={4}>Teacher not found</Text>
      </Layout>
    );

  const status = teacher.banned ? (
    <Badge variant="danger">Banned</Badge>
  ) : teacher.active ? (
    <Badge variant="success">Active</Badge>
  ) : (
    <Badge>Inactive</Badge>
  );

  return (
    <Layout>
      <Box sx={{ p: 4, maxWidth: 1200, mx: "auto" }}>
        {/* HEADER */}
        <Flex sx={{ alignItems: "center", gap: 3, mb: 4 }}>
          <Button
            onClick={() => navigate("/teachers")}
            sx={{ bg: "muted", color: "text" }}
          >
            {t("common.back")}
          </Button>

          <Text as="h1" sx={{ fontSize: 5, fontWeight: "bold" }}>
            {t("teachers.teacherdetails")}
          </Text>
        </Flex>

        {/* PROFILE CARD */}
        <Card
          sx={{
            p: 4,
            mb: 4,
            bg: "background",
            border: "1px solid",
            borderColor: "border",
            borderRadius: "lg",
          }}
        >
          <Flex sx={{ gap: 4, alignItems: "center" }}>
            {teacher.picture ? (
              <Avatar src={teacher.picture} sx={{ width: 100, height: 100 }} />
            ) : (
              <Box
                sx={{
                  width: 100,
                  height: 100,
                  bg: "muted",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 4,
                  borderRadius: "md",
                }}
              >
                👨‍🏫
              </Box>
            )}

            <Box>
              <Text sx={{ fontSize: 3, fontWeight: "bold" }}>
                {teacher.firstName} {teacher.lastName}
              </Text>
              <Box mt={2}>{status}</Box>
            </Box>
          </Flex>

          {/* INFO GRID */}
          <Box
            sx={{
              mt: 4,
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 3,
            }}
          >
            <InfoField label={t("teachers.email")} value={teacher.email} />
            <InfoField label={t("teachers.phone")} value={teacher.phone} />
            <InfoField
              label={t("teachers.gender")}
              value={
                teacher.gender === TeacherGender.Male
                  ? t("teachers.male")
                  : t("teachers.female")
              }
            />
            <InfoField
              label={t("students.dateOfBirth")}
              value={formatDate(teacher.dateOfBirth)}
            />
            <InfoField
              label={t("teachers.memberSince")}
              value={formatDate(teacher.createdAt)}
            />
            <InfoField
              label={t("teachers.createdBy")}
              value={
                teacher.creator
                  ? `${teacher.creator.firstName} ${teacher.creator.lastName}`
                  : "-"
              }
            />
            <InfoField
              label={t("teachers.paymenttype")}
              value={teacher.paymentType}
            />
            <InfoField
              label={t("teachers.salary")}
              value={
                teacher.paymentAmount
                  ? Number(teacher.paymentAmount).toFixed(2)
                  : "0.00"
              }
            />
          </Box>

          {teacher.description && (
            <Box mt={4}>
              <Text sx={{ fontWeight: "bold", mb: 2 }}>Description</Text>
              <Text>{teacher.description}</Text>
            </Box>
          )}
        </Card>

        {/* TABLE CARD */}
        <Card
          sx={{
            p: 4,
            mb: 4,
            bg: "background",
            border: "1px solid",
            borderColor: "border",
            borderRadius: "lg",
          }}
        >
          <Text sx={{ fontSize: 3, fontWeight: "bold", mb: 3 }}>
            {t("teachers.assignments")}({assignments.length})
          </Text>

          {assignments.length === 0 ? (
            <Text sx={{ textAlign: "center", py: 4, color: "muted" }}>
              {t("teachers.noassignments")}
              No assignments
            </Text>
          ) : (
            <Box sx={{ overflowX: "auto" }}>
              <table style={{ width: "100%" }}>
                <thead>
                  {table.getHeaderGroups().map((hg) => (
                    <tr key={hg.id}>
                      {hg.headers.map((h) => (
                        <th
                          key={h.id}
                          style={{ textAlign: "left", padding: 8 }}
                        >
                          {flexRender(
                            h.column.columnDef.header,
                            h.getContext()
                          )}
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>

                <tbody>
                  {table.getRowModel().rows.map((row) => (
                    <tr key={row.id}>
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} style={{ padding: 8 }}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </Box>
          )}
        </Card>
      </Box>
    </Layout>
  );
};

export default TeacherDetailsPage;
