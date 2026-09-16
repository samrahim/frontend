/** @jsxImportSource theme-ui */
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
  ColumnDef,
} from "@tanstack/react-table";
import { useEffect, useMemo, useRef, useState, HTMLProps } from "react";
import { Box, Button, Flex, Text } from "theme-ui";
import { Attendance } from "../graphql";
import i18n from "../i18n/i18n";
import { useTranslation } from "react-i18next";

const columnHelper = createColumnHelper<any>();

// Helper Component to handle the indeterminate state via React Ref
function IndeterminateCheckbox({
  indeterminate,
  className = "",
  ...rest
}: { indeterminate?: boolean } & HTMLProps<HTMLInputElement>) {
  const ref = useRef<HTMLInputElement>(null!);

  useEffect(() => {
    if (typeof indeterminate === "boolean") {
      ref.current.indeterminate = !rest.checked && indeterminate;
    }
  }, [ref, indeterminate, rest.checked]);

  return (
    <input
      type="checkbox"
      ref={ref}
      className={className + " cursor-pointer"}
      style={{ cursor: "pointer", width: 16, height: 16 }}
      {...rest}
    />
  );
}

export interface PendingAttendanceChange {
  attendanceId: string;
  isPresent: boolean;
  reason?: string;
}

interface AttendanceTableProps {
  data: any[];
  loading: boolean;
  onBatchUpdateAttendance: (
    changes: PendingAttendanceChange[]
  ) => Promise<void>;
}

export const AttendanceTable = ({
  data,
  loading,
}: // onBatchUpdateAttendance,
AttendanceTableProps) => {
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});
  // const [updatingBatch, setUpdatingBatch] = useState(false);
  const { t } = useTranslation();

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "";
    const [year, month, day] = dateStr.split("T")[0].split("-");
    return `${day}-${month}-${year}`;
  };

  const columns = useMemo(
    () =>
      [
        // columnHelper.display({
        //   id: "select",
        //   header: ({ table }) => (
        //     <IndeterminateCheckbox
        //       checked={table.getIsAllRowsSelected()}
        //       indeterminate={table.getIsSomeRowsSelected()}
        //       onChange={table.getToggleAllRowsSelectedHandler()}
        //     />
        //   ),
        //   cell: ({ row }) => (
        //     <IndeterminateCheckbox
        //       checked={row.getIsSelected()}
        //       disabled={!row.getCanSelect()}
        //       indeterminate={row.getIsSomeSelected()}
        //       onChange={row.getToggleSelectedHandler()}
        //     />
        //   ),
        // }),
        columnHelper.accessor("studentName", {
          header: () => `${t("students.name")}`,
          cell: (info) => info.getValue(),
        }),
        columnHelper.accessor("date", {
          header: () => `${t("hifdh.date")}`,
          cell: (info) => <Text>{formatDate(info.getValue() as string)}</Text>,
        }),
        columnHelper.accessor("startTime", {
          header: () => `${t("groups.startTime")}`,
          cell: (info) => info.getValue(),
        }),
        columnHelper.accessor("endTime", {
          header: () => `${t("groups.endTime")}`,
          cell: (info) => info.getValue(),
        }),
        columnHelper.accessor("isPresent", {
          header: () => `${t("session.status")}`,
          cell: (info) => (
            <Box sx={{ textAlign: "center", userSelect: "none" }}>
              {info.getValue() ? "✅" : "❌"}
            </Box>
          ),
        }),
        columnHelper.accessor("reason", {
          header: () => `${t("attendance.reason")}`,
          cell: (info) => info.getValue() || "-",
        }),
        columnHelper.accessor("group", {
          header: () => `${t("groups.groupName")}`,
          cell: (info) => info.getValue(),
        }),
        columnHelper.accessor("subject", {
          header: () => `${t("groups.subject")}`,
          cell: (info) => info.getValue(),
        }),
      ] as const,
    []
  ) as ColumnDef<Attendance>[];

  const table = useReactTable({
    data,
    columns,
    state: {
      rowSelection,
    },
    getRowId: (row) => row.id,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    enableRowSelection: true,
  });

  const isRTL = i18n.dir() === "rtl";
  // const selectedRows = table.getSelectedRowModel().rows;
  // const selectedIds = selectedRows.map((r) => r.original.id);

  // const handleBatchAction = async (isPresent: boolean) => {
  //   if (!selectedIds.length || !onBatchUpdateAttendance) return;

  //   let reason: string | undefined = undefined;
  //   if (!isPresent) {
  //     const inputReason = window.prompt("Enter reason for absence (optional):");
  //     if (inputReason === null) return; // User cancelled prompt
  //     reason = inputReason || undefined;
  //   }

  //   // Map string IDs to PendingAttendanceChange[]
  //   const changes: PendingAttendanceChange[] = selectedIds.map((id) => ({
  //     attendanceId: id,
  //     isPresent,
  //     reason,
  //   }));

  //   setUpdatingBatch(true);
  //   try {
  //     await onBatchUpdateAttendance(changes);
  //     setRowSelection({}); // Clear row selection after update
  //   } finally {
  //     setUpdatingBatch(false);
  //   }
  // };

  return (
    <Box sx={{ width: "100%", mt: 4, mb: 2 }}>
      {/* Batch Action Toolbar */}
      {/* {selectedIds.length > 0 && (
        <Flex
          sx={{
            alignItems: "center",
            justifyContent: "space-between",
            bg: "primary",
            color: "white",
            p: 2,
            px: 3,
            borderRadius: "md",
            mb: 2,
            gap: 3,
          }}
        >
          <Text sx={{ fontWeight: "bold" }}>
            {selectedIds.length} item(s) selected
          </Text>
          <Flex sx={{ gap: 2 }}>
            <Button
              onClick={() => handleBatchAction(true)}
              disabled={updatingBatch}
              sx={{ bg: "green", cursor: "pointer", px: 3 }}
            >
              Mark Present ✅
            </Button>
            <Button
              onClick={() => handleBatchAction(false)}
              disabled={updatingBatch}
              sx={{ bg: "red", cursor: "pointer", px: 3 }}
            >
              Mark Absent ❌
            </Button>
          </Flex>
        </Flex>
      )} */}

      {/* Main Table */}
      <Box
        sx={{
          overflowX: "auto",
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
          {/* HEADER */}
          <Box as="thead">
            {table.getHeaderGroups().map((headerGroup) => (
              <Box as="tr" key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <Box
                    as="th"
                    key={header.id}
                    sx={{
                      bg: "tableHeaderBackground",
                      color: "tableHeaderText",
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

          {/* BODY */}
          <Box as="tbody">
            {loading && data.length === 0 ? (
              <Box as="tr">
                <td colSpan={columns.length} style={{ padding: "0" }}>
                  <Box
                    sx={{
                      p: 3,
                      textAlign: "center",
                      borderBottom: "1px solid",
                      borderColor: "tableBorder",
                      color: "tableText",
                    }}
                  >
                    Loading attendances...
                  </Box>
                </td>
              </Box>
            ) : data.length === 0 ? (
              <Box as="tr">
                <td colSpan={columns.length} style={{ padding: "0" }}>
                  <Box
                    sx={{
                      p: 3,
                      textAlign: "center",
                      borderBottom: "1px solid",
                      borderColor: "tableBorder",
                      color: "tableText",
                    }}
                  >
                    {t("attendance.noRecords")}
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
                    "&:nth-of-type(odd)": { bg: "tableRowStripe" },
                    bg: row.getIsSelected() ? "highlight" : "transparent",
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
    </Box>
  );
};
