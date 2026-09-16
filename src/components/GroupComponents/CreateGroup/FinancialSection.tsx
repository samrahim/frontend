import {
  LuCreditCard,
  LuCalendarDays,
  LuLayers,
  LuSparkles,
} from "react-icons/lu";
import { Box, Checkbox, Flex, Input, Label, Select, Text } from "theme-ui";
import { GroupBillingCycle, GroupBillingUnit } from "../../../graphql";

type Props = {
  formData: any;
  handleInputChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => void;
  getPaymentText: () => string;
  t: (key: string) => string;
  handleFreeToggle: (checked: boolean) => void;
};

export function FinancialSection({
  formData,
  handleInputChange,
  getPaymentText,
  t,
  handleFreeToggle,
}: Props) {
  return (
    <Box
      sx={{
        mb: 5,
        p: 4,
        border: "1px solid",
        borderColor: "border",
        borderRadius: "lg",
        boxShadow: "sm",
        bg: "background",
      }}
    >
      {/* HEADER SECTION */}
      <Box
        sx={{ mb: 4, pb: 3, borderBottom: "1px solid", borderColor: "border" }}
      >
        <Flex sx={{ alignItems: "center", gap: 3, mb: 1 }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              p: 2,
              bg: "muted",
              borderRadius: "md",
              color: "primary",
            }}
          >
            <LuCreditCard size={28} />
          </Box>

          <Box>
            <Text
              as="h2"
              sx={{
                fontSize: 4,
                fontWeight: "bold",
                lineHeight: "heading",
                color: "text",
              }}
            >
              {t("groups.billingConfiguration") || "Billing Configuration"}
            </Text>
            <Text
              as="p"
              sx={{
                fontSize: 1,
                fontWeight: "normal",
                mt: 1,
              }}
            >
              {t("groups.billingSubtitle") ||
                "Choose how students will be invoiced and configure the pricing structure."}
            </Text>
          </Box>
        </Flex>
      </Box>

      {/* FREE TOGGLE FIELD */}
      <Box sx={{ mb: 4, display: "flex", alignItems: "center", gap: 2 }}>
        <Checkbox
          id="isFree"
          name="isFree"
          checked={formData.isFree}
          onChange={(e) => handleFreeToggle(e.target.checked)}
        />
        <Label
          htmlFor="isFree"
          sx={{ m: 0, fontWeight: "bold", cursor: "pointer" }}
        >
          {t("groups.freeGroup")}
        </Label>
      </Box>

      {!formData.isFree && (
        <>
          {/* PAYMENT MODEL SELECTOR */}
          <Box sx={{ mb: 4 }}>
            <Label sx={{ fontWeight: "bold", mb: 2 }}>
              {t("groups.paymentMethod") || "Payment Method"}
              <Text as="span" sx={{ color: "indigo", ml: 1 }}>
                *
              </Text>
            </Label>

            <Flex sx={{ gap: 3, flexWrap: "wrap", width: "100%" }}>
              {/* Box Option 1: Session */}
              <Flex
                onClick={() =>
                  handleInputChange({
                    target: {
                      name: "billingUnit",
                      value: GroupBillingUnit.Session,
                    },
                  } as any)
                }
                sx={{
                  flex: 1,
                  minWidth: "250px",
                  p: 3,
                  border: "1px solid",
                  borderColor:
                    formData.billingUnit === GroupBillingUnit.Session
                      ? "primary"
                      : "border",
                  borderRadius: "md",
                  cursor: "pointer",
                  // Uses "primaryLight" (very soft green) in light mode, or drops to deep container dark green "muted" in dark mode
                  bg:
                    formData.billingUnit === GroupBillingUnit.Session
                      ? "primaryLight"
                      : "tableBackground",
                  transition: "all 0.2s ease",
                  flexDirection: "column",
                  gap: 1,
                  "&:hover": {
                    bg:
                      formData.billingUnit === GroupBillingUnit.Session
                        ? "primaryLight" // Keeps active bright, or slightly deeper
                        : "muted",
                  },
                }}
              >
                <Flex
                  sx={{
                    alignItems: "center",
                    gap: 2,
                    color:
                      formData.billingUnit === GroupBillingUnit.Session
                        ? "primary"
                        : "text",
                  }}
                >
                  <LuLayers size={20} />
                  <Text sx={{ fontWeight: "bold", fontSize: 2 }}>
                    {t("groups.billingUnitSession") || "Per session"}
                  </Text>
                </Flex>
                <Text
                  sx={{
                    fontSize: 1,
                    // Fallback to "subtle" instead of "muted" (as "muted" is used for backgrounds in Theme UI specs)
                    color:
                      formData.billingUnit === GroupBillingUnit.Session
                        ? "primary"
                        : "subtle",
                    mt: 1,
                  }}
                >
                  {t("groups.persessionDescription")}
                </Text>
              </Flex>

              {/* Box Option 2: Monthly */}
              <Flex
                onClick={() =>
                  handleInputChange({
                    target: {
                      name: "billingUnit",
                      value: GroupBillingUnit.Monthly,
                    },
                  } as any)
                }
                sx={{
                  flex: 1,
                  minWidth: "250px",
                  p: 3,
                  border: "1px solid",
                  borderColor:
                    formData.billingUnit === GroupBillingUnit.Monthly
                      ? "primary"
                      : "border",
                  borderRadius: "md",
                  cursor: "pointer",
                  bg:
                    formData.billingUnit === GroupBillingUnit.Monthly
                      ? "primaryLight"
                      : "tableBackground",
                  transition: "all 0.2s ease",
                  flexDirection: "column",
                  gap: 1,
                  "&:hover": {
                    bg:
                      formData.billingUnit === GroupBillingUnit.Monthly
                        ? "primaryLight"
                        : "muted",
                  },
                }}
              >
                <Flex
                  sx={{
                    alignItems: "center",
                    gap: 2,
                    color:
                      formData.billingUnit === GroupBillingUnit.Monthly
                        ? "primary"
                        : "text",
                  }}
                >
                  <LuCalendarDays size={20} />
                  <Text sx={{ fontWeight: "bold", fontSize: 2 }}>
                    {t("groups.recurrenceMonthly") || "Monthly"}
                  </Text>
                </Flex>
                <Text
                  sx={{
                    fontSize: 1,
                    color:
                      formData.billingUnit === GroupBillingUnit.Monthly
                        ? "primary"
                        : "subtle",
                    mt: 1,
                  }}
                >
                  {t("groups.perMonthDescription")}
                </Text>
              </Flex>

              {/* Box Option 3: One-Time */}
              <Flex
                onClick={() =>
                  handleInputChange({
                    target: {
                      name: "billingUnit",
                      value: GroupBillingUnit.Once,
                    },
                  } as any)
                }
                sx={{
                  flex: 1,
                  minWidth: "250px",
                  p: 3,
                  border: "1px solid",
                  borderColor:
                    formData.billingUnit === GroupBillingUnit.Once
                      ? "primary"
                      : "border",
                  borderRadius: "md",
                  cursor: "pointer",
                  bg:
                    formData.billingUnit === GroupBillingUnit.Once
                      ? "primaryLight"
                      : "tableBackground",
                  transition: "all 0.2s ease",
                  flexDirection: "column",
                  gap: 1,
                  "&:hover": {
                    bg:
                      formData.billingUnit === GroupBillingUnit.Once
                        ? "primaryLight"
                        : "muted",
                  },
                }}
              >
                <Flex
                  sx={{
                    alignItems: "center",
                    gap: 2,
                    color:
                      formData.billingUnit === GroupBillingUnit.Once
                        ? "primary"
                        : "text",
                  }}
                >
                  <LuSparkles size={20} />
                  <Text sx={{ fontWeight: "bold", fontSize: 2 }}>
                    {t("groups.billingUnitOnce") || "One-time"}
                  </Text>
                </Flex>
                <Text
                  sx={{
                    fontSize: 1,
                    color:
                      formData.billingUnit === GroupBillingUnit.Once
                        ? "primary"
                        : "subtle",
                    mt: 1,
                  }}
                >
                  {t("groups.oneTimeDescription")}
                </Text>
              </Flex>
            </Flex>
          </Box>

          {/* DYNAMIC FORM INNER CONTAINER CARD */}
          {formData.billingUnit && (
            <Box
              sx={{
                p: 4,
                mb: 4,
                bg: "muted",
                borderRadius: "md",
                border: "1px solid",
                borderColor: "border",
              }}
            >
              {/* IF CHOSEN: PER SESSION */}
              {formData.billingUnit === GroupBillingUnit.Session && (
                <>
                  <Flex
                    sx={{
                      gap: 4,
                      mb: 4,
                      flexWrap: "wrap",
                      alignItems: "flex-end",
                    }}
                  >
                    <Box sx={{ flex: 1, minWidth: "200px" }}>
                      <Label
                        htmlFor="pricePerUnit"
                        sx={{ fontWeight: "bold", mb: 2 }}
                      >
                        {t("groups.pricePerSession")}
                        <Text as="span" sx={{ color: "indigo", ml: 1 }}>
                          *
                        </Text>
                      </Label>
                      <Input
                        type="number"
                        id="pricePerUnit"
                        name="pricePerUnit"
                        value={formData.pricePerUnit}
                        onChange={handleInputChange}
                        placeholder="0.00"
                        step="0.01"
                        sx={{ height: "48px", bg: "background" }}
                      />
                    </Box>

                    <Box sx={{ flex: 1, minWidth: "200px" }}>
                      <Label
                        htmlFor="invoiceThreshold"
                        sx={{ fontWeight: "bold", mb: 2 }}
                      >
                        {t("groups.invoiceThreshold")}
                        <Text as="span" sx={{ color: "indigo", ml: 1 }}>
                          *
                        </Text>
                      </Label>
                      <Input
                        type="number"
                        id="invoiceThreshold"
                        name="invoiceThreshold"
                        value={formData.invoiceThreshold}
                        onChange={handleInputChange}
                        min="1"
                        max="100"
                        sx={{ height: "48px", bg: "background" }}
                      />
                    </Box>
                  </Flex>

                  <Box sx={{ width: "100%" }}>
                    <Label
                      htmlFor="billingCycle"
                      sx={{ fontWeight: "bold", mb: 2 }}
                    >
                      {t("groups.billingCycle")}
                      <Text as="span" sx={{ color: "indigo", ml: 1 }}>
                        *
                      </Text>
                    </Label>

                    <Flex
                      sx={{
                        border: "1px solid",
                        borderColor: "border",
                        borderRadius: "md",
                        overflow: "hidden",
                        width: "100%",
                        bg: "white",
                      }}
                    >
                      <Box
                        onClick={() =>
                          handleInputChange({
                            target: {
                              name: "billingCycle",
                              value: GroupBillingCycle.Before,
                            },
                          } as any)
                        }
                        sx={{
                          flex: 1,
                          py: 3,
                          textAlign: "center",
                          fontWeight: "bold",
                          fontSize: 1,
                          cursor: "pointer",
                          bg:
                            formData.billingCycle === GroupBillingCycle.Before
                              ? "rgba(79, 70, 229, 0.1)"
                              : "white",
                          color:
                            formData.billingCycle === GroupBillingCycle.Before
                              ? "indigo"
                              : "gray",
                          transition: "all 0.2s ease",
                        }}
                      >
                        {t("groups.billingCycleBefore")}
                      </Box>
                      <Box
                        sx={{
                          width: "1px",
                          bg: "border",
                          alignSelf: "stretch",
                        }}
                      />
                      <Box
                        onClick={() =>
                          handleInputChange({
                            target: {
                              name: "billingCycle",
                              value: GroupBillingCycle.After,
                            },
                          } as any)
                        }
                        sx={{
                          flex: 1,
                          py: 3,
                          textAlign: "center",
                          fontWeight: "bold",
                          fontSize: 1,
                          cursor: "pointer",
                          bg:
                            formData.billingCycle === GroupBillingCycle.After
                              ? "rgba(79, 70, 229, 0.1)"
                              : "white",
                          color:
                            formData.billingCycle === GroupBillingCycle.After
                              ? "indigo"
                              : "gray",
                          transition: "all 0.2s ease",
                        }}
                      >
                        {t("groups.billingCycleAfter")}
                      </Box>
                    </Flex>
                    <Text
                      sx={{
                        fontSize: 0,
                        color: "gray",
                        mt: 2,
                        display: "block",
                      }}
                    >
                      {t("groups.invoiceThresholdHelp")}
                    </Text>
                  </Box>
                </>
              )}

              {/* IF CHOSEN: MONTHLY */}
              {formData.billingUnit === GroupBillingUnit.Monthly && (
                <>
                  <Flex
                    sx={{
                      gap: 4,
                      mb: 4,
                      flexWrap: "wrap",
                      alignItems: "flex-end",
                    }}
                  >
                    <Box sx={{ flex: 1, width: "100%" }}>
                      <Label
                        htmlFor="pricePerUnit"
                        sx={{ fontWeight: "bold", mb: 2 }}
                      >
                        {t("groups.pricePerMonth")}
                        <Text as="span" sx={{ color: "indigo", ml: 1 }}>
                          *
                        </Text>
                      </Label>
                      <Input
                        type="number"
                        id="pricePerUnit"
                        name="pricePerUnit"
                        value={formData.pricePerUnit}
                        onChange={handleInputChange}
                        placeholder="0.00"
                        step="0.01"
                        sx={{ height: "48px", bg: "background" }}
                      />
                    </Box>
                  </Flex>

                  <Box sx={{ width: "100%" }}>
                    <Label
                      htmlFor="billingCycle"
                      sx={{ fontWeight: "bold", mb: 2 }}
                    >
                      {t("groups.billingCycle")}
                      <Text as="span" sx={{ color: "indigo", ml: 1 }}>
                        *
                      </Text>
                    </Label>

                    <Flex
                      sx={{
                        border: "1px solid",
                        borderColor: "border",
                        borderRadius: "md",
                        overflow: "hidden",
                        width: "100%",
                        bg: "white",
                      }}
                    >
                      <Box
                        onClick={() =>
                          handleInputChange({
                            target: {
                              name: "billingCycle",
                              value: GroupBillingCycle.Before,
                            },
                          } as any)
                        }
                        sx={{
                          flex: 1,
                          py: 3,
                          textAlign: "center",
                          fontWeight: "bold",
                          fontSize: 1,
                          cursor: "pointer",
                          bg:
                            formData.billingCycle === GroupBillingCycle.Before
                              ? "rgba(79, 70, 229, 0.1)"
                              : "white",
                          color:
                            formData.billingCycle === GroupBillingCycle.Before
                              ? "indigo"
                              : "gray",
                        }}
                      >
                        {t("groups.billingCycleBefore")}
                      </Box>
                      <Box
                        sx={{
                          width: "1px",
                          bg: "border",
                          alignSelf: "stretch",
                        }}
                      />
                      <Box
                        onClick={() =>
                          handleInputChange({
                            target: {
                              name: "billingCycle",
                              value: GroupBillingCycle.After,
                            },
                          } as any)
                        }
                        sx={{
                          flex: 1,
                          py: 3,
                          textAlign: "center",
                          fontWeight: "bold",
                          fontSize: 1,
                          cursor: "pointer",
                          bg:
                            formData.billingCycle === GroupBillingCycle.After
                              ? "rgba(79, 70, 229, 0.1)"
                              : "white",
                          color:
                            formData.billingCycle === GroupBillingCycle.After
                              ? "indigo"
                              : "gray",
                        }}
                      >
                        {t("groups.billingCycleAfter")}
                      </Box>
                    </Flex>
                  </Box>
                </>
              )}

              {/* IF CHOSEN: ONE-TIME */}
              {formData.billingUnit === GroupBillingUnit.Once && (
                <>
                  <Flex
                    sx={{
                      gap: 4,
                      mb: 4,
                      flexWrap: "wrap",
                      alignItems: "flex-end",
                    }}
                  >
                    <Box sx={{ flex: 1, width: "100%" }}>
                      <Label
                        htmlFor="pricePerUnit"
                        sx={{ fontWeight: "bold", mb: 2 }}
                      >
                        {t("groups.price") || "Total Price"}
                        <Text as="span" sx={{ color: "indigo", ml: 1 }}>
                          *
                        </Text>
                      </Label>
                      <Input
                        type="number"
                        id="pricePerUnit"
                        name="pricePerUnit"
                        value={formData.pricePerUnit}
                        onChange={handleInputChange}
                        placeholder="0.00"
                        step="0.01"
                        sx={{ height: "48px", bg: "background" }}
                      />
                    </Box>
                  </Flex>

                  <Box sx={{ width: "100%" }}>
                    <Label
                      htmlFor="billingCycle"
                      sx={{ fontWeight: "bold", mb: 2 }}
                    >
                      {t("groups.billingCycle")}
                      <Text as="span" sx={{ color: "indigo", ml: 1 }}>
                        *
                      </Text>
                    </Label>

                    <Flex
                      sx={{
                        border: "1px solid",
                        borderColor: "border",
                        borderRadius: "md",
                        overflow: "hidden",
                        width: "100%",
                        bg: "white",
                      }}
                    >
                      <Box
                        onClick={() =>
                          handleInputChange({
                            target: {
                              name: "billingCycle",
                              value: GroupBillingCycle.Before,
                            },
                          } as any)
                        }
                        sx={{
                          flex: 1,
                          py: 3,
                          textAlign: "center",
                          fontWeight: "bold",
                          fontSize: 1,
                          cursor: "pointer",
                          bg:
                            formData.billingCycle === GroupBillingCycle.Before
                              ? "rgba(79, 70, 229, 0.1)"
                              : "white",
                          color:
                            formData.billingCycle === GroupBillingCycle.Before
                              ? "indigo"
                              : "gray",
                        }}
                      >
                        {t("groups.billingCycleBefore")}
                      </Box>
                      <Box
                        sx={{
                          width: "1px",
                          bg: "border",
                          alignSelf: "stretch",
                        }}
                      />
                      <Box
                        onClick={() =>
                          handleInputChange({
                            target: {
                              name: "billingCycle",
                              value: GroupBillingCycle.After,
                            },
                          } as any)
                        }
                        sx={{
                          flex: 1,
                          py: 3,
                          textAlign: "center",
                          fontWeight: "bold",
                          fontSize: 1,
                          cursor: "pointer",
                          bg:
                            formData.billingCycle === GroupBillingCycle.After
                              ? "rgba(79, 70, 229, 0.1)"
                              : "white",
                          color:
                            formData.billingCycle === GroupBillingCycle.After
                              ? "indigo"
                              : "gray",
                        }}
                      >
                        {t("groups.billingCycleAfter")}
                      </Box>
                    </Flex>
                  </Box>
                </>
              )}
            </Box>
          )}

          {/* PREVIEW SELECTION CARD OVERVIEW */}
          {formData.billingUnit && (
            <Box
              sx={{
                p: 3,

                borderRadius: "md",
                border: "1px solid",
                borderColor: "border",
                borderLeft: "6px solid",
                borderLeftColor: "indigo",
                boxShadow: "sm",
              }}
            >
              <Text
                sx={{
                  fontSize: 0,
                  color: "gray",
                  fontWeight: "bold",
                  textTransform: "uppercase",
                  mb: 1,
                  display: "block",
                }}
              >
                {t("groups.billingPreview") || "Billing Structure Summary"}
              </Text>
              <Text
                sx={{
                  fontSize: 1,
                  whiteSpace: "pre-wrap",
                  lineHeight: 1.6,
                  fontWeight: "bold",
                  color: "text",
                }}
              >
                {getPaymentText()}
              </Text>
            </Box>
          )}
        </>
      )}
    </Box>
  );
}
