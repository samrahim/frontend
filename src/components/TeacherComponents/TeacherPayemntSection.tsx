import React from "react";
import { t } from "i18next";
import {
  LuClock3,
  LuLayers,
  LuSparkles,
  LuInfo,
  LuCheck,
  LuChevronDown,
  LuCalendarCheck,
  LuCoins,
  LuLoaderCircle,
} from "react-icons/lu";
import { Flex, Text, Box, Label, Input, Select, Button } from "theme-ui";
import {
  TeacherPaymentFrequency,
  TeacherPaymentType,
  TeacherPaymentWeekday,
} from "../../graphql";
import {
  describePayment,
  TeacherFormData,
  todayInAlgiers,
} from "./teacher.types";

const WEEK_DAYS = [
  { value: TeacherPaymentWeekday.Sunday, label: "Sunday" },
  { value: TeacherPaymentWeekday.Monday, label: "Monday" },
  { value: TeacherPaymentWeekday.Tuesday, label: "Tuesday" },
  { value: TeacherPaymentWeekday.Wednesday, label: "Wednesday" },
  { value: TeacherPaymentWeekday.Thursday, label: "Thursday" },
  { value: TeacherPaymentWeekday.Friday, label: "Friday" },
  { value: TeacherPaymentWeekday.Saturday, label: "Saturday" },
];

/* ── Helper Components ── */

function FieldLabel({
  children,
  required,
  hint,
}: {
  children: React.ReactNode;
  required?: boolean;
  hint?: string;
}) {
  return (
    <Flex sx={{ alignItems: "center", gap: 1, mb: 2 }}>
      <Label
        sx={{
          fontSize: 1,
          fontWeight: "bold",
          color: "text",
          width: "auto",
        }}
      >
        {children}
        {required && (
          <Text as="span" sx={{ color: "primary", ml: 1 }}>
            *
          </Text>
        )}
      </Label>
      {hint && (
        <Box
          sx={{
            position: "relative",
            display: "inline-flex",
            "&:hover .tooltip": { opacity: 1, pointerEvents: "auto" },
          }}
        >
          <LuInfo size={14} style={{ cursor: "help", color: "#6b7280" }} />
          <Box
            className="tooltip"
            sx={{
              position: "absolute",
              left: 0,
              bottom: "100%",
              mb: 1,
              width: "220px",
              bg: "text",
              color: "background",
              fontSize: 0,
              p: 2,
              borderRadius: "md",
              opacity: 0,
              pointerEvents: "none",
              transition: "opacity 0.2s ease",
              zIndex: 10,
              boxShadow: "md",
              lineHeight: "body",
            }}
          >
            {hint}
          </Box>
        </Box>
      )}
    </Flex>
  );
}

function HelperText({ children }: { children: React.ReactNode }) {
  return (
    <Flex
      sx={{
        alignItems: "flex-start",
        gap: 1,
        mt: 1,
        fontSize: 0,
        color: "subtle",
        lineHeight: "body",
      }}
    >
      <LuInfo size={12} style={{ marginTop: "2px", flexShrink: 0 }} />
      <Text>{children}</Text>
    </Flex>
  );
}

function AmountInput({
  value,
  onChange,
  placeholder = "0",
}: {
  value: number | string;
  onChange: (v: number) => void;
  placeholder?: string;
}) {
  return (
    <Flex sx={{ position: "relative", alignItems: "center", width: "100%" }}>
      <Input
        type="text"
        inputMode="decimal"
        value={value || ""}
        onChange={(e) => {
          const raw = e.target.value
            .replace(/[^\d.]/g, "")
            .replace(/(\..*)\./g, "$1");
          onChange(raw ? Number(raw) : 0);
        }}
        placeholder={placeholder}
        sx={{
          width: "100%",
          pl: 3,
          pr: 12,
          py: 2,
          borderRadius: "md",
          borderColor: "border",
          bg: "tableBackground",
          fontSize: 1,
          fontFamily: "monospace",
          "&:focus": { borderColor: "primary", outline: "none" },
        }}
      />
      <Text
        sx={{
          position: "absolute",
          right: 3,
          fontSize: 0,
          fontWeight: "bold",
          color: "subtle",
          bg: "muted",
          px: 2,
          py: 1,
          borderRadius: "sm",
          fontFamily: "monospace",
        }}
      >
        DZ
      </Text>
    </Flex>
  );
}

