import { PageLayout } from "../components/PageLayout";
import { Layout } from "../components/Layout";
import {
  useCreateWithDrawMutation,
  useWithdrawsQuery,
  useWithDrawsTypesQuery,
  Withdraw,
} from "../graphql";
import { useMemo, useState } from "react";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { t } from "i18next";
import {
  Box,
  Button,
  Divider,
  Flex,
  Heading,
  Input,
  Label,
  Select,
  Text,
  Textarea,
} from "theme-ui";
import i18n from "../i18n/i18n";
import { useAuth } from "../contexts/AuthContext";
import { printWithDraw } from "../utils/printInvoice";

export function WithdrawsPage() {
  const isRTL = i18n.dir() === "rtl";

  const PAGE_SIZE = 10;
  const { data, loading, error, refetch, fetchMore } = useWithdrawsQuery({
    variables: {
      first: 10,
    },
  });

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "";

    const [year, month, day] = dateStr.split("T")[0].split("-");

    return `${day}-${month}-${year}`;
  };
  const columnHelper = createColumnHelper<Withdraw>();
  const columns = useMemo(
    () => [
      columnHelper.accessor("creator", {
        header: () => t("groups.createdBy"),
        cell: (info) => {
          const creator = info.getValue();
          return (
            <Text>
              {creator ? `${creator.firstName} ${creator.lastName}` : "-"}
            </Text>
          );
        },
      }),
      columnHelper.accessor("createdAt", {
        header: () => t("recitation.date"),
        cell: (info) => <Text>{formatDate(info.getValue())}</Text>,
      }),
      columnHelper.accessor("amount", {
        header: () => t("withdraw.amount"),
        cell: (info) => info.getValue(),
      }),

      columnHelper.accessor("type", {
        header: () => t("withdraw.type"),
        cell: (info) => info.getValue()?.name ?? "-",
      }),

      columnHelper.accessor("note", {
        header: () => t("withdraw.note"),
        cell: (info) => info.getValue() ?? "-",
      }),
      columnHelper.display({
        id: "actions",
        header: () => t("common.actions"),
        cell: (info) => {
          return (
            <Flex sx={{ gap: 2 }}>
              <Button
                onClick={() => {}}
                sx={{
                  px: 3,
                  py: 2,
                  bg: "primary",
                  color: "white",
                  fontSize: 0,
                  fontWeight: 500,
                  cursor: "pointer",
                  borderRadius: "md",
                  border: "none",
                  opacity: 1,
                  "&:hover": {
                    opacity: 0.8,
                  },
                }}
              >
                {t("common.edit")}
              </Button>

              <Button
                onClick={() => printWithDraw()}
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
    []
  );

  const withDraws = useMemo(() => {
    return (
      data?.withdraws?.edges
        ?.map((edge) => edge!.node)
        .filter((withDraw): withDraw is Withdraw => withDraw != null) || []
    );
  }, [data]);

  const table = useReactTable<Withdraw>({
    data: withDraws,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });
  const handleNext = async () => {
    console.log("Next clicked");

    if (!data?.withdraws.pageInfo.hasNextPage) return;

    const res = await fetchMore({
      variables: {
        first: PAGE_SIZE,
        after: data.withdraws.pageInfo.endCursor,
      },

      updateQuery: (_, { fetchMoreResult }) => {
        if (!fetchMoreResult) return _;

        return fetchMoreResult;
      },
    });
  };
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    amount: 0,
    note: "",
    typeId: "",
  });
  const [createWithDraw] = useCreateWithDrawMutation();
  const { data: withDrawsTypes, loading: typesLoading } =
    useWithDrawsTypesQuery();
  const withdrawTypes = useMemo(() => {
    return (
      withDrawsTypes?.withdrawTypes?.edges
        ?.map((edge) => edge?.node)
        .filter((type): type is NonNullable<typeof type> => type != null) ?? []
    );
  }, [withDrawsTypes]);

  const handleSubmit = async () => {
    try {
      const result = await createWithDraw({
        variables: {
          input: {
            amount: formData.amount,
            creatorID: String(user?.id),
            note: formData.note,
            typeID: formData.typeId,
          },
        },
      });
      if (result.data?.createWithdraw?.id) {
        alert(t("common.groupCreatedSuccessfully"));
        setFormData({
          amount: 0,
          note: "",
          typeId: "",
        });
      }
    } catch (error) {
      alert(t("Some thing went to wrong please try again"));
    }
  };

  const handlePrevious = () => {
    if (!data?.withdraws.pageInfo.hasPreviousPage) return;

    fetchMore({
      variables: {
        last: PAGE_SIZE,
        before: data.withdraws.pageInfo.startCursor,
      },
    });
  };

  const [showCreateDialog, setShowCreateDialog] = useState(false);

  if (error) {
    return (
      <Box>
        <Text>some thing went to wrong please try again</Text>
        <Button
          onClick={(e) => {
            refetch;
          }}
        >
          {" "}
        </Button>
      </Box>
    );
  }

  return (
    <Layout>
      <PageLayout
        title={t("withdraw.withDraws")}
        icon="💰"
        description={t("withdraw.description")}
        actions={
          <>
            <Button
              sx={{
                marginRight: 2,
              }}
              onClick={() => setShowCreateDialog(true)}
            >
              {t("withdraw.create")}
            </Button>
          </>
        }
      >
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
              {loading && withDraws.length === 0 ? (
                <Box as="tr">
                  <td
                    colSpan={data?.withdraws.totalCount}
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
                      Loading withdraws records...
                    </Box>
                  </td>
                </Box>
              ) : withDraws.length === 0 ? (
                <Box as="tr">
                  <td
                    colSpan={data?.withdraws.totalCount}
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
                      {t("withdraw.noRecords")}
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
                      transition:
                        "opacity 0.2s ease, background-color 0.2s ease",
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
                          color: "tableText",
                        }}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </Box>
                    ))}
                  </Box>
                ))
              )}
            </Box>
          </Box>
        </Box>
        <Divider></Divider>

        <Flex
          sx={{
            flexDirection: "column",
          }}
        >
          <Flex
            sx={{
              justifyContent: "space-between",
              alignItems: "center",
              mt: 3,
            }}
          >
            <Button
              variant="secondary"
              onClick={handlePrevious}
              disabled={!data?.withdraws.pageInfo.hasPreviousPage || loading}
            >
              {t("common.previous")}
            </Button>

            <Button
              onClick={handleNext}
              disabled={!data?.withdraws.pageInfo.hasNextPage || loading}
            >
              {t("common.next")}
            </Button>
          </Flex>
        </Flex>
        <CreateWithdrawDialog
          open={showCreateDialog}
          onClose={() => setShowCreateDialog(false)}
          formData={formData}
          setFormData={setFormData}
          withdrawTypes={withdrawTypes}
          loading={typesLoading}
          onSubmit={handleSubmit}
        />
      </PageLayout>
    </Layout>
  );
}

