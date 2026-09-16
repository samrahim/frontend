import { useNavigate, useParams } from "react-router-dom";
import { gql, useMutation } from "@apollo/client";
import { Box, Button, Card, Flex, Input, Label, Text } from "theme-ui";
import {
  TeacherGender,
  useGetTeacherDetailsQuery,
  useUpdateTeacherMutation,
  useStopTeacherMutation,
} from "../graphql";
import { useEffect, useMemo, useState } from "react";
import { Layout } from "../components/Layout";
import { LuContact, LuUser } from "react-icons/lu";
import { t } from "i18next";
import PhoneInput from "react-phone-input-2";

import {
  ColumnDef,
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";

interface FormAssignment {
  id: string;
  subjectName: string;
  groupName: string;
  isStopped: boolean;
}
interface TeacherForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  gender: TeacherGender;
  dateOfBirth: string;
  salary: number;
  address: string;
  assignments: FormAssignment[];
}

const StopTeacherDocument = gql`
  mutation StopTeacher($id: ID!) {
    stopTeacher(id: $id) {
      id
      stoppedAt
    }
  }
`;

const TeacherEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data, loading, error, refetch } = useGetTeacherDetailsQuery({
    variables: { id: id || "" },
    skip: !id,
  });

  const teacher =
    data?.node && data.node.__typename === "Teacher" ? data.node : null;

  const [form, setForm] = useState<TeacherForm>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    gender: TeacherGender.Male,
    dateOfBirth: "",
    salary: 0,
    address: "",
    assignments: [],
  });

  useEffect(() => {
    if (!teacher) return;

    setForm({
      firstName: teacher.firstName || "",
      lastName: teacher.lastName || "",
      email: teacher.email || "",
      phone: teacher.phone || "",
      gender: teacher.gender || TeacherGender.Male,
      dateOfBirth: teacher.dateOfBirth ? teacher.dateOfBirth.split("T")[0] : "",
      salary: teacher.paymentAmount || 0,
      address: teacher.address || "",
      assignments: (teacher.assignments || []).map((a) => ({
        id: a.id,
        subjectName: a.subject?.name || "",
        groupName: a.group?.name || "",
        isStopped: Boolean(a.stoppedAt),
      })),
    });
  }, [teacher]);

  const isDirty = useMemo(() => {
    if (!teacher) return false;

    // Layer A: Profile Fields Check
    const teacherChanged =
      form.firstName !== (teacher.firstName || "") ||
      form.lastName !== (teacher.lastName || "") ||
      form.email !== (teacher.email || "") ||
      form.phone !== (teacher.phone || "") ||
      form.gender !== (teacher.gender ?? TeacherGender.Male) ||
      form.address !== (teacher.address || "") ||
      form.salary !== (teacher.paymentAmount || 0) ||
      form.dateOfBirth !==
      (teacher.dateOfBirth ? teacher.dateOfBirth.split("T")[0] : "");

    // Layer B: Deep Assignment Comparison
    // const baselineAssignments = (teacher.assignments || []).map((a) => ({
    //   id: a.id,
    //   subjectName: a.subject?.name || "",
    //   groupName: a.group?.name || "",
    //   isStopped: Boolean(a.stoppedAt),
    // }));

    // const assignmentsChanged =
    // JSON.stringify(form.assignments) !== JSON.stringify(baselineAssignments);

    return teacherChanged;
  }, [form, teacher]);

  const [updateTeacher, { loading: updating }] = useUpdateTeacherMutation();
  const [stopTeacher, { loading: stoppingAssignment }] = useStopTeacherMutation();
  const handleSave = async () => {
    if (!id || !teacher) {
      return;
    }

    try {

      const response = await updateTeacher({
        variables: {
          id: teacher.id,
          input: {
            firstName: form.firstName,
            lastName: form.lastName,
            dateOfBirth: form.dateOfBirth
              ? new Date(form.dateOfBirth).toISOString()
              : null,
            email: form.email,
            phone: form.phone,
            gender: form.gender,
          },
        },
      });

      console.log("Mutation successfully saved: ", response);

      // Refresh the UI cache layout with backend data
      if (response.data) {
        refetch();
      }
    } catch (error) {
      console.error("Failed to save changes:", error);
    }
  };
  const handleDiscard = () => {
    if (!teacher) return;
    setForm({
      firstName: teacher.firstName || "",
      lastName: teacher.lastName || "",
      email: teacher.email || "",
      phone: teacher.phone || "",
      gender: teacher.gender ?? TeacherGender.Male,
      dateOfBirth: teacher.dateOfBirth ? teacher.dateOfBirth.split("T")[0] : "",
      address: teacher.address || "",
      salary: teacher.paymentAmount || 0,
      assignments: (teacher.assignments || []).map((a) => ({
        id: a.id,
        subjectName: a.subject?.name || "",
        groupName: a.group?.name || "",
        isStopped: Boolean(a.stoppedAt),
      })),
    });
  };

  const handleToggleStopAssignment = async (assignmentId: string) => {
    console.log("Attempting to stop assignment with ID:", assignmentId);
    try {
      await stopTeacher({
        variables: { id: assignmentId },
        onCompleted: () => {
          // Update the local form state to reflect the stopped assignment
          setForm((prevForm) => ({
            ...prevForm,
            assignments: prevForm.assignments.map((item) =>
              item.id === assignmentId ? { ...item, isStopped: true } : item
            ),
          }));
          // refetch(); // Refresh the data to reflect the stopped assignment
        },
        onError: (error) => {

          console.error("Failed to stop assignment:", error);
        }
      });

    } catch (error) {
      console.error("Failed to stop assignment:", error);
    }
  };

  const bgColor = "var(--theme-ui-colors-background)";
  const textColor = "var(--theme-ui-colors-text)";

  // Strongly typed column definitions mapping against our localized form state definition
  const columnHelper = createColumnHelper<FormAssignment>();
  const columns = useMemo(
    () => [
      columnHelper.accessor("subjectName", {
        header: "Subject",
        cell: (info) => info.getValue() || "N/A",
      }),
      columnHelper.accessor("groupName", {
        header: "Group",
        cell: (info) => info.getValue() || "N/A",
      }),
      columnHelper.accessor("isStopped", {
        header: "Status",
        cell: (info) => {
          const isStopped = info.getValue();
          return isStopped ? "❌ Inactive" : "✅ Active";
        },
      }),
      columnHelper.accessor("id", {
        header: "Actions",
        cell: (info) => {
          const row = info.row.original;
          return (
            <Button
              variant="secondary"
              onClick={() => handleToggleStopAssignment(row.id)} // Fixed execution invocation
              disabled={row.isStopped || stoppingAssignment}
              sx={{
                cursor: "pointer",
                fontSize: 1,
                py: 1,
                px: 2,
                bg: row.isStopped ? "muted" : "orange",
                color: row.isStopped ? "text" : "white",
              }}
            >
              {row.isStopped ? "Stopped" : stoppingAssignment ? "Stopping..." : "Stop"}
            </Button>
          );
        },
      }),
    ],
    []
  );

  // Fixed: Connect table mapping directly to form state array to show reactive UI updates
  const table = useReactTable({
    data: form.assignments,
    columns: columns as ColumnDef<FormAssignment>[],
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
        <Text p={4}>Error loading teacher data.</Text>
      </Layout>
    );
  if (!teacher)
    return (
      <Layout>
        <Text p={4}>Teacher data record not found.</Text>
      </Layout>
    );

  return (
    <Layout>
      <Box sx={{ maxWidth: "800px", mx: "auto", p: 3, position: "relative" }}>
        <Flex sx={{ alignItems: "center", gap: 3, mb: 4 }}>
          <Button
            onClick={() => navigate("/teachers")}
            sx={{ bg: "muted", color: "text", cursor: "pointer" }}
          >
            {t("common.back")}
          </Button>
          <Text as="h1" sx={{ fontSize: 5, fontWeight: "bold" }}>
            {t("teachers.edit")}
          </Text>
        </Flex>

        {isDirty && (
          <Flex
            sx={{
              width: "100%",
              justifyContent: "flex-end",
              gap: 3,
              alignItems: "center",
              p: 2,
              mb: 3,
            }}
          >
            <Text sx={{ color: "orange", fontWeight: "medium", fontSize: 1 }}>
              You have unsaved changes
            </Text>
            <Button
              onClick={handleDiscard}
              sx={{
                bg: "transparent",
                border: "1px solid",
                borderColor: "border",
                color: "text",
                cursor: "pointer",
                "&:hover": { bg: "muted" },
              }}
            >
              Discard
            </Button>
            <Button
              onClick={handleSave}
              sx={{
                bg: "primary",
                color: "white",
                px: 4,
                cursor: "pointer",
                fontWeight: "bold",
                "&:disabled": { opacity: 0.6 },
              }}
            >
              {updating ? "Saving Changes..." : "Save Changes"}
            </Button>
          </Flex>
        )}

        <Box
          sx={{
            p: [3, 4],
            borderRadius: "xl",
            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
            border: "1px solid",
            borderColor: "border",
            bg: "background",
            mb: 4,
          }}
        >
          {/* PERSONAL INFO CONTAINER */}
          <Box
            sx={{
              mb: 5,
              pb: 3,
              borderBottom: "1px solid",
              borderColor: "border",
            }}
          >
            <Flex sx={{ alignItems: "center", gap: 3, mb: 4 }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  p: 2,
                  bg: "muted",
                  borderRadius: "md",
                  color: "primary",
                }}
              >
                <LuUser size={28} />
              </Box>
              <Text
                as="h2"
                sx={{ fontSize: 4, fontWeight: "bold", color: "text" }}
              >
                {t("Personal Information")}
              </Text>
            </Flex>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: ["1fr", "1fr 1fr"],
                columnGap: 4,
                rowGap: 3,
              }}
            >
              {/* First Name */}
              <Box>
                <Label htmlFor="firstName" sx={{ fontWeight: "bold", mb: 2 }}>
                  {t("teachers.firstName")}
                </Label>
                <Box sx={{ position: "relative", width: "100%" }}>
                  <Box
                    sx={{
                      position: "absolute",
                      top: "50%",
                      left: 3,
                      transform: "translateY(-50%)",
                      display: "flex",
                      alignItems: "center",
                      pointerEvents: "none",
                      color: "primary",
                    }}
                  >
                    <LuUser size={22} />
                  </Box>
                  <Input
                    id="firstName"
                    name="firstName"
                    value={form.firstName}
                    placeholder="e.g. Ahmed"
                    onChange={(e) =>
                      setForm({ ...form, firstName: e.target.value })
                    }
                    sx={{ pl: "40px !important", width: "100%" }}
                    required
                  />
                </Box>
              </Box>

              {/* Last Name */}
              <Box>
                <Label htmlFor="lastName" sx={{ fontWeight: "bold", mb: 2 }}>
                  {t("teachers.lastName")}
                </Label>
                <Box sx={{ position: "relative", width: "100%" }}>
                  <Box
                    sx={{
                      position: "absolute",
                      top: "50%",
                      left: 3,
                      transform: "translateY(-50%)",
                      display: "flex",
                      alignItems: "center",
                      pointerEvents: "none",
                      color: "primary",
                    }}
                  >
                    <LuUser size={22} />
                  </Box>
                  <Input
                    id="lastName"
                    name="lastName"
                    value={form.lastName}
                    placeholder="e.g. Benali"
                    onChange={(e) =>
                      setForm({ ...form, lastName: e.target.value })
                    }
                    sx={{ pl: "40px !important", width: "100%" }}
                    required
                  />
                </Box>
              </Box>

              {/* Email Address */}
              <Box>
                <Label htmlFor="email" sx={{ fontWeight: "bold", mb: 2 }}>
                  {t("teachers.email")}
                </Label>
                <Box sx={{ position: "relative", width: "100%" }}>
                  <Box
                    sx={{
                      position: "absolute",
                      top: "50%",
                      left: 3,
                      transform: "translateY(-50%)",
                      display: "flex",
                      alignItems: "center",
                      pointerEvents: "none",
                      color: "primary",
                    }}
                  >
                    <LuContact size={22} />
                  </Box>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={form.email}
                    placeholder="e.g. Ahmed@email.com"
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                    sx={{ pl: "40px !important", width: "100%" }}
                    required
                  />
                </Box>
              </Box>

              {/* Phone Input */}
              <Box>
                <Label htmlFor="phone" sx={{ fontWeight: "bold", mb: 2 }}>
                  {t("teachers.phone")}
                  <Text as="span" sx={{ color: "indigo", ml: 1 }}>
                    *
                  </Text>
                </Label>
                <Box
                  sx={{
                    width: "100%",
                    "& .react-tel-input": { width: "100%" },
                    "& .form-control": {
                      width: "100% !important",
                      height: "42px !important",
                      backgroundColor: `${bgColor} !important`,
                      color: `${textColor} !important`,
                      border: "1px solid !important",
                      borderColor: "border !important",
                      borderRadius: "6px !important",
                      paddingLeft: "58px !important",
                    },
                  }}
                >
                  <PhoneInput
                    placeholder="6XX XXX XXX"
                    country={"dz"}
                    value={form.phone}
                    onChange={(phone) =>
                      setForm({ ...form, phone: "+" + phone })
                    }
                    enableSearch={true}
                  />
                </Box>
              </Box>

              {/* Date Of Birth */}
              <Box>
                <Label htmlFor="dateOfBirth" sx={{ fontWeight: "bold", mb: 2 }}>
                  {t("teachers.dateOfBirth")}
                  <Text as="span" sx={{ color: "indigo", ml: 1 }}>
                    *
                  </Text>
                </Label>
                <Input
                  type="date"
                  id="dateOfBirth"
                  name="dateOfBirth"
                  value={form.dateOfBirth}
                  onChange={(e) =>
                    setForm({ ...form, dateOfBirth: e.target.value })
                  }
                  onClick={(e) => e.currentTarget.showPicker?.()}
                  max={new Date().toISOString().split("T")[0]}
                  required
                  sx={{
                    height: "42px",
                    borderColor: "border",
                    width: "100%",
                    cursor: "pointer",
                  }}
                />
              </Box>

              {/* Gender Selection */}
              <Box>
                <Label sx={{ fontWeight: "bold", mb: 2 }}>
                  {t("teachers.gender")}
                </Label>
                <Flex sx={{ gap: 2, height: "42px" }}>
                  {Object.values(TeacherGender).map((g) => (
                    <Box
                      key={g}
                      onClick={() => setForm({ ...form, gender: g })}
                      sx={{
                        flex: 1,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        border: "1px solid",
                        borderColor: form.gender === g ? "primary" : "border",
                        bg: form.gender === g ? "muted" : "transparent",
                        borderRadius: "md",
                        cursor: "pointer",
                        fontWeight: form.gender === g ? "bold" : "normal",
                        transition: "all 0.2s",
                      }}
                    >
                      {t(`teachers.${g.toLowerCase()}`)}
                    </Box>
                  ))}
                </Flex>
              </Box>
            </Box>
          </Box>
        </Box>

        {/* Dynamic Assignments Table Card */}
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
            Assignments ({form.assignments.length})
          </Text>

          <Box sx={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                {table.getHeaderGroups().map((hg) => (
                  <tr key={hg.id}>
                    {hg.headers.map((h) => (
                      <th key={h.id} style={{ textAlign: "left", padding: 8 }}>
                        {flexRender(h.column.columnDef.header, h.getContext())}
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
        </Card>
      </Box>
    </Layout>
  );
};

export default TeacherEditPage;
