import React, { useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  ColumnDef,
} from "@tanstack/react-table";
import { useGetStudentDetailsQuery } from "../graphql/generated";
import { Layout } from "../components/Layout";
import { Box, Flex, Text, Button, Badge, Avatar, Card } from "theme-ui";
import { useTranslation } from "react-i18next";
import i18n from "../i18n/i18n";

/* -------------------- Info Field -------------------- */
const InfoField = ({ label, value }: { label: string; value?: any }) => (
  <Box
    sx={{
      p: 3,
      bg: "muted",
      borderRadius: "md",
      border: "1px solid",
      borderColor: "border",
      display: "flex",
      flexDirection: "column",
      gap: 1,
    }}
  >
    <Text sx={{ fontSize: 0, color: "secondary", fontWeight: 500 }}>
      {label}
    </Text>

    <Text sx={{ fontSize: 2, fontWeight: 700, color: "text" }}>
      {value || "—"}
    </Text>
  </Box>
);
/* -------------------- Table Card -------------------- */
const TableCard = ({
  title,
  data,
  table,
}: {
  title: string;
  data: any[];
  table: any;
}) => (
  <Card
    sx={{
      p: 3,
      bg: "background",
      border: "1px solid",
      borderColor: "border",
      borderRadius: "lg",
    }}
  >
    <Text sx={{ mb: 3, fontWeight: "bold" }}>
      {title} ({data.length})
    </Text>

    {data.length === 0 ? (
      <Text sx={{ color: "secondary", textAlign: "center", py: 3 }}>
        No data available
      </Text>
    ) : (
      <Box sx={{ overflowX: "auto" }}>
        <Box as="table" sx={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            {table.getHeaderGroups().map((hg: any) => (
              <tr key={hg.id}>
                {hg.headers.map((h: any) => (
                  <th
                    key={h.id}
                    style={{
                      textAlign: "left",
                      padding: "10px",
                      background: "var(--theme-ui-colors-highlight)",
                    }}
                  >
                    {flexRender(h.column.columnDef.header, h.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>

          <tbody>
            {table.getRowModel().rows.map((row: any) => (
              <tr
                key={row.id}
                style={{
                  borderBottom: "1px solid var(--theme-ui-colors-border)",
                }}
              >
                {row.getVisibleCells().map((cell: any) => (
                  <td key={cell.id} style={{ padding: "10px" }}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </Box>
      </Box>
    )}
  </Card>
);

/* -------------------- Page -------------------- */
const StudentDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data, loading, error } = useGetStudentDetailsQuery({
    variables: { id: id || "" },
    skip: !id,
  });

  const student =
    data?.node && data.node.__typename === "Student" ? data.node : null;

  const columnHelper = createColumnHelper<any>();

  const columns = useMemo(
    () => [
      columnHelper.accessor("surah", { header: "Surah" }),
      columnHelper.accessor("fromAyah", { header: "From" }),
      columnHelper.accessor("toAyah", { header: "To" }),
      columnHelper.accessor("evaluation", {
        header: "Evaluation",
        cell: (info) => {
          const val = info.getValue();
          const variant =
            val === "excellent"
              ? "success"
              : val === "poor"
              ? "danger"
              : val === "fair"
              ? "warning"
              : "muted";

          return <Badge variant={variant as any}>{val || "-"}</Badge>;
        },
      }),
      columnHelper.accessor("createdAt", {
        header: "Date",
        cell: (info) => new Date(info.getValue()).toLocaleDateString(),
      }),
    ],
    [i18n.language]
  );

  /* -------------------- Data -------------------- */
  const hifdhSessions =
    student?.hifdhsessions?.filter((s) => !s.deletedAt) || [];

  const recitationSessions =
    student?.recitationsessions?.filter((s) => !s.deletedAt) || [];

  const hifdhTable = useReactTable({
    data: hifdhSessions,
    columns: columns as ColumnDef<any>[],
    getCoreRowModel: getCoreRowModel(),
  });

  const recitationTable = useReactTable({
    data: recitationSessions,
    columns: columns as ColumnDef<any>[],
    getCoreRowModel: getCoreRowModel(),
  });

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "";

    const [year, month, day] = dateStr.split("T")[0].split("-");

    return `${day}-${month}-${year}`;
  };
  const { t } = useTranslation();
  /* -------------------- States -------------------- */
  if (loading)
    return (
      <Layout>
        <Text sx={{ p: 4 }}>Loading...</Text>
      </Layout>
    );
  if (error)
    return (
      <Layout>
        <Text sx={{ p: 4 }}>Error</Text>
      </Layout>
    );
  if (!student)
    return (
      <Layout>
        <Text sx={{ p: 4 }}>Not found</Text>
      </Layout>
    );

  return (
    <Layout>
      <Box sx={{ p: 4, maxWidth: 1200, mx: "auto" }}>
        {/* Header */}

        <Flex sx={{ alignItems: "center", gap: 3, mb: 4 }}>
          <Button
            onClick={() => navigate(-1)}
            sx={{ bg: "muted", color: "text" }}
          >
            {t("common.back")}
          </Button>

          <Text as="h1" sx={{ fontSize: 5, fontWeight: "bold" }}>
            {t("students.studentDetails")}
          </Text>
        </Flex>

        {/* Student Card */}
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
          <Flex sx={{ gap: 4, mb: 4 }}>
            {student.picture ? (
              <Avatar src={student.picture} />
            ) : (
              <Box
                sx={{
                  width: 80,
                  height: 80,
                  bg: "highlight",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: "bold",
                }}
              >
                {student.firstName?.[0]}
                {student.lastName?.[0]}
              </Box>
            )}

            <Box>
              <Flex sx={{ alignItems: "center", gap: 2 }}>
                <Text sx={{ fontSize: 3, fontWeight: "bold" }}>
                  {student.firstName} {student.lastName}
                </Text>
              </Flex>
            </Box>
          </Flex>

          {/* Info Grid */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 3,
            }}
          >
            {/* <InfoField label={t("students.email")} value={student.email} />
            <InfoField label={t("students.phone")} value={student.phone} /> */}
            <InfoField
              label={t("students.dateOfBirth")}
              value={
                student.dateOfBirth ? formatDate(student.dateOfBirth) : null
              }
            />
            <InfoField label={t("students.gender")} value={student.gender} />
            <InfoField
              label={t("teachers.memberSince")}
              value={formatDate(student.dateOfBirth)}
            />
          </Box>
        </Card>
        {/* ENROLLED GROUPS */}
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
            {t("students.enrolledGroups")}
          </Text>

          {!student.enroll || student.enroll.length === 0 ? (
            <Text sx={{ color: "muted" }}>No enrollments</Text>
          ) : (
            <Flex sx={{ flexWrap: "wrap", gap: 2 }}>
              {student.enroll.map((enrollment) => {
                const isStopped = enrollment.stopped;

                return (
                  <Box
                    onClick={() => {
                      navigate(
                        `/studentEnrollmentCard/${enrollment.group.id}/${student.id}`
                      );
                    }}
                    key={enrollment.id}
                    sx={{
                      px: 3,
                      py: 1,
                      borderRadius: "999px", // 🔥 pill shape
                      fontSize: 1,
                      fontWeight: 500,
                      bg: isStopped ? "muted" : "primary",
                      color: isStopped ? "text" : "white",
                      border: "1px solid",
                      borderColor: isStopped ? "border" : "transparent",
                      display: "flex",
                      alignItems: "center",
                      gap: 2,
                      transition: "0.2s",
                      cursor: "pointer",

                      "&:hover": {
                        transform: "translateY(-2px)",
                        opacity: 0.9,
                      },
                    }}
                  >
                    {/* Group Name */}
                    <Text sx={{ m: 0 }}>
                      {enrollment.group?.name || "No Group"}
                    </Text>

                    {/* Status dot */}
                    <Box
                      sx={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        bg: isStopped ? "gray" : "green",
                      }}
                    />
                  </Box>
                );
              })}
            </Flex>
          )}
        </Card>
        {/* Tables */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))",
            gap: 4,
          }}
        >
          <TableCard
            title="📖 Hifdh Sessions"
            data={hifdhSessions}
            table={hifdhTable}
          />

          <TableCard
            title="🎙️ Recitation Sessions"
            data={recitationSessions}
            table={recitationTable}
          />
        </Box>
      </Box>
    </Layout>
  );
};

export default StudentDetailsPage;
