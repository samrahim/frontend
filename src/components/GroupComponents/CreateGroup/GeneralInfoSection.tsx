import { Box, Flex, Input, Label, Select, Text } from "theme-ui";

import { LuGraduationCap } from "react-icons/lu";
import dayjs, { Dayjs } from "dayjs";
import DatePicker from "react-datepicker";

type Props = {
  academicYears: any[];

  groupTypes: any[];
  formData: any;
  selectedTeacher: any;
  teacherSearch: string;
  showTeacherDropdown: boolean;

  handleInputChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => void;

  handleColorChange: (e: React.ChangeEvent<HTMLInputElement>) => void;

  t: (key: string) => string;
};
export function GeneralInfoSection({
  formData,
  academicYears,
  handleInputChange,
  handleColorChange,
  t,
}: Props) {
  const selectedDate = formData.startDate
    ? dayjs(formData.startDate).toDate()
    : null;
  const handleDateChange = (date: Date | null) => {
    const formattedString = date ? dayjs(date).format("YYYY-MM-DD") : "";

    handleInputChange({
      target: {
        name: "startDate",
        value: formattedString,
      },
    } as React.ChangeEvent<HTMLInputElement>);
  };
  return (
    <Box
      sx={{
        mb: 5,
        p: 4,
        border: "1px solid",
        borderColor: "border",
        borderRadius: "lg",
        boxShadow: "sm",
        bg: "background",
      }}
    >
      {/* --- CARD HEADER --- */}
      <Box
        sx={{ mb: 4, pb: 3, borderBottom: "1px solid", borderColor: "border" }}
      >
        <Flex sx={{ alignItems: "center", gap: 3, mb: 1 }}>
          {/* Graduation Cap Icon Container */}
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
            <LuGraduationCap size={28} />
          </Box>

          {/* Text Headers Group */}
          <Box>
            <Text
              as="h2"
              sx={{
                fontSize: 4,
                fontWeight: "bold",
                lineHeight: "heading",
                color: "text",
              }}
            >
              {t("session.groupDetails")}
            </Text>
            <Text
              as="p"
              sx={{
                fontSize: 1,
                fontWeight: "normal",

                mt: 1,
              }}
            >
              {t("groups.generalInfoDescription")}
            </Text>
          </Box>
        </Flex>
      </Box>

      {/* Group Name */}
      <Box sx={{ mb: 4 }}>
        <Label htmlFor="name" sx={{ fontWeight: "bold", mb: 2 }}>
          {t("groups.groupName")}
          <Text as="span" sx={{ color: "indigo", ml: 1 }}>
            *
          </Text>
        </Label>

        <Input
          id="name"
          name="name"
          value={formData.name}
          onChange={handleInputChange}
          placeholder={t("groups.namePlaceholder")}
          required
        />
      </Box>

      {/* Date */}

      <Box
        sx={{
          paddingBottom: 4,
          flex: 1,
          width: "100%",
          // Target the react-datepicker wrapper element specifically
          "& .react-datepicker-wrapper": {
            width: "100%",
          },
          "& .react-datepicker__input-container": {
            width: "100%",
          },
        }}
      >
        <Label htmlFor="startDate" sx={{ fontWeight: "bold", mb: 2 }}>
          {t("groups.startDate")}
          <Text as="span" sx={{ color: "indigo", ml: 1 }}>
            *
          </Text>
        </Label>

        <DatePicker
          id="startDate"
          name="startDate"
          selected={selectedDate}
          onChange={handleDateChange}
          dateFormat="dd/MM/yyyy"
          minDate={new Date()}
          required
          customInput={
            <Input
              sx={{
                height: "48px",
                boxSizing: "border-box",
                py: 2,
                borderColor: "border",
                width: "100%",
                cursor: "pointer",
              }}
            />
          }
        />
      </Box>

      {/* Academic Year */}
      <Flex sx={{ gap: 4, mb: 4, flexWrap: "wrap" }}>
        <Box sx={{ flex: 1, alignItems: "center", minWidth: "250px" }}>
          <Label
            htmlFor="academicYearId"
            sx={{ width: "auto", fontWeight: "bold", mb: 2 }}
          >
            {t("groups.academicYear")}
            <Text as="span" sx={{ color: "indigo", ml: 1 }}>
              *
            </Text>
          </Label>

          <Select
            id="academicYearId"
            name="academicYearId"
            value={formData.academicYearId}
            onChange={handleInputChange}
            required
            sx={{
              height: "48px",
              boxSizing: "border-box",
              py: 2,
              borderColor: "border",
              width: "100%",
            }}
          >
            <option value="">{t("groups.selectAcademicYear")}</option>
            {academicYears.map((year) => (
              <option key={year?.id} value={year?.id || ""}>
                {year?.name}
              </option>
            ))}
          </Select>
        </Box>
      </Flex>

      {/* Visual Identity / Color Picker */}
      <Box sx={{ mb: 3 }}>
        <Label htmlFor="color" sx={{ mb: 2, fontWeight: "bold" }}>
          {t("groups.groupColor")}
        </Label>

        {/* TOP ROW: Presets + Icon Picker */}
        <Flex sx={{ gap: 2, alignItems: "center", flexWrap: "wrap", mb: 3 }}>
          {[
            "#4CAF50",
            "#2196F3",
            "#9C27B0",
            "#FF9800",
            "#E91E63",
            "#00BCD4",
            "#3F51B5",
            "#009688",
            "#FFEB3B",
            "#795548",
          ].map((presetColor) => (
            <Box
              key={presetColor}
              onClick={() =>
                handleColorChange({ target: { value: presetColor } } as any)
              }
              sx={{
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                backgroundColor: presetColor,
                cursor: "pointer",
                border:
                  formData.color === presetColor ? "3px solid" : "1px solid",
                borderColor: formData.color === presetColor ? "text" : "muted",
                transition: "all 0.2s ease",
                "&:hover": { transform: "scale(1.1)" },
              }}
            />
          ))}

          {/* Inline Picker Element masquerading as an Icon */}
          <Box
            sx={{
              position: "relative",
              width: "32px",
              height: "32px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text sx={{ fontSize: 3, pointerEvents: "none", zIndex: 1 }}>
              🎨
            </Text>
            <Input
              type="color"
              id="color"
              name="color"
              value={formData.color}
              onChange={handleColorChange}
              sx={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                opacity: 0,
                cursor: "pointer",
              }}
            />
          </Box>
        </Flex>

        {/* BOTTOM ROW: Selected Color Preview Display */}
        <Flex
          sx={{
            alignItems: "center",
            gap: 3,
            p: 2,
            bg: "muted",
            borderRadius: "md",
            borderLeft: "6px solid",
            borderLeftColor: formData.color,
            maxWidth: "280px",
          }}
        >
          <Box
            sx={{
              width: "16px",
              height: "16px",
              borderRadius: "50%",
              bg: formData.color,
            }}
          />
          <Box>
            <Text
              sx={{
                fontSize: 0,
                color: "gray",
                display: "block",
                textTransform: "uppercase",
              }}
            >
              {t("groups.selectedColor") || "Selected Color"}
            </Text>
            <Text sx={{ fontFamily: "mono", fontWeight: "bold", fontSize: 1 }}>
              {formData.color.toUpperCase()}
            </Text>
          </Box>
        </Flex>
      </Box>
    </Box>
  );
}
