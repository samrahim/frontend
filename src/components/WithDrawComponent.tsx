import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
} from "@tanstack/react-table";
import Modal from "react-modal";
import { useState, useMemo } from "react";
import {
  useCreateWithDrawTypeMutation,
  useWithDrawsTypesQuery,
} from "../graphql";
import { Box, Button, Heading, Input } from "theme-ui";
import { t } from "i18next";

type WithDrawTypeRow = {
  name: string;
};

const columnHelper = createColumnHelper<WithDrawTypeRow>();

const PAGE_SIZE = 10;

export function WithDrawsTypesComponent() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [withdrawname, setWithdrawName] = useState("");

  // Track page index and cursors stack
  const [pageIndex, setPageIndex] = useState(0);
  const [cursors, setCursors] = useState<(string | null)[]>([null]);

  // Fetch paginated query using active cursor
  const { data, loading, error } = useWithDrawsTypesQuery({
    variables: {
      first: PAGE_SIZE,
      after: cursors[pageIndex] ?? null,
    },
  });

  const [createWithDraw] = useCreateWithDrawTypeMutation();

  const edges = data?.withdrawTypes?.edges ?? [];

  // Get the cursor of the last item on the current page
  const lastCursor = edges.length > 0 ? edges[edges.length - 1]?.cursor : null;

  // Determine if there are likely more items (if current batch fills PAGE_SIZE)
  const hasNextPage = edges.length === PAGE_SIZE;

  const tableData: WithDrawTypeRow[] = useMemo(() => {
    return edges.map(({ node }) => ({
      name: node.name,
    }));
  }, [edges]);

  const columns = useMemo(
    () => [
      columnHelper.accessor("name", {
        header: () => t("students.name"),
        cell: (info) => info.getValue(),
      }),
    ],
    []
  );

  const table = useReactTable({
    data: tableData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
  });

  const handleNextPage = () => {
    if (!hasNextPage || !lastCursor) return;

    // Store the cursor for the next page index if not already recorded
    if (cursors.length <= pageIndex + 1) {
      setCursors((prev) => [...prev, lastCursor]);
    }
    setPageIndex((prev) => prev + 1);
  };

  const handlePreviousPage = () => {
    if (pageIndex > 0) {
      setPageIndex((prev) => prev - 1);
    }
  };

  const handleCreateWithDrawType = async () => {
    if (!withdrawname.trim()) return;

    await createWithDraw({
      variables: {
        input: {
          name: withdrawname,
        },
      },
    });

    setWithdrawName("");
    setIsModalOpen(false);
  };

  if (loading && !data) return <Box>Loading...</Box>;
  if (error) return <Box>Error: {error.message}</Box>;

  return (
    <Box sx={{ overflowX: "auto", mb: 3 }}>
      {/* BUTTON */}
      <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 3 }}>
        <Button onClick={() => setIsModalOpen(true)}>
          {t("settings.addWithdraw")}
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

        <Box sx={{ fontSize: 1 }}>Page {pageIndex + 1}</Box>

        <Button
          onClick={handleNextPage}
          disabled={!hasNextPage || loading}
          variant="secondary"
        >
          {t("common.next")}
        </Button>
      </Box>

      {/* MODAL */}
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
            Create withdraw
          </Heading>

          <Input
            value={withdrawname}
            onChange={(e) => setWithdrawName(e.target.value)}
            placeholder="withdraw name"
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
              Cancel
            </Button>

            <Button
              onClick={handleCreateWithDrawType}
              disabled={!withdrawname.trim()}
              sx={{
                bg: "primary",
                color: "background",
                px: 3,
                py: 2,
                borderRadius: "6px",
                cursor: withdrawname.trim() ? "pointer" : "not-allowed",
                opacity: withdrawname.trim() ? 1 : 0.5,
                "&:hover": {
                  opacity: withdrawname.trim() ? 0.9 : 0.5,
                },
              }}
            >
              Create
            </Button>
          </Box>
        </Box>
      </Modal>
    </Box>
  );
}