function DateInput({
  value,
  onChange,
  min,
}: {
  value: string | null;
  onChange: (v: string) => void;
  min?: string;
}) {
  return (
    <Box sx={{ position: "relative", width: "100%" }}>
      <LuCalendarCheck
        size={16}
        style={{
          position: "absolute",
          left: 12,
          top: "50%",
          transform: "translateY(-50%)",
          pointerEvents: "none",
          color: "#6b7280",
        }}
      />
      <Input
        type="date"
        value={value ?? ""}
        min={min}
        onChange={(e) => onChange(e.target.value)}
        sx={{
          width: "100%",
          pl: 8,
          pr: 3,
          py: 2,
          borderRadius: "md",
          borderColor: "border",
          bg: "tableBackground",
          fontSize: 1,
          "&:focus": { borderColor: "primary", outline: "none" },
        }}
      />
    </Box>
  );
}

function SummaryRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <Flex
      sx={{
        alignItems: "center",
        justifyContent: "space-between",
        py: 2,
        borderBottom: "1px solid",
        borderColor: "border",
        "&:last-child": { borderBottom: "none" },
      }}
    >
      <Text sx={{ fontSize: 0, color: "subtle" }}>{label}</Text>
      <Text
        sx={{
          fontSize: 0,
          fontWeight: "bold",
          fontFamily: "monospace",
          color: highlight ? "primary" : "text",
        }}
      >
        {value}
      </Text>
    </Flex>
  );
}

// Replace ONLY the imports at the top and the TeacherPaymentSection component.
// Keep your helper components unchanged: FieldLabel, HelperText, AmountInput,
// DateInput, SummaryRow. Delete WEEK_DAYS_MAP and WEEK_DAYS (no longer used).

interface TeacherPaymentSectionProps {
  formData: TeacherFormData;
  onChange: <K extends keyof TeacherFormData>(
    field: K,
    value: TeacherFormData[K]
  ) => void;
  /** true when editing an existing teacher (allows keeping a past date) */
  isEdit?: boolean;
}

