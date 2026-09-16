import { LuHourglass } from "react-icons/lu";
import { Box, Text, Select, Button, Flex, Label, Input } from "theme-ui";
import { Timepicker } from "timepicker-ui-react";

type TimeData = {
  hour?: string;
  minutes?: string;
  type?: string;
};

type Props = {
  formData: any;
  newSchedule: any;
  teacherSearch: string;
  classrooms: any[];
  showTeacherDropdown: boolean;
  subjects: any[];
  handleTeacherSearch: (value: string) => void;
  handleSelectTeacher: (teacher: any) => void;
  handleRemoveTeacher: () => void;
  setShowTeacherDropdown: (value: boolean) => void;
  filteredTeachers: any[];
  teachersLoading: boolean;
  handleNewScheduleChange: (
    e:
      | React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
      | { target: { name: string; value: any } }
  ) => void;
  handleStartTimeChange: (data: TimeData) => void;
  handleEndTimeChange: (data: TimeData) => void;
  handleAddSchedule: () => void;
  handleRemoveSchedule: (id: string) => void;
  setPreviewScheduleId: (id: string | null) => void;
  getOccurrenceCount: (value: string) => number;
  t: (key: string) => string;
  classroomsLoading: boolean;
  showStartDate?: boolean;
};

const WEEKDAYS = [
  { value: 0, labelKey: "groups.sunday", short: "groups.sunday" },
  { value: 1, labelKey: "groups.monday", short: "groups.shortmonday" },
  { value: 2, labelKey: "groups.tuesday", short: "groups.shorttuesday" },
  { value: 3, labelKey: "groups.wednesday", short: "groups.shortwednesday" },
  { value: 4, labelKey: "groups.thursday", short: "groups.shortthursday" },
  { value: 5, labelKey: "groups.friday", short: "groups.shortfriday" },
  { value: 6, labelKey: "groups.saturday", short: "groups.shortsaturday" },
];

