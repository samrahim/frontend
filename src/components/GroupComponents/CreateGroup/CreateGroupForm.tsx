import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { RRule } from "rrule";
import { format, parse, startOfWeek, getDay } from "date-fns";
import enUS from "date-fns/locale/en-US";
import ar from "date-fns/locale/ar-SA";

import "react-big-calendar/lib/css/react-big-calendar.css";
import "timepicker-ui/main.css";

import { Calendar as BigCalendar, dateFnsLocalizer } from "react-big-calendar";
import { Box, Button, Text, Flex } from "theme-ui";

type TimeData = {
  hour?: string;
  minutes?: string;
  type?: string;
};

import {
  useGetGroupTypesQuery,
  useGetAcademicYearsQuery,
  useGetSubjectsQuery,
  useTeachersTableQuery,
  GroupBillingUnit,
  GroupBillingCycle,
  useCreateGroupMutation,
  CreateTeachingAssignmentInput,
  useClassRoomsQuery,
} from "../../../graphql/generated";
import { useAuth } from "../../../contexts/AuthContext";

import { GeneralInfoSection } from "./GeneralInfoSection";
import { ScheduleSection } from "./ScheduleSection";
import { FinancialSection } from "./FinancialSection";
import { CalendarPreviewModal } from "./CalendarPreviewModal";
import { getRRuleLanguageConfig } from "../../../utils/days";

export interface Schedule {
  id: string;
  subjectId: string;
  subjectName: string;
  dayOfWeek: number[];
  dayName: string;
  startTime: string;
  endTime: string;
  rrule: string;
  recurrenceText: string;
  count: number | null;
  until: string | null;
  teacherId: string;
  classroomId: string;
}

interface FormData {
  name: string;
  subjectIds: string[];
  color: string;
  pricePerUnit: string;
  isFree: boolean;
  billingUnit: GroupBillingUnit;
  billingCycle: GroupBillingCycle;
  invoiceThreshold: string;
  academicYearId: string;
  startDate: string;
  schedules: Schedule[];
}

