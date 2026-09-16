import { Box, Button, Divider, Flex, Text } from "theme-ui";
import {
  InvoiceEdge,
  TransactionsType,
  useCreateTransactionMutation,
  useInvoicesQuery,
} from "../graphql";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import i18n from "../i18n/i18n";
import { useEffect, useMemo, useState } from "react";
import { t } from "i18next";
import { printInvoice } from "../utils/printInvoice";
import { useAuth } from "../contexts/AuthContext";
import { useNotifications } from "../providers/NotificationProvider";
const columnHelper = createColumnHelper<any>();

interface InvoiceFilters {
  search: string;
  groupId: string;
  month: string;
}

export function InvoiceTable({ search, groupId, month }: InvoiceFilters) {
  const limit = 10;
  const [after, setAfter] = useState<string | null>(null);
  const [cursorHistory, setCursorHistory] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const where = useMemo(() => {
    const w: any = {};

    // Student search
    if (search.trim()) {
      w.hasEnrollmentWith = {
        hasStudentWith: {
          or: [
            {
              firstNameContainsFold: search,
            },
            {
              lastNameContainsFold: search,
            },
          ],
        },
      };
    }

    // Group
    if (groupId) {
      w.hasEnrollmentWith = {
        ...w.hasEnrollmentWith,
        hasGroupWith: {
          id: groupId,
        },
      };
    }

    // Month
    if (month) {
      const [year, monthn] = month.split("-");

      const start = new Date(Number(year), Number(monthn) - 1, 1);

      const end = new Date(Number(year), Number(monthn), 0, 23, 59, 59);

      w.createdAtGTE = start.toISOString();
      w.createdAtLTE = end.toISOString();
    }

    return w;
  }, [search, groupId, month]);
  const { addNotification } = useNotifications();
  const { data, loading } = useInvoicesQuery({
    variables: {
      where,
      first: limit,
      after,
    },
    notifyOnNetworkStatusChange: true,
  });
  const { invoices, edges } = useMemo(() => {
    const rawEdges = (data?.invoices?.edges ?? []).filter(
      (edge): edge is InvoiceEdge => edge != null
    );

    const mappedInvoices = rawEdges.map(
      (edge: InvoiceEdge | undefined | null) => {
        const invoice = edge?.node;
        const amountDue = invoice?.amountDue ?? 0;
        const amountPaid = invoice?.amountPaid ?? 0;

        let status = "Unpaid";
        if (amountPaid >= amountDue) {
          status = "Paid";
        } else if (amountPaid > 0) {
          status = "Partial";
        }

        let cashierName = "";
        if (invoice?.transactions && invoice.transactions.length > 0) {
          const cashier = invoice.transactions[0].cashier;
          if (cashier) {
            cashierName = `${cashier.lastName || ""} ${
              cashier.firstName || ""
            }`.trim();
          }
        }

        return {
          id: invoice?.id,
          studentName: invoice?.enrollment?.student
            ? `${invoice.enrollment.student.firstName} ${invoice.enrollment.student.lastName}`
            : "",
          studentId: invoice?.enrollment?.student
            ? invoice?.enrollment?.student.id
            : "",
          group: invoice?.enrollment?.group?.name ?? "",
          billingUnit: invoice?.enrollment?.group?.billingUnit ?? "",
          amountDue,
          amountPaid,
          status,
          createdAt: invoice?.createdAt
            ? new Date(invoice.createdAt).toLocaleDateString()
            : "",
          paidDate: invoice?.paidDate
            ? new Date(invoice.paidDate).toLocaleDateString()
            : "-",
          transactionsCount: invoice?.transactions?.length ?? 0,
          cashierName: cashierName,
        };
      }
    );

    return {
      invoices: mappedInvoices,
      edges: rawEdges,
    };
  }, [data]);

  const hasNext = edges.length === limit;
  const hasPrev = cursorHistory.length > 0;
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { user } = useAuth();
  const [payInovoice] = useCreateTransactionMutation();
  const handleConfirmPayment = async (
    amount: number,
    studentId: string,
    invoiceId: string
  ) => {
    const r = await payInovoice({
      update(cache, { data }) {
        const invoicer = data?.createTransaction?.invoice;

        if (!invoicer) return;

        cache.modify({
          id: cache.identify({
            __typename: "Invoice",
            id: invoicer[0].id,
          }),

          fields: {
            amountPaid() {
              return invoicer[0].amountPaid;
            },

            paidDate() {
              return invoicer[0].paidDate;
            },
          },
        });
      },
      variables: {
        input: {
          amount: amount,
          studentID: studentId,
          cashierID: String(user?.id),
          invoiceIDs: [invoiceId],
          type: TransactionsType.Credit,
        },
      },
    });

    console.log(r);
    setIsDialogOpen(false);
    setStudentId("");
    setInvoiceId("");
    setInvoiceAmount(0);
    console.log("Payment confirmed");
  };
  const handleNext = () => {
    if (!hasNext || loading) return;

    const lastCursor = edges[edges.length - 1]?.cursor;
    if (!lastCursor) return;

    setCursorHistory((prev) => [...prev, after ?? ""]);
    setAfter(lastCursor);
    setPage((p) => p + 1);
  };
  const [selectedStudentId, setStudentId] = useState("");
  const [selectedInvoiceId, setInvoiceId] = useState("");
  const [selectedInvoiceAmount, setInvoiceAmount] = useState(0);
  const handlePrev = () => {
    if (!hasPrev || loading) return;

    const history = [...cursorHistory];
    const previousCursor = history.pop()!;

    setCursorHistory(history);
    setAfter(previousCursor || null);
    setPage((p) => Math.max(1, p - 1));
  };

  useEffect(() => {
    setAfter(null);
    setCursorHistory([]);
    setPage(1);
  }, [search, groupId, month]);
  const isRTL = i18n.dir() === "rtl";
  function formatDate(value?: string | Date | null) {
    if (!value) return "-";

    const date = value instanceof Date ? value : new Date(value);

    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();

    return `${day}-${month}-${year}`;
  }
  const columns = useMemo(
    () => [
      columnHelper.accessor("studentName", {
        header: () => `${t("students.name")}`,
      }),
      columnHelper.accessor("group", {
        header: () => `${t("groups.groupName")}`,
      }),
      columnHelper.accessor("billingUnit", {
        header: () => `${t("common.billingUnit")}`,
      }),
      columnHelper.accessor("amountDue", {
        header: () => `${t("invoices.amountDue")}`,
      }),
      columnHelper.accessor("amountPaid", {
        header: () => `${t("invoices.amountpaid")}`,
      }),

      columnHelper.accessor("status", {
        header: () => `${t("session.status")}`,
        cell: (info) => {
          const status = info.getValue();
          if (status === "Paid") return "✅ Paid";
          if (status === "Partial") return "🟡 Partial";
          return "❌ Unpaid";
        },
      }),
      columnHelper.accessor("createdAt", {
        header: () => `${t("students.createdAt")}`,
        cell: (info) => <Text>{formatDate(info.getValue())}</Text>,
      }),
      columnHelper.accessor("paidDate", {
        header: () => `${t("invoices.paidAt")}`,
        cell: (info) => <Text>{formatDate(info.getValue())}</Text>,
      }),
      columnHelper.display({
        id: "actions",
        header: t("common.actions"),
        cell: (info) => {
          const isPaid =
            info.row.original.amountPaid! >= info.row.original.amountDue;

          return (
            <Flex sx={{ gap: 2 }}>
              <Button
                disabled={isPaid}
                onClick={() => {
                  if (isPaid) return;

                  setStudentId(info.row.original.studentId);
                  setInvoiceId(info.row.original.id);
                  setInvoiceAmount(
                    info.row.original.amountDue - info.row.original.amountPaid
                  );
                  setIsDialogOpen(true);
                }}
                sx={{
                  px: 3,
                  py: 2,
                  bg: isPaid ? "muted" : "primary",
                  color: "white",
                  fontSize: 0,
                  fontWeight: 500,
                  cursor: isPaid ? "not-allowed" : "pointer",
                  borderRadius: "md",
                  border: "none",
                  opacity: isPaid ? 0.6 : 1,
                  "&:hover": isPaid ? {} : { opacity: 0.8 },
                }}
              >
                {isPaid ? "Paid" : "Pay"}
              </Button>

              <Button
                onClick={() => printInvoice([info.row.original])}
                type="button"
                sx={{
                  px: 3,
                  py: 2,
                  bg: "secondary",
                  color: "white",
                  fontSize: 0,
                  fontWeight: 500,
                  cursor: "pointer",
                  borderRadius: "md",
                  border: "none",
                  "&:hover": { opacity: 0.8 },
                }}
              >
                {t("invoices.print")}
              </Button>
            </Flex>
          );
        },
      }),
    ],
    [t]
  );

  const table = useReactTable({
    data: invoices,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const totalColumns = columns.length;

  return (
    <Box
      sx={{
        overflowX: "auto",
        mb: 2,
        mt: 4,
        direction: isRTL ? "rtl" : "ltr",
        flex: 1,
        width: "100%",
        bg: "tableBackground",
        p: 3,
        borderRadius: "md",
        border: "1px solid",
        borderColor: "border",
      }}
    >
      {isDialogOpen && (
        <Box
          sx={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            bg: "rgba(0, 0, 0, 0.5)", // Semi-transparent dim background
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          {/* Dialog Container */}
          <Box
            sx={{
              width: "100%",
              maxWidth: "400px",
              p: 4,
              borderRadius: "lg",
              // Theme UI adaptive variables mapping to light/dark themes
              bg: "background",
              color: "text",
              border: "1px solid",
              borderColor: "muted",
              boxShadow: "0px 10px 25px rgba(0, 0, 0, 0.15)",
            }}
          >
            {/* Dialog Header */}
            <Text sx={{ fontSize: 3, fontWeight: "bold", mb: 2 }}>
              {t("payment.confirmTitle") || "Confirm Payment"}
            </Text>

            {/* Dialog Content Text */}
            <Text
              sx={{
                fontSize: 1,
                color: "text",
                opacity: 0.8,
                mb: 4,
                display: "block",
              }}
            >
              {t("payment.confirmMessage") ||
                "Are you sure you want to proceed with this payment? This action cannot be undone."}
            </Text>

            {/* Actions Row */}
            <Flex sx={{ justifyContent: "flex-end", gap: 3 }}>
              {/* Cancel Button */}
              <Button
                onClick={() => setIsDialogOpen(false)}
                sx={{
                  px: 3,
                  py: 2,
                  bg: "transparent",
                  color: "text",
                  border: "1px solid",
                  borderColor: "muted",
                  borderRadius: "md",
                  cursor: "pointer",
                  fontWeight: "body",
                  "&:hover": {
                    bg: "muted",
                    opacity: 0.9,
                  },
                }}
              >
                {t("common.cancel") || "Cancel"}
              </Button>

              {/* Confirm Button */}
              <Button
                onClick={() => {
                  handleConfirmPayment(
                    selectedInvoiceAmount,
                    selectedStudentId,
                    selectedInvoiceId
                  );
                }}
                sx={{
                  px: 3,
                  py: 2,
                  bg: "primary",
                  color: "white",
                  border: "none",
                  borderRadius: "md",
                  cursor: "pointer",
                  fontWeight: "medium",
                  "&:hover": {
                    opacity: 0.9,
                  },
                }}
              >
                {t("common.confirm") || "Confirm"}
              </Button>
            </Flex>
          </Box>
        </Box>
      )}
      <Box
        as="table"
        sx={{
          width: "100%",
          borderCollapse: "collapse",
        }}
      >
        <Box as="thead">
          {table.getHeaderGroups().map((headerGroup) => (
            <Box as="tr" key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <Box
                  as="th"
                  key={header.id}
                  sx={{
                    bg: "tableHeaderBackground", // ✅ Changed from 'muted' to use specific theme header colors
                    color: "tableHeaderText", // ✅ High contrast context coloring
                    p: 3,
                    borderBottom: "2px solid",
                    borderColor: "tableBorder",
                    textAlign: isRTL ? "right" : "left",
                  }}
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                </Box>
              ))}
            </Box>
          ))}
        </Box>
        <Box as="tbody">
          {loading && invoices.length === 0 ? (
            <Box as="tr">
              <td
                colSpan={totalColumns}
                style={{ padding: "0" }} // Resets default padding if needed
              >
                <Box
                  sx={{
                    p: 3,
                    textAlign: "center",
                    borderBottom: "1px solid",
                    borderColor: "tableBorder",
                    color: "tableText",
                  }}
                >
                  Loading invoices...
                </Box>
              </td>
            </Box>
          ) : invoices.length === 0 ? (
            <Box as="tr">
              <td
                colSpan={totalColumns}
                style={{ padding: "0" }} // Resets default padding if needed
              >
                <Box
                  sx={{
                    p: 3,
                    textAlign: "center",
                    borderBottom: "1px solid",
                    borderColor: "tableBorder",
                    color: "tableText",
                  }}
                >
                  {t("invoices.noRecords")}
                </Box>
              </td>
            </Box>
          ) : (
            table.getRowModel().rows.map((row) => (
              <Box
                as="tr"
                key={row.id}
                sx={{
                  opacity: loading ? 0.6 : 1,
                  transition: "opacity 0.2s ease, background-color 0.2s ease",
                  "&:hover": { bg: "tableRowHover" },
                  // Optional stripes using theme properties:
                  "&:nth-of-type(odd)": { bg: "tableRowStripe" },
                }}
              >
                {row.getVisibleCells().map((cell) => (
                  <Box
                    as="td"
                    key={cell.id}
                    sx={{
                      p: 3,
                      borderBottom: "1px solid",
                      borderColor: "tableBorder",
                      textAlign: isRTL ? "right" : "left",
                      fontSize: 2,
                      color: "tableText", // ✅ Swapped global text for specialized tableText token
                    }}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </Box>
                ))}
              </Box>
            ))
          )}
        </Box>
      </Box>
      <Divider sx={{ my: 3 }} />
      <Flex sx={{ justifyContent: "space-between", alignItems: "center" }}>
        <Button onClick={handlePrev} disabled={!hasPrev || loading}>
          {t("common.previous")}
        </Button>
        <Text sx={{ fontSize: 2, fontWeight: "bold", color: "text" }}>
          Page {page}
        </Text>
        <Button onClick={handleNext} disabled={!hasNext || loading}>
          {t("common.next")}
        </Button>
      </Flex>
    </Box>
  );
}
