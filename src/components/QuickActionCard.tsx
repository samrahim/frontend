import { t } from "i18next";
import React from "react";
import { useNavigate } from "react-router-dom";
import { Card, Grid, Flex, Heading, Text, Box } from "theme-ui";

export default function QuickActionsCard() {
  const navigate = useNavigate();

  const actions = [
    {
      title: t("dashboard.enrollStudent"),
      icon: "👤➕",
      color: "primary",
      bgLight: "primaryLight",
      bgDark: "muted",
      onClick: () => navigate("/student/create"),
    },
    {
      title: t("dashboard.createGroup"),
      icon: "👥➕",
      color: "secondary",
      bgLight: "secondaryLight",
      bgDark: "muted",
      onClick: () => navigate("/groups/create"),
    },
    {
      title: t("dashboard.markAttendance"),
      icon: "📝✔️",
      color: "info",
      bgLight: "tableRowHover",
      bgDark: "muted",
      onClick: () => navigate("/attendences"),
    },
    {
      title: t("dashboard.payInvoice"),
      icon: "💳💰",
      color: "success",
      bgLight: "tableRowStripe",
      bgDark: "muted",
      onClick: () => navigate("/pay-invoice"),
    },
  ];

  return (
    <Card
      sx={{
        p: 4,
        display: "flex",
        flexDirection: "column",
        gap: 3,
        bg: "tableBackground",
        borderRadius: "lg",
        border: "1px solid",
        borderColor: "border",
        boxShadow: "sm",
      }}
    >
      {/* Header Info */}
      <Box mb={2}>
        <Heading
          sx={{ m: 0, fontSize: 3, fontWeight: "heading", color: "text" }}
        >
          {t("dashboard.quickActions")}
        </Heading>
        <Text sx={{ fontSize: 1, color: "subtle", mt: 1, display: "block" }}>
          {t("dashboard.commontasks")}
        </Text>
      </Box>

      {/* Grid Layout */}
      <Grid columns={[1, 2, 4]} gap={3}>
        {actions.map((action, idx) => (
          <Flex
            key={idx}
            onClick={action.onClick}
            sx={{
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              p: 4,
              textAlign: "center",
              cursor: "pointer",
              borderRadius: "12px",
              border: "1px solid",
              borderColor: (theme) =>
                theme.colors?.background === "#102A25"
                  ? "tableBorder"
                  : "border",
              bg: (theme) =>
                theme.colors?.background === "#102A25"
                  ? action.bgDark
                  : action.bgLight,
              transition: "all 0.2s ease-in-out",
              "&:hover": {
                transform: "translateY(-2px)",
                borderColor: action.color,
                boxShadow: (theme) =>
                  theme.colors?.background === "#102A25"
                    ? "0px 4px 12px rgba(60, 183, 165, 0.15)"
                    : "0px 4px 12px rgba(15, 118, 110, 0.1)",
              },
            }}
          >
            {/* Column Icon Frame */}
            <Box
              sx={{
                fontSize: 4,
                mb: 3,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "56px",
                height: "56px",
                borderRadius: "50%",
                bg: "tableBackground",
                border: "1px solid",
                borderColor: "tableBorder",
                boxShadow: "xs",
              }}
            >
              {action.icon}
            </Box>

            {/* Action Text */}
            <Text
              sx={{
                fontWeight: "bold",
                fontSize: 2,
                color: (theme) =>
                  theme.colors?.background === "#102A25"
                    ? "text"
                    : "primaryDark",
                transition: "color 0.2s ease",
              }}
            >
              {action.title}
            </Text>
          </Flex>
        ))}
      </Grid>
    </Card>
  );
}
