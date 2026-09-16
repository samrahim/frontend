import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
} from "@tanstack/react-table";
import Modal from "react-modal";
import { useState, useMemo } from "react";
import {
  useGetFamilyMembersQuery,
  useCreateFamilyMemberMutation,
} from "../graphql";
import { Box, Button, Heading, Input } from "theme-ui";
import { useTranslation } from "react-i18next";

type FamilyMemberRow = {
  id: string;
  type: string;
};

const columnHelper = createColumnHelper<FamilyMemberRow>();

const PAGE_SIZE = 10;

export function ParentRelationComponent() {
  const { t } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [familyMemberType, setFamilyMemberType] = useState("");

  const [pageIndex, setPageIndex] = useState(0);
  const [cursors, setCursors] = useState<(string | null)[]>([null]);

  // Query using your GetFamilyMembers schema
  const { data, loading, error } = useGetFamilyMembersQuery({
    variables: {
      first: PAGE_SIZE,
      after: cursors[pageIndex] ?? null,
      where: null,
    },
  });

  const [createFamilyMember, { loading: isCreating }] =
    useCreateFamilyMemberMutation();

  const edges = data?.getfamilyMembers.edges ?? [];
  const pageInfo = data?.getfamilyMembers?.pageInfo;

  const hasNextPage = pageInfo?.hasNextPage ?? false;
  const endCursor = pageInfo?.endCursor ?? null;

  const tableData: FamilyMemberRow[] = useMemo(() => {
    return edges.map(({ node }) => ({
      id: node.id,
      type: node.type,
    }));
  }, [edges]);

  const columns = useMemo(
    () => [
      columnHelper.accessor("type", {
        header: () => t("familyMembers.type"),
        cell: (info) => info.getValue(),
      }),
    ],
    [t]
  );

  const table = useReactTable({
    data: tableData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
  });

  const handleNextPage = () => {
    if (!hasNextPage || !endCursor) return;

    if (cursors.length <= pageIndex + 1) {
      setCursors((prev) => [...prev, endCursor]);
    }
    setPageIndex((prev) => prev + 1);
  };

  const handlePreviousPage = () => {
    if (pageIndex > 0) {
      setPageIndex((prev) => prev - 1);
    }
  };

  const handleCreateFamilyMember = async () => {
    if (!familyMemberType.trim()) return;

    await createFamilyMember({
      variables: {
        input: {
          type: familyMemberType.trim(),
        },
      },
    });

    setFamilyMemberType("");
    setIsModalOpen(false);
    // refetch();
  };

  if (loading && !data) return <Box>{t("common.loading")}</Box>;
  if (error)
    return (
      <Box>
        {t("common.error")}: {error.message}
      </Box>
    );

  return (
    <Box sx={{ overflowX: "auto", mb: 3 }}>
      {/* ACTION BUTTON */}
      <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 3 }}>
        <Button onClick={() => setIsModalOpen(true)}>
          {t("familyMembers.addMember")}
        </Button>
      </Box>

      {/* TABLE */}
      <Box
        as="table"
        sx={{
          width: "100%",
          borderCollapse: "collapse",
          "& th, & td": {
            textAlign: "left",
            padding: 3,
          },
          "& th": {
            fontWeight: "bold",
          },
        }}
      >
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th key={header.id}>
                  {flexRender(
                    header.column.columnDef.header,
                    header.getContext()
                  )}
                </th>
              ))}
            </tr>
          ))}
        </thead>

        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </Box>

      {/* PAGINATION CONTROLS */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          gap: 2,
          mt: 3,
        }}
      >
        <Button
          onClick={handlePreviousPage}
          disabled={pageIndex === 0 || loading}
          variant="secondary"
        >
          {t("common.previous")}
        </Button>

        <Box sx={{ fontSize: 1 }}>
          {t("common.page")} {pageIndex + 1}
        </Box>

        <Button
          onClick={handleNextPage}
          disabled={!hasNextPage || loading}
          variant="secondary"
        >
          {t("common.next")}
        </Button>
      </Box>

      {/* CREATE MODAL */}
      <Modal
        isOpen={isModalOpen}
        onRequestClose={() => setIsModalOpen(false)}
        ariaHideApp={false}
        style={{
          overlay: {
            backgroundColor: "rgba(0, 0, 0, 0.65)",
            backdropFilter: "blur(4px)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          },
          content: {
            position: "relative",
            inset: "auto",
            width: "100%",
            maxWidth: "450px",
            margin: "0 16px",
            padding: 0,
            border: "none",
            background: "transparent",
            borderRadius: "12px",
            overflow: "visible",
          },
        }}
      >
        <Box
          sx={{
            bg: "background",
            color: "text",
            p: 4,
            borderRadius: "12px",
            borderColor: "muted",
            borderStyle: "solid",
            borderWidth: "1px",
            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.4)",
          }}
        >
          <Heading as="h2" sx={{ color: "text", mb: 3, fontSize: 4 }}>
            {t("familyMembers.createMember")}
          </Heading>

          <Input
            value={familyMemberType}
            onChange={(e) => setFamilyMemberType(e.target.value)}
            placeholder={t("familyMembers.typePlaceholder")}
            sx={{
              mt: 3,
              width: "100%",
              color: "text",
              bg: "background",
              borderColor: "muted",
              borderRadius: "6px",
              p: 2,
              "&::placeholder": {
                color: "text",
                opacity: 0.5,
              },
              "&:focus": {
                borderColor: "primary",
                outline: "none",
                boxShadow: (theme) => `0 0 0 2px ${theme?.colors?.primary}`,
              },
            }}
          />

          <Box
            sx={{
              display: "flex",
              justifyContent: "flex-end",
              mt: 4,
              gap: 2,
            }}
          >
            <Button
              variant="secondary"
              onClick={() => setIsModalOpen(false)}
              sx={{
                bg: "muted",
                color: "text",
                cursor: "pointer",
                px: 3,
                py: 2,
                borderRadius: "6px",
                "&:hover": {
                  opacity: 0.85,
                },
              }}
            >
              {t("common.cancel")}
            </Button>

            <Button
              onClick={handleCreateFamilyMember}
              disabled={!familyMemberType.trim() || isCreating}
              sx={{
                bg: "primary",
                color: "background",
                px: 3,
                py: 2,
                borderRadius: "6px",
                cursor: familyMemberType.trim() ? "pointer" : "not-allowed",
                opacity: familyMemberType.trim() ? 1 : 0.5,
                "&:hover": {
                  opacity: familyMemberType.trim() ? 0.9 : 0.5,
                },
              }}
            >
              {t("common.create")}
            </Button>
          </Box>
        </Box>
      </Modal>
    </Box>
  );
}
