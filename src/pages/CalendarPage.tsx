import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Calendar, momentLocalizer, Event, View } from "react-big-calendar";
import moment from "moment";

import "react-big-calendar/lib/css/react-big-calendar.css";
import "./CalendarPage.css";
import { Layout } from "../components/Layout";
import { SessionDetailsModal } from "../components/SessionDetailsModal";
import type { Event as BigCalendarEvent } from "react-big-calendar";
import {
  useGetSessionsQuery,
  useGetSessionSubjectsQuery,
  useGetSessionGroupsQuery,
  useGetClassRoomsQuery,
} from "../graphql/generated";
import { Box, Button, Flex, Text, Input, Select } from "theme-ui";

const localizer = momentLocalizer(moment);

const normalizeHex = (color: number | string | null | undefined): string => {
  if (color === null || color === undefined) return "#16a34a";
  if (typeof color === "string") {
    let clean = color.trim();
    if (!clean.startsWith("#")) clean = "#" + clean;
    if (clean.length === 9) clean = clean.slice(0, 7);
    return /^#[0-9A-Fa-f]{6}$/.test(clean) ? clean : "#16a34a";
  }
  if (typeof color === "number") {
    const hex = color.toString(16).padStart(6, "0");
    return `#${hex}`;
  }
  return "#16a34a";
};

const getContrastingTextColor = (hexColor: string): string => {
  const hex = hexColor.replace("#", "");
  const r = parseInt(hex.substring(0, 2), 16) || 0;
  const g = parseInt(hex.substring(2, 4), 16) || 0;
  const b = parseInt(hex.substring(4, 6), 16) || 0;
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 128 ? "#1f2937" : "#ffffff";
};

/**
 * Parses server ISO strings directly as literal local dates without timezone conversion.
 */
const parseAsLiteralDate = (dateStr: string): Date => {
  if (!dateStr) return new Date();
  const match = dateStr.match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/
  );
  if (match) {
    const [, year, month, day, hours, minutes, seconds] = match;
    return new Date(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hours),
      Number(minutes),
      Number(seconds)
    );
  }
  return new Date(dateStr);
};

/**
 * Formats local JavaScript Date into RFC3339 string using direct literal numbers
 * instead of `.toISOString()` which forces UTC conversion.
 */
