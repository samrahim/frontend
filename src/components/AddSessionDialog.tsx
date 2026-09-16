import React, { useMemo, useState } from "react";
import {
  GetGroupDetailsCompleteDocument,
  useAddSubjectWithTeacherToGroupMutation,
  useClassRoomsQuery,
  useTeachersTableQuery,
} from "../graphql";
import { RRule } from "rrule";
import { useTranslation } from "react-i18next";
import { Label, Text } from "theme-ui";
import { Timepicker } from "timepicker-ui-react";
interface AssignTeacherDialogProps {
  isOpen: boolean;
  onClose: () => void;
  groupId: string;
  subjects: any[];
}

const AssignTeacherDialog: React.FC<AssignTeacherDialogProps> = ({
  isOpen,
  onClose,
  groupId,
  subjects,
}) => {
  const { t } = useTranslation();

  const [newSchedule, setNewSchedule] = useState({
    subjectId: "",
    dayOfWeek: [1] as number[],
    startDate: new Date().toISOString().split("T")[0],
    startTime: "10:00",
    endTime: "11:30",
    recurrenceType: "weekly" as "daily" | "weekly" | "monthly",
    endType: "count" as "count" | "until",
    count: "10",
    until: "",
    teacherId: "",
    teacher: null as any,
    classroomId: "",
  });

  const [teacherSearch, setTeacherSearch] = useState("");
  const [showTeacherDropdown, setShowTeacherDropdown] = useState(false);

  const { data: classes, loading: classesLoading } = useClassRoomsQuery();
  const classrooms =
    classes?.classRooms?.edges
      ?.map((edge) => edge?.node)
      .filter((node): node is NonNullable<typeof node> => Boolean(node)) ?? [];

  const searchFilter = teacherSearch.trim()
    ? {
        or: [
          { firstNameContains: teacherSearch },
          { lastNameContains: teacherSearch },
          { emailContains: teacherSearch },
        ],
      }
    : undefined;

  const { data: teachersData, loading: teachersLoading } =
    useTeachersTableQuery({
      variables: {
        offset: 0,
        limit: 10,
        where: teacherSearch.trim() ? searchFilter : undefined,
        withTotalCount: false,
      },
      skip: !isOpen || !showTeacherDropdown,
    });

  const filteredTeachers = useMemo(
    () =>
      teachersData?.teachersTable?.edges
        ?.map((edge) => edge?.node)
        .filter(Boolean) || [],
    [teachersData]
  );

  const [addsubjectwithTeacher, { loading: isSubmitting }] =
    useAddSubjectWithTeacherToGroupMutation({
      refetchQueries: [
        {
          query: GetGroupDetailsCompleteDocument,
          variables: { id: groupId || "" },
        },
      ],
      awaitRefetchQueries: true,
    });

  if (!isOpen) return null;

  const padZero = (val: string | number) => String(val).padStart(2, "0");

  const handleStartTimeChange = (data: any) =>
    setNewSchedule((prev) => ({
      ...prev,
      startTime: `${padZero(data.hour)}:${padZero(data.minutes)}`,
    }));

  const handleEndTimeChange = (data: any) =>
    setNewSchedule((prev) => ({
      ...prev,
      endTime: `${padZero(data.hour)}:${padZero(data.minutes)}`,
    }));

  const generateRRule = (
    daysOfWeek: number[],
    recurrenceType: "daily" | "weekly" | "monthly",
    endType: "count" | "until",
    count?: number,
    until?: Date
  ): string => {
    const rruleWeekdays = [
      RRule.SU,
      RRule.MO,
      RRule.TU,
      RRule.WE,
      RRule.TH,
      RRule.FR,
      RRule.SA,
    ];

    try {
      const rruleParams: Record<string, any> = {};

      switch (recurrenceType) {
        case "daily":
          rruleParams.freq = RRule.DAILY;
          break;
        case "weekly":
          rruleParams.freq = RRule.WEEKLY;
          rruleParams.byweekday = daysOfWeek.map((d) => rruleWeekdays[d]);
          break;
        case "monthly":
          rruleParams.freq = RRule.MONTHLY;
          rruleParams.byweekday = daysOfWeek.map((d) => rruleWeekdays[d]);
          break;
      }

      if (endType === "count" && count) rruleParams.count = count;
      else if (endType === "until" && until) rruleParams.until = until;

      const rawRRule =
        new RRule(rruleParams).toString().split("\n").pop() || "FREQ=WEEKLY";

      return rawRRule.startsWith("RRULE:") ? rawRRule : `RRULE:${rawRRule}`;
    } catch {
      return "RRULE:FREQ=WEEKLY";
    }
  };

  const handleDayToggle = (dayIndex: number) => {
    setNewSchedule((prev) => {
      const exists = prev.dayOfWeek.includes(dayIndex);
      const updatedDays = exists
        ? prev.dayOfWeek.filter((d) => d !== dayIndex)
        : [...prev.dayOfWeek, dayIndex];
      return {
        ...prev,
        dayOfWeek: updatedDays.length ? updatedDays : [dayIndex],
      };
    });
  };

  const handleAddSchedule = async () => {
    if (!newSchedule.subjectId || !newSchedule.teacherId) {
      alert("Subject and Teacher are required.");
      return;
    }

    const countValue = newSchedule.count
      ? parseInt(newSchedule.count, 10)
      : undefined;
    const untilDate = newSchedule.until
      ? new Date(newSchedule.until)
      : undefined;

    const rruleString = generateRRule(
      newSchedule.dayOfWeek,
      newSchedule.recurrenceType,
      newSchedule.endType,
      countValue,
      untilDate
    );

    const baseDate =
      newSchedule.startDate || new Date().toISOString().split("T")[0];
    const buildISO = (timeStr: string) => `${baseDate}T${timeStr}:00Z`;

    try {
      await addsubjectwithTeacher({
        variables: {
          input: {
            groupId,
            teacherId: newSchedule.teacherId,
            subjectId: newSchedule.subjectId,
            rrule: {
              rrule: rruleString,
              startTime: buildISO(newSchedule.startTime),
              endTime: buildISO(newSchedule.endTime),
              groupID: groupId,
              subjectID: newSchedule.subjectId,
              roomID: newSchedule.classroomId,
            },
          },
        },
      });

      onClose();
    } catch (error) {
      console.error("❌ Mutation failed:", error);
    }
  };

  const daysList = [
    { name: "Sun", id: 0 },
    { name: "Mon", id: 1 },
    { name: "Tue", id: 2 },
    { name: "Wed", id: 3 },
    { name: "Thu", id: 4 },
    { name: "Fri", id: 5 },
    { name: "Sat", id: 6 },
  ];

  return (
    <div style={styles.overlay}>
      <div style={styles.dialog}>
        {/* Header */}
        <div style={styles.header}>
          <div>
            <h3 style={styles.title}>Assign Subject & Teacher</h3>
            <p style={styles.subtitle}>
              Set up subject assignment and time schedule for group
            </p>
          </div>
          <button onClick={onClose} style={styles.closeBtn}>
            &times;
          </button>
        </div>

        {/* Body */}
        <div style={styles.body}>
          {/* Section 1: Subject, Teacher & Classroom Selection */}
          <div style={styles.gridTwoCols}>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Subject *</label>
              <select
                style={styles.input}
                value={newSchedule.subjectId}
                onChange={(e) =>
                  setNewSchedule({ ...newSchedule, subjectId: e.target.value })
                }
              >
                <option value="">Select Subject...</option>
                {subjects?.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name}
                  </option>
                ))}
              </select>
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.label}>Teacher *</label>
              {newSchedule.teacher ? (
                <div style={styles.selectedTeacherBadge}>
                  <span>
                    {newSchedule.teacher.firstName}{" "}
                    {newSchedule.teacher.lastName}
                  </span>
                  <button
                    type="button"
                    style={styles.removeTeacherBtn}
                    onClick={() =>
                      setNewSchedule({
                        ...newSchedule,
                        teacherId: "",
                        teacher: null,
                      })
                    }
                  >
                    &times;
                  </button>
                </div>
              ) : (
                <div style={{ position: "relative" }}>
                  <input
                    type="text"
                    style={styles.input}
                    placeholder="Search Teacher..."
                    value={teacherSearch}
                    onChange={(e) => {
                      setTeacherSearch(e.target.value);
                      setShowTeacherDropdown(true);
                    }}
                    onFocus={() => setShowTeacherDropdown(true)}
                  />
                  {showTeacherDropdown && (
                    <div style={styles.dropdown}>
                      {teachersLoading ? (
                        <div style={styles.dropdownItem}>Loading...</div>
                      ) : filteredTeachers.length > 0 ? (
                        filteredTeachers.map((t: any) => (
                          <div
                            key={t.id}
                            style={styles.dropdownItem}
                            onClick={() => {
                              setNewSchedule({
                                ...newSchedule,
                                teacherId: t.id,
                                teacher: t,
                              });
                              setShowTeacherDropdown(false);
                              setTeacherSearch("");
                            }}
                          >
                            {t.firstName} {t.lastName} ({t.email})
                          </div>
                        ))
                      ) : (
                        <div style={styles.dropdownItem}>No teachers found</div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Classroom Selection */}
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Classroom</label>
            <select
              style={styles.input}
              value={newSchedule.classroomId}
              onChange={(e) =>
                setNewSchedule({ ...newSchedule, classroomId: e.target.value })
              }
            >
              <option value="">Select Classroom...</option>
              {classrooms.map((room) => (
                <option key={room.id} value={room.id}>
                  {room.name}
                </option>
              ))}
            </select>
          </div>

          <hr style={styles.divider} />

          {/* Section 2: Timing & Frequency */}
          <div style={styles.gridTwoCols}>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Start Date</label>
              <input
                type="date"
                style={styles.input}
                value={newSchedule.startDate}
                onChange={(e) =>
                  setNewSchedule({ ...newSchedule, startDate: e.target.value })
                }
              />
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.label}>Recurrence</label>
              <select
                style={styles.input}
                value={newSchedule.recurrenceType}
                onChange={(e) =>
                  setNewSchedule({
                    ...newSchedule,
                    recurrenceType: e.target.value as any,
                  })
                }
              >
                <option value="weekly">Weekly</option>
                <option value="daily">Daily</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
          </div>

          {/* Start Time & End Time using Custom Timepicker */}
          <div style={styles.gridTwoCols}>
            <div style={styles.fieldGroup}>
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
            </div>

            <div style={styles.fieldGroup}>
              <Label
                htmlFor="scheduleEndTime"
                sx={{ fontWeight: "bold", mb: 2 }}
              >
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
            </div>
          </div>

          {/* Weekday Selector */}
          {newSchedule.recurrenceType !== "daily" && (
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Repeat On Days</label>
              <div style={styles.daysContainer}>
                {daysList.map((day) => {
                  const isSelected = newSchedule.dayOfWeek.includes(day.id);
                  return (
                    <button
                      key={day.id}
                      type="button"
                      onClick={() => handleDayToggle(day.id)}
                      style={{
                        ...styles.dayBadge,
                        backgroundColor: isSelected ? "#2563eb" : "#f1f5f9",
                        color: isSelected ? "#fff" : "#475569",
                      }}
                    >
                      {day.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* End Condition */}
          <div style={styles.gridTwoCols}>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>End Condition</label>
              <select
                style={styles.input}
                value={newSchedule.endType}
                onChange={(e) =>
                  setNewSchedule({
                    ...newSchedule,
                    endType: e.target.value as any,
                  })
                }
              >
                <option value="count">Number of Sessions</option>
                <option value="until">Until Date</option>
              </select>
            </div>

            <div style={styles.fieldGroup}>
              {newSchedule.endType === "count" ? (
                <>
                  <label style={styles.label}>Sessions Count</label>
                  <input
                    type="number"
                    style={styles.input}
                    value={newSchedule.count}
                    placeholder="e.g. 10"
                    onChange={(e) =>
                      setNewSchedule({ ...newSchedule, count: e.target.value })
                    }
                  />
                </>
              ) : (
                <>
                  <label style={styles.label}>Until Date</label>
                  <input
                    type="date"
                    style={styles.input}
                    value={newSchedule.until}
                    onChange={(e) =>
                      setNewSchedule({ ...newSchedule, until: e.target.value })
                    }
                  />
                </>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={styles.footer}>
          <button type="button" onClick={onClose} style={styles.cancelBtn}>
            Cancel
          </button>
          <button
            type="button"
            onClick={handleAddSchedule}
            disabled={isSubmitting}
            style={styles.submitBtn}
          >
            {isSubmitting ? "Saving..." : "Assign & Create Schedule"}
          </button>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(15, 23, 42, 0.55)",
    backdropFilter: "blur(4px)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1100,
  },
  dialog: {
    backgroundColor: "#ffffff",
    borderRadius: "12px",
    width: "100%",
    maxWidth: "580px",
    boxShadow:
      "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
    display: "flex",
    flexDirection: "column",
    maxHeight: "90vh",
    overflow: "hidden",
  },
  header: {
    padding: "20px 24px",
    borderBottom: "1px solid #e2e8f0",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  title: {
    margin: 0,
    fontSize: "18px",
    fontWeight: 600,
    color: "#0f172a",
  },
  subtitle: {
    margin: "4px 0 0 0",
    fontSize: "13px",
    color: "#64748b",
  },
  closeBtn: {
    background: "none",
    border: "none",
    fontSize: "22px",
    cursor: "pointer",
    color: "#94a3b8",
  },
  body: {
    padding: "20px 24px",
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  gridTwoCols: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "16px",
  },
  fieldGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  label: {
    fontSize: "13px",
    fontWeight: 500,
    color: "#334155",
  },
  input: {
    width: "100%",
    padding: "9px 12px",
    borderRadius: "6px",
    border: "1px solid #cbd5e1",
    fontSize: "14px",
    outline: "none",
    boxSizing: "border-box",
  },
  dropdown: {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    border: "1px solid #cbd5e1",
    borderRadius: "6px",
    marginTop: "4px",
    maxHeight: "180px",
    overflowY: "auto",
    zIndex: 10,
    boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
  },
  dropdownItem: {
    padding: "10px 12px",
    cursor: "pointer",
    fontSize: "13px",
    borderBottom: "1px solid #f1f5f9",
  },
  selectedTeacherBadge: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "8px 12px",
    backgroundColor: "#eff6ff",
    border: "1px solid #bfdbfe",
    borderRadius: "6px",
    color: "#1e40af",
    fontSize: "14px",
    fontWeight: 500,
  },
  removeTeacherBtn: {
    background: "none",
    border: "none",
    color: "#1e40af",
    fontSize: "18px",
    cursor: "pointer",
  },
  daysContainer: {
    display: "flex",
    gap: "6px",
    flexWrap: "wrap",
  },
  dayBadge: {
    padding: "6px 12px",
    borderRadius: "6px",
    border: "none",
    fontSize: "12px",
    fontWeight: 600,
    cursor: "pointer",
  },
  divider: {
    border: 0,
    borderTop: "1px solid #f1f5f9",
    margin: "4px 0",
  },
  footer: {
    padding: "16px 24px",
    borderTop: "1px solid #e2e8f0",
    display: "flex",
    justifyContent: "flex-end",
    gap: "12px",
    backgroundColor: "#f8fafc",
  },
  cancelBtn: {
    padding: "9px 16px",
    borderRadius: "6px",
    border: "1px solid #cbd5e1",
    backgroundColor: "#fff",
    color: "#475569",
    cursor: "pointer",
    fontWeight: 500,
  },
  submitBtn: {
    padding: "9px 18px",
    borderRadius: "6px",
    border: "none",
    backgroundColor: "#2563eb",
    color: "#fff",
    cursor: "pointer",
    fontWeight: 500,
  },
};

export default AssignTeacherDialog;
