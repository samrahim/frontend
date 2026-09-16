import { useState } from "react";

import {
  StudentGender,
  TeacherPaymentType,
  useCreateTeacherMutation,
} from "../../graphql";
import ReactPhoneInput from "react-phone-input-2";
const PhoneInput = (ReactPhoneInput as any).default || ReactPhoneInput;
import "react-datepicker/dist/react-datepicker.css";

import { useAuth } from "../../contexts/AuthContext";
import { Box, Button, Text, Flex, Input, Label, useThemeUI } from "theme-ui";
import { useTranslation } from "react-i18next";

import { useNavigate } from "react-router-dom";
import { LuUser, LuMapPin, LuContact, LuHandCoins } from "react-icons/lu";
import { Layout } from "../Layout";
import { PageLayout } from "../PageLayout";

export function CreateTeachertForm() {
  const [createTeacher, { loading }] = useCreateTeacherMutation();
  const themeUI = useThemeUI();
  const theme = themeUI.theme;
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [teacherform, setForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    paymentAmount: 0,
    gender: "MALE",
    dateOfBirth: "",
    email: "",
    active: true,
    address: "",
  });

  const { user } = useAuth();

  const handleSubmit = async () => {
    if (!teacherform.phone || teacherform.phone.length < 8) {
      alert(t("students.invalidPhone"));
      return;
    }
    if (!user) {
      alert(t("students.userNotAuthenticated"));
      return;
    }

    try {
      await createTeacher({
        variables: {
          input: {
            firstName: teacherform.firstName,
            lastName: teacherform.lastName,
            phone: teacherform.phone,
            dateOfBirth: new Date(teacherform.dateOfBirth).toISOString(),
            paymentAmount: teacherform.paymentAmount,
            paymentType: TeacherPaymentType.Salary,
            email: teacherform.email,
          },
        },
      }).then((e) => {
        console.log(e);
        navigate(-1);
      });
    } catch (err) {
      alert(err);
    }
  };

  const bgColor = theme?.colors?.background || "#ffffff";
  const textColor = theme?.colors?.text || "#000000";

  return (
    <Layout>
      <PageLayout
        title={t("hifdh.teacher")}
        description={t("teachers.add")}
        icon="➕"
      >
        <Box sx={{ maxWidth: "800px", mx: "auto", pl: 3 }}>
          <Flex sx={{ alignItems: "center" }}>
            <Button
              onClick={() => navigate(-1)}
              sx={{ bg: "muted", color: "text" }}
            >
              {t("common.back")}
            </Button>

            <Text as="h1" sx={{ fontSize: 5, fontWeight: "bold" }}>
              {t("teachers.createTeacher")}
            </Text>
          </Flex>
        </Box>
        <Box sx={{ maxWidth: "800px", mx: "auto", p: 3 }}>
          {/* Section 1: Personal Information */}

          <Box
            sx={{
              p: [3, 4], // Padding inside the card
              borderRadius: "xl", // Smooth rounded corners
              boxShadow:
                "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)", // Subtle depth shadow
              border: "1px solid",
            }}
          >
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
                  {t("students.personalInfo")}
                </Text>
              </Flex>

              {/* 2-Column Grid Layout for Fields */}
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

                  {/* 1. Relative Container Wrapper */}
                  <Box sx={{ position: "relative", width: "100%" }}>
                    {/* 2. Absolute Icon Container */}
                    <Box
                      sx={{
                        position: "absolute",
                        top: "50%",
                        left: 3, // Spaces it from the left edge
                        transform: "translateY(-50%)", // Vertically centers the icon perfectly
                        display: "flex",
                        alignItems: "center",
                        pointerEvents: "none", // Allows clicks to pass through to the input below
                        color: "primary", // Icon color (or use "primary")
                      }}
                    >
                      <LuUser size={22} /> {/* Your Icon */}
                    </Box>

                    {/* 3. The Input Component */}
                    <Input
                      id="firstName"
                      name="firstName"
                      value={teacherform.firstName}
                      placeholder="e.g. Ahmed"
                      onChange={(e) =>
                        setForm({ ...teacherform, firstName: e.target.value })
                      }
                      sx={{
                        pl: "40px !important", // CRITICAL: Leaves exact room for the icon on the left
                        width: "100%",
                      }}
                      required
                    />
                  </Box>
                </Box>
                <Box>
                  <Label htmlFor="lastName" sx={{ fontWeight: "bold", mb: 2 }}>
                    {t("students.lastName")}
                  </Label>
                  {/* Last Name */}

                  <Box sx={{ position: "relative", width: "100%" }}>
                    {/* 2. Absolute Icon Container */}
                    <Box
                      sx={{
                        position: "absolute",
                        top: "50%",
                        left: 3, // Spaces it from the left edge
                        transform: "translateY(-50%)", // Vertically centers the icon perfectly
                        display: "flex",
                        alignItems: "center",
                        pointerEvents: "none", // Allows clicks to pass through to the input below
                        color: "primary", // Icon color (or use "primary")
                      }}
                    >
                      <LuUser size={22} /> {/* Your Icon */}
                    </Box>

                    {/* 3. The Input Component */}
                    <Input
                      id="lastName"
                      name="lastName"
                      value={teacherform.lastName}
                      placeholder="e.g. Benali"
                      onChange={(e) =>
                        setForm({ ...teacherform, lastName: e.target.value })
                      }
                      sx={{
                        pl: "40px !important",
                        width: "100%",
                      }}
                      required
                    />
                  </Box>
                </Box>
                <Box>
                  <Label htmlFor="email" sx={{ fontWeight: "bold", mb: 2 }}>
                    {t("students.email")}
                  </Label>
                  {/* Last Name */}

                  <Box sx={{ position: "relative", width: "100%" }}>
                    {/* 2. Absolute Icon Container */}
                    <Box
                      sx={{
                        position: "absolute",
                        top: "50%",
                        left: 3, // Spaces it from the left edge
                        transform: "translateY(-50%)", // Vertically centers the icon perfectly
                        display: "flex",
                        alignItems: "center",
                        pointerEvents: "none", // Allows clicks to pass through to the input below
                        color: "primary", // Icon color (or use "primary")
                      }}
                    >
                      <LuContact size={22} /> {/* Your Icon */}
                    </Box>

                    {/* 3. The Input Component */}
                    <Input
                      id="email"
                      name="email"
                      value={teacherform.email}
                      placeholder="e.g. Ahmed@email.com"
                      onChange={(e) =>
                        setForm({ ...teacherform, email: e.target.value })
                      }
                      sx={{
                        pl: "40px !important",
                        width: "100%",
                      }}
                      required
                    />
                  </Box>
                </Box>
                {/* Phone Number */}
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

                      "& .react-tel-input": {
                        width: "100%",
                      },
                      "& .form-control": {
                        width: "100% !important",
                        height: "42px !important", // Matches standard input height
                        backgroundColor: `${bgColor} !important`,
                        color: `${textColor} !important`,
                        border: "1px solid !important",
                        borderColor: "border !important", // Uses your theme's border color
                        borderRadius: "6px !important", // Matches standard input border radius
                        fontSize: "16px !important",
                        paddingLeft: "58px !important", // Gives breathing room for the flag dropdown
                        transition: "all 0.2s",
                      },
                      "& .form-control:focus": {
                        borderColor: "primary !important",
                        boxShadow:
                          "0 0 0 2px rgba(59, 130, 246, 0.1) !important",
                        outline: "none !important",
                      },
                      "& .flag-dropdown": {
                        backgroundColor: `${bgColor} !important`,
                        borderColor: "border !important",
                        borderTopLeftRadius: "6px !important",
                        borderBottomLeftRadius: "6px !important",
                        borderRight: "1px solid !important",
                        borderRightColor: "border !important",
                      },
                      "& .selected-flag": {
                        backgroundColor: `${bgColor} !important`,
                        width: "48px !important",
                      },
                      "& .country-list": {
                        backgroundColor: `${bgColor} !important`,
                        color: `${textColor} !important`,
                        borderColor: "border !important",
                        borderRadius: "8px !important",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.1) !important",
                      },
                      "& .country-list .country:hover": {
                        backgroundColor: "muted !important",
                      },
                    }}
                  >
                    <PhoneInput
                      placeholder="6XX XXX XXX"
                      country={"dz"}
                      value={teacherform.phone}
                      onChange={(phone) =>
                        setForm({ ...teacherform, phone: "+" + phone })
                      }
                      enableSearch={true}
                    />
                  </Box>
                </Box>
                {/* Date of Birth */}
                <Box sx={{ paddingBottom: 4, flex: 1, width: "100%" }}>
                  <Label
                    htmlFor="dateOfBirth"
                    sx={{ fontWeight: "bold", mb: 2 }}
                  >
                    {t("students.dateOfBirth")}
                    <Text as="span" sx={{ color: "indigo", ml: 1 }}>
                      *
                    </Text>
                  </Label>

                  <Input
                    type="date"
                    id="dateOfBirth"
                    name="dateOfBirth"
                    value={teacherform.dateOfBirth?.split("T")[0] ?? ""}
                    onChange={(e) =>
                      setForm({
                        ...teacherform,
                        dateOfBirth: e.target.value,
                      })
                    }
                    onClick={(e) =>
                      (e.currentTarget as HTMLInputElement).showPicker?.()
                    }
                    max={new Date().toISOString().split("T")[0]} // Can't be born in the future
                    required
                    sx={{
                      height: "42px",
                      boxSizing: "border-box",
                      py: 2,
                      borderColor: "border",
                      width: "100%",
                      cursor: "pointer",
                    }}
                  />
                </Box>

                {/* Gender Selection Boxes */}
                <Box>
                  <Label sx={{ fontWeight: "bold", mb: 2 }}>
                    {t("students.gender")}
                  </Label>
                  <Flex sx={{ gap: 2, height: "42px" }}>
                    <Box
                      onClick={() =>
                        setForm({ ...teacherform, gender: StudentGender.Male })
                      }
                      sx={{
                        flex: 1,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        border: "1px solid",
                        borderColor:
                          teacherform.gender === StudentGender.Male
                            ? "primary"
                            : "border",
                        bg:
                          teacherform.gender === StudentGender.Male
                            ? "muted"
                            : "transparent",
                        borderRadius: "md",
                        cursor: "pointer",
                        fontWeight:
                          teacherform.gender === StudentGender.Male
                            ? "bold"
                            : "normal",
                        transition: "all 0.2s",
                      }}
                    >
                      {t("students.male")}
                    </Box>
                    <Box
                      onClick={() =>
                        setForm({
                          ...teacherform,
                          gender: StudentGender.Female,
                        })
                      }
                      sx={{
                        flex: 1,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        border: "1px solid",
                        borderColor:
                          teacherform.gender === StudentGender.Female
                            ? "primary"
                            : "border",
                        bg:
                          teacherform.gender === StudentGender.Female
                            ? "muted"
                            : "transparent",
                        borderRadius: "md",
                        cursor: "pointer",
                        fontWeight:
                          teacherform.gender === StudentGender.Female
                            ? "bold"
                            : "normal",
                        transition: "all 0.2s",
                      }}
                    >
                      {t("students.female")}
                    </Box>
                  </Flex>
                </Box>
              </Box>
            </Box>

            {/* Section 2: Contact & Family */}
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
                  <LuHandCoins size={28} />
                </Box>
                <Text
                  as="h2"
                  sx={{ fontSize: 4, fontWeight: "bold", color: "text" }}
                >
                  {t("teachers.payement")}
                </Text>
              </Flex>

              <Box sx={{ mb: 4 }}>
                <Label
                  htmlFor="payementAmount"
                  sx={{ fontWeight: "bold", mb: 2 }}
                >
                  {t("teachers.salary")}
                  <Text as="span" sx={{ color: "indigo", ml: 1 }}>
                    *
                  </Text>
                </Label>
                <Input
                  id="salary"
                  name="salary"
                  value={teacherform.paymentAmount}
                  onChange={(e) =>
                    setForm({
                      ...teacherform,
                      paymentAmount: Number(e.target.value),
                    })
                  }
                  placeholder="1000 DZ"
                  required
                />
              </Box>
            </Box>

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
                  <LuMapPin size={28} />
                </Box>
                <Text
                  as="h2"
                  sx={{ fontSize: 4, fontWeight: "bold", color: "text" }}
                >
                  {t("students.address")}
                </Text>
              </Flex>

              {/* Full Width Address */}
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
                  value={teacherform.address}
                  onChange={(e) =>
                    setForm({ ...teacherform, address: e.target.value })
                  }
                  placeholder="street city country"
                  required
                />
              </Box>
            </Box>
            {/* Section 4: Action Rows */}
            <Flex
              sx={{
                gap: 3,
                mt: 5,
                pt: 3,
                borderColor: "border",
              }}
            >
              <Button
                variant="secondary"
                onClick={() => setForm(teacherform)}
                sx={{
                  flex: 1,
                  py: 3,
                  fontSize: 2,
                  bg: "muted",
                  color: "text",
                  "&:hover": { bg: "border" },
                }}
              >
                {t("students.resetForm")}
              </Button>
              <Button
                variant="primary"
                onClick={handleSubmit}
                disabled={loading}
                sx={{ flex: 2, py: 3, fontSize: 2, fontWeight: "bold" }}
              >
                {loading ? t("calendar.creating") : t("teachers.enroll")}
              </Button>
            </Flex>
          </Box>
        </Box>
      </PageLayout>
    </Layout>
  );
}