export function ScheduleSection({
  formData,
  newSchedule,
  subjects,
  handleNewScheduleChange,
  handleAddSchedule,
  handleRemoveSchedule,
  setPreviewScheduleId,
  getOccurrenceCount,
  handleStartTimeChange,
  handleEndTimeChange,
  teacherSearch,
  showTeacherDropdown,
  filteredTeachers,
  teachersLoading,
  handleTeacherSearch,
  handleSelectTeacher,
  handleRemoveTeacher,
  setShowTeacherDropdown,
  classroomsLoading,
  classrooms,
  t,
  showStartDate = false,
}: Props) {
  // Toggle day selection for multi-day support
  const handleToggleDay = (dayValue: number) => {
    let currentDays: number[] = Array.isArray(newSchedule.dayOfWeek)
      ? [...newSchedule.dayOfWeek]
      : [Number(newSchedule.dayOfWeek)];

    if (currentDays.includes(dayValue)) {
      // Prevent unselecting if it's the last selected day
      if (currentDays.length > 1) {
        currentDays = currentDays.filter((d) => d !== dayValue);
      }
    } else {
      currentDays.push(dayValue);
      currentDays.sort((a, b) => a - b);
    }

    // Auto-switch recurrence type if all 7 days are selected
    if (currentDays.length === 7) {
      handleNewScheduleChange({
        target: { name: "recurrenceType", value: "daily" },
      });
    }

    handleNewScheduleChange({
      target: { name: "dayOfWeek", value: currentDays },
    });
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
      {/* HEADER SECTION */}
      <Box
        sx={{ mb: 4, pb: 3, borderBottom: "1px solid", borderColor: "border" }}
      >
        <Flex sx={{ alignItems: "center", gap: 3, mb: 1 }}>
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
            <LuHourglass size={28} />
          </Box>

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
              {t("groups.schedule")}
            </Text>
            <Text
              as="p"
              sx={{
                fontSize: 1,
                fontWeight: "normal",
                mt: 1,
              }}
            >
              {t("groups.scheduleDescription")}
            </Text>
          </Box>
        </Flex>
      </Box>

      {/* SCHEDULE CONFIGURATION FORM */}
      <Box sx={{ p: 0, mb: 4 }}>
        <Text as="h3" sx={{ fontSize: 3, fontWeight: "bold", mb: 4 }}>
          {t("groups.addSchedule")}
        </Text>

        {/* ROW 1: Subject Selector & Teacher Assignment */}
        <Flex sx={{ gap: 4, mb: 4, flexWrap: "wrap", alignItems: "flex-end" }}>
          {/* Subject Selector */}
          <Box sx={{ flex: 1, minWidth: "250px" }}>
            <Label htmlFor="scheduleSubject" sx={{ fontWeight: "bold", mb: 2 }}>
              {t("groups.subject")}
              <Text as="span" sx={{ color: "indigo", ml: 1 }}>
                *
              </Text>
            </Label>
            <Select
              id="scheduleSubject"
              name="subjectId"
              value={newSchedule.subjectId}
              onChange={handleNewScheduleChange}
              sx={{ height: "48px", boxSizing: "border-box" }}
            >
              <option value="">{t("groups.selectSubject")}</option>
              {subjects.map((subject) => (
                <option key={subject?.id} value={subject?.id || ""}>
                  {subject?.name}
                </option>
              ))}
            </Select>
          </Box>

          {/* Classroom Selector */}
          <Box sx={{ flex: 1, minWidth: "200px" }}>
            <Label
              htmlFor="scheduleClassroom"
              sx={{ fontWeight: "bold", mb: 2 }}
            >
              {t("groups.classroom") || "Classroom"}
              <Text as="span" sx={{ color: "indigo", ml: 1 }}>
                *
              </Text>
            </Label>
            <Select
              id="scheduleClassroom"
              name="classroomId"
              value={newSchedule.classroomId || ""}
              onChange={handleNewScheduleChange}
              disabled={classroomsLoading}
              sx={{ height: "48px", boxSizing: "border-box" }}
            >
              <option value="">
                {classroomsLoading
                  ? t("common.loading")
                  : t("groups.selectClassroom") || "Select Classroom"}
              </option>
              {classrooms.map((room: any) => (
                <option key={room.id} value={room.id}>
                  {room.name || `Room ${room.id}`}
                </option>
              ))}
            </Select>
          </Box>

          {/* Teacher Field */}
          <Box sx={{ flex: 1, minWidth: "250px" }}>
            <Label htmlFor="teacherSearch" sx={{ fontWeight: "bold", mb: 2 }}>
              {t("groups.assignTeacher")}
              <Text as="span" sx={{ color: "indigo", ml: 1 }}>
                *
              </Text>
            </Label>

            {newSchedule.teacher ? (
              <Box
                sx={{
                  p: 2,
                  px: 3,
                  bg: "muted",
                  borderRadius: "md",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  border: "1px solid",
                  borderColor: "border",
                  height: "48px",
                  boxSizing: "border-box",
                }}
              >
                <Box sx={{ overflow: "hidden" }}>
                  <Text
                    sx={{
                      fontWeight: "bold",
                      fontSize: 1,
                      whiteSpace: "nowrap",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {newSchedule.teacher.firstName}{" "}
                    {newSchedule.teacher.lastName}
                  </Text>
                </Box>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleRemoveTeacher}
                  title={t("common.remove")}
                  sx={{ px: 2, py: 1, fontSize: 0, minHeight: "auto" }}
                >
                  ✕
                </Button>
              </Box>
            ) : (
              <Box sx={{ position: "relative" }}>
                <Input
                  type="text"
                  id="teacherSearch"
                  placeholder={t("groups.searchTeacher")}
                  value={teacherSearch}
                  onChange={(e) => handleTeacherSearch(e.target.value)}
                  onFocus={() => setShowTeacherDropdown(true)}
                  sx={{ height: "48px", boxSizing: "border-box" }}
                />

                {showTeacherDropdown && (
                  <Box
                    sx={{
                      position: "absolute",
                      top: "100%",
                      left: 0,
                      right: 0,
                      bg: "background",
                      border: "1px solid",
                      borderColor: "border",
                      borderRadius: "md",
                      mt: 1,
                      zIndex: 999,
                      maxHeight: "200px",
                      overflowY: "auto",
                      boxShadow: "md",
                    }}
                  >
                    {teachersLoading && (
                      <Box sx={{ p: 2, textAlign: "center" }}>
                        <Text>{t("common.loading")}</Text>
                      </Box>
                    )}

                    {!teachersLoading &&
                      filteredTeachers.length > 0 &&
                      filteredTeachers.map((teacher) => (
                        <Box
                          key={teacher.id}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleSelectTeacher(teacher);
                          }}
                          sx={{
                            p: 2,
                            cursor: "pointer",
                            borderBottom: "1px solid",
                            borderColor: "border",
                            "&:hover": { bg: "muted" },
                          }}
                        >
                          <Text sx={{ fontWeight: "bold", fontSize: 1 }}>
                            {teacher.firstName} {teacher.lastName}
                          </Text>
                          <Text sx={{ fontSize: 0, color: "muted" }}>
                            {teacher.email}
                          </Text>
                        </Box>
                      ))}

                    {!teachersLoading && filteredTeachers.length === 0 && (
                      <Box sx={{ p: 2, textAlign: "center", color: "muted" }}>
                        <Text>{t("groups.noTeachersFound")}</Text>
                      </Box>
                    )}
                  </Box>
                )}
              </Box>
            )}
          </Box>
        </Flex>

        {/* ROW 2: Start Date, Recurrence, Multi-Day Buttons, Start & End Time */}
        <Flex sx={{ gap: 4, mb: 4, flexWrap: "wrap", alignItems: "flex-end" }}>
          {showStartDate && (
            <Box sx={{ flex: 1, minWidth: "150px" }}>
              <Label htmlFor="startDate" sx={{ fontWeight: "bold", mb: 2 }}>
                {t("groups.startDate") || "Course Start Date"}
              </Label>
              <Input
                type="date"
                id="startDate"
                name="startDate"
                value={newSchedule.startDate || ""}
                onChange={handleNewScheduleChange}
                onClick={(e) =>
                  (e.currentTarget as HTMLInputElement).showPicker?.()
                }
                sx={{
                  height: "48px",
                  width: "100%",
                  boxSizing: "border-box",
                  cursor: "pointer",
                }}
              />
            </Box>
          )}

          <Box sx={{ flex: 1, minWidth: "150px" }}>
            <Label htmlFor="recurrenceType" sx={{ fontWeight: "bold", mb: 2 }}>
              {t("groups.recurrence")}
              <Text as="span" sx={{ color: "indigo", ml: 1 }}>
                *
              </Text>
            </Label>
            <Select
              id="recurrenceType"
              name="recurrenceType"
              value={newSchedule.recurrenceType}
              onChange={handleNewScheduleChange}
              sx={{ height: "48px", boxSizing: "border-box" }}
            >
              <option value="daily">{t("groups.recurrenceDaily")}</option>
              <option value="weekly">{t("groups.recurrenceWeekly")}</option>
              <option value="monthly">{t("groups.recurrenceMonthly")}</option>
            </Select>
          </Box>

          {/* MULTI-DAY SELECTION PILLS */}
          {newSchedule.recurrenceType !== "daily" && (
            <Box sx={{ flex: 2, minWidth: "280px" }}>
              <Label sx={{ fontWeight: "bold", mb: 2 }}>
                {t("groups.dayOfWeek")}
                <Text as="span" sx={{ color: "indigo", ml: 1 }}>
                  *
                </Text>
              </Label>
              <Flex sx={{ gap: 1, flexWrap: "nowrap" }}>
                {WEEKDAYS.map((day) => {
                  const isSelected = Array.isArray(newSchedule.dayOfWeek)
                    ? newSchedule.dayOfWeek.includes(day.value)
                    : Number(newSchedule.dayOfWeek) === day.value;

                  return (
                    <Box
                      key={day.value}
                      onClick={() => handleToggleDay(day.value)}
                      title={t(day.labelKey)}
                      sx={{
                        flex: 1,
                        height: "48px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: "md",
                        border: "1px solid",
                        borderColor: isSelected ? "indigo" : "border",
                        bg: isSelected
                          ? "rgba(79, 70, 229, 0.12)"
                          : "background",
                        color: isSelected ? "indigo" : "text",
                        fontWeight: isSelected ? "bold" : "normal",
                        fontSize: 0,
                        cursor: "pointer",
                        userSelect: "none",
                        transition: "all 0.15s ease",
                        "&:hover": {
                          borderColor: "indigo",
                          bg: isSelected ? "rgba(79, 70, 229, 0.2)" : "muted",
                        },
                      }}
                    >
                      {t(day.short)}
                    </Box>
                  );
                })}
              </Flex>
            </Box>
          )}

          <Box
            sx={{
              flex: 1,
              minWidth: "150px",
              "& input": {
                width: "100%",
                height: "48px",
                boxSizing: "border-box",
                padding: "10px 12px",
                borderRadius: "default",
                border: "1px solid",
                borderColor: "border",
                backgroundColor: "background",
                color: "text",
                fontSize: 2,
                cursor: "pointer",
              },
              "& input:focus": {
                outline: "none",
                borderColor: "primary",
              },
            }}
          >
            <Label
              htmlFor="scheduleStartTime"
              sx={{ fontWeight: "bold", mb: 2 }}
            >
              {t("groups.startTime")}
              <Text as="span" sx={{ color: "indigo", ml: 1 }}>
                *
              </Text>
            </Label>
            <Timepicker
              id="scheduleStartTime"
              placeholder="Select time"
              options={{ clock: { type: "24h" } }}
              value={newSchedule.startTime}
              onUpdate={handleStartTimeChange}
            />
          </Box>

          <Box
            sx={{
              flex: 1,
              minWidth: "150px",
              "& input": {
                width: "100%",
                height: "48px",
                boxSizing: "border-box",
                padding: "10px 12px",
                borderRadius: "default",
                border: "1px solid",
                borderColor: "border",
                backgroundColor: "background",
                color: "text",
                fontSize: 2,
                cursor: "pointer",
              },
              "& input:focus": {
                outline: "none",
                borderColor: "primary",
              },
            }}
          >
            <Label htmlFor="scheduleEndTime" sx={{ fontWeight: "bold", mb: 2 }}>
              {t("groups.endTime")}
              <Text as="span" sx={{ color: "indigo", ml: 1 }}>
                *
              </Text>
            </Label>
            <Timepicker
              id="scheduleEndTime"
              placeholder="Select time"
              options={{ clock: { type: "24h" } }}
              value={newSchedule.endTime}
              onUpdate={handleEndTimeChange}
            />
          </Box>
        </Flex>

        {/* ROW 3: Condition Selection */}
        <Box sx={{ mb: 4 }}>
          <Label sx={{ fontWeight: "bold", mb: 2 }}>
            {t("groups.endConditionTitle") || "When should this schedule end?"}
            <Text as="span" sx={{ color: "indigo", ml: 1 }}>
              *
            </Text>
          </Label>

          <Flex
            sx={{
              border: "1px solid",
              borderColor: "border",
              borderRadius: "md",
              overflow: "hidden",
              width: "100%",
              bg: "white",
            }}
          >
            <Box
              onClick={() =>
                handleNewScheduleChange({
                  target: { name: "endType", value: "count" },
                } as any)
              }
              sx={{
                flex: 1,
                py: 3,
                textAlign: "center",
                fontWeight: "bold",
                fontSize: 1,
                cursor: "pointer",
                bg:
                  newSchedule.endType === "count"
                    ? "rgba(79, 70, 229, 0.1)"
                    : "white",
                color: newSchedule.endType === "count" ? "indigo" : "gray",
                transition: "all 0.2s ease",
                "&:hover": {
                  bg:
                    newSchedule.endType === "count"
                      ? "rgba(79, 70, 229, 0.15)"
                      : "muted",
                },
              }}
            >
              {t("groups.endTypeCount") || "After N sessions"}
            </Box>

            <Box sx={{ width: "1px", bg: "border", alignSelf: "stretch" }} />

            <Box
              onClick={() =>
                handleNewScheduleChange({
                  target: { name: "endType", value: "until" },
                } as any)
              }
              sx={{
                flex: 1,
                py: 3,
                textAlign: "center",
                fontWeight: "bold",
                fontSize: 1,
                cursor: "pointer",
                bg:
                  newSchedule.endType === "until"
                    ? "rgba(79, 70, 229, 0.1)"
                    : "white",
                color: newSchedule.endType === "until" ? "indigo" : "gray",
                transition: "all 0.2s ease",
                "&:hover": {
                  bg:
                    newSchedule.endType === "until"
                      ? "rgba(79, 70, 229, 0.15)"
                      : "muted",
                },
              }}
            >
              {t("groups.endTypeUntil") || "Pick End date"}
            </Box>
          </Flex>
        </Box>

        {/* ROW 4: Dynamic End Metric Input */}
        <Flex sx={{ gap: 4, mb: 4, flexWrap: "wrap" }}>
          {newSchedule.endType === "count" ? (
            <Box sx={{ flex: 1, width: "100%" }}>
              <Label htmlFor="count" sx={{ fontWeight: "bold", mb: 2 }}>
                {t("groups.numberOfSessions")}
                <Text as="span" sx={{ color: "indigo", ml: 1 }}>
                  *
                </Text>
              </Label>
              <Input
                type="number"
                id="count"
                name="count"
                value={newSchedule.count}
                onChange={handleNewScheduleChange}
                placeholder={t("groups.enterNumberOfSessions")}
                min="1"
                sx={{ height: "48px", boxSizing: "border-box" }}
              />
            </Box>
          ) : (
            <Box sx={{ flex: 1, width: "100%" }}>
              <Label htmlFor="until" sx={{ fontWeight: "bold", mb: 2 }}>
                {t("groups.endDate")}
                <Text as="span" sx={{ color: "indigo", ml: 1 }}>
                  *
                </Text>
              </Label>
              <Input
                type="date"
                id="until"
                name="until"
                value={newSchedule.until}
                onChange={handleNewScheduleChange}
                onClick={(e) =>
                  (e.currentTarget as HTMLInputElement).showPicker?.()
                }
                sx={{
                  height: "48px",
                  width: "100%",
                  boxSizing: "border-box",
                  cursor: "pointer",
                }}
              />
            </Box>
          )}
        </Flex>

        {/* Add Schedule Button */}
        <Button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleAddSchedule();
          }}
          sx={{
            px: 4,
            py: 2,
            fontSize: 2,
            fontWeight: "bold",
            color: "success",
            bg: "transparent",
            border: "2px solid",
            borderColor: "success",
            borderRadius: "md",
            cursor: "pointer",
            transition: "all 0.2s ease",
            "&:hover": {
              bg: "success",
              color: "background",
            },
          }}
        >
          {t("groups.addScheduleButton")}
        </Button>
      </Box>

      {/* LIST OF SCHEDULES TABLE */}
      {formData.schedules.length > 0 && (
        <Box sx={{ mb: 4, mt: 5, overflowX: "auto" }}>
          <Text as="h3" sx={{ fontSize: 3, fontWeight: "bold", mb: 3 }}>
            {t("groups.scheduledSessions")} ({formData.schedules.length})
          </Text>
          <Box
            as="table"
            sx={{
              width: "100%",
              borderCollapse: "collapse",
              "& thead": {
                bg: "tableHeaderBackground",
                "& th": {
                  px: 2,
                  py: 2,
                  textAlign: "left",
                  fontSize: 1,
                  fontWeight: "bold",
                  color: "tableHeaderText",
                  borderBottom: "2px solid",
                  borderColor: "tableBorder",
                },
              },
              "& tbody tr": {
                borderBottom: "1px solid",
                borderColor: "tableBorder",
                "&:hover": { bg: "tableRowHover" },
              },
              "& td": { px: 2, py: 2, color: "tableText", fontSize: 1 },
            }}
          >
            <thead>
              <tr>
                <th>{t("groups.subject")}</th>
                <th>{t("groups.dayOfWeek")}</th>
                <th>{t("groups.time")}</th>
                <th>{t("groups.rrule")}</th>
                <th>{t("groups.totalSessions")}</th>
                <th>{t("common.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {formData.schedules.map((schedule: any) => (
                <tr key={schedule.id}>
                  <td>{schedule.subjectName}</td>
                  <td>{schedule.dayName}</td>
                  <td>
                    {schedule.startTime} - {schedule.endTime}
                  </td>
                  <td style={{ fontSize: "12px" }}>
                    {schedule.recurrenceText}
                  </td>
                  <td>
                    {getOccurrenceCount(schedule.rrule)} {t("groups.sessions")}
                  </td>
                  <td>
                    <Button
                      variant="info"
                      type="button"
                      onClick={() => setPreviewScheduleId(schedule.id)}
                      mr={2}
                      sx={{ px: 2, py: 1, fontSize: 0 }}
                      title={t("groups.previewSchedule")}
                    >
                      {t("groups.preview")}
                    </Button>
                    <Button
                      type="button"
                      variant="danger"
                      onClick={() => handleRemoveSchedule(schedule.id)}
                      sx={{ px: 2, py: 1, fontSize: 0 }}
                    >
                      {t("common.delete")}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Box>
        </Box>
      )}

      {formData.schedules.length === 0 && (
        <Box
          sx={{
            p: 3,
            bg: "muted",
            borderRadius: "md",
            textAlign: "center",
            color: "text",
            mt: 4,
          }}
        >
          <Text>{t("groups.noSchedulesAdded")}</Text>
        </Box>
      )}
    </Box>
  );
}
