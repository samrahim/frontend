import { useState } from "react";
import { Box, Button, Input, Label, Heading, Checkbox, Text } from "theme-ui";
import {
  TransactionsType,
  useCreateTransactionMutation,
  useInvoicesQuery,
} from "../graphql";
import { SelectStudentInput } from "../components/StudentComponents/SelectStudentInput";
import { t } from "i18next";
import { Layout } from "../components/Layout";
import { PageLayout } from "../components/PageLayout";
import { printInvoice } from "../utils/printInvoice";
import { useAuth } from "../contexts/AuthContext";

export function PayInvoicePage() {
  const [formData, setFormData] = useState({
    studentID: "",
    invoicesids: [] as string[],
    amount: 0,
    type: TransactionsType.Credit, // Hardcoded to Credit
  });

  // 1. Dynamically fetch invoices belonging to the selected student
  const { data, loading, error } = useInvoicesQuery({
    variables: {
      where: {
        hasStudentWith: formData.studentID
          ? [{ idIn: [formData.studentID] }]
          : [],
      },
    },
    skip: !formData.studentID, // Don't run the query until a student is selected
  });

  const [createTransaction, { loading: mutationLoading }] =
    useCreateTransactionMutation();

  // Extract invoice nodes safely from GraphQL edges
  const invoices = data?.invoices?.edges?.map((edge) => edge?.node) || [];

  // Filter out invoices that are already fully paid
  const unpaidInvoices = invoices.filter(
    (invoice) => invoice && invoice.amountDue !== invoice.amountPaid
  );

  const handleStudentChange = (studentID: string | string[]) => {
    const selectedId = Array.isArray(studentID) ? studentID[0] : studentID;
    setFormData((prev) => ({
      ...prev,
      studentID: selectedId,
      invoicesids: [], // Reset selected invoices when switching students
      amount: 0, // Reset amount
    }));
  };

  // Toggle invoice selection and calculate the total amount automatically
  const handleInvoiceToggle = (invoiceId: string) => {
    setFormData((prev) => {
      const isSelected = prev.invoicesids.includes(invoiceId);
      const newInvoiceIds = isSelected
        ? prev.invoicesids.filter((id) => id !== invoiceId)
        : [...prev.invoicesids, invoiceId];

      // Auto-calculate total amount based on selected unpaid invoices
      const newAmount = newInvoiceIds.reduce((total, id) => {
        const inv = unpaidInvoices.find((i) => i?.id === id);
        const balance = (inv?.amountDue || 0) - (inv?.amountPaid || 0);
        return total + balance;
      }, 0);

      return {
        ...prev,
        invoicesids: newInvoiceIds,
        amount: newAmount,
      };
    });
  };
  const invoicesToPrint: any[] = [];
  const formatServerDate = (dateString: string) => {
    if (!dateString) return "";
    const datePart = dateString.split("T")[0];
    const [year, month, day] = datePart.split("-");
    return `${day}/${month}/${year}`;
  };
  const { user } = useAuth();
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.studentID || formData.invoicesids.length === 0) return;

    // 1. Show confirmation dialog before sending request
    const confirmMessage =
      t("invoice.confirmPayment") ||
      "Are you sure you want to submit this payment?";
    if (!window.confirm(confirmMessage)) {
      return; // Cancel submission if user hits "Cancel"
    }

    try {
      const response = await createTransaction({
        variables: {
          input: {
            studentID: formData.studentID,
            invoiceIDs: formData.invoicesids,
            amount: parseFloat(formData.amount.toString()),
            type: formData.type,
          },
        },
      });

      alert(t("payment.success") || "Payment registered successfully!");

      // 2. Map and print each selected invoice matching printInvoice layout expectations
      formData.invoicesids.forEach((id) => {
        const selectedInvoice = unpaidInvoices.find((inv) => inv?.id === id);
        if (selectedInvoice) {
          // Fallback parsing for student name details if available
          const studentName = selectedInvoice.enrollment?.student?.firstName
            ? `${selectedInvoice.enrollment?.student.firstName || ""} ${
                selectedInvoice.enrollment?.student.lastName || ""
              }`.trim()
            : "N/A";
          invoicesToPrint.push({
            id: selectedInvoice.id,
            studentName: studentName,
            group: selectedInvoice.enrollment?.group?.name || "N/A",
            billingUnit: selectedInvoice.amountPaid || "N/A",
            createdAt: formatServerDate(selectedInvoice.createdAt),
            // Use current date as fallback for payment date
            paidDate: formatServerDate(new Date().toISOString()),
            status: "PAID",
            amountDue: selectedInvoice.amountDue || 0,
            amountPaid: selectedInvoice.amountDue || 0, // Assuming full remaining balance payment
            cashier: user,
          });
          if (invoicesToPrint.length > 0) {
            printInvoice(invoicesToPrint);
          }
        }
      });

      // 3. Reset form state after print triggers
      setFormData({
        studentID: "",
        invoicesids: [],
        amount: 0,
        type: TransactionsType.Credit,
      });
    } catch (err) {
      console.error("Error creating transaction:", err);
    }
  };

  return (
    <Layout>
      <PageLayout title="Invoices" description="Pay student invoices">
        <Box
          as="form"
          onSubmit={handleSubmit}
          sx={{ p: 4, maxWidth: "600px", mx: "auto" }}
        >
          {/* Student Selection */}
          <Box mb={3}>
            <SelectStudentInput
              onChange={handleStudentChange}
              label={t("students.title")}
              placeholder={t("common.searchPlaceholder")}
            />
          </Box>

          {/* Invoice Selection Checklist */}
          {formData.studentID && (
            <Box
              mb={4}
              sx={{
                border: "1px solid #eee",
                p: 3,
                borderRadius: 4,
                bg: "#f9f9f9",
              }}
            >
              <Heading as="h3" sx={{ fontSize: 2, mb: 2 }}>
                {t("invoices.chooseInvoices") || "Select Invoices to Pay"}
              </Heading>

              {loading && (
                <Text>{t("common.loading") || "Loading invoices..."}</Text>
              )}
              {error && <Text sx={{ color: "red" }}>{error.message}</Text>}

              {!loading && unpaidInvoices.length === 0 && (
                <Text sx={{ color: "secondary" }}>
                  {t("invoice.noInvoices") ||
                    "No outstanding invoices found for this student."}
                </Text>
              )}

              {unpaidInvoices.map((invoice) => {
                if (!invoice) return null;
                return (
                  <Label
                    key={invoice.id}
                    sx={{
                      mb: 2,
                      display: "flex",
                      alignItems: "center",
                      cursor: "pointer",
                    }}
                  >
                    <Checkbox
                      checked={formData.invoicesids.includes(invoice.id)}
                      onChange={() => handleInvoiceToggle(invoice.id)}
                    />

                    <Box sx={{ ml: 2 }}>
                      <Text sx={{ fontWeight: "bold" }}>
                        Group: {invoice.enrollment?.group.name}
                      </Text>

                      {/* Formatted Date Display */}
                      {invoice.createdAt && (
                        <Text sx={{ fontSize: 1, color: "gray" }}>
                          {t("students.createdAt")}:{" "}
                          {formatServerDate(invoice.createdAt)}
                        </Text>
                      )}
                    </Box>
                  </Label>
                );
              })}
            </Box>
          )}

          {/* Payment Details */}
          {formData.invoicesids.length > 0 && (
            <Box>
              <Box mb={3}>
                <Label htmlFor="amount">
                  {t("invoice.amount") || "Payment Amount"}
                </Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  readOnly
                  sx={{
                    bg: "#eaeaea",
                    color: "#555",
                    cursor: "not-allowed",
                  }}
                />
              </Box>

              <Button
                type="submit"
                disabled={mutationLoading}
                sx={{ width: "100%" }}
              >
                {mutationLoading
                  ? t("common.processing") || "Processing..."
                  : t("invoice.submitPayment") || "Submit Payment"}
              </Button>
            </Box>
          )}
        </Box>
      </PageLayout>
    </Layout>
  );
}