interface Props {
  open: boolean;
  onClose: () => void;
  formData: any;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  withdrawTypes: any[];
  loading: boolean;
  onSubmit: () => void;
}
export function CreateWithdrawDialog({
  open,
  onClose,
  formData,
  setFormData,
  withdrawTypes,
  loading,
  onSubmit,
}: Props) {
  if (!open) return null;

  return (
    <Box
      onClick={onClose}
      sx={{
        position: "fixed",
        inset: 0,
        bg: "rgba(0,0,0,.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
    >
      <Box
        onClick={(e) => e.stopPropagation()}
        sx={{
          width: "100%",
          maxWidth: 500,
          bg: "background",
          color: "text",
          borderRadius: 12,
          p: 4,
          boxShadow: "0 20px 60px rgba(0,0,0,.25)",
          border: "1px solid",
          borderColor: "border",
        }}
      >
        <Heading mb={4}>{t("withdraw.create")}</Heading>

        <Box mb={3}>
          <Label>{t("withdraw.amount")}</Label>

          <Input
            type="number"
            value={formData.amount}
            onChange={(e) =>
              setFormData((prev: any) => ({
                ...prev,
                amount: Number(e.target.value),
              }))
            }
          />
        </Box>

        <Box mb={3}>
          <Label>{t("withdraw.type")}</Label>

          <Select
            value={formData.typeId}
            onChange={(e) =>
              setFormData((prev: any) => ({
                ...prev,
                typeId: e.target.value,
              }))
            }
          >
            <option value="">
              {loading ? "Loading..." : t("common.selectOption")}
            </option>

            {withdrawTypes.map((type: any) => (
              <option key={type.id} value={type.id}>
                {type.name}
              </option>
            ))}
          </Select>
        </Box>

        <Box mb={4}>
          <Label>{t("withdraw.note")}</Label>

          <Textarea
            rows={4}
            value={formData.note}
            onChange={(e) =>
              setFormData((prev: any) => ({
                ...prev,
                note: e.target.value,
              }))
            }
          />
        </Box>

        <Flex sx={{ justifyContent: "flex-end", gap: 2 }}>
          <Button variant="secondary" onClick={onClose}>
            {t("common.cancel")}
          </Button>

          <Button
            onClick={async () => {
              await onSubmit();
              onClose();
            }}
          >
            {t("common.create")}
          </Button>
        </Flex>
      </Box>
    </Box>
  );
}