export function CreateGroupForm() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();

  // Multi-step State Tracking
  const [activeStep, setActiveStep] = useState(0);

  const { data: groupTypesData, loading: groupTypesLoading } =
    useGetGroupTypesQuery();
  const { data: academicYearsData, loading: academicYearsLoading } =
    useGetAcademicYearsQuery();
  const { data: subjectsData, loading: subjectsLoading } =
    useGetSubjectsQuery();

  const [createGroup] = useCreateGroupMutation();

  const [teacherSearch, setTeacherSearch] = useState("");
  const [showTeacherDropdown, setShowTeacherDropdown] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<any>(null);

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
      skip: !showTeacherDropdown,
    });

  const [calendarView, setCalendarView] = useState<"month" | "week" | "day">(
    "month"
  );
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [previewScheduleId, setPreviewScheduleId] = useState<string | null>(
    null
  );

  const [formData, setFormData] = useState<FormData>({
    name: "",

    subjectIds: [],
    color: "#4CAF50",
    pricePerUnit: "0",
    isFree: false,
    billingUnit: GroupBillingUnit.Session,
    billingCycle: GroupBillingCycle.Before,
    invoiceThreshold: "5",
    academicYearId: "",
    startDate: new Date().toISOString().split("T")[0],
    schedules: [],
  });

  const [newSchedule, setNewSchedule] = useState({
    subjectId: "",
    dayOfWeek: [1] as number[],
    startTime: "10:00",
    endTime: "11:30",
    recurrenceType: "weekly" as "daily" | "weekly" | "monthly",
    endType: "count" as "count" | "until",
    count: "",
    until: "",
    teacherId: "",
    classroomId: "",
  });

  const locales = {
    "en-US": enUS,
    "ar-SA": ar,
  };

  const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek,
    getDay,
    locales,
  });

  // Step Navigation Handlers
  const handleNextStep = () => {
    if (activeStep === 0) {
      if (!formData.name || !formData.academicYearId) {
        alert(t("common.fillAllFields"));
        return;
      }
    }
    if (activeStep === 1) {
      if (formData.schedules.length === 0) {
        alert(t("common.addAtLeastOneSchedule"));
        return;
      }
    }
    setActiveStep((prev) => prev + 1);
  };

  const handleBackStep = () => {
    setActiveStep((prev) => prev - 1);
  };

  const generateCalendarEvents = (scheduleId?: string) => {
    const events: any[] = [];
    const subjects =
      subjectsData?.subjects?.edges?.map((e) => e?.node).filter(Boolean) || [];
    const schedulesToProcess = scheduleId
      ? formData.schedules.filter((s) => s.id === scheduleId)
      : formData.schedules;

    schedulesToProcess.forEach((schedule) => {
      try {
        const startDateObj = new Date(formData.startDate);
        const [hours, minutes] = schedule.startTime.split(":").map(Number);
        startDateObj.setHours(hours, minutes, 0, 0);

        const dtStartStr = `DTSTART:${startDateObj.getFullYear()}${String(
          startDateObj.getMonth() + 1
        ).padStart(2, "0")}${String(startDateObj.getDate()).padStart(
          2,
          "0"
        )}T${String(hours).padStart(2, "0")}${String(minutes).padStart(
          2,
          "0"
        )}00Z`;
        const completeRRule = `${dtStartStr}\n${schedule.rrule}`;

        const rule = RRule.fromString(completeRRule);
        const occurrences = rule.all((_, i) => i < 20);

        occurrences.forEach((date, index) => {
          const subject = subjects.find((s) => s?.id === schedule.subjectId);
          const [endHours, endMinutes] = schedule.endTime
            .split(":")
            .map(Number);

          const eventStart = new Date(date);
          const eventEnd = new Date(date);
          eventEnd.setHours(endHours, endMinutes, 0, 0);

          events.push({
            id: `${schedule.id}-${index}`,
            title: subject?.name || schedule.subjectName,
            start: eventStart,
            end: eventEnd,
            resource: {
              scheduleId: schedule.id,
              subjectId: schedule.subjectId,
            },
          });
        });
      } catch (error) {
        console.error("Error generating calendar events:", error);
      }
    });

    return events;
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, color: e.target.value }));
  };

  const handleTeacherSearch = (value: string) => {
    setTeacherSearch(value);
    setShowTeacherDropdown(!!value.trim());
  };

  const filteredTeachers = useMemo(() => {
    return (
      teachersData?.teachersTable?.edges
        ?.map((edge) => edge?.node)
        .filter(Boolean) || []
    );
  }, [teachersData]);

  const handleSelectTeacher = (teacher: any) => {
    setNewSchedule((prev) => ({ ...prev, teacherId: teacher.id, teacher }));
    setTeacherSearch("");
    setShowTeacherDropdown(false);
  };

  const handleRemoveTeacher = () => {
    setNewSchedule((prev) => ({ ...prev, teacherId: "", teacher: null }));
  };

  const validateRRule = (rruleString: string): boolean => {
    try {
      const rule = RRule.fromString(rruleString);
      return rule.all().length > 0;
    } catch (error) {
      return false;
    }
  };

  const generateRRule = (
    daysOfWeek: number[], // 👈 استقبال مصفوفة أعياد/أيام
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
      let rruleParams: any = {};
      switch (recurrenceType) {
        case "daily":
          rruleParams.freq = RRule.DAILY;
          break;
        case "weekly":
          rruleParams.freq = RRule.WEEKLY;
          // 👈 تمرير الأيام المختارة كلها
          rruleParams.byweekday = daysOfWeek.map((d) => rruleWeekdays[d]);
          break;
        case "monthly":
          rruleParams.freq = RRule.MONTHLY;
          rruleParams.byweekday = daysOfWeek.map((d) => rruleWeekdays[d]);
          break;
      }

      if (endType === "count" && count) rruleParams.count = count;
      else if (endType === "until" && until) rruleParams.until = until;

      return new RRule(rruleParams).toString().split("\n")[0];
    } catch (error) {
      return "FREQ=WEEKLY";
    }
  };

  const getTotalSessions = (): number => {
    return formData.schedules.reduce((total, schedule) => {
      try {
        return total + RRule.fromString(schedule.rrule).all().length;
      } catch (error) {
        return total;
      }
    }, 0);
  };

  const getPaymentText = (): string => {
    if (formData.isFree)
      return i18n.language === "ar"
        ? "💚 هذه مجموعة مجانية - لا توجد رسوم"
        : "💚 This is a free group - No charges";
    const price = parseFloat(formData.pricePerUnit) || 0;
    if (price <= 0)
      return i18n.language === "ar"
        ? "اختر نوع الفوترة وأدخل السعر"
        : "Select a billing unit and enter a price";

    const isBefore = formData.billingCycle === GroupBillingCycle.Before;
    const billingCycleText = isBefore
      ? i18n.language === "ar"
        ? "دفع مقدم"
        : "Prepayment"
      : i18n.language === "ar"
      ? "دفع لاحق"
      : "Postpayment";

    switch (formData.billingUnit) {
      case GroupBillingUnit.Once:
        return i18n.language === "ar"
          ? `💰 الطالب سيدفع ${price.toFixed(
              2
            )}$ مرة واحدة فقط\n📋 ${billingCycleText}`
          : `💰 Student will pay $${price.toFixed(
              2
            )} one time only\n📋 Billing Cycle: ${billingCycleText}`;
      case GroupBillingUnit.Monthly:
        return i18n.language === "ar"
          ? `💰 الطالب سيدفع ${price.toFixed(
              2
            )}$ شهرياً\n📋 ${billingCycleText}`
          : `💰 Student will pay $${price.toFixed(
              2
            )} per month\n📋 Billing Cycle: ${billingCycleText}`;
      case GroupBillingUnit.Session: {
        const totalSessions = getTotalSessions();
        return i18n.language === "ar"
          ? `💰 ${price.toFixed(
              2
            )}$ لكل جلسة\n📚 عدد الجلسات: ${totalSessions}\n💵 المجموع المتوقع: ${(
              totalSessions * price
            ).toFixed(2)}$\n📋 ${billingCycleText}\n📌 فاتورة كل ${
              parseInt(formData.invoiceThreshold, 10) || 5
            } جلسات`
          : `💰 $${price.toFixed(
              2
            )} per session\n📚 Total Sessions: ${totalSessions}\n💵 Expected Total: $${(
              totalSessions * price
            ).toFixed(
              2
            )}\n📋 Billing Cycle: ${billingCycleText}\n📌 Invoice every ${
              parseInt(formData.invoiceThreshold, 10) || 5
            } sessions`;
      }
      default:
        return i18n.language === "ar"
          ? "اختر نوع الفوترة"
          : "Select a billing unit";
    }
  };

  const getOccurrenceCount = (rruleString: string): number => {
    try {
      return RRule.fromString(rruleString).all().length;
    } catch {
      return 0;
    }
  };

  const getRRuleText = (rruleString: string): string => {
    try {
      return RRule.fromString(rruleString).toText(
        undefined,
        getRRuleLanguageConfig(i18n.language || "en")
      );
    } catch {
      return rruleString;
    }
  };
  const {
    data: classes,
    loading: classesLoading,
    error: classesError,
  } = useClassRoomsQuery();
  const classrooms =
    classes?.classRooms?.edges
      ?.map((edge) => edge?.node)
      .filter((node): node is NonNullable<typeof node> => Boolean(node)) ?? [];
  const toRFC3339Nano = (date: Date): string =>
    date.toISOString().replace(/\.(\d{3})Z$/, ".$1000000Z");
  const toDTSTART = (date: Date): string => {
    const year = date.getUTCFullYear();

    const month = String(date.getUTCMonth() + 1).padStart(2, "0");

    const day = String(date.getUTCDate()).padStart(2, "0");

    const hours = String(date.getUTCHours()).padStart(2, "0");

    const minutes = String(date.getUTCMinutes()).padStart(2, "0");

    const seconds = String(date.getUTCSeconds()).padStart(2, "0");

    return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
  };

  const handleAddSchedule = () => {
    if (!newSchedule.subjectId) {
      alert(t("groups.scheduleSubjectRequired"));
      return;
    }
    if (newSchedule.startTime >= newSchedule.endTime) {
      alert(t("groups.scheduleTimeInvalid"));
      return;
    }
    if (newSchedule.endType === "count") {
      if (!newSchedule.count || parseInt(newSchedule.count) <= 0) {
        alert(t("groups.scheduleCountRequired"));
        return;
      }
      if (parseInt(newSchedule.count) > 500) {
        alert(t("groups.scheduleCountTooLarge"));
        return;
      }
    }
    if (newSchedule.endType === "until") {
      if (!newSchedule.until) {
        alert(t("groups.scheduleUntilRequired"));
        return;
      }
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (new Date(newSchedule.until) < today) {
        alert(t("groups.scheduleUntilPastDate"));
        return;
      }
    }

    const hasTimeConflict = formData.schedules.some((s) => {
      if (s.dayOfWeek !== newSchedule.dayOfWeek) return false;
      return (
        newSchedule.startTime < s.endTime && newSchedule.endTime > s.startTime
      );
    });

    if (hasTimeConflict) {
      alert(t("groups.scheduleTimeConflict"));
      return;
    }

    const subject = subjects.find((s) => s?.id === newSchedule.subjectId);
    const countValue = newSchedule.count
      ? parseInt(newSchedule.count)
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

    if (!validateRRule(rruleString)) {
      alert(t("groups.scheduleInvalidRRule"));
      return;
    }

    const dayNames = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    const schedule: Schedule = {
      // 1. Join array values for the ID string
      id: `${newSchedule.subjectId}-${newSchedule.dayOfWeek.join(
        "-"
      )}-${Date.now()}`,
      subjectId: newSchedule.subjectId,
      subjectName: subject?.name || "",
      dayOfWeek: newSchedule.dayOfWeek,
      // 2. Map over the array to get names for selected days, or return 'Daily'
      dayName:
        newSchedule.recurrenceType === "daily"
          ? t("groups.daily")
          : newSchedule.dayOfWeek.map((d) => dayNames[d]).join(", "),
      startTime: newSchedule.startTime,
      endTime: newSchedule.endTime,
      rrule: rruleString,
      recurrenceText: getRRuleText(rruleString),
      count: countValue || null,
      until: newSchedule.until || null,
      teacherId: newSchedule.teacherId,
      classroomId: newSchedule.classroomId,
    };

    setFormData((prev) => ({
      ...prev,
      schedules: [...prev.schedules, schedule],
    }));
    setNewSchedule({
      subjectId: "",
      dayOfWeek: [1],
      startTime: "10:00",
      endTime: "11:30",
      recurrenceType: "weekly",
      endType: "count",
      count: "",
      until: "",
      teacherId: "",
      classroomId: "",
    });
  };

  const handleRemoveSchedule = (scheduleId: string) => {
    setFormData((prev) => ({
      ...prev,
      schedules: prev.schedules.filter((s) => s.id !== scheduleId),
    }));
  };

  const handleFreeToggle = (checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      isFree: checked,
      pricePerUnit: checked ? "0" : prev.pricePerUnit,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    console.log(activeStep);

    if (activeStep < 2) {
      return;
    }
    if (!formData.name || !formData.academicYearId) {
      alert(t("common.fillAllFields"));
      return;
    }
    if (formData.schedules.length === 0) {
      alert(t("common.addAtLeastOneSchedule"));
      return;
    }
    const hexToInt = (hex: string): number =>
      parseInt(hex.replace("#", ""), 16);
    try {
      const timeToISO = (time: string) => `1970-01-01T${time}:00Z`;
      const schedulesInput = formData.schedules.map((schedule) => {
        let rruleString = schedule.rrule;
        if (rruleString) {
          try {
            const [hours, minutes] = schedule.startTime.split(":");
            const startDateTime = new Date(formData.startDate);
            startDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
            rruleString = `DTSTART:${toDTSTART(startDateTime)}\n${rruleString}`;
          } catch (error) {
            console.error("Error adjusting RRule start date:", error);
          }
        }

        return {
          rrule: rruleString,
          subjectID: schedule.subjectId,
          roomID: schedule.classroomId,
          startTime: timeToISO(schedule.startTime),
          endTime: timeToISO(schedule.endTime),
        };
      });

      const teachersInput: CreateTeachingAssignmentInput[] =
        formData.schedules.map((schedule) => ({
          teacherID: schedule.teacherId,
          subjectID: schedule.subjectId,
          groupID: "0007",
          assignedByID: user?.id.toString() || "",
        }));

      const result = await createGroup({
        variables: {
          input: {
            name: formData.name,
            academicYearID: formData.academicYearId,
            creatorID: user?.id.toString() || "",
            expected: parseFloat(formData.pricePerUnit) || 0,
            pricePerUnit: parseFloat(formData.pricePerUnit) || 0,
            billingUnit: formData.billingUnit,
            billingCycle: formData.billingCycle,
            invoiceThreshold: parseInt(formData.invoiceThreshold) || 5,
            startDate: toRFC3339Nano(new Date(formData.startDate)),
            trackBilling: true,
            color: hexToInt(formData.color),
          },
          teachers: teachersInput,
          rrules: schedulesInput,
        },
      });

      if (result.data?.createGroup?.id) {
        alert(t("common.groupCreatedSuccessfully"));
        setFormData({
          name: "",

          subjectIds: [],
          color: "#4CAF50",
          pricePerUnit: "0",
          isFree: false,
          billingUnit: GroupBillingUnit.Session,
          billingCycle: GroupBillingCycle.Before,
          invoiceThreshold: "5",
          academicYearId: "",
          startDate: new Date().toISOString().split("T")[0],
          schedules: [],
        });
        setSelectedTeacher(null);
        setActiveStep(0); // Reset UI to first step
      }
    } catch (error) {
      console.log(error);
      alert(t("common.errorCreatingGroup"));
    }
  };

  const handleNewScheduleChange = (
    e:
      | React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
      | { target: { name: string; value: any } }
  ) => {
    const { name, value } = e.target;

    setNewSchedule((prev) => {
      // 1. If updating dayOfWeek, ensure it stores an array of numbers
      if (name === "dayOfWeek") {
        const daysArray = Array.isArray(value)
          ? value.map(Number)
          : [Number(value)];

        return {
          ...prev,
          dayOfWeek: daysArray,
        };
      }

      // 2. If changing recurrence to daily, reset or select all days
      if (name === "recurrenceType" && value === "daily") {
        return {
          ...prev,
          recurrenceType: "daily",
          dayOfWeek: [0, 1, 2, 3, 4, 5, 6],
        };
      }

      return {
        ...prev,
        [name]: value,
      };
    });
  };
  const handleStartTimeChange = (data: TimeData) =>
    setNewSchedule((prev) => ({
      ...prev,
      startTime: `${data.hour}:${data.minutes}`,
    }));
  const handleEndTimeChange = (data: TimeData) =>
    setNewSchedule((prev) => ({
      ...prev,
      endTime: `${data.hour}:${data.minutes}`,
    }));

  const groupTypes =
    groupTypesData?.groupTypes?.edges?.map((e) => e?.node).filter(Boolean) ||
    [];
  const academicYears =
    academicYearsData?.academicYears?.edges
      ?.map((e) => e?.node)
      .filter(Boolean) || [];
  const subjects =
    subjectsData?.subjects?.edges?.map((e) => e?.node).filter(Boolean) || [];
  const isLoading =
    groupTypesLoading || academicYearsLoading || subjectsLoading;
  if (isLoading) return <Text>{t("groups.loadingForm")}</Text>;
  return (
    <Box
      as="form"
      onSubmit={handleSubmit}
      sx={{ maxWidth: "1000px", mx: "auto", bg: "background" }}
    >
      {/* React Form Stepper Headings */}

      {/* Conditional Section Steps */}
      {activeStep === 0 && (
        <GeneralInfoSection
          formData={formData}
          groupTypes={groupTypes}
          academicYears={academicYears}
          selectedTeacher={selectedTeacher}
          teacherSearch={teacherSearch}
          showTeacherDropdown={showTeacherDropdown}
          handleInputChange={handleInputChange}
          handleColorChange={handleColorChange}
          t={t}
        />
      )}

      {activeStep === 1 && (
        <ScheduleSection
          formData={formData}
          newSchedule={newSchedule}
          subjects={subjects}
          showStartDate={false}
          handleNewScheduleChange={handleNewScheduleChange}
          handleStartTimeChange={handleStartTimeChange}
          handleEndTimeChange={handleEndTimeChange}
          handleAddSchedule={handleAddSchedule}
          handleRemoveSchedule={handleRemoveSchedule}
          setPreviewScheduleId={setPreviewScheduleId}
          getOccurrenceCount={getOccurrenceCount}
          handleTeacherSearch={handleTeacherSearch}
          handleSelectTeacher={handleSelectTeacher}
          handleRemoveTeacher={handleRemoveTeacher}
          setShowTeacherDropdown={setShowTeacherDropdown}
          showTeacherDropdown={showTeacherDropdown}
          filteredTeachers={filteredTeachers}
          teachersLoading={teachersLoading}
          classrooms={classrooms}
          classroomsLoading={classesLoading}
          t={t}
          teacherSearch={teacherSearch}
        />
      )}

      {activeStep === 2 && (
        <FinancialSection
          formData={formData}
          handleInputChange={handleInputChange}
          handleFreeToggle={handleFreeToggle}
          getPaymentText={getPaymentText}
          t={t}
        />
      )}

      {/* Calendar Modal remains functional during Schedule View */}
      <CalendarPreviewModal
        previewScheduleId={previewScheduleId}
        setPreviewScheduleId={setPreviewScheduleId}
        generateCalendarEvents={generateCalendarEvents}
        calendarView={calendarView}
        setCalendarView={setCalendarView}
        calendarDate={calendarDate}
        setCalendarDate={setCalendarDate}
        localizer={localizer}
        i18n={i18n}
        t={t}
      />

      {/* Controlled Navigation Buttons */}
      <Flex sx={{ gap: 3, justifyContent: "flex-start", mt: 4 }}>
        {/* 🟢 Back Button - Only visible if we aren't on the first step */}
        {activeStep > 0 && (
          <Button
            type="button"
            variant="secondary" // Or "outline" depending on your theme presets
            onClick={(e) => {
              e.preventDefault();
              handleBackStep(); // Make sure this function exists in your parent component state handlers
            }}
            sx={{
              px: 4,
              py: 2,
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            {t("common.back") || "Back"}
          </Button>
        )}

        {/* Next or Create Group Decision Trigger */}
        {activeStep < 2 ? (
          <Button
            type="button"
            variant="primary"
            onClick={(e) => {
              e.preventDefault();
              handleNextStep();
            }}
            sx={{
              px: 4,
              py: 2,
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            {t("common.next") || "Next"}
          </Button>
        ) : (
          <Button
            type="button"
            variant="success"
            onClick={(e) => {
              console.log("clicked");
              e.preventDefault();
              handleSubmit(e);
            }}
            sx={{
              px: 4,
              py: 2,
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            {t("groups.createGroup")}
          </Button>
        )}
      </Flex>
    </Box>
  );
}
