import { useState } from "react";

import {
  StudentGender,
  useCreateStudentMutation,
  useParentQuery,
} from "../../graphql";
import "react-phone-input-2/lib/style.css";
import "react-datepicker/dist/react-datepicker.css";

import { useAuth } from "../../contexts/AuthContext";
import { Box, Button, Text, Flex, Input, Label, useThemeUI } from "theme-ui";
import { useTranslation } from "react-i18next";
import { CreateParentModal } from "../CreateParentForm";
import { useDebounce } from "../Debouncer";
import { useNavigate } from "react-router-dom";
import { LuUser, LuMapPin, LuHeart, LuContact } from "react-icons/lu";

export function CreateStudentForm() {
  const [createStudent, { loading }] = useCreateStudentMutation();
  const themeUI = useThemeUI();
  const theme = themeUI.theme;
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    gender: "MALE",
    dateOfBirth: "",
    address: "",
    isSick: false,
    healthNote: "",
  });

  const { user } = useAuth();
  const [selectedParent, setSelectedParent] = useState<any | null>(null);
  const [openParentModal, setOpenParentModal] = useState(false);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 400);

  const { data: parentData, loading: parentLoading } = useParentQuery({
    variables: {
      where: {
        or: [
          { firstNameContains: debouncedSearch },
          { lastNameContains: debouncedSearch },
        ],
      },
    },
    skip: debouncedSearch.length < 2,
  });
  const handleSubmit = async () => {
    if (!user) {
      alert(t("students.userNotAuthenticated"));
      return;
    }
    if (!selectedParent) {
      alert("Please select or create a parent");
      return;
    }
    console.log(selectedParent.id);

    try {
      await createStudent({
        variables: {
          firstName: form.firstName,
          lastName: form.lastName,
          email: "",
          phone: "",
          dateOfBirth: new Date(form.dateOfBirth).toISOString(),

          gender: form.gender as StudentGender,
          address: form.address,
          creatorID: String(user?.id),
          isSick: form.isSick,
          healthNote: form.isSick ? form.healthNote : "Good",
          parentID: String(selectedParent?.id),
        },
      }).then((e) => {
        navigate(-1);
      });
    } catch (err) {
      return err;
    }
  };

  return (
    <Box sx={{ maxWidth: "800px", mx: "auto", p: 3 }}>
      <Flex sx={{ alignItems: "center", gap: 3, mb: 4 }}>
        <Button
          onClick={() => navigate(-1)}
          sx={{ bg: "muted", color: "text" }}
        >
          {t("common.back")}
        </Button>

        <Text as="h1" sx={{ fontSize: 5, fontWeight: "bold" }}>
          {t("students.createStudent")}
        </Text>
      </Flex>

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
                <Text as="span" sx={{ color: "indigo", ml: 1 }}>
                  *
                </Text>
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
                  value={form.firstName}
                  placeholder="e.g. Ahmed"
                  onChange={(e) =>
                    setForm({ ...form, firstName: e.target.value })
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
                <Text as="span" sx={{ color: "indigo", ml: 1 }}>
                  *
                </Text>
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
                  value={form.lastName}
                  placeholder="e.g. Benali"
                  onChange={(e) =>
                    setForm({ ...form, lastName: e.target.value })
                  }
                  sx={{
                    pl: "40px !important",
                    width: "100%",
                  }}
                  required
                />
              </Box>
            </Box>
            {/* <Box>
              <Label htmlFor="email" sx={{ fontWeight: "bold", mb: 2 }}>
                {t("students.email")}
              </Label>
             

              <Box sx={{ position: "relative", width: "100%" }}>
               
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
                  <LuContact size={22} />
                </Box>

                
                <Input
                  id="email"
                  name="email"
                  // value={form.email}
                  placeholder="e.g. Ahmed@email.com"
                  // onChange={(e) => setForm({ ...form, email: e.target.value })}
                  sx={{
                    pl: "40px !important",
                    width: "100%",
                  }}
                  required
                />
              </Box>
            </Box>
           
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
                    boxShadow: "0 0 0 2px rgba(59, 130, 246, 0.1) !important",
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
                  value={form.phone}
                  onChange={(phone) => setForm({ ...form, phone: "+" + phone })}
                  enableSearch={true}
                />
              </Box>
            </Box> */}
            {/* Date of Birth */}
            <Box sx={{ paddingBottom: 4, flex: 1, width: "100%" }}>
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
                value={form.dateOfBirth?.split("T")[0] ?? ""}
                onChange={(e) =>
                  setForm({
                    ...form,
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
                <Text as="span" sx={{ color: "indigo", ml: 1 }}>
                  *
                </Text>
              </Label>
              <Flex sx={{ gap: 2, height: "42px" }}>
                <Box
                  onClick={() =>
                    setForm({ ...form, gender: StudentGender.Male })
                  }
                  sx={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "1px solid",
                    borderColor:
                      form.gender === StudentGender.Male ? "primary" : "border",
                    bg:
                      form.gender === StudentGender.Male
                        ? "muted"
                        : "transparent",
                    borderRadius: "md",
                    cursor: "pointer",
                    fontWeight:
                      form.gender === StudentGender.Male ? "bold" : "normal",
                    transition: "all 0.2s",
                  }}
                >
                  {t("students.male")}
                </Box>
                <Box
                  onClick={() =>
                    setForm({ ...form, gender: StudentGender.Female })
                  }
                  sx={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "1px solid",
                    borderColor:
                      form.gender === StudentGender.Female
                        ? "primary"
                        : "border",
                    bg:
                      form.gender === StudentGender.Female
                        ? "muted"
                        : "transparent",
                    borderRadius: "md",
                    cursor: "pointer",
                    fontWeight:
                      form.gender === StudentGender.Female ? "bold" : "normal",
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
              <LuMapPin size={28} />
            </Box>
            <Text
              as="h2"
              sx={{ fontSize: 4, fontWeight: "bold", color: "text" }}
            >
              {t("students.addr&Family")}
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
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              placeholder="street city country"
              required
            />
          </Box>

          {/* Parent Search & Add Split (70% / 30%) */}
          <Box>
            <Label sx={{ fontWeight: "bold", mb: 2 }}>
              {t("parents.parent")}
              <Text as="span" sx={{ color: "indigo", ml: 1 }}>
                *
              </Text>
            </Label>
            <Flex sx={{ gap: 3, alignItems: "flex-start" }}>
              <Box sx={{ width: "70%", position: "relative" }}>
                <Input
                  placeholder={t("parents.parentsearchplaceholder")}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                {debouncedSearch.length >= 2 && (
                  <Box
                    sx={{
                      border: "1px solid",
                      borderColor: "border",
                      borderRadius: "8px",
                      mt: 2,
                      maxHeight: 200,
                      overflowY: "auto",
                      bg: "background",
                      position: "absolute",
                      width: "100%",
                      zIndex: 10,
                    }}
                  >
                    {parentLoading && <Text p={2}>Searching...</Text>}
                    {parentData?.parents?.edges?.map((e: any) => {
                      const p = e.node;
                      return (
                        <Box
                          key={p.id}
                          sx={{
                            p: 2,
                            cursor: "pointer",
                            "&:hover": { bg: "muted" },
                          }}
                          onClick={() => {
                            setSelectedParent(p);
                            setSearch("");
                          }}
                        >
                          <Text sx={{ fontWeight: 500 }}>
                            {p.firstName} {p.lastName}
                          </Text>
                          <Text sx={{ fontSize: 0, color: "gray" }}>
                            {p.phones?.[0]}
                          </Text>
                        </Box>
                      );
                    })}
                  </Box>
                )}
              </Box>
              <Button
                sx={{ width: "30%", height: "42px" }}
                onClick={() => setOpenParentModal(true)}
              >
                {t("students.addNewParent")}
              </Button>
            </Flex>
            {selectedParent && (
              <Text sx={{ mt: 2, color: "green", fontWeight: "medium" }}>
                ✓ Selected: {selectedParent.firstName} {selectedParent.lastName}
              </Text>
            )}
          </Box>
        </Box>

        {/* Section 3: Health Status Card */}
        <Box sx={{ mb: 5 }}>
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
              <LuHeart size={28} />
            </Box>
            <Text
              as="h2"
              sx={{ fontSize: 4, fontWeight: "bold", color: "text" }}
            >
              {t("students.healthStatus")}
            </Text>
          </Flex>

          {/* Health Card Container */}
          <Box
            sx={{
              border: "1px solid",
              borderColor: "border",
              borderRadius: "lg",
              p: 4,
              bg: "background",
            }}
          >
            <Flex
              sx={{
                alignItems: "center",
                justifyContent: "space-between",
                gap: 3,
              }}
            >
              {/* Text Information Column */}
              <Box sx={{ display: "flex", flexDirection: "column" }}>
                <Text sx={{ fontWeight: "bold", fontSize: 2, mb: 1 }}>
                  {t("students.healthCondition")}
                </Text>
                <Text sx={{ color: "gray", fontSize: 1 }}>
                  {" "}
                  {form.isSick
                    ? t("students.medicalconditionflagged")
                    : t("students.nohealthconditionsreported")}{" "}
                </Text>
              </Box>

              {/* Toggle Input Container */}
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <input
                  type="checkbox"
                  id="healthToggle"
                  checked={form.isSick}
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
            </Flex>

            {/* Conditional Details Input */}
            {form.isSick && (
              <Box
                sx={{
                  mt: 4,
                  pt: 3,
                  borderTop: "1px solid",
                  borderColor: "muted",
                }}
              >
                <Label htmlFor="healthNote" sx={{ fontWeight: "bold", mb: 2 }}>
                  {t("students.healthConditionDetails")} *
                </Label>
                <Input
                  id="healthNote"
                  placeholder={t("students.describecondition")}
                  value={form.healthNote}
                  onChange={(e) =>
                    setForm({ ...form, healthNote: e.target.value })
                  }
                  required
                />
              </Box>
            )}
          </Box>
        </Box>

        {/* Section 4: Action Rows */}
        <Flex
          sx={{
            gap: 3,
            mt: 5,
            pt: 3,
            borderTop: "1px solid",
            borderColor: "border",
          }}
        >
          <Button
            variant="secondary"
            onClick={() => setForm(form)}
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
            {loading ? t("students.creating") : t("dashboard.enrollStudent")}
          </Button>
        </Flex>

        <CreateParentModal
          open={openParentModal}
          onClose={() => setOpenParentModal(false)}
          onCreated={(parent: any) => setSelectedParent(parent)}
        />
      </Box>
    </Box>
  );
}
