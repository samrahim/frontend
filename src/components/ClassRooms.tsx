import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
} from "@tanstack/react-table";
import Modal from "react-modal";
import { useState, useMemo } from "react";
import {
  useClassRoomsQuery,
  useCreateClassroomMutation,
  useUpdateClassroomMutation,
} from "../graphql";
import {
  Alert,
  Box,
  Button,
  Flex,
  Heading,
  Input,
  Label,
  Text,
} from "theme-ui";
import { t } from "i18next";
const PAGE_SIZE = 10;
// 🔹 HELPER FUNCTIONS FOR COLOR CONVERSION (HEX <-> INT)
const hexToInt = (hex: string): number => {
  const cleanHex = hex.replace("#", "");
  return parseInt(cleanHex, 16) || 0;
};

const PRESET_COLORS = [
  "#4CAF50",
  "#2196F3",
  "#9C27B0",
  "#FF9800",
  "#E91E63",
  "#00BCD4",
  "#3F51B5",
  "#009688",
  "#FFEB3B",
  "#795548",
];
const intToHex = (colorInt: number | null | undefined): string => {
  if (colorInt === null || colorInt === undefined) return "#4CAF50";
  const hex = colorInt.toString(16).padStart(6, "0");
  return `#${hex}`;
};

type ClassroomRow = {
  id: string;
  name: string;
  color: string; // Front-end uses HEX string for Theme-UI compatibility
  qty: number;
};

const columnHelper = createColumnHelper<ClassroomRow>();

