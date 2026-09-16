import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
} from "@tanstack/react-table";
import Modal from "react-modal";
import { useState, useMemo } from "react";
import { useCreateSubjectMutation, useGetSubjectsQuery } from "../graphql";
import { Box, Button, Heading, Input, Text } from "theme-ui";
import { useAuth } from "../contexts/AuthContext";
import { t } from "i18next";

type SubjectRow = {
  id: string;
  subjectName: string;
  createdAt: string;
  creatorName: string;
};

const PAGE_SIZE = 10;
const columnHelper = createColumnHelper<SubjectRow>();

export function SubjectComponent() {
  const { user } = useAuth();
  const [pageIndex, setPageIndex] = useState(0);
  const [cursors, setCursors] = useState<(string | null)[]>([null]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [subjectName, setSubjectName] = useState("");

  const { data, loading, error } = useGetSubjectsQuery({
    variables: {
      first: PAGE_SIZE,
      after: cursors[pageIndex] ?? null,
    },
  });
  const edges = data?.subjects?.edges ?? [];
  const lastCursor = edges.length > 0 ? edges[edges.length - 1]?.cursor : null;

  const hasNextPage = edges.length === PAGE_SIZE;
  const [createsubject] = useCreateSubjectMutation();

  const tableData: SubjectRow[] = useMemo(() => {
    return (
      data?.subjects?.edges?.map(({ node }: any) => ({
        id: node.id,
        subjectName: node.name,
        createdAt: node.createdAt
          ? new Date(node.createdAt).toLocaleDateString()
          : "N/A",
        creatorName: node.creator
          ? `${node.creator.firstName ?? ""} ${
              node.creator.lastName ?? ""
            }`.trim()
          : "System",
      })) ?? []
    );
  }, [data]);
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
      columnHelper.accessor("subjectName", {
        header: () => `${t("groups.subject")}`,
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor("createdAt", {
        header: () => `${t("groups.createdAt")}`,
        cell: (info) => <Text>{formatDate(info.getValue())}</Text>,
      }),
      columnHelper.accessor("creatorName", {
        header: () => `${t("groups.createdBy")}`,
        cell: (info) => info.getValue(),
      }),
    ],
    []
  );

  const table = useReactTable({
    data: tableData,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const handleNextPage = () => {
    if (!hasNextPage || !lastCursor) return;

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
  const handleCreateSubject = async () => {
    if (!subjectName.trim()) return;

    await createsubject({
      variables: {
        input: {
          creatorID: user?.id.toString() ?? "",
          name: subjectName,
        },
      },
      update(cache, { data: mutationData }) {
        // Extract created subject from mutation response (adapt key if generated differently)
        const newSubject = mutationData?.createSubject;
        if (!newSubject) return;

        cache.modify({
          fields: {
            subjects(existing = { edges: [] }) {
              if (
                existing.edges.some(
                  (edge: any) => edge.node.id === newSubject.id
                )
              ) {
                return existing;
              }

              const newEdge = {
                __typename: "SubjectEdge",
                node: newSubject,
              };

              return {
                ...existing,
                edges: [newEdge, ...existing.edges],
              };
            },
          },
        });
      },
    });

    setSubjectName("");
    setIsModalOpen(false);
  };

  if (loading) return <Box>Loading...</Box>;
  if (error) return <Box>Error: {error.message}</Box>;

  return (
    <Box sx={{ overflowX: "auto", mb: 3 }}>
      {/* BUTTON */}
      <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 3 }}>
        <Button onClick={() => setIsModalOpen(true)}>
          {t("settings.addSubject")}
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
            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.3)",
          }}
        >
          <Heading as="h2" sx={{ color: "text", mb: 3, fontSize: 4 }}>
            {t("settings.addSubject")}
          </Heading>

          <Input
            value={subjectName}
            onChange={(e) => setSubjectName(e.target.value)}
            placeholder="Subject name"
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
              onClick={handleCreateSubject}
              disabled={!subjectName.trim()}
              sx={{
                bg: "primary",
                color: "background",
                px: 3,
                py: 2,
                borderRadius: "6px",
                cursor: subjectName.trim() ? "pointer" : "not-allowed",
                opacity: subjectName.trim() ? 1 : 0.5,
                "&:hover": {
                  opacity: subjectName.trim() ? 0.9 : 0.5,
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
