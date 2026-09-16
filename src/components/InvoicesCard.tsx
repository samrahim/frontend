import { t } from "i18next";
import React, { useEffect, useState } from "react";
import { Card, Flex, Heading, Text, Box, Badge } from "theme-ui";

// Helper to extract initials for the Google-like avatar
const getInitials = (firstName, lastName) => {
  const first = firstName?.charAt(0)?.toUpperCase() || "";
  const last = lastName?.charAt(0)?.toUpperCase() || "";
  return `${first}${last}` || "??";
};

export default function RecentInvoicesCard({
  invoicesData,
  totalCount,
  onViewAll,
}) {
  const [showAll, setShowAll] = useState(false);

  const invoices = invoicesData?.edges?.map((edge) => edge.node) || [];

  // Toggle button click handler
  const handleToggleClick = () => {
    const nextShowAllState = !showAll;
    setShowAll(nextShowAllState);

    // Fire the parent callback function to alter 'first' variable query payload
    if (onViewAll) {
      onViewAll(nextShowAllState);
    }
  };

  // Pagination: Show only 5 items initially unless 'showAll' is active
  const displayedInvoices = showAll ? invoices : invoices.slice(0, 5);

  // Calculate accumulated totals for the footer summary panel
  const totalPaid = invoices.reduce(
    (sum, inv) => sum + (inv.amountPaid || 0),
    0
  );
  const totalOverdue = invoices.reduce((sum, inv) => {
    const remaining = (inv.amountDue || 0) - (inv.amountPaid || 0);
    return remaining > 0 ? sum + remaining : sum;
  }, 0);

  return (
    <Card
      sx={{
        p: 4,
        display: "flex",
        flexDirection: "column",
        gap: 3,
        mb: 4,
        bg: "tableBackground",
        borderRadius: "lg",
        border: "1px solid",
        borderColor: "border",
        boxShadow: "sm",
      }}
    >
      {/* Header Section */}
      <Flex
        sx={{
          justifyContent: "space-between",
          alignItems: "flex-start",
          mb: 2,
        }}
      >
        <Box>
          <Heading
            sx={{ m: 0, fontSize: 3, fontWeight: "heading", color: "text" }}
          >
            {t("dashboard.recentInvoices")}
          </Heading>
          <Text sx={{ fontSize: 1, color: "subtle", mt: 1, display: "block" }}>
            {totalCount} {t("dashboard.invoicesgenerated")}
          </Text>
        </Box>

        {totalCount > 5 && (
          <Text
            onClick={handleToggleClick}
            sx={{
              color: "primary",
              cursor: "pointer",
              fontSize: 1,
              fontWeight: "bold",
              "&:hover": { textDecoration: "underline" },
            }}
          >
            {showAll ? "Show less" : "View all"}
          </Text>
        )}
      </Flex>

      {/* Invoice Row List */}
      <Flex sx={{ flexDirection: "column", gap: 3 }}>
        {invoices.map((invoice: any) => {
          const student = invoice?.enrollment?.student;
          const groupName = invoice?.enrollment?.group?.name || "No Group";
          const firstName = student?.firstName || "";
          const lastName = student?.lastName || "";

          const due = invoice?.amountDue || 0;
          const paid = invoice?.amountPaid || 0;
          const isPaid = due === paid;

          return (
            <Flex
              key={invoice?.id}
              sx={{
                justifyContent: "space-between",
                alignItems: "center",
                p: 3,
                bg: "tableRowStripe",
                border: "1px solid",
                borderColor: "tableBorder",
                borderRadius: "12px",
                transition: "all 0.2s ease-in-out",
                "&:hover": { borderColor: "subtle", bg: "tableRowHover" },
              }}
            >
              {/* Left Column: Avatar */}
              <Flex sx={{ alignItems: "center", flex: 1 }}>
                <Flex
                  sx={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "50%",
                    bg: isPaid ? "primaryLight" : "secondaryLight",
                    color: isPaid ? "primaryDark" : "secondaryDark",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: "bold",
                    fontSize: 2,
                    userSelect: "none",
                  }}
                >
                  {getInitials(firstName, lastName)}
                </Flex>

                <Box
                  sx={{
                    height: "40px",
                    borderLeft: "1px solid",
                    borderColor: "border",
                    mx: 3,
                  }}
                />

                <Box>
                  <Text
                    sx={{
                      fontWeight: "bold",
                      fontSize: 2,
                      color: "text",
                      display: "block",
                    }}
                  >
                    {firstName} {lastName}
                  </Text>
                  <Text
                    sx={{
                      fontSize: 1,
                      color: "subtle",
                      mt: 0.5,
                      display: "block",
                    }}
                  >
                    {groupName}
                  </Text>
                </Box>
              </Flex>

              {/* Right Column: Badging & Financial Values */}
              <Flex sx={{ alignItems: "center", gap: 3 }}>
                <Box sx={{ textAlign: "right" }}>
                  <Text
                    sx={{
                      fontWeight: "bold",
                      fontSize: 2,
                      color: "text",
                      display: "block",
                    }}
                  >
                    {due.toFixed(2)} DA
                  </Text>
                  {!isPaid && (
                    <Text
                      sx={{ fontSize: 0, color: "danger", display: "block" }}
                    >
                      Remaining: {(due - paid).toFixed(2)} DA
                    </Text>
                  )}
                </Box>

                <Badge
                  sx={{
                    px: 3,
                    py: 1.5,
                    borderRadius: "20px",
                    bg: isPaid ? "success" : "danger",
                    color: "white",
                    fontWeight: "heading",
                    fontSize: 1,
                    minWidth: "80px",
                    textAlign: "center",
                  }}
                >
                  {isPaid ? "Paid" : "Overdue"}
                </Badge>
              </Flex>
            </Flex>
          );
        })}
      </Flex>

      {/* Bottom Summary Panel */}
      <Box
        sx={{ mt: 2, pt: 3, borderTop: "1px dashed", borderColor: "border" }}
      >
        <Flex sx={{ justifyContent: "space-between", px: 2 }}>
          <Flex sx={{ gap: 2, alignItems: "center" }}>
            <Text sx={{ fontSize: 1, color: "subtle" }}>
              {t("dashboard.totalPaid")}:
            </Text>
            <Text sx={{ fontSize: 2, color: "success", fontWeight: "bold" }}>
              {totalPaid.toFixed(2)} DA
            </Text>
          </Flex>
          <Flex sx={{ gap: 2, alignItems: "center" }}>
            <Text sx={{ fontSize: 1, color: "subtle" }}>
              {t("dashboard.totalOverdue")}:
            </Text>
            <Text sx={{ fontSize: 2, color: "danger", fontWeight: "bold" }}>
              {totalOverdue.toFixed(2)} DA
            </Text>
          </Flex>
        </Flex>
      </Box>
    </Card>
  );
}