export function TeacherPaymentSection({
  formData,
  onChange,
  isEdit = false,
}: TeacherPaymentSectionProps) {
  const type = formData.paymentType;
  const isOnce = type === TeacherPaymentType.Once;

  const freq: TeacherPaymentFrequency | null = isOnce
    ? null
    : formData.paymentFrequency ?? TeacherPaymentFrequency.Monthly;

  const paymentOptions = [
    {
      value: TeacherPaymentType.Hourly,
      icon: LuClock3,
      title: t("teachers.paymentHourly") || "Hourly",
      description:
        t("teachers.paymentHourlyDescription") ||
        "Paid according to approved working hours",
    },
    {
      value: TeacherPaymentType.Session,
      icon: LuLayers,
      title: t("teachers.paymentPerSession") || "Per session",
      description:
        t("teachers.paymentSessionDescription") ||
        "Paid for each completed session",
    },
    {
      value: TeacherPaymentType.Once,
      icon: LuSparkles,
      title: t("teachers.paymentOnce") || "One-time",
      description: t("teachers.paymentOnceDescription") || "Single payment",
    },
  ];

  const payrollFreqs = [
    {
      id: TeacherPaymentFrequency.Weekly,
      label: t("teachers.freqWeekly") || "Weekly",
    },
    {
      id: TeacherPaymentFrequency.Biweekly,
      label: t("teachers.freqBiweekly") || "Every 2 weeks",
    },
    {
      id: TeacherPaymentFrequency.Monthly,
      label: t("teachers.freqMonthly") || "Monthly",
    },
  ];

  const amountLabelMap: Partial<Record<TeacherPaymentType, string>> = {
    [TeacherPaymentType.Hourly]:
      t("teachers.amountHourly") || "Amount per hour",
    [TeacherPaymentType.Session]:
      t("teachers.amountPerSession") || "Amount per session",
    [TeacherPaymentType.Once]: t("teachers.amountOnce") || "Payment amount",
  };

  const showFreq = !isOnce;

  // One date field for ALL types: it is saved in paymentAnchorDate.
  const dateLabel = isOnce
    ? t("teachers.paymentDate") || "Payment Date"
    : t("teachers.paymentFirstInvoiceDate") || "First Payment Date";

  const handleTypeChange = (newType: TeacherPaymentType) => {
    onChange("paymentType", newType);

    if (newType === TeacherPaymentType.Once) {
      onChange("paymentFrequency", null);
    } else if (!formData.paymentFrequency) {
      onChange("paymentFrequency", TeacherPaymentFrequency.Monthly);
    }
    // The date is kept: it means "first payment date" for every type.
  };

  const handleFreqChange = (newFreq: TeacherPaymentFrequency) => {
    onChange("paymentFrequency", newFreq);
    // The date is kept: weekday / day of month are derived from it.
  };

  // Summary
  const selectedOption = paymentOptions.find((p) => p.value === type);
  const summaryLines: { label: string; value: string; highlight?: boolean }[] =
    [];

  summaryLines.push({
    label: t("teachers.summaryPaymentType") || "Payment type",
    value: selectedOption?.title || "—",
  });

  if (formData.paymentAmount > 0) {
    const unitSuffix =
      type === TeacherPaymentType.Hourly
        ? " / hr"
        : type === TeacherPaymentType.Session
        ? " / session"
        : "";

    summaryLines.push({
      label: amountLabelMap[type] ?? "Amount",
      value: `${formData.paymentAmount.toLocaleString()} DZ${unitSuffix}`,
      highlight: true,
    });
  }

  if (showFreq && freq) {
    summaryLines.push({
      label: t("teachers.summaryPayrollFreq") || "Payroll frequency",
      value: payrollFreqs.find((f) => f.id === freq)?.label || "—",
    });
  }

  if (formData.paymentAnchorDate) {
    summaryLines.push({
      label: dateLabel,
      value: formData.paymentAnchorDate,
      highlight: true,
    });
  }

  return (
    <Flex sx={{ flexDirection: "column", gap: 4, width: "100%" }}>
      {/* Header */}
      <Flex sx={{ alignItems: "flex-start", gap: 3, pt: 1 }}>
        <Box
          sx={{
            p: 2,
            borderRadius: "md",
            bg: "primaryLight",
            border: "1px solid",
            borderColor: "border",
            color: "primary",
          }}
        >
          <LuCoins size={20} />
        </Box>
        <Box>
          <Text sx={{ fontSize: 2, fontWeight: "bold", color: "text" }}>
            {t("teachers.paymentSectionTitle") || "Payment & Salary"}
          </Text>
          <Text
            sx={{ fontSize: 0, color: "subtle", mt: 1, lineHeight: "body" }}
          >
            {t("teachers.paymentSectionSub") ||
              "Configure how this teacher will be paid and how payroll will be generated."}
          </Text>
        </Box>
      </Flex>

      {/* 1. Payment Type */}
      <Box>
        <FieldLabel required>
          {t("teachers.paymentTypeLabel") || "Payment Type"}
        </FieldLabel>
        <Flex sx={{ gap: 3, flexWrap: "wrap", width: "100%" }}>
          {paymentOptions.map((option) => {
            const Icon = option.icon;
            const selected = type === option.value;

            return (
              <Flex
                key={option.value}
                onClick={() => handleTypeChange(option.value)}
                sx={{
                  flex: "1 1 200px",
                  p: 3,
                  border: "2px solid",
                  borderColor: selected ? "primary" : "border",
                  borderRadius: "md",
                  cursor: "pointer",
                  bg: selected ? "primaryLight" : "tableBackground",
                  transition: "all 0.2s ease",
                  flexDirection: "column",
                  gap: 1,
                  position: "relative",
                  "&:hover": {
                    borderColor: selected ? "primary" : "primaryLight",
                  },
                }}
              >
                {selected && (
                  <Box
                    sx={{
                      position: "absolute",
                      top: 2,
                      right: 2,
                      width: 16,
                      height: 16,
                      borderRadius: "50%",
                      bg: "primary",
                      color: "white",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <LuCheck size={10} strokeWidth={3} />
                  </Box>
                )}

                <Flex
                  sx={{
                    alignItems: "center",
                    gap: 2,
                    color: selected ? "primary" : "text",
                  }}
                >
                  <Icon size={20} />
                  <Text sx={{ fontWeight: "bold", fontSize: 1 }}>
                    {option.title}
                  </Text>
                </Flex>

                <Text
                  sx={{
                    fontSize: 0,
                    color: selected ? "primary" : "subtle",
                    mt: 1,
                  }}
                >
                  {option.description}
                </Text>
              </Flex>
            );
          })}
        </Flex>
      </Box>

      {/* 2. Amount */}
      <Box>
        <FieldLabel required>{amountLabelMap[type] ?? "Amount"}</FieldLabel>
        <AmountInput
          value={formData.paymentAmount}
          onChange={(v) => onChange("paymentAmount", v)}
          placeholder="e.g. 1,000"
        />
        {!formData.paymentAmount && (
          <Flex sx={{ gap: 1, alignItems: "center", mt: 1, color: "subtle" }}>
            <LuLoaderCircle size={12} />
            <Text sx={{ fontSize: 0 }}>
              {t("teachers.amountRequired") || "Enter an amount to continue."}
            </Text>
          </Flex>
        )}
      </Box>

      {/* 3. Payroll frequency (hourly / session only) */}
      {showFreq && (
        <Box>
          <FieldLabel required>
            {t("teachers.payrollFreqLabel") || "Payroll Frequency"}
          </FieldLabel>
          <Flex sx={{ gap: 2 }}>
            {payrollFreqs.map((f) => {
              const active = freq === f.id;
              return (
                <Button
                  key={f.id}
                  type="button"
                  onClick={() => handleFreqChange(f.id)}
                  sx={{
                    flex: 1,
                    py: 2,
                    px: 3,
                    borderRadius: "md",
                    border: "2px solid",
                    borderColor: active ? "primary" : "border",
                    bg: active ? "primaryLight" : "tableBackground",
                    color: active ? "primary" : "text",
                    fontWeight: "bold",
                    fontSize: 1,
                    cursor: "pointer",
                    "&:hover": { borderColor: "primary" },
                  }}
                >
                  {f.label}
                </Button>
              );
            })}
          </Flex>
        </Box>
      )}

      {/* 4. First payment date: ONE block for every type */}
      <Box
        sx={{
          p: 3,
          borderRadius: "md",
          bg: "muted",
          border: "1px solid",
          borderColor: "border",
        }}
      >
        <FieldLabel
          required
          hint={
            isOnce
              ? undefined
              : t("teachers.firstInvoiceDateHint") ||
                "Select the exact date (Day/Month/Year) for the first payment. Future payments will recur automatically based on this starting date."
          }
        >
          {dateLabel}
        </FieldLabel>
        <DateInput
          value={formData.paymentAnchorDate}
          min={isEdit ? undefined : todayInAlgiers()}
          onChange={(v) => onChange("paymentAnchorDate", v || null)}
        />
        <HelperText>
          {formData.paymentAnchorDate
            ? describePayment(formData)
            : isOnce
            ? t("teachers.payDateHelper") ||
              "This teacher will receive this payment only once on the selected date."
            : t("teachers.firstInvoiceDateHelper") ||
              "Select the starting date. The weekday or day of month is taken from it."}
        </HelperText>
      </Box>

      {/* 5. Summary */}
      <Box
        sx={{
          borderRadius: "md",
          border: "1px solid",
          borderColor: "primary",
          bg: "primaryLight",
          overflow: "hidden",
        }}
      >
        <Flex
          sx={{
            alignItems: "center",
            gap: 2,
            px: 3,
            py: 2,
            borderBottom: "1px solid",
            borderColor: "border",
          }}
        >
          <LuCoins size={14} style={{ color: "#000" }} />
          <Text
            sx={{
              fontSize: 0,
              fontWeight: "bold",
              color: "primary",
              textTransform: "uppercase",
              fontFamily: "monospace",
            }}
          >
            {t("teachers.paymentSummary") || "Payment Summary"}
          </Text>
        </Flex>
        <Box sx={{ px: 3, py: 1 }}>
          {summaryLines.map((row, i) => (
            <SummaryRow key={i} {...row} />
          ))}
        </Box>
      </Box>
    </Flex>
  );
}