const toLiteralRFC3339Nano = (date: Date): string => {
  const pad = (num: number) => String(num).padStart(2, "0");
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());

  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.000000Z`;
};

interface CalendarEvent extends BigCalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  color: string;
  resource?: any;
}

interface CreateSessionSlot {
  start: Date;
  end: Date;
}

function CalendarPage() {
  const { t } = useTranslation();
  const [selectedSession, setSelectedSession] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [selectedSlot, setSelectedSlot] = useState<CreateSessionSlot | null>(
    null
  );
  const [dateRange, setDateRange] = useState({
    start: moment().startOf("month").toDate(),
    end: moment().endOf("month").toDate(),
  });

  const [sessionForm, setSessionForm] = useState({
    subjectId: "",
    groupId: "",
    classId: "",
    startTime: "08:00",
    endTime: "09:00",
    recurrenceType: "once",
    recurrenceEndType: "date",
    recurrenceEndDate: moment().add(1, "month").format("YYYY-MM-DD"),
    recurrenceCount: 10,
    durationMin: 60,
  });

  const [selectedWeekDays, setSelectedWeekDays] = useState<Set<string>>(
    new Set()
  );
  const [selectedMonthDays, setSelectedMonthDays] = useState<Set<number>>(
    new Set()
  );

  const { data: subjectsData } = useGetSessionSubjectsQuery();
  const { data: groupsData } = useGetSessionGroupsQuery({
    variables: { offset: 0, limit: 100, withTotalCount: false },
  });
  const { data: classRoomsData } = useGetClassRoomsQuery({
    variables: { first: 100 },
  });

  // Query variables using local RFC3339 formatter
  const { data, error, refetch } = useGetSessionsQuery({
    variables: {
      where: {
        startAtGTE: toLiteralRFC3339Nano(dateRange.start),
        startAtLTE: toLiteralRFC3339Nano(dateRange.end),
      },
    },
  });

  const events: CalendarEvent[] = (data?.sessions?.edges
    ?.map((edge) => {
      const node = edge?.node;
      if (!node) return null;

      return {
        id: node.id,
        title: node.schedule?.subject?.name || "Session",
        start: parseAsLiteralDate(node.startAt),
        end: parseAsLiteralDate(node.endAt),
        classroom: node.schedule?.room,
        resource: node,
        color: normalizeHex(node.schedule?.group?.color),
      } as CalendarEvent;
    })
    .filter((event): event is CalendarEvent => event !== null) ||
    []) as CalendarEvent[];

  const handleSelectEvent = (event: CalendarEvent) => {
    setSelectedSession(event.resource);
    setIsModalOpen(true);
  };

  const handleSelectSlot = (slotInfo: { start: Date; end: Date }) => {
    setSelectedSlot(slotInfo);

    const startTime = moment(slotInfo.start).format("HH:mm");
    const endTime = moment(slotInfo.end).format("HH:mm");
    setSessionForm((prev) => ({
      ...prev,
      startTime,
      endTime,
      durationMin: moment(slotInfo.end).diff(moment(slotInfo.start), "minutes"),
    }));
  };

  const handleNavigate = (date: Date, view: View) => {
    if (view === "day") {
      setDateRange({
        start: moment(date).startOf("day").toDate(),
        end: moment(date).endOf("day").toDate(),
      });
    } else if (view === "week") {
      setDateRange({
        start: moment(date).startOf("week").toDate(),
        end: moment(date).endOf("week").toDate(),
      });
    } else {
      setDateRange({
        start: moment(date).startOf("month").toDate(),
        end: moment(date).endOf("month").toDate(),
      });
    }
  };

  const handleRangeChange = (range: any) => {
    if (Array.isArray(range)) {
      setDateRange({
        start: moment(range[0]).startOf("day").toDate(),
        end: moment(range[range.length - 1])
          .endOf("day")
          .toDate(),
      });
    } else if (range.start && range.end) {
      setDateRange({
        start: range.start,
        end: range.end,
      });
    }
  };

  return (
    <Layout>
      {error && (
        <Box sx={{ p: 4, bg: "dangerLight", color: "danger" }}>
          {t("common.error")}: {error.message}
        </Box>
      )}

      <Box sx={{ flex: 1, overflow: "auto", height: "100%" }}>
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          step={30}
          timeslots={2}
          style={{ height: "100%" }}
          onSelectEvent={handleSelectEvent}
          onSelectSlot={handleSelectSlot}
          onNavigate={handleNavigate}
          onRangeChange={handleRangeChange}
          popup
          selectable
          views={["month", "week", "day", "agenda"]}
          defaultView="month"
          eventPropGetter={(event: CalendarEvent) => {
            const bgColor = event.color || "#16a34a";
            const textColor = getContrastingTextColor(bgColor);
            const isNearWhite = textColor === "#1f2937";

            return {
              style: {
                backgroundColor: bgColor,
                borderColor: isNearWhite ? "#d1d5db" : bgColor,
                color: textColor,
                borderRadius: "4px",
                fontWeight: isNearWhite ? 600 : 400,
              },
            };
          }}
        />
      </Box>

      <SessionDetailsModal
        session={selectedSession}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedSession(null);
        }}
      />
    </Layout>
  );
}

// export default CalendarPage;
{
  /* Create Session Modal */
}
{
  /* {isCreateSessionOpen && selectedSlot && (
        <Box
          sx={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            bg: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            overflowY: "auto",
          }}
          onClick={handleCloseCreateSession}
        >
          <Box
            sx={{
              bg: "background",
              p: 4,
              borderRadius: "lg",
              boxShadow: "0 10px 40px rgba(0, 0, 0, 0.2)",
              maxWidth: "600px",
              width: "90%",

              my: 4,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <Text as="h2" sx={{ fontSize: 3, fontWeight: "bold", mb: 4, m: 0 }}>
              {t("calendar.createSession")}
            </Text>

            
            <Box sx={{ mb: 4 }}>
              <Text sx={{ fontSize: 0, fontWeight: "bold", mb: 1 }}>
                {t("calendar.dateAndTime")}
              </Text>
              <Box sx={{ p: 2, bg: "muted", borderRadius: "md", mb: 2 }}>
                <Text sx={{ fontSize: 0 }}>
                  {moment(selectedSlot.start).format("MMMM DD, YYYY")}
                </Text>
              </Box>

              
              <Text sx={{ fontSize: 0, fontWeight: "bold", mb: 1 }}>
                {t("calendar.startTime")}
              </Text>
              <Input
                type="time"
                value={sessionForm.startTime}
                onChange={(e) => {
                  setSessionForm({ ...sessionForm, startTime: e.target.value });
                  // Update endTime if it's before startTime
                  if (e.target.value > sessionForm.endTime) {
                    setSessionForm((prev) => ({
                      ...prev,
                      startTime: e.target.value,
                      endTime: moment(e.target.value, "HH:mm")
                        .add(60, "minutes")
                        .format("HH:mm"),
                    }));
                  }
                }}
                sx={{
                  width: "100%",
                  p: 2,
                  border: "1px solid",
                  borderColor: "border",
                  borderRadius: "md",
                  fontSize: 1,
                  mb: 3,
                  "&:focus": {
                    outline: "none",
                    borderColor: "primary",
                  },
                }}
              />

             
              <Text sx={{ fontSize: 0, fontWeight: "bold", mb: 1 }}>
                {t("calendar.endTime")}
              </Text>
              <Input
                type="time"
                value={sessionForm.endTime}
                onChange={(e) => {
                  setSessionForm({ ...sessionForm, endTime: e.target.value });
                }}
                sx={{
                  width: "100%",
                  p: 2,
                  border: "1px solid",
                  borderColor: "border",
                  borderRadius: "md",
                  fontSize: 1,
                  mb: 3,
                  "&:focus": {
                    outline: "none",
                    borderColor: "primary",
                  },
                }}
              />
            </Box>

            
            <Box sx={{ mb: 3 }}>
              <Text sx={{ fontSize: 0, fontWeight: "bold", mb: 1 }}>
                {t("calendar.subjectRequired")}
              </Text>
              <Select
                value={sessionForm.subjectId}
                onChange={(e) =>
                  setSessionForm({ ...sessionForm, subjectId: e.target.value })
                }
                sx={{
                  width: "100%",
                  p: 2,
                  border: "1px solid",
                  borderColor: "border",
                  borderRadius: "md",
                  fontSize: 1,
                  "&:focus": {
                    outline: "none",
                    borderColor: "primary",
                  },
                }}
              >
                <option value="">{t("calendar.selectSubject")}</option>
                {(
                  subjectsData?.subjects?.edges?.map((edge) => edge?.node) || []
                ).map((subject: any) => (
                  <option key={subject?.id} value={subject?.id}>
                    {subject?.name}
                  </option>
                ))}
              </Select>
            </Box>

            <Box sx={{ mb: 3 }}>
              <Text sx={{ fontSize: 0, fontWeight: "bold", mb: 1 }}>
                {t("calendar.group")}
              </Text>
              <Select
                value={sessionForm.groupId}
                onChange={(e) =>
                  setSessionForm({ ...sessionForm, groupId: e.target.value })
                }
                sx={{
                  width: "100%",
                  p: 2,
                  border: "1px solid",
                  borderColor: "border",
                  borderRadius: "md",
                  fontSize: 1,
                  "&:focus": {
                    outline: "none",
                    borderColor: "primary",
                  },
                }}
              >
                <option value="">{t("calendar.selectGroup")}</option>
                {(
                  groupsData?.groupsTable?.edges?.map((edge) => edge?.node) ||
                  []
                ).map((group: any) => (
                  <option key={group?.id} value={group?.id}>
                    {group?.name}
                  </option>
                ))}
              </Select>
            </Box>

         
            <Box sx={{ mb: 3 }}>
              <Text sx={{ fontSize: 0, fontWeight: "bold", mb: 1 }}>
                {t("calendar.classroom")}
              </Text>
              <Select
                value={sessionForm.classId}
                onChange={(e) =>
                  setSessionForm({ ...sessionForm, classId: e.target.value })
                }
                sx={{
                  width: "100%",
                  p: 2,
                  border: "1px solid",
                  borderColor: "border",
                  borderRadius: "md",
                  fontSize: 1,
                  "&:focus": {
                    outline: "none",
                    borderColor: "primary",
                  },
                }}
              >
                <option value="">{t("calendar.selectClassroom")}</option>
                {(
                  classRoomsData?.classRooms?.edges?.map(
                    (edge) => edge?.node
                  ) || []
                ).map((room: any) => (
                  <option key={room?.id} value={room?.id}>
                    {room?.name}
                  </option>
                ))}
              </Select>
            </Box>

            
            <Box sx={{ mb: 3 }}>
              <Text sx={{ fontSize: 0, fontWeight: "bold", mb: 1 }}>
                {t("calendar.duration")}
              </Text>
              <Box sx={{ p: 2, bg: "muted", borderRadius: "md" }}>
                <Text sx={{ fontSize: 0 }}>
                  {moment(sessionForm.endTime, "HH:mm").diff(
                    moment(sessionForm.startTime, "HH:mm"),
                    "minutes"
                  )}{" "}
                  {t("groups.duration").toLowerCase()}
                </Text>
              </Box>
            </Box>

            
            <Box sx={{ mb: 3 }}>
              <Text sx={{ fontSize: 0, fontWeight: "bold", mb: 1 }}>
                {t("calendar.recurrence")}
              </Text>
              <Select
                value={sessionForm.recurrenceType}
                onChange={(e) => {
                  setSessionForm({
                    ...sessionForm,
                    recurrenceType: e.target.value,
                  });
                  // Reset day selections when changing recurrence type
                  setSelectedWeekDays(new Set());
                  setSelectedMonthDays(new Set());
                }}
                sx={{
                  width: "100%",
                  p: 2,
                  border: "1px solid",
                  borderColor: "border",
                  borderRadius: "md",
                  fontSize: 1,
                  "&:focus": {
                    outline: "none",
                    borderColor: "primary",
                  },
                }}
              >
                <option value="once">{t("calendar.recurrenceOnce")}</option>
                <option value="daily">{t("calendar.recurrenceDaily")}</option>
                <option value="weekly">{t("calendar.recurrenceWeekly")}</option>
                <option value="monthly">
                  {t("calendar.recurrenceMonthly")}
                </option>
              </Select>
            </Box>

          
            {sessionForm.recurrenceType === "weekly" && (
              <Box sx={{ mb: 3, p: 2, bg: "muted", borderRadius: "md" }}>
                <Text
                  sx={{
                    fontSize: 0,
                    fontWeight: "bold",
                    mb: 2,
                    color: "muted",
                  }}
                >
                  {t("calendar.repeatOnDays")}
                </Text>
                <Flex sx={{ flexWrap: "wrap", gap: 2 }}>
                  {["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"].map(
                    (day) => (
                      <Box
                        as="label"
                        key={day}
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                          cursor: "pointer",
                          fontSize: 0,
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={selectedWeekDays.has(day)}
                          onChange={(e) => {
                            const newDays = new Set(selectedWeekDays);
                            if (e.target.checked) {
                              newDays.add(day);
                            } else {
                              newDays.delete(day);
                            }
                            setSelectedWeekDays(newDays);
                          }}
                        />
                        {day}
                      </Box>
                    )
                  )}
                </Flex>
              </Box>
            )}

            {sessionForm.recurrenceType === "monthly" && (
              <Box sx={{ mb: 3, p: 2, bg: "muted", borderRadius: "md" }}>
                <Text
                  sx={{
                    fontSize: 0,
                    fontWeight: "bold",
                    mb: 2,
                    color: "muted",
                  }}
                >
                  {t("calendar.repeatOnDaysOfMonth")}
                </Text>
                <Flex sx={{ flexWrap: "wrap", gap: 1 }}>
                  {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                    <Box
                      as="label"
                      key={day}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "30px",
                        height: "30px",
                        border: "1px solid",
                        borderColor: selectedMonthDays.has(day)
                          ? "primary"
                          : "border",
                        borderRadius: "md",
                        cursor: "pointer",
                        bg: selectedMonthDays.has(day)
                          ? "primary"
                          : "transparent",
                        color: selectedMonthDays.has(day) ? "white" : "text",
                        fontSize: 0,
                        fontWeight: "bold",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedMonthDays.has(day)}
                        onChange={(e) => {
                          const newDays = new Set(selectedMonthDays);
                          if (e.target.checked) {
                            newDays.add(day);
                          } else {
                            newDays.delete(day);
                          }
                          setSelectedMonthDays(newDays);
                        }}
                        style={{ display: "none" }}
                      />
                      {day}
                    </Box>
                  ))}
                </Flex>
              </Box>
            )}

          
            {sessionForm.recurrenceType !== "once" && (
              <>
                <Box sx={{ mb: 3 }}>
                  <Text
                    sx={{
                      fontSize: 0,
                      fontWeight: "bold",
                      mb: 2,
                      color: "muted",
                    }}
                  >
                    {t("calendar.recurrenceEnds")}
                  </Text>
                  <Flex sx={{ gap: 2 }}>
                    <Box
                      as="label"
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        cursor: "pointer",
                        fontSize: 0,
                      }}
                    >
                      <input
                        type="radio"
                        name="endType"
                        value="date"
                        checked={sessionForm.recurrenceEndType === "date"}
                        onChange={(e) =>
                          setSessionForm({
                            ...sessionForm,
                            recurrenceEndType: e.target.value,
                          })
                        }
                      />
                      {t("calendar.endOnSpecificDate")}
                    </Box>
                    <Box
                      as="label"
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        cursor: "pointer",
                        fontSize: 0,
                      }}
                    >
                      <input
                        type="radio"
                        name="endType"
                        value="count"
                        checked={sessionForm.recurrenceEndType === "count"}
                        onChange={(e) =>
                          setSessionForm({
                            ...sessionForm,
                            recurrenceEndType: e.target.value,
                          })
                        }
                      />
                      {t("calendar.endAfterXSessions")}
                    </Box>
                  </Flex>
                </Box>

                {sessionForm.recurrenceEndType === "date" && (
                  <Box sx={{ mb: 3 }}>
                    <Text
                      sx={{
                        fontSize: 0,
                        fontWeight: "bold",
                        mb: 1,
                        color: "muted",
                      }}
                    >
                      {t("calendar.endDate")}
                    </Text>
                    <Input
                      type="date"
                      value={sessionForm.recurrenceEndDate}
                      onChange={(e) =>
                        setSessionForm({
                          ...sessionForm,
                          recurrenceEndDate: e.target.value,
                        })
                      }
                      sx={{
                        width: "100%",
                        p: 2,
                        border: "1px solid",
                        borderColor: "border",
                        borderRadius: "md",
                        fontSize: 1,
                        "&:focus": {
                          outline: "none",
                          borderColor: "primary",
                        },
                      }}
                    />
                  </Box>
                )}

                {sessionForm.recurrenceEndType === "count" && (
                  <Box sx={{ mb: 3 }}>
                    <Text
                      sx={{
                        fontSize: 0,
                        fontWeight: "bold",
                        mb: 1,
                        color: "muted",
                      }}
                    >
                      {t("calendar.numberOfSessions")}
                    </Text>
                    <Input
                      type="number"
                      value={sessionForm.recurrenceCount}
                      onChange={(e) =>
                        setSessionForm({
                          ...sessionForm,
                          recurrenceCount: Math.max(
                            1,
                            parseInt(e.target.value) || 1
                          ),
                        })
                      }
                      min="1"
                      max="365"
                      sx={{
                        width: "100%",
                        p: 2,
                        border: "1px solid",
                        borderColor: "border",
                        borderRadius: "md",
                        fontSize: 1,
                        "&:focus": {
                          outline: "none",
                          borderColor: "primary",
                        },
                      }}
                    />
                  </Box>
                )}
              </>
            )}

            
            <Flex sx={{ gap: 2, justifyContent: "flex-end" }}>
              <Button
                onClick={handleCloseCreateSession}
                disabled={creatingSession}
                sx={{
                  px: 4,
                  py: 2,
                  bg: "muted",
                  color: "text",
                  border: "none",
                  borderRadius: "md",
                  cursor: creatingSession ? "not-allowed" : "pointer",
                  fontSize: 1,
                  fontWeight: "bold",
                  transition: "all 0.2s ease",
                  opacity: creatingSession ? 0.5 : 1,
                  "&:hover": {
                    opacity: 0.8,
                  },
                }}
              >
                {t("calendar.cancel")}
              </Button>
              <Button
                onClick={handleCreateSession}
                disabled={creatingSession || !sessionForm.subjectId}
                sx={{
                  px: 4,
                  py: 2,
                  bg: "primary",
                  color: "white",
                  border: "none",
                  borderRadius: "md",
                  cursor:
                    creatingSession || !sessionForm.subjectId
                      ? "not-allowed"
                      : "pointer",
                  fontSize: 1,
                  fontWeight: "bold",
                  transition: "all 0.2s ease",
                  opacity: creatingSession || !sessionForm.subjectId ? 0.5 : 1,
                  "&:hover": {
                    opacity: 0.8,
                  },
                }}
              >
                {creatingSession
                  ? t("calendar.creating")
                  : t("calendar.createButton")}
              </Button>
            </Flex>
          </Box>
        </Box>
      )} */
}

export default CalendarPage;
