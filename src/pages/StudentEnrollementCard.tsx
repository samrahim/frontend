import React, { useState } from "react";
import { useParams } from "react-router-dom";
import {
  Box,
  Card,
  Flex,
  Text,
  Badge,
  Button,
  Grid,
  Divider,
  Spinner,
} from "theme-ui";
import {
  Calendar,
  CreditCard,
  User,
  CheckCircle2,
  Clock,
  Receipt,
  FileText,
  AlertTriangle,
  AlertCircle,
} from "lucide-react";
import { useEnrollemntInfoQuery } from "../graphql";

const normalizeHex = (color: number | string | null | undefined): string => {
  // If missing or null, return fallback green
  if (color === null || color === undefined) return "#16a34a";

  // If it's already a string hex code (e.g. "#16a34a" or "16a34a")
  if (typeof color === "string") {
    let clean = color.trim();
    if (!clean.startsWith("#")) clean = "#" + clean;
    if (clean.length === 9) clean = clean.slice(0, 7); // drop alpha if present
    return /^#[0-9A-Fa-f]{6}$/.test(clean) ? clean : "#16a34a";
  }

  // If it's a decimal number (e.g. 14687012 or 48340)
  if (typeof color === "number") {
    // Convert to hex, pad with leading zeros to ensure 6 characters
    const hex = color.toString(16).padStart(6, "0");
    return `#${hex}`;
  }

  return "#16a34a";
};
import { Layout } from "../components/Layout";

// 1. Infer exact GraphQL Node Type from generated Hook Return Type
type Edge = NonNullable<
  NonNullable<
    ReturnType<typeof useEnrollemntInfoQuery>["data"]
  >["courseEnrollments"]["edges"]
>[number];

export type CourseEnrollmentNode = NonNullable<NonNullable<Edge>["node"]>;

interface StudentEnrollmentCardProps {
  onRecordPayment?: (enrollmentNode: CourseEnrollmentNode) => void;
}

// Route Component
export const StudentEnrollmentCard: React.FC<StudentEnrollmentCardProps> = ({
  onRecordPayment,
}) => {
  // Extract route params matching path="/StudentEnrollmentCard/:groupId/:studentId"
  const { groupId, studentId } = useParams<{
    groupId: string;
    studentId: string;
  }>();

  // Execute Apollo Query with Ent / GraphQL where input syntax
  const { data, loading, error } = useEnrollemntInfoQuery({
    variables: {
      where: {
        and: [
          {
            hasStudentWith: [
              {
                id: studentId,
              },
            ],
            hasGroupWith: [
              {
                id: groupId,
              },
            ],
          },
        ],
      },
    },
    skip: !groupId || !studentId,
    fetchPolicy: "cache-and-network",
  });
  console.log(data);

  if (loading) {
    return (
      <Flex
        sx={{
          justifyContent: "center",
          alignItems: "center",
          p: 5,
          gap: 2,
        }}
      >
        <Spinner size={32} color="primary" />
        <Text sx={{ fontSize: 1, color: "subtle" }}>
          Loading enrollment details...
        </Text>
      </Flex>
    );
  }

  if (error) {
    return (
      <Card
        sx={{
          p: 4,
          m: 3,
          bg: "tableBackground",
          border: "1px solid",
          borderColor: "danger",
          borderRadius: "md",
        }}
      >
        <Flex sx={{ alignItems: "center", gap: 2, color: "danger", mb: 2 }}>
          <AlertTriangle size={20} />
          <Text sx={{ fontWeight: "bold", fontSize: 2 }}>
            Error fetching enrollment
          </Text>
        </Flex>
        <Text sx={{ fontSize: 1, color: "text", mb: 3 }}>{error.message}</Text>
      </Card>
    );
  }

  const rawNode = data?.courseEnrollments?.edges?.[0]?.node;
  const enrollmentNode: CourseEnrollmentNode | undefined = rawNode ?? undefined;

  if (!enrollmentNode) {
    return (
      <Card
        sx={{
          p: 4,
          m: 3,
          bg: "tableBackground",
          border: "1px dashed",
          borderColor: "border",
          borderRadius: "md",
          textAlign: "center",
        }}
      >
        <FileText size={32} style={{ opacity: 0.4 }} />
        <Text sx={{ fontSize: 2, fontWeight: "heading", mt: 2, color: "text" }}>
          No Enrollment Found
        </Text>
        <Text sx={{ fontSize: 1, color: "subtle", mt: 1 }}>
          Student #{studentId} is not enrolled in Group #{groupId}.
        </Text>
      </Card>
    );
  }

  return (
    <Layout>
      <StudentEnrollmentView
        enrollment={enrollmentNode}
        onRecordPayment={onRecordPayment}
      />
    </Layout>
  );
};

