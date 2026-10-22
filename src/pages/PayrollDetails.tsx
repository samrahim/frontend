import { useMemo, useState } from "react";
import { Box, Button, Flex, Label, Text, Textarea } from "theme-ui";
import { useNavigate, useParams } from "react-router-dom";
import { Layout } from "../components/Layout";
import { usePayrollsQuery } from "../graphql";
import { useTranslation } from "react-i18next";

/* ------------------------------------------------------------------ */
/* Types                                                              */
/* ------------------------------------------------------------------ */

type SessionRow = {
  id: string;
  startAt: string;
  endAt: string;
  durationMin: number;
  schedule?: { subject?: { id: string; name: string } | null } | null;
};

type ItemRow = {
  id?: string;
  type?: string;
  description?: string | null;
  unitPrice: number;
  quantity: number;
  amount?: number;
  sessions?: SessionRow[] | null;
  assignment?: {
    group?: { name: string } | null;
  } | null;
};

type PayrollNode = {
  id: string;
  createdAt: string;
  periodStart: string;
  periodEnd: string;
  grossAmount: number;
  bonusAmount: number;
  deductionAmount?: number;
  netAmount: number;
  status: string;
  teacher: { id: string; firstName: string; lastName: string };
  items?: ItemRow[] | null;
};

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const TZ = "Africa/Algiers";

const money = (n: number) =>
  new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 2 })
    .format(n)
    .replace(/[\u202f\u00a0]/g, " ") + " EURO";

const num = (n: number) =>
  new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 2 })
    .format(n)
    .replace(/[\u202f\u00a0]/g, " ");

const duration = (min: number) => {
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  if (h === 0) return `${m}m`;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
};

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", {
    timeZone: TZ,
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

const fmtTime = (iso: string, lang: string = "en") =>
  new Date(iso).toLocaleTimeString(lang, {
    timeZone: TZ,
    hour: "2-digit",
    minute: "2-digit",
  });

const dateLocales: Record<string, string> = {
  en: "en-GB",
  fr: "fr-FR",
  ar: "ar",
};

const getDateLocale = (language?: string) => {
  if (!language) return "en-GB";
  return dateLocales[language.split("-")[0]] ?? "en-GB";
};

