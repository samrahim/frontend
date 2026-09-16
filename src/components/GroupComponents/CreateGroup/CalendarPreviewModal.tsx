import { Calendar } from "react-big-calendar";
import type { DateLocalizer } from "react-big-calendar";
import { Box, Button, Flex, Text } from "theme-ui";

type Props = {
  previewScheduleId: string | null;
  setPreviewScheduleId: (id: string | null) => void;

  generateCalendarEvents: (scheduleId: string) => any[];

  calendarView: "month" | "week" | "day";
  setCalendarView: (view: "month" | "week" | "day") => void;

  calendarDate: Date;
  setCalendarDate: (date: Date) => void;

  localizer: DateLocalizer;

  i18n: {
    language: string;
  };

  t: (key: string) => string;
};
export function CalendarPreviewModal({
  previewScheduleId,
  setPreviewScheduleId,
  generateCalendarEvents,
  calendarView,
  setCalendarView,
  calendarDate,
  setCalendarDate,
  localizer,
  i18n,
  t,
}: Props) {
  if (!previewScheduleId) return null;

  return (
    <Box
      onClick={() => setPreviewScheduleId(null)}
      sx={{
        position: "fixed",
        inset: 0,
        bg: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: "modal",
      }}
    >
      <Box
        onClick={(e) => e.stopPropagation()}
        sx={{
          bg: "background",
          borderRadius: "md",
          maxWidth: "900px",
          width: "90%",
          maxHeight: "90vh",
          overflow: "auto",
          p: 4,
          boxShadow: "lg",
        }}
      >
        <Flex
          sx={{
            justifyContent: "space-between",
            alignItems: "center",
            mb: 3,
          }}
        >
          <Text as="h3" sx={{ fontSize: 3, fontWeight: "heading", m: 0 }}>
            {t("groups.calendarPreview")}
          </Text>
          <Button
            onClick={() => setPreviewScheduleId(null)}
            sx={{
              bg: "transparent",
              border: "none",
              cursor: "pointer",
              fontSize: 4,
              p: 0,
              color: "text",
            }}
          >
            ✕
          </Button>
        </Flex>

        <Flex sx={{ gap: 2, mb: 4 }}>
          <Button
            variant={calendarView === "month" ? "primary" : "secondary"}
            onClick={() => setCalendarView("month")}
          >
            {t("groups.monthView")}
          </Button>
          <Button
            variant={calendarView === "week" ? "primary" : "secondary"}
            onClick={() => setCalendarView("week")}
          >
            {t("groups.weekView")}
          </Button>
          <Button
            variant={calendarView === "day" ? "primary" : "secondary"}
            onClick={() => setCalendarView("day")}
          >
            {t("groups.dayView")}
          </Button>
        </Flex>

        <Box sx={{ height: "500px" }}>
          <Calendar
            localizer={localizer}
            events={generateCalendarEvents(previewScheduleId)}
            startAccessor="start"
            endAccessor="end"
            defaultView={calendarView}
            view={calendarView}
            date={calendarDate}
            onNavigate={setCalendarDate}
            style={{ height: "100%" }}
            rtl={i18n.language === "ar"}
            popup
          />
        </Box>
      </Box>
    </Box>
  );
}