// Presentational View Component
const StudentEnrollmentView: React.FC<{
  enrollment: CourseEnrollmentNode;
  onRecordPayment?: (enrollmentNode: CourseEnrollmentNode) => void;
}> = ({ enrollment, onRecordPayment }) => {
  const [activeTab, setActiveTab] = useState<"schedule" | "invoices">(
    "schedule"
  );

  const {
    student,
    group,
    paymentPlans = [],
    invoices = [],
    discount,
    startAt,
    endAt,
  } = enrollment;

  // Financial Calculations
  const totalAmountDue =
    invoices?.reduce((acc, inv) => acc + (inv?.amountDue || 0), 0) || 0;
  const totalAmountPaid =
    invoices?.reduce((acc, inv) => acc + (inv?.amountPaid || 0), 0) || 0;
  const remainingBalance = totalAmountDue - totalAmountPaid;

  const getStatusBadge = () => {
    if (remainingBalance <= 0 && totalAmountDue > 0) {
      return <Badge variant="success">Fully Paid</Badge>;
    }
    if (totalAmountPaid > 0) {
      return <Badge variant="warning">Partially Paid</Badge>;
    }
    return <Badge variant="danger">Pending Payment</Badge>;
  };

  return (
    <Card
      sx={{
        m: 3,
        bg: "tableBackground",
        borderRadius: "lg",
        border: "1px solid",
        borderColor: "border",
        boxShadow: "sm",
        overflow: "hidden",
      }}
    >
      {/* 1. Header Banner */}
      <Box
        sx={{
          p: 3,
          bg: "primaryLight",
          borderBottom: "1px solid",
          borderColor: "border",
          borderLeft: "6px solid",
          borderLeftColor: normalizeHex(group?.color) || "primary",
        }}
      >
        <Flex sx={{ justifyContent: "space-between", alignItems: "center" }}>
          <Flex sx={{ alignItems: "center", gap: 2 }}>
            <Box
              sx={{
                p: 2,
                borderRadius: "full",
                bg: "primary",
                color: "white",
                display: "flex",
              }}
            >
              <User size={18} />
            </Box>
            <Box>
              <Text sx={{ fontSize: 2, fontWeight: "bold", color: "text" }}>
                {student?.firstName || ""} {student?.lastName || ""}
              </Text>
              <Text sx={{ fontSize: 0, color: "subtle" }}>
                Group: <strong>{group?.name}</strong> • Billing:{" "}
                <strong style={{ textTransform: "capitalize" }}>
                  {group?.billingUnit}
                </strong>
              </Text>
            </Box>
          </Flex>

          <Flex sx={{ alignItems: "center", gap: 2 }}>
            {getStatusBadge()}
            {discount ? (
              <Badge variant="info">Discount: {discount}%</Badge>
            ) : null}
          </Flex>
        </Flex>
      </Box>

      {/* 2. Key Summary Grid */}
      <Grid columns={[1, 3]} sx={{ p: 3, bg: "tableRowStripe", gap: 3 }}>
        <Box>
          <Text sx={{ fontSize: 0, color: "subtle" }}>Enrollment Duration</Text>
          <Flex sx={{ alignItems: "center", gap: 1, mt: 1 }}>
            <Calendar size={14} />
            <Text sx={{ fontSize: 1, fontWeight: "heading" }}>
              {new Date(startAt).toLocaleDateString()} -{" "}
              {endAt ? new Date(endAt).toLocaleDateString() : "Ongoing"}
            </Text>
          </Flex>
        </Box>

        <Box>
          <Text sx={{ fontSize: 0, color: "subtle" }}>Total Due / Paid</Text>
          <Text sx={{ fontSize: 1, fontWeight: "heading", color: "text" }}>
            ${totalAmountDue.toFixed(2)} /{" "}
            <span style={{ color: "var(--theme-ui-colors-success, #10B981)" }}>
              ${totalAmountPaid.toFixed(2)}
            </span>
          </Text>
        </Box>

        <Box sx={{ textAlign: ["left", "right"] }}>
          <Text sx={{ fontSize: 0, color: "subtle" }}>Remaining Balance</Text>
          <Text
            sx={{
              fontSize: 2,
              fontWeight: "bold",
              color: remainingBalance > 0 ? "danger" : "success",
            }}
          >
            ${remainingBalance.toFixed(2)}
          </Text>
        </Box>
      </Grid>

      <Divider sx={{ my: 0, borderColor: "border" }} />

      {/* 3. Tab Navigation */}
      <Flex
        sx={{
          bg: "muted",
          borderBottom: "1px solid",
          borderColor: "border",
        }}
      >
        <Button
          onClick={() => setActiveTab("schedule")}
          sx={{
            bg: activeTab === "schedule" ? "tableBackground" : "transparent",
            color: activeTab === "schedule" ? "primary" : "text",
            borderRadius: 0,
            py: 2,
            px: 3,
            fontSize: 1,
            fontWeight: "heading",
            borderBottom: activeTab === "schedule" ? "2px solid" : "none",
            borderColor: "primary",
            "&:hover": { bg: "tableRowHover" },
          }}
        >
          <Flex sx={{ alignItems: "center", gap: 2 }}>
            <Clock size={16} />
            {group?.billingUnit === "monthly"
              ? "Monthly Payment Schedule"
              : "Payment Plan"}
          </Flex>
        </Button>

        <Button
          onClick={() => setActiveTab("invoices")}
          sx={{
            bg: activeTab === "invoices" ? "tableBackground" : "transparent",
            color: activeTab === "invoices" ? "primary" : "text",
            borderRadius: 0,
            py: 2,
            px: 3,
            fontSize: 1,
            fontWeight: "heading",
            borderBottom: activeTab === "invoices" ? "2px solid" : "none",
            borderColor: "primary",
            "&:hover": { bg: "tableRowHover" },
          }}
        >
          <Flex sx={{ alignItems: "center", gap: 2 }}>
            <Receipt size={16} />
            Invoices & Receipts ({invoices?.length || 0})
          </Flex>
        </Button>
      </Flex>

      {/* 4. Tab Body Content */}
      <Box sx={{ p: 3 }}>
        {activeTab === "schedule" && (
          <Box>
            {group?.billingUnit === "monthly" ? (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <Text
                  sx={{
                    fontSize: 1,
                    fontWeight: "heading",
                    mb: 2,
                    color: "text",
                  }}
                >
                  Expected Monthly Due Dates
                </Text>
                {paymentPlans && paymentPlans.length > 0 ? (
                  paymentPlans.map((plan, idx) => {
                    const dueDate = new Date(plan?.dueDate);
                    const isPastDue = new Date() > dueDate;

                    return (
                      <Flex
                        key={idx}
                        sx={{
                          justifyContent: "space-between",
                          alignItems: "center",
                          p: 2,
                          px: 3,
                          borderRadius: "base",
                          bg: "tableRowStripe",
                          border: "1px solid",
                          borderColor: "tableBorder",
                          "&:hover": { bg: "tableRowHover" },
                        }}
                      >
                        <Flex sx={{ alignItems: "center", gap: 3 }}>
                          <Box
                            sx={{
                              width: 32,
                              height: 32,
                              borderRadius: "full",
                              bg: "primaryLight",
                              color: "primary",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontWeight: "bold",
                              fontSize: 0,
                            }}
                          >
                            M{plan?.monthIndex || idx + 1}
                          </Box>

                          <Box>
                            <Text sx={{ fontSize: 1, fontWeight: "heading" }}>
                              {dueDate.toLocaleDateString(undefined, {
                                month: "long",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </Text>
                            <Text sx={{ fontSize: 0, color: "subtle" }}>
                              {dueDate.toLocaleDateString(undefined, {
                                weekday: "long",
                              })}
                            </Text>
                          </Box>
                        </Flex>

                        <Flex sx={{ alignItems: "center", gap: 3 }}>
                          <Text sx={{ fontSize: 1, fontWeight: "bold" }}>
                            ${plan?.amount ? plan.amount.toFixed(2) : "0.00"}
                          </Text>
                          {isPastDue ? (
                            <Badge variant="danger">
                              <Flex sx={{ alignItems: "center", gap: 1 }}>
                                <AlertCircle size={12} /> Overdue
                              </Flex>
                            </Badge>
                          ) : (
                            <Badge variant="info">Upcoming</Badge>
                          )}
                        </Flex>
                      </Flex>
                    );
                  })
                ) : (
                  <Text sx={{ fontSize: 1, color: "subtle" }}>
                    No specific monthly plan generated for this enrollment.
                  </Text>
                )}
              </Box>
            ) : (
              <Box
                sx={{
                  p: 3,
                  textAlign: "center",
                  bg: "tableRowStripe",
                  borderRadius: "md",
                }}
              >
                <FileText size={24} style={{ opacity: 0.5 }} />
                <Text sx={{ fontSize: 1, color: "subtle", mt: 1 }}>
                  This group uses <strong>{group?.billingUnit}</strong> billing.
                  Charges are calculated per session or hour rather than fixed
                  monthly dates.
                </Text>
              </Box>
            )}
          </Box>
        )}

        {activeTab === "invoices" && (
          <Box>
            {invoices && invoices.length > 0 ? (
              invoices.map((inv) => {
                if (!inv) return null;
                const isPaid = (inv.amountPaid || 0) >= (inv.amountDue || 0);
                return (
                  <Box
                    key={inv.id}
                    sx={{
                      p: 3,
                      mb: 2,
                      borderRadius: "base",
                      border: "1px solid",
                      borderColor: "tableBorder",
                      bg: "tableBackground",
                    }}
                  >
                    <Flex
                      sx={{
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <Flex sx={{ alignItems: "center", gap: 2 }}>
                        {isPaid ? (
                          <CheckCircle2
                            size={18}
                            color="var(--theme-ui-colors-success, #10B981)"
                          />
                        ) : (
                          <Clock
                            size={18}
                            color="var(--theme-ui-colors-warning, #D97706)"
                          />
                        )}
                        <Text sx={{ fontSize: 1, fontWeight: "heading" }}>
                          Invoice #{inv.id.slice(-6)}
                        </Text>
                      </Flex>

                      <Text sx={{ fontSize: 1, fontWeight: "bold" }}>
                        ${inv.amountPaid?.toFixed(2) || "0.00"} / $
                        {inv.amountDue?.toFixed(2) || "0.00"}
                      </Text>
                    </Flex>

                    {inv.transactions && inv.transactions.length > 0 && (
                      <Box
                        sx={{
                          mt: 2,
                          pt: 2,
                          borderTop: "1px dashed",
                          borderColor: "tableBorder",
                        }}
                      >
                        <Text
                          sx={{
                            fontSize: 0,
                            fontWeight: "heading",
                            color: "subtle",
                            mb: 1,
                          }}
                        >
                          Transactions
                        </Text>
                        {inv.transactions.map((tx, tIdx) => {
                          if (!tx) return null;
                          return (
                            <Flex
                              key={tIdx}
                              sx={{
                                justifyContent: "space-between",
                                fontSize: 0,
                                color: "text",
                                py: 0.5,
                              }}
                            >
                              <Text sx={{ color: "subtle" }}>
                                {tx.note || "Payment received"}
                                {tx.cashier &&
                                  ` (Cashier: ${tx.cashier.firstName})`}
                              </Text>
                              <Text
                                sx={{
                                  fontWeight: "bold",
                                  color: "success",
                                }}
                              >
                                +${tx.amount?.toFixed(2) || "0.00"}
                              </Text>
                            </Flex>
                          );
                        })}
                      </Box>
                    )}
                  </Box>
                );
              })
            ) : (
              <Text sx={{ fontSize: 1, color: "subtle" }}>
                No invoices recorded yet.
              </Text>
            )}
          </Box>
        )}
      </Box>

      {/* 5. Footer Quick Action */}
      {onRecordPayment && remainingBalance > 0 && (
        <Flex
          sx={{
            p: 3,
            bg: "tableRowStripe",
            borderTop: "1px solid",
            borderColor: "border",
            justifyContent: "flex-end",
          }}
        >
          <Button
            variant="primary"
            onClick={() => onRecordPayment(enrollment)}
            sx={{ display: "flex", alignItems: "center", gap: 2 }}
          >
            <CreditCard size={16} /> Record Payment
          </Button>
        </Flex>
      )}
    </Card>
  );
};

export default StudentEnrollmentCard;
