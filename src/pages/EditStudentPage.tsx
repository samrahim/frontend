import React, { useEffect, useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  StudentGender,
  useGetStudentDetailsQuery,
  useUpdateCourseEnrollmentMutation,
  useUpdateparentMutation,
  useUpdateStudentMutation,
  useGetFamilyMembersQuery, // تم إضافة الاستعلام لجلب خيارات أفراد العائلة
} from "../graphql/generated";
import { Layout } from "../components/Layout";
import {
  Box,
  Input,
  Button,
  Text,
  Label,
  Flex,
  Card,
  Switch,
  Heading,
  Select,
} from "theme-ui";
import { LuContact, LuMapPin, LuUser } from "react-icons/lu";
import { t } from "i18next";
import ReactPhoneInput from "react-phone-input-2";
const PhoneInput = (ReactPhoneInput as any).default || ReactPhoneInput;
import { EnrollOneStudentModel } from "../components/EnrollOneStudentDialog";

// تعديل الواجهة لتتعامل مع familyMemberId بدلاً من الـ Enum القديم
interface ParentForm {
  firstName: string;
  lastName: string;
  phones: string[];
  familyMemberId?: string | null;
}

interface EnrollmentForm {
  id: string;
  groupName: string;
  startAt: string;
  endAt?: string;
  stopped: boolean;
  discount: number;
  note?: string;
}

interface StudentForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  gender: StudentGender;
  dateOfBirth: string;
  address: string;
  isSick: boolean;
  healthNote: string;
}

// Helper to reliably compare arrays
const areArraysEqual = (a: string[] = [], b: string[] = []) => {
  if (a.length !== b.length) return false;
  return a.every((val, index) => val === b[index]);
};

