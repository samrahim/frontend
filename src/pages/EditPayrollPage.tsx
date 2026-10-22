import React, { useEffect, useState } from "react";
import {
  Box,
  Flex,
  Text,
  Heading,
  Button,
  Input,
  Select,
  Textarea,
  Card,
  Spinner,
  Label,
  Badge,
} from "theme-ui";
import { useNavigate, useParams } from "react-router-dom";
import {
  TeacherPayrollStatus,
  usePayrollsQuery,
  useUpdatePayrollMutation,
} from "../graphql";
import { Layout } from "../components/Layout";
import { t } from "i18next";

// Helper function to format ISO date string to DD/MM/YYYY
const formatDateToDDMMYYYY = (dateString?: string | null): string => {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "";
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

export function UpdateTeacherPayroll() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // 1. Fetch current payroll details
  const { data, loading, error } = usePayrollsQuery({
    variables: { where: { id }, offset: 0, limit: 1 },
    skip: !id,
  });

  const [updatePayroll, { loading: updating }] = useUpdatePayrollMutation();

  const payroll =
    data?.payrolls && data.payrolls.__typename === "TeacherPayrollConnection"
      ? data.payrolls.edges?.[0]?.node
      : null;

  // 2. Local Form State (Restricted to Status, Bonus, Deduction, Note)
  const [status, setStatus] = useState<TeacherPayrollStatus>(
    TeacherPayrollStatus.Draft
  );
  const [grossAmount, setGrossAmount] = useState<number>(0);
  const [bonusAmount, setBonusAmount] = useState<number>(0);
  const [deductionAmount, setDeductionAmount] = useState<number>(0);
  const [note, setNote] = useState<string>("");

  // Initial loaded values for comparison (to detect changes)
  const [initialState, setInitialState] = useState({
    status: TeacherPayrollStatus.Draft,
    bonusAmount: 0,
    deductionAmount: 0,
    note: "",
  });

  // Read-only display states (Formatted as DD/MM/YYYY)
  const [periodStart, setPeriodStart] = useState<string>("");
  const [periodEnd, setPeriodEnd] = useState<string>("");
  const [createdAt, setcreatedAt] = useState<string>("");

  // Sync state when data arrives
  useEffect(() => {
    if (payroll) {
      const currentStatus = payroll.status || TeacherPayrollStatus.Draft;
      const currentBonus = payroll.bonusAmount ?? 0;
      const currentDeduction = payroll.deductionAmount ?? 0;
      const currentNote = payroll.note ?? "";

      setStatus(currentStatus);
      setBonusAmount(currentBonus);
      setDeductionAmount(currentDeduction);
      setNote(currentNote);

      // Save initial state for change tracking
      setInitialState({
        status: currentStatus,
        bonusAmount: currentBonus,
        deductionAmount: currentDeduction,
        note: currentNote,
      });

      // Format dates to DD/MM/YYYY
      setPeriodStart(formatDateToDDMMYYYY(payroll.periodStart));
      setPeriodEnd(formatDateToDDMMYYYY(payroll.periodEnd));
      setcreatedAt(formatDateToDDMMYYYY(payroll.createdAt));

      // Compute gross amount from items or existing gross
      const itemsSum =
        payroll.items?.reduce((sum: number, it: any) => {
          const sub = it.amount ?? it.quantity * it.unitPrice;
          return it.type === "DEDUCTION" || it.type === "ABSENCE"
            ? sum - sub
            : sum + sub;
        }, 0) ??
        payroll.grossAmount ??
        0;

      setGrossAmount(itemsSum);
    }
  }, [payroll]);

  // Check if any changeable field has been modified
  const hasChanges =
    status !== initialState.status ||
    bonusAmount !== initialState.bonusAmount ||
    deductionAmount !== initialState.deductionAmount ||
    note !== initialState.note;

  // Computed Net Amount = Gross + Bonus - Deduction
  const computedNet =
    (grossAmount || 0) + (bonusAmount || 0) - (deductionAmount || 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !hasChanges) return;

    try {
      await updatePayroll({
        variables: {
          id,
          input: {
            status,
            bonusAmount: Number(bonusAmount),
            deductionAmount: Number(deductionAmount),
            netAmount: Number(computedNet),
            grossAmount: Number(grossAmount),
            note,
          },
        },
      });
      navigate(-1);
    } catch (err) {
      console.error("Error updating payroll:", err);
    }
  };

  if (loading) {
    return (
      <Layout>
        <Flex
          sx={{
            justifyContent: "center",
            alignItems: "center",
            height: "300px",
          }}
        >
          <Spinner size={48} />
        </Flex>
      </Layout>
    );
  }

  if (error || !payroll) {
    return (
      <Layout>
        <Card sx={{ p: 4, bg: "highlight", color: "text", borderRadius: 8 }}>
          <Heading as="h3">Payroll Not Found</Heading>
        </Card>
      </Layout>
    );
  }

  return (
    <Layout>
      <Box
        as="form"
        onSubmit={handleSubmit}
        sx={{ maxWidth: 1200, mx: "auto", p: 4, width: "100%" }}
      >
        {/* Header Bar */}
        <Flex
          sx={{ alignItems: "center", justifyContent: "space-between", mb: 4 }}
        >
          <Flex sx={{ alignItems: "center", gap: 3 }}>
            <Button
              type="button"
              onClick={() => navigate(-1)}
              sx={{ bg: "muted", color: "text", cursor: "pointer" }}
            >
              {t("common.back")}
            </Button>

            <Text
              as="h1"
              sx={{ fontSize: 5, fontWeight: "bold", color: "text" }}
            >
              {t("teachers.editpayrolldetails")}
            </Text>
          </Flex>

          {/* Conditional Save Button: Appears only if changes are made */}
          {hasChanges && (
            <Button
              type="submit"
              sx={{ bg: "primary", color: "white", cursor: "pointer" }}
              disabled={updating}
            >
              {updating ? <Spinner size={20} /> : t("common.save") || "Save"}
            </Button>
          )}
        </Flex>

        <Card
          sx={{
            p: 4,
            mb: 4,
            bg: "background",
            border: "1px solid",
            borderColor: "border",
            borderRadius: 8,
          }}
        >
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: ["1fr", "1fr 1fr"],
              gap: 3,
            }}
          >
            <Box>
              <Label htmlFor="status">{t("session.status")}</Label>
              <Select
                id="status"
                value={status}
                onChange={(e) =>
                  setStatus(e.target.value as TeacherPayrollStatus)
                }
              >
                <option value="DRAFT">{t("teachers.draft")}</option>
                <option value="PAID">{t("teachers.paid")}</option>
              </Select>
            </Box>

            <Box />

            <Box>
              <Label htmlFor="periodStart"> {t("teachers.startPeriod")}</Label>
              <Input
                id="periodStart"
                type="text"
                value={periodStart}
                disabled
              />
            </Box>

            <Box>
              <Label htmlFor="periodEnd">{t("teachers.endPeriod")}</Label>
              <Input id="periodEnd" type="text" value={periodEnd} disabled />
            </Box>

            <Box>
              <Label htmlFor="createdAt">{t("students.createdAt")}</Label>
              <Input id="createdAt" type="text" value={createdAt} disabled />
            </Box>
          </Box>
        </Card>

        {/* 2. Financial Amounts Section (Editable Bonus & Deduction) */}
        <Card
          sx={{
            p: 4,
            mb: 4,
            bg: "background",
            border: "1px solid",
            borderColor: "border",
            borderRadius: 8,
          }}
        >
          <Heading as="h3" sx={{ fontSize: 3, color: "text", mb: 3 }}>
            {t("teachers.financialBreakdown")}
          </Heading>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: ["1fr", "1fr 1fr 1fr"],
              gap: 3,
            }}
          >
            <Box>
              <Label htmlFor="grossAmount">{t("teachers.grossAmount")}</Label>
              <Input
                id="grossAmount"
                type="number"
                value={grossAmount}
                disabled
              />
            </Box>

            <Box>
              <Label htmlFor="bonusAmount">{t("teachers.bonus")}</Label>
              <Input
                id="bonusAmount"
                type="number"
                step="0.01"
                value={bonusAmount}
                onChange={(e) =>
                  setBonusAmount(parseFloat(e.target.value) || 0)
                }
              />
            </Box>

            <Box>
              <Label htmlFor="deductionAmount">{t("teachers.deduction")}</Label>
              <Input
                id="deductionAmount"
                type="number"
                step="0.01"
                value={deductionAmount}
                onChange={(e) =>
                  setDeductionAmount(parseFloat(e.target.value) || 0)
                }
              />
            </Box>
          </Box>

          {/* Computed Net Preview */}
          <Flex
            sx={{
              justifyContent: "space-between",
              alignItems: "center",
              bg: "muted",
              p: 3,
              mt: 4,
              borderRadius: 8,
            }}
          >
            <Text sx={{ fontWeight: 600, color: "text" }}>
              {t("teachers.calculateNetAmount")}
            </Text>
            <Text sx={{ fontSize: 4, fontWeight: "bold", color: "primary" }}>
              {computedNet} EURO
            </Text>
          </Flex>
        </Card>

        {/* 3. Notes Section */}
        <Card
          sx={{
            p: 4,
            bg: "background",
            border: "1px solid",
            borderColor: "border",
            borderRadius: 8,
          }}
        >
          <Heading as="h3" sx={{ fontSize: 3, color: "text", mb: 3 }}>
            {t("teachers.remarksandNotes")}
          </Heading>
          <Input
            id="note"
            name="note"
            value={note}
            onChange={(e) => {
              setNote(e.target.value);
            }}
            placeholder={t("teachers.notePlaceholder")}
            required
          />
        </Card>
      </Box>
    </Layout>
  );
}