export function ClassRoomComponent() {
  const [pageIndex, setPageIndex] = useState(0);
  const [cursors, setCursors] = useState<(string | null)[]>([null]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [classroomName, setClassroomName] = useState("");
  const [classroomColor, setClassroomColor] = useState("#4CAF50"); // Hex String state
  const [classroomQty, setClassroomQty] = useState(1);

  const [createclassroom] = useCreateClassroomMutation();
  const { data, loading, error } = useClassRoomsQuery({
    variables: {
      first: PAGE_SIZE,
      after: cursors[pageIndex] ?? null,
    },
  });
  const edges = data?.classRooms?.edges ?? [];
  const lastCursor = edges.length > 0 ? edges[edges.length - 1]?.cursor : null;

  const hasNextPage = edges.length === PAGE_SIZE;
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
  const tableData: ClassroomRow[] = useMemo(() => {
    return (
      data?.classRooms?.edges?.map(({ node }: any) => ({
        id: node.id,
        name: node.name,
        color: intToHex(node.color),
        qty: node.qty,
      })) ?? []
    );
  }, [data]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("#4CAF50");
  const [editQty, setEditQty] = useState(1);

  const [updateClassroom, { loading: isUpdating }] =
    useUpdateClassroomMutation();

  const handleOpenEdit = (classroom: ClassroomRow) => {
    setEditingId(classroom.id);
    setEditName(classroom.name);
    setEditColor(classroom.color);
    setEditQty(classroom.qty);
    setIsEditModalOpen(true);
  };

  const handleCloseEdit = () => {
    setIsEditModalOpen(false);
    setEditingId(null);
    setEditName("");
    setEditColor("#4CAF50");
    setEditQty(1);
  };

  const [updateError, setUpdateError] = useState<string | null>(null);
  const handleUpdateClassroom = async () => {
    if (!editingId || !editName.trim()) return;

    try {
      await updateClassroom({
        variables: {
          id: editingId,
          input: {
            name: editName.trim(),
            color: hexToInt(editColor),
            qty: editQty,
          },
        },
      });
      handleCloseEdit();
    } catch (err) {
      setUpdateError("Failed to update classroom. Please try again.");
    }
  };

  const columns = useMemo(
    () => [
      columnHelper.accessor("name", {
        header: () => `${t("students.name")}`,
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor("color", {
        header: () => `${t("settings.color")}`,
        cell: (info) => (
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Box
              sx={{
                width: 16,
                height: 16,
                borderRadius: "50%",
                backgroundColor: info.getValue(), // Theme-UI receives valid string
              }}
            />
            {info.getValue()}
          </Box>
        ),
      }),
      columnHelper.accessor("qty", {
        header: () => `${t("settings.quantity")}`,
        cell: (info) => info.getValue(),
      }),
      columnHelper.display({
        id: "actions",
        header: () => `${t("common.actions")}`,
        cell: (info) => (
          <Flex sx={{ gap: 2 }}>
            <Button
              onClick={() => handleOpenEdit(info.row.original)}
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
                "&:hover": {
                  opacity: 0.8,
                },
              }}
            >
              {t("common.edit")}
            </Button>
          </Flex>
        ),
      }),
    ],
    [t]
  );

  const table = useReactTable({
    data: tableData,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const handleCreateClassroom = async () => {
    if (!classroomName.trim()) return;

    await createclassroom({
      variables: {
        input: {
          name: classroomName,
          // 🔹 Convert Hex String ("#4CAF50") to Int (5025616) for GraphQL
          color: hexToInt(classroomColor),
          qty: classroomQty,
        },
      },
    });

    setClassroomName("");
    setClassroomColor("#4CAF50");
    setClassroomQty(1);
    setIsModalOpen(false);
  };

  if (loading) return <Box>Loading...</Box>;
  if (error) return <Box>Error: {error.message}</Box>;
  {
    updateError && (
      <Alert variant="error" sx={{ mb: 3 }}>
        {updateError}
      </Alert>
    );
  }
  return (
    <Box sx={{ overflowX: "auto", mb: 3 }}>
      {/* BUTTON */}
      <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 3 }}>
        <Button onClick={() => setIsModalOpen(true)}>
          {t("settings.addClassroom")}
        </Button>
      </Box>

      {/* TABLE */}
      <Box
        as="table"
        sx={{
          width: "100%",
          borderCollapse: "collapse",
          "& th, & td": {
            textAlign: "start",
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
            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.4)",
          }}
        >
          <Heading as="h2" sx={{ color: "text", mb: 3, fontSize: 4 }}>
            Create Classroom
          </Heading>

          {/* Classroom Name Input */}
          <Input
            value={classroomName}
            onChange={(e) => setClassroomName(e.target.value)}
            placeholder="Classroom name"
            sx={{
              mt: 3,
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
              },
            }}
          />

          {/* Capacity Label & Input */}
          <Label
            htmlFor="qty"
            sx={{ mt: 3, mb: 1, fontWeight: "bold", color: "text" }}
          >
            Quantity / Capacity
          </Label>
          <Input
            id="qty"
            type="number"
            value={classroomQty}
            onChange={(e) => setClassroomQty(Number(e.target.value))}
            sx={{
              mb: 3,
              color: "text",
              bg: "background",
              borderColor: "muted",
              borderRadius: "6px",
              p: 2,
              "&:focus": {
                borderColor: "primary",
                outline: "none",
              },
            }}
          />

          {/* Color Selector Section */}
          <Box sx={{ mb: 3 }}>
            <Label
              htmlFor="color"
              sx={{ mb: 2, fontWeight: "bold", color: "text" }}
            >
              {t("classrooms.groupColor")}
            </Label>

            <Flex
              sx={{ gap: 2, alignItems: "center", flexWrap: "wrap", mb: 3 }}
            >
              {[
                "#4CAF50",
                "#2196F3",
                "#9C27B0",
                "#FF9800",
                "#E91E63",
                "#00BCD4",
                "#3F51B5",
                "#009688",
                "#FFEB3B",
                "#795548",
              ].map((presetColor) => (
                <Box
                  key={presetColor}
                  onClick={() => setClassroomColor(presetColor)}
                  sx={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    backgroundColor: presetColor,
                    cursor: "pointer",
                    border:
                      classroomColor === presetColor
                        ? "3px solid"
                        : "1px solid",
                    borderColor:
                      classroomColor === presetColor ? "text" : "muted",
                    transition: "all 0.2s ease",
                    "&:hover": { transform: "scale(1.1)" },
                  }}
                />
              ))}

              {/* Custom Color Picker Button */}
              <Box
                sx={{
                  position: "relative",
                  width: "32px",
                  height: "32px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text sx={{ fontSize: 3, pointerEvents: "none", zIndex: 1 }}>
                  🎨
                </Text>
                <Input
                  type="color"
                  id="color"
                  name="color"
                  value={classroomColor}
                  onChange={(e) => setClassroomColor(e.target.value)}
                  sx={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    opacity: 0,
                    cursor: "pointer",
                  }}
                />
              </Box>
            </Flex>

            {/* Selected Color Card */}
            <Flex
              sx={{
                alignItems: "center",
                gap: 3,
                p: 2,
                bg: "muted",
                borderRadius: "6px",
                borderLeft: "6px solid",
                borderLeftColor: classroomColor,
                maxWidth: "280px",
              }}
            >
              <Box
                sx={{
                  width: "16px",
                  height: "16px",
                  borderRadius: "50%",
                  backgroundColor: classroomColor,
                }}
              />
              <Box>
                <Text
                  sx={{
                    fontSize: 0,
                    color: "text",
                    opacity: 0.7,
                    display: "block",
                    textTransform: "uppercase",
                  }}
                >
                  {t("groups.selectedColor") || "Selected Color"}
                </Text>
                <Text
                  sx={{
                    fontFamily: "mono",
                    fontWeight: "bold",
                    fontSize: 1,
                    color: "text",
                  }}
                >
                  {classroomColor.toUpperCase()}
                </Text>
              </Box>
            </Flex>
          </Box>

          {/* Actions / Buttons */}
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
              onClick={handleCreateClassroom}
              disabled={!classroomName.trim()}
              sx={{
                bg: "primary",
                color: "background",
                px: 3,
                py: 2,
                borderRadius: "6px",
                cursor: classroomName.trim() ? "pointer" : "not-allowed",
                opacity: classroomName.trim() ? 1 : 0.5,
                "&:hover": {
                  opacity: classroomName.trim() ? 0.9 : 0.5,
                },
              }}
            >
              {t("common.create")}
            </Button>
          </Box>
        </Box>
      </Modal>

      <Modal
        isOpen={isEditModalOpen}
        onRequestClose={handleCloseEdit}
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
            {t("settings.editClassroom")}
          </Heading>

          {/* Name */}
          <Input
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            placeholder="Classroom name"
            sx={{
              mt: 3,
              color: "text",
              bg: "background",
              borderColor: "muted",
              borderRadius: "6px",
              p: 2,
              "&::placeholder": { color: "text", opacity: 0.5 },
              "&:focus": { borderColor: "primary", outline: "none" },
            }}
          />

          {/* Quantity */}
          <Label
            htmlFor="edit-qty"
            sx={{ mt: 3, mb: 1, fontWeight: "bold", color: "text" }}
          >
            Quantity / Capacity
          </Label>
          <Input
            id="edit-qty"
            type="number"
            value={editQty}
            onChange={(e) => setEditQty(Number(e.target.value))}
            sx={{
              mb: 3,
              color: "text",
              bg: "background",
              borderColor: "muted",
              borderRadius: "6px",
              p: 2,
              "&:focus": { borderColor: "primary", outline: "none" },
            }}
          />

          {/* Color */}
          <Box sx={{ mb: 3 }}>
            <Label
              htmlFor="edit-color"
              sx={{ mb: 2, fontWeight: "bold", color: "text" }}
            >
              {t("classrooms.groupColor")}
            </Label>

            <Flex
              sx={{ gap: 2, alignItems: "center", flexWrap: "wrap", mb: 3 }}
            >
              {PRESET_COLORS.map((presetColor) => (
                <Box
                  key={presetColor}
                  onClick={() => setEditColor(presetColor)}
                  sx={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    backgroundColor: presetColor,
                    cursor: "pointer",
                    border:
                      editColor.toLowerCase() === presetColor.toLowerCase()
                        ? "3px solid"
                        : "1px solid",
                    borderColor:
                      editColor.toLowerCase() === presetColor.toLowerCase()
                        ? "text"
                        : "muted",
                    transition: "all 0.2s ease",
                    "&:hover": { transform: "scale(1.1)" },
                  }}
                />
              ))}

              <Box
                sx={{
                  position: "relative",
                  width: "32px",
                  height: "32px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text sx={{ fontSize: 3, pointerEvents: "none", zIndex: 1 }}>
                  🎨
                </Text>
                <Input
                  type="color"
                  id="edit-color"
                  name="edit-color"
                  value={editColor}
                  onChange={(e) => setEditColor(e.target.value)}
                  sx={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    opacity: 0,
                    cursor: "pointer",
                  }}
                />
              </Box>
            </Flex>

            <Flex
              sx={{
                alignItems: "center",
                gap: 3,
                p: 2,
                bg: "muted",
                borderRadius: "6px",
                borderLeft: "6px solid",
                borderLeftColor: editColor,
                maxWidth: "280px",
              }}
            >
              <Box
                sx={{
                  width: "16px",
                  height: "16px",
                  borderRadius: "50%",
                  backgroundColor: editColor,
                }}
              />
              <Box>
                <Text
                  sx={{
                    fontSize: 0,
                    color: "text",
                    opacity: 0.7,
                    display: "block",
                    textTransform: "uppercase",
                  }}
                >
                  {t("groups.selectedColor") || "Selected Color"}
                </Text>
                <Text
                  sx={{
                    fontFamily: "mono",
                    fontWeight: "bold",
                    fontSize: 1,
                    color: "text",
                  }}
                >
                  {editColor.toUpperCase()}
                </Text>
              </Box>
            </Flex>
          </Box>

          {/* Actions */}
          <Box
            sx={{ display: "flex", justifyContent: "flex-end", mt: 4, gap: 2 }}
          >
            <Button
              variant="secondary"
              onClick={handleCloseEdit}
              sx={{
                bg: "muted",
                color: "text",
                cursor: "pointer",
                px: 3,
                py: 2,
                borderRadius: "6px",
                "&:hover": { opacity: 0.85 },
              }}
            >
              {t("common.cancel")}
            </Button>

            <Button
              onClick={handleUpdateClassroom}
              disabled={!editName.trim() || isUpdating}
              sx={{
                bg: "primary",
                color: "background",
                px: 3,
                py: 2,
                borderRadius: "6px",
                cursor:
                  editName.trim() && !isUpdating ? "pointer" : "not-allowed",
                opacity: editName.trim() && !isUpdating ? 1 : 0.5,
                "&:hover": {
                  opacity: editName.trim() && !isUpdating ? 0.9 : 0.5,
                },
              }}
            >
              {isUpdating ? t("common.saving") : t("common.save")}
            </Button>
          </Box>
        </Box>
      </Modal>
    </Box>
  );
}