const fmtRange = (a: string, b: string, lang?: string) => {
  const locale = getDateLocale(lang);

  const f = (iso: string) =>
    new Date(iso).toLocaleDateString(locale, {
      timeZone: TZ,
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  const start = f(a);
  const end = f(b);

  return start === end ? start : `${start} – ${end}`;
};

const itemSubtotal = (it: ItemRow) => it.amount ?? it.unitPrice * it.quantity;
const itemMinutes = (it: ItemRow) =>
  (it.sessions ?? []).reduce((s, x) => s + x.durationMin, 0);

/* ------------------------------------------------------------------ */
/* Layout Grid & Status Colors                                         */
/* ------------------------------------------------------------------ */

const MAIN_COLS = "minmax(180px, 1fr) 190px 150px 44px";
const SESSION_COLS =
  "48px minmax(120px, 1.2fr) minmax(150px, 1.4fr) 1fr 1fr 1fr";

const STATUS_STYLES: Record<string, { bg: string; fg: string; label: string }> =
  {
    DRAFT: {
      bg: "rgba(156, 163, 175, 0.15)",
      fg: "text",
      label: "Draft",
    },
    PENDING: {
      bg: "rgba(245, 158, 11, 0.15)",
      fg: "#f59e0b",
      label: "Pending",
    },
    PAID: {
      bg: "rgba(16, 185, 129, 0.15)",
      fg: "#10b981",
      label: "Paid",
    },
    CANCELED: {
      bg: "rgba(239, 68, 68, 0.15)",
      fg: "#ef4444",
      label: "Canceled",
    },
  };

const getStatusStyle = (status?: string) => {
  return STATUS_STYLES[status?.toUpperCase() || ""] || STATUS_STYLES.DRAFT;
};

/* ------------------------------------------------------------------ */
/* Components                                                         */
/* ------------------------------------------------------------------ */

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{
        transition: "transform 160ms ease",
        transform: open ? "rotate(180deg)" : "rotate(0deg)",
      }}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function Stat({
  label,
  value,
  color = "text",
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <Box sx={{ minWidth: 120 }}>
      <Text sx={{ display: "block", fontSize: 1, color: "secondary" }}>
        {label}
      </Text>
      <Text
        sx={{
          display: "block",
          fontSize: 4,
          fontWeight: 600,
          color: color,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value}
      </Text>
    </Box>
  );
}

function SessionsTable({ sessions }: { sessions: SessionRow[] }) {
  const { t, i18n } = useTranslation();
  const sorted = [...sessions].sort(
    (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime()
  );
  const total = sorted.reduce((s, x) => s + x.durationMin, 0);

  return (
    <Box
      sx={{
        borderTop: "1px solid",
        borderColor: "border",
        bg: "muted",
        p: 3,
      }}
    >
      <Box
        sx={{
          bg: "background",
          border: "1px solid",
          borderColor: "border",
          borderRadius: 8,
          overflow: "hidden",
        }}
      >
        <Flex
          sx={{
            justifyContent: "space-between",
            alignItems: "center",
            px: 3,
            py: 2,
            borderBottom: "1px solid",
            borderColor: "border",
          }}
        >
          <Text sx={{ fontWeight: 600, color: "text" }}>
            Sessions ({sorted.length})
          </Text>
          <Text sx={{ color: "secondary", fontSize: 1 }}>
            {t("teachers.totalDuration")}{" "}
            <Text as="span" sx={{ color: "text", fontWeight: 600 }}>
              {duration(total)}
            </Text>
          </Text>
        </Flex>

        <Box sx={{ overflowX: "auto" }}>
          <Box sx={{ minWidth: 560 }}>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: SESSION_COLS,
                px: 3,
                py: 2,
                bg: "muted",
                color: "secondary",
                fontSize: 1,
                fontWeight: 600,
              }}
            >
              <Text>#</Text>
              <Text>{t("groups.subject")}</Text>
              <Text>{t("hifdh.date")}</Text>
              <Text>{t("groups.startTime")}</Text>
              <Text>{t("groups.endTime")}</Text>
              <Text sx={{ textAlign: "right" }}>
                {t("recitation.duration")}
              </Text>
            </Box>

            {sorted.map((s, i) => (
              <Box
                key={s.id}
                sx={{
                  display: "grid",
                  gridTemplateColumns: SESSION_COLS,
                  px: 3,
                  py: 2,
                  fontSize: 2,
                  color: "text",
                  borderTop: "1px solid",
                  borderColor: "border",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                <Text sx={{ color: "secondary" }}>{i + 1}</Text>
                <Text>{s.schedule?.subject?.name ?? "—"}</Text>
                <Text>{fmtDate(s.startAt)}</Text>
                <Text>{fmtTime(s.startAt, i18n.language)}</Text>
                <Text>{fmtTime(s.endAt, i18n.language)}</Text>
                <Text sx={{ textAlign: "right" }}>
                  {duration(s.durationMin)}
                </Text>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

function GroupRow({ item }: { item: ItemRow }) {
  const [open, setOpen] = useState(false);
  const sessions = item.sessions ?? [];
  const minutes = itemMinutes(item);
  const hasSessions = sessions.length > 0;
  const name = item.assignment?.group?.name ?? item.description ?? "Payment";

  return (
    <Box sx={{ borderTop: "1px solid", borderColor: "border" }}>
      <Box
        as={hasSessions ? "button" : "div"}
        aria-expanded={hasSessions ? open : undefined}
        onClick={hasSessions ? () => setOpen((v) => !v) : undefined}
        sx={{
          all: "unset",
          boxSizing: "border-box",
          width: "100%",
          display: "grid",
          gridTemplateColumns: MAIN_COLS,
          alignItems: "center",
          px: 4,
          py: 3,
          cursor: hasSessions ? "pointer" : "default",
          "&:hover": hasSessions ? { bg: "muted" } : undefined,
        }}
      >
        <Box>
          <Text sx={{ display: "block", fontWeight: 600, color: "text" }}>
            {name}
          </Text>
          <Text
            sx={{ display: "block", fontSize: 1, color: "secondary", mt: 1 }}
          >
            {hasSessions
              ? `${sessions.length} session${
                  sessions.length > 1 ? "s" : ""
                } · ${duration(minutes)}`
              : item.description}
          </Text>
        </Box>

        <Text
          sx={{
            color: "text",
            fontVariantNumeric: "tabular-nums",
            textAlign: "right",
          }}
        >
          {num(item.quantity)} × {num(item.unitPrice)}
        </Text>

        <Text
          sx={{
            fontWeight: 600,
            color: "text",
            fontVariantNumeric: "tabular-nums",
            textAlign: "right",
          }}
        >
          {money(itemSubtotal(item))}
        </Text>

        <Flex sx={{ justifyContent: "center", color: "secondary" }}>
          {hasSessions && <Chevron open={open} />}
        </Flex>
      </Box>

      {open && hasSessions && <SessionsTable sessions={sessions} />}
    </Box>
  );
}

/* ------------------------------------------------------------------ */
/* Main Page                                                          */
/* ------------------------------------------------------------------ */

export function PayrollDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const { data, loading, error } = usePayrollsQuery({
    variables: { where: { id }, offset: 0, limit: 1 },
    skip: !id,
  });

  const payroll =
    (data?.payrolls && data.payrolls.__typename === "TeacherPayrollConnection"
      ? (data.payrolls.edges?.[0]?.node as unknown as PayrollNode | undefined)
      : undefined) ?? null;

  if (loading) {
    return (
      <Layout>
        <Box sx={{ p: 4 }}>
          <Text sx={{ color: "secondary" }}>Loading payroll…</Text>
        </Box>
      </Layout>
    );
  }

  if (error || !payroll) {
    return (
      <Layout>
        <Box sx={{ p: 4 }}>
          <Text sx={{ display: "block", color: "text", fontWeight: 600 }}>
            {error ? "Could not load this payroll" : "Payroll not found"}
          </Text>
        </Box>
      </Layout>
    );
  }

  const teacherName = `${payroll.teacher.firstName} ${payroll.teacher.lastName}`;
  const st = getStatusStyle(payroll.status);
  const items = payroll.items ?? [];
  const bonus = payroll.bonusAmount ?? 0;
  const deduction = payroll.deductionAmount ?? 0;
  const net = payroll.netAmount ?? payroll.grossAmount + bonus - deduction;

  return (
    <Layout>
      <Box sx={{ p: 4, maxWidth: 1200, mx: "auto", width: "100%" }}>
        <Flex sx={{ alignItems: "center", gap: 3, mb: 4 }}>
          <Button
            onClick={() => navigate(-1)}
            sx={{ bg: "muted", color: "text", cursor: "pointer" }}
          >
            {t("common.back")}
          </Button>

          <Text as="h1" sx={{ fontSize: 5, fontWeight: "bold", color: "text" }}>
            {t("teachers.payrollDetails")}
          </Text>
        </Flex>

        {/* ---------- Header ---------- */}
        <Box
          sx={{
            bg: "background",
            border: "1px solid",
            borderColor: "border",
            borderRadius: 10,
            p: 4,
            mb: 4,
          }}
        >
          <Flex
            sx={{
              flexWrap: "wrap",
              gap: 4,
              alignItems: "flex-end",
              justifyContent: "space-between",
            }}
          >
            <Box sx={{ flex: "1 1 240px" }}>
              <Flex sx={{ alignItems: "center", gap: 2 }}>
                <Text sx={{ fontSize: 5, fontWeight: 700, color: "text" }}>
                  {teacherName}
                </Text>
                <Text
                  sx={{
                    bg: st.bg,
                    color: st.fg,
                    fontSize: 0,
                    fontWeight: 600,
                    px: 2,
                    py: "2px",
                    borderRadius: 999,
                  }}
                >
                  {st.label}
                </Text>
              </Flex>
              <Text sx={{ display: "block", color: "secondary", mt: 1 }}>
                {fmtRange(
                  payroll.periodStart,
                  payroll.periodEnd,
                  i18n.language
                )}
              </Text>
            </Box>

            <Flex sx={{ gap: 4, flexWrap: "wrap" }}>
              <Stat
                label={t("teachers.grossAmount")}
                value={money(payroll.grossAmount)}
              />
              {bonus > 0 && (
                <Stat label="Bonus (+)" value={money(bonus)} color="#10b981" />
              )}
              {deduction > 0 && (
                <Stat
                  label={t("teachers.deduction")}
                  value={money(deduction)}
                  color="#ef4444"
                />
              )}
              <Stat
                label={t("teachers.netAmount")}
                value={money(net)}
                color="primary"
              />
            </Flex>
          </Flex>
        </Box>

        {/* ---------- Groups card ---------- */}
        <Box
          sx={{
            bg: "background",
            border: "1px solid",
            borderColor: "border",
            borderRadius: 10,
            overflow: "hidden",
            mb: 4,
          }}
        >
          <Box sx={{ overflowX: "auto" }}>
            <Box sx={{ minWidth: 640 }}>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: MAIN_COLS,
                  px: 4,
                  py: 2,
                  bg: "muted",
                  color: "secondary",
                  fontSize: 1,
                  fontWeight: 600,
                }}
              >
                <Text>{t("teachers.group/Assignment")}</Text>
                <Text sx={{ textAlign: "right" }}>
                  {t("teachers.qtyXunitprice")}
                </Text>
                <Text sx={{ textAlign: "right" }}>
                  {t("teachers.subtotal")}
                </Text>
                <Text />
              </Box>

              {items.length === 0 ? (
                <Box sx={{ p: 4 }}>
                  <Text sx={{ color: "secondary" }}>
                    This payroll has no line items.
                  </Text>
                </Box>
              ) : (
                items.map((it, i) => <GroupRow key={it.id ?? i} item={it} />)
              )}
            </Box>
          </Box>
        </Box>

        {/* ---------- Total Summary Card ---------- */}
        <Box
          sx={{
            bg: "background",
            border: "1px solid",
            borderColor: "border",
            borderRadius: 10,
            p: 4,
          }}
        >
          <Flex
            sx={{
              justifyContent: "space-between",
              alignItems: "baseline",
              mb: 2,
            }}
          >
            <Text sx={{ fontSize: 2, color: "secondary" }}>
              {t("teachers.grossAmount")}
            </Text>
            <Text sx={{ fontSize: 3, fontWeight: 600, color: "text" }}>
              {money(payroll.grossAmount)}
            </Text>
          </Flex>

          {bonus > 0 && (
            <Flex
              sx={{
                justifyContent: "space-between",
                alignItems: "baseline",
                mb: 2,
              }}
            >
              <Text sx={{ fontSize: 2, color: "#10b981" }}>Bonus (+)</Text>
              <Text sx={{ fontSize: 3, fontWeight: 600, color: "#10b981" }}>
                + {money(bonus)}
              </Text>
            </Flex>
          )}

          {deduction > 0 && (
            <Flex
              sx={{
                justifyContent: "space-between",
                alignItems: "baseline",
                mb: 2,
              }}
            >
              <Text sx={{ fontSize: 2, color: "#ef4444" }}>
                {t("teachers.deduction")}
              </Text>
              <Text sx={{ fontSize: 3, fontWeight: 600, color: "#ef4444" }}>
                - {money(deduction)}
              </Text>
            </Flex>
          )}

          <Box sx={{ borderTop: "1px solid", borderColor: "border", my: 3 }} />

          <Flex
            sx={{ justifyContent: "space-between", alignItems: "baseline" }}
          >
            <Text sx={{ fontSize: 3, fontWeight: 600, color: "text" }}>
              {t("teachers.totalNetPayroll")}
            </Text>
            <Text
              sx={{
                fontSize: 5,
                fontWeight: 700,
                color: "primary",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {money(net)}
            </Text>
          </Flex>
        </Box>
        <Box sx={{ mb: 3 }}>
          <Label
            htmlFor="notes"
            sx={{ display: "block", mb: 2, fontWeight: "bold" }}
          >
            {t("recitation.notes")}
          </Label>
          <Textarea
            id="notes"
            readOnly
            value={payroll?.note || ""}
            sx={{
              width: "100%",
              p: 2,
              borderRadius: "base",
              border: "1px solid",
              minHeight: "100px",
              bg: "offset",
              resize: "none",
            }}
          />
        </Box>
      </Box>
    </Layout>
  );
}