const StudentEditPage: React.FC = () => {
  const [enrollments, setEnrollments] = useState<EnrollmentForm[]>([]);
  const [originalEnrollments, setOriginalEnrollments] = useState<
    EnrollmentForm[]
  >([]);

  const [updateCourseEnrollment] = useUpdateCourseEnrollmentMutation();
  const [enrollmentIds, setEnrollmentsIds] = useState<string[]>([]);
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // جلب خيارات أفراد العائلة (Family Members) لتعبئة القائمة المنسدلة
  const { data: familyMembersData, loading: loadingFamilyMembers } =
    useGetFamilyMembersQuery();

  const { data, loading, error, refetch } = useGetStudentDetailsQuery({
    variables: { id: id || "" },
    skip: !id,
  });

  const student =
    data?.node && data.node.__typename === "Student" ? data.node : null;
  const parent = student?.parent ?? null;

  const [form, setForm] = useState<StudentForm>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    gender: StudentGender.Male,
    dateOfBirth: "",
    address: "",
    isSick: false,
    healthNote: "",
  });

  const [originalParent, setOriginalParent] = useState<ParentForm>({
    firstName: "",
    lastName: "",
    phones: [],
    familyMemberId: null,
  });

  const [parentForm, setparentForm] = useState<ParentForm>({
    firstName: "",
    lastName: "",
    phones: [],
    familyMemberId: null,
  });

  const [openEnrollOneStudent, setOpenEnrollStudent] = useState(false);

  useEffect(() => {
    if (!student) return;

    const mapped: EnrollmentForm[] =
      student.enroll?.map((e) => ({
        id: e.id,
        groupName: e.group.name,
        startAt: e.startAt,
        endAt: e.endAt ?? "",
        stopped: e.stopped ?? false,
        discount: e.discount,
        note: e.note ?? "",
      })) ?? [];

    setEnrollments(mapped);
    const ids = mapped.map((e) => e.id);
    setEnrollmentsIds(ids);
    setOriginalEnrollments(mapped);
  }, [student]);

  /* -------------------- INITIAL DATA MAPPER -------------------- */
  useEffect(() => {
    if (!student) return;

    setForm({
      firstName: student.firstName || "",
      lastName: student.lastName || "",
      email: student.email || "",
      phone: student.phone || "",
      gender: student.gender ?? StudentGender.Male,
      dateOfBirth: student.dateOfBirth ? student.dateOfBirth.split("T")[0] : "",
      address: student.address || "",
      isSick: student.isSick,
      healthNote: student.healthNote || "",
    });

    const initialParent: ParentForm = {
      firstName: parent?.firstName || "",
      lastName: parent?.lastName || "",
      phones: parent?.phones || [],
      familyMemberId: parent?.familyMember?.id || null, // جلب ID الخاص بالـ FamilyMember
    };

    setparentForm(initialParent);
    setOriginalParent(initialParent);
  }, [student, parent]);

  const bgColor = "var(--theme-ui-colors-background)";
  const textColor = "var(--theme-ui-colors-text)";

  /* -------------------- DYNAMIC CHANGE TRACKER -------------------- */
  const isDirty = useMemo(() => {
    if (!student) return false;

    return (
      form.firstName !== (student.firstName || "") ||
      form.lastName !== (student.lastName || "") ||
      form.email !== (student.email || "") ||
      form.phone !== (student.phone || "") ||
      form.gender !== (student.gender ?? StudentGender.Male) ||
      form.address !== (student.address || "") ||
      form.dateOfBirth !==
        (student.dateOfBirth ? student.dateOfBirth.split("T")[0] : "") ||
      form.isSick !== (student.isSick || false) ||
      form.healthNote !== (student.healthNote || "")
    );
  }, [form, student]);

  const enrollmentsDirty = useMemo(() => {
    return JSON.stringify(enrollments) !== JSON.stringify(originalEnrollments);
  }, [enrollments, originalEnrollments]);

  const toggleEnrollment = (id: string) => {
    setEnrollments((prev) =>
      prev.map((e) =>
        e.id === id
          ? {
              ...e,
              stopped: !e.stopped,
              endAt: !e.stopped ? new Date().toISOString() : "",
            }
          : e
      )
    );
  };

  const parenDirty = useMemo(() => {
    return (
      parentForm.firstName !== originalParent.firstName ||
      parentForm.lastName !== originalParent.lastName ||
      !areArraysEqual(parentForm.phones, originalParent.phones) ||
      parentForm.familyMemberId !== originalParent.familyMemberId
    );
  }, [originalParent, parentForm]);

  /* -------------------- MUTATION HANDLER -------------------- */
  const [updateStudent, { loading: updating }] = useUpdateStudentMutation();
  const [updateParent, { loading: updatingparent }] = useUpdateparentMutation();
  const hasChanges = isDirty || enrollmentsDirty || parenDirty;

  const handleSaveAll = async () => {
    try {
      if (isDirty && id) {
        const response = await updateStudent({
          variables: {
            id,
            input: {
              firstName: form.firstName,
              lastName: form.lastName,
              email: form.email,
              phone: form.phone,
              gender: form.gender as StudentGender,
              address: form.address,
              isSick: form.isSick,
              healthNote: form.healthNote,
              dateOfBirth: form.dateOfBirth
                ? new Date(form.dateOfBirth).toISOString()
                : null,
            },
          },
        });

        const updatedStudent = response.data?.updateStudent;
        if (updatedStudent) {
          setForm({
            firstName: updatedStudent.firstName || "",
            lastName: updatedStudent.lastName || "",
            email: updatedStudent.email || "",
            phone: updatedStudent.phone || "",
            gender: updatedStudent.gender ?? StudentGender.Male,
            dateOfBirth: updatedStudent.dateOfBirth
              ? updatedStudent.dateOfBirth.split("T")[0]
              : "",
            address: updatedStudent.address || "",
            isSick: updatedStudent.isSick || false,
            healthNote: updatedStudent.healthNote || "",
          });
        }
      }

      if (parenDirty && parent?.id) {
        const response = await updateParent({
          variables: {
            id: parent.id,
            input: {
              firstName: parentForm.firstName,
              lastName: parentForm.lastName,
              phones: parentForm.phones,
              familyMemberID: parentForm.familyMemberId, // إرسال المعرف ID الخاص بالـ FamilyMember
            },
          },
        });

        const updatedParent = response.data?.updateParent;

        const syncedParentState: ParentForm = {
          firstName: updatedParent?.firstName ?? parentForm.firstName,
          lastName: updatedParent?.lastName ?? parentForm.lastName,
          phones: updatedParent?.phones ?? parentForm.phones,
          familyMemberId: updatedParent?.id ?? parentForm.familyMemberId,
        };

        setparentForm(syncedParentState);
        setOriginalParent(syncedParentState);
      }

      if (enrollmentsDirty) {
        const changed = enrollments.filter((e, index) => {
          const original = originalEnrollments[index];
          return e.stopped !== original.stopped || e.endAt !== original.endAt;
        });

        await Promise.all(
          changed.map((e) =>
            updateCourseEnrollment({
              variables: {
                id: e.id,
                input: {
                  stopped: e.stopped,
                  endAt: e.stopped ? new Date(e.endAt!) : null,
                },
              },
            })
          )
        );

        setOriginalEnrollments(enrollments);
      }

      await refetch();
    } catch (err) {
      console.error("Update failed ❌", err);
    }
  };

  const handleDiscard = () => {
    if (!student) return;
    setForm({
      firstName: student.firstName || "",
      lastName: student.lastName || "",
      email: student.email || "",
      phone: student.phone || "",
      gender: student.gender ?? StudentGender.Male,
      dateOfBirth: student.dateOfBirth ? student.dateOfBirth.split("T")[0] : "",
      address: student.address || "",
      healthNote: student.healthNote || "",
      isSick: student.isSick || false,
    });
  };

  const handleDiscardEnrollments = () => {
    setEnrollments(originalEnrollments.map((e) => ({ ...e })));
  };

  const handleDiscardParentChanged = () => {
    setparentForm(originalParent);
  };

  const handleDiscardAll = () => {
    handleDiscard();
    handleDiscardEnrollments();
    handleDiscardParentChanged();
  };

  const familyMembersList =
    familyMembersData?.getfamilyMembers?.edges?.map((edge) => edge?.node) ?? [];
  if (loading || loadingFamilyMembers)
    return (
      <Layout>
        <Text p={4}>Loading...</Text>
      </Layout>
    );

  if (error)
    return (
      <Layout>
        <Text p={4}>Error loading student data.</Text>
      </Layout>
    );

  if (!student)
    return (
      <Layout>
        <Text p={4}>Student data record not found.</Text>
      </Layout>
    );

  return (
    <Layout>
      <Box sx={{ maxWidth: "800px", mx: "auto", p: 3, position: "relative" }}>
        {/* Navigation Section */}
        <Flex sx={{ alignItems: "center", gap: 3, mb: 4 }}>
          <Button
            onClick={() => navigate("/students")}
            sx={{ bg: "muted", color: "text", cursor: "pointer" }}
          >
            {t("common.back")}
          </Button>
          <Text as="h1" sx={{ fontSize: 5, fontWeight: "bold" }}>
            {t("students.editStudent")}
          </Text>
        </Flex>

        {hasChanges && (
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
              {t("common.youhaveunsavedchanges")}
            </Text>
            <Button
              onClick={handleDiscardAll}
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
              onClick={handleSaveAll}
              disabled={updating || updatingparent}
              sx={{
                bg: "primary",
                color: "white",
                px: 4,
                cursor: "pointer",
                fontWeight: "bold",
                "&:disabled": { opacity: 0.6 },
              }}
            >
              {updating || updatingparent
                ? "Saving Changes..."
                : "Save Changes"}
            </Button>
          </Flex>
        )}

        {/* Form Container Card Layout */}
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
                {t("students.personalInformation")}
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
                  {t("students.firstName")}
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
                  {t("students.lastName")}
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
                  {t("students.email")}
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
                  {t("students.phone")}
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
                  {t("students.dateOfBirth")}
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
                  {t("students.gender")}
                </Label>
                <Flex sx={{ gap: 2, height: "42px" }}>
                  {Object.values(StudentGender).map((g) => (
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
                      {t(`students.${g.toLowerCase()}`)}
                    </Box>
                  ))}
                </Flex>
              </Box>
            </Box>
          </Box>

          {/* FAMILY & CONTACT INFRASTRUCTURE CARD */}
          <Box sx={{ mb: 2 }}>
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
                <LuMapPin size={28} />
              </Box>
              <Text
                as="h2"
                sx={{ fontSize: 4, fontWeight: "bold", color: "text" }}
              >
                {t("Contact & Family")}
              </Text>
            </Flex>

            {/* Address */}
            <Box sx={{ mb: 4 }}>
              <Label htmlFor="address" sx={{ fontWeight: "bold", mb: 2 }}>
                {t("students.address")}
                <Text as="span" sx={{ color: "indigo", ml: 1 }}>
                  *
                </Text>
              </Label>
              <Input
                id="address"
                name="address"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="Street, City, Country"
                required
              />
            </Box>

            {/* Health Conditions Section */}
            <Flex sx={{ alignItems: "center", gap: 3, mb: 3 }}>
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <input
                  type="checkbox"
                  id="healthToggle"
                  checked={Boolean(form.isSick)}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      isSick: e.target.checked,
                      healthNote: e.target.checked ? form.healthNote : "",
                    })
                  }
                  style={{ width: "20px", height: "20px", cursor: "pointer" }}
                />
              </Box>
              <Box sx={{ display: "flex", flexDirection: "column" }}>
                <Label
                  htmlFor="healthToggle"
                  sx={{
                    fontWeight: "bold",
                    fontSize: 2,
                    cursor: "pointer",
                    mb: 0,
                  }}
                >
                  {t("Health Condition")}
                </Label>
                <Text
                  sx={{ color: form.isSick ? "orange" : "gray", fontSize: 1 }}
                >
                  {Boolean(form.isSick)
                    ? t("Medical condition flagged.")
                    : t("No health conditions reported.")}
                </Text>
              </Box>
            </Flex>

            {/* Condition details text input card layout */}
            {Boolean(form.isSick) && (
              <Box
                sx={{
                  mt: 3,
                  mb: 4,
                  pt: 3,
                  borderTop: "1px solid",
                  borderColor: "muted",
                }}
              >
                <Label htmlFor="healthNote" sx={{ fontWeight: "bold", mb: 2 }}>
                  {t("Health Condition Details *")}
                </Label>
                <Input
                  id="healthNote"
                  placeholder="Describe condition..."
                  value={form.healthNote || ""}
                  onChange={(e) =>
                    setForm({ ...form, healthNote: e.target.value })
                  }
                  required
                />
              </Box>
            )}

            {/* Editable Parent Information Layout */}
            {parentForm && (
              <Box
                sx={{
                  mt: 4,
                  pt: 4,
                  borderTop: "1px solid",
                  borderColor: "border",
                }}
              >
                <Text
                  sx={{ fontWeight: "bold", fontSize: 3, mb: 3, color: "text" }}
                >
                  {t("Parent / Guardian Information")}
                </Text>

                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: ["1fr", "1fr 1fr"],
                    columnGap: 4,
                    rowGap: 3,
                  }}
                >
                  {/* Parent First Name */}
                  <Box>
                    <Label
                      htmlFor="parentFirstName"
                      sx={{ fontWeight: "bold", mb: 2 }}
                    >
                      {t("Parent First Name")}
                    </Label>
                    <Input
                      id="parentFirstName"
                      onChange={(e) =>
                        setparentForm({
                          ...parentForm,
                          firstName: e.target.value,
                        })
                      }
                      value={parentForm?.firstName || ""}
                    />
                  </Box>

                  {/* Parent Last Name */}
                  <Box>
                    <Label
                      htmlFor="parentLastName"
                      sx={{ fontWeight: "bold", mb: 2 }}
                    >
                      {t("Parent Last Name")}
                    </Label>
                    <Input
                      onChange={(e) =>
                        setparentForm({
                          ...parentForm,
                          lastName: e.target.value,
                        })
                      }
                      id="parentLastName"
                      value={parentForm?.lastName || ""}
                    />
                  </Box>

                  {/* Family Member Relationship Select Dropdown */}
                  <Box>
                    <Label
                      htmlFor="familyMemberSelect"
                      sx={{ fontWeight: "bold", mb: 2 }}
                    >
                      {t("Family Member Relationship")}
                    </Label>
                    <Select
                      id="familyMemberSelect"
                      value={parentForm.familyMemberId || ""}
                      onChange={(e) =>
                        setparentForm({
                          ...parentForm,
                          familyMemberId: e.target.value || null,
                        })
                      }
                    >
                      <option value="">{t("Select Relationship...")}</option>
                      {familyMembersList.map((member: any) => (
                        <option key={member?.id} value={member?.id}>
                          {member?.type}
                        </option>
                      ))}
                    </Select>
                  </Box>

                  {/* Parent Phone Numbers */}
                  <Box sx={{ gridColumn: ["1fr", "1fr / span 2"] }}>
                    <Label
                      htmlFor="parentPhone"
                      sx={{ fontWeight: "bold", mb: 2 }}
                    >
                      {t("Parent Phone Number")}
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
                        onChange={(phone) =>
                          setparentForm({
                            ...parentForm,
                            phones: phone ? ["+" + phone] : [],
                          })
                        }
                        placeholder="6XX XXX XXX"
                        country={"dz"}
                        value={parentForm?.phones?.[0] || ""}
                        enableSearch={true}
                      />
                    </Box>
                  </Box>
                </Box>
              </Box>
            )}
          </Box>
        </Box>

        {/* Course Enrollments Section */}
        <Card sx={{ p: 3 }}>
          <Flex
            sx={{
              justifyContent: "space-between",
              alignItems: "center",
              mb: 3,
            }}
          >
            <Heading>{t("Course Enrollments")}</Heading>
            <Button onClick={() => setOpenEnrollStudent(true)}>enroll</Button>
          </Flex>

          {enrollments.map((e) => (
            <Flex
              key={e.id}
              sx={{
                width: "100%",
                justifyContent: "space-between",
                alignItems: "center",
                py: 3,
                gap: 3,
                borderBottom: "1px solid",
                borderColor: "border",
                "&:last-child": { borderBottom: "none" },
              }}
            >
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Text
                  sx={{
                    fontWeight: "bold",
                    wordBreak: "break-word",
                  }}
                >
                  {e.groupName}
                </Text>
              </Box>

              <Box sx={{ flexShrink: 0 }}>
                <Switch
                  checked={!e.stopped}
                  onChange={() => toggleEnrollment(e.id)}
                />
              </Box>
            </Flex>
          ))}
        </Card>
      </Box>

      {openEnrollOneStudent && (
        <EnrollOneStudentModel
          studentId={student.id}
          open={openEnrollOneStudent}
          onClose={() => setOpenEnrollStudent(false)}
          onCreated={() => console.log("")}
          studentEnrollements={enrollmentIds}
        />
      )}
    </Layout>
  );
};

export default StudentEditPage;
