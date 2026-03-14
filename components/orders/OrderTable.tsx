/**
 * Order Table Component
 * Displays orders in a table format with sorting, pagination, and filtering
 */

"use client";

import React, { useMemo, useState, useLayoutEffect } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Order } from "@/types";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import { PaginationType } from "@/components/shared/PaginationSelector";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GrFormPrevious, GrFormNext } from "react-icons/gr";
import { BiFirstPage, BiLastPage } from "react-icons/bi";
import { ChevronDown } from "lucide-react";

interface OrderTableProps {
  data: Order[];
  columns: ColumnDef<Order>[];
  isLoading: boolean;
  searchTerm: string;
  pagination: PaginationType;
  setPagination: (
    updater: PaginationType | ((old: PaginationType) => PaginationType)
  ) => void;
  selectedStatuses: string[];
  selectedPaymentStatuses: string[];
}

export const OrderTable = React.memo(function OrderTable({
  data,
  columns,
  isLoading,
  searchTerm,
  pagination,
  setPagination,
  selectedStatuses,
  selectedPaymentStatuses,
}: OrderTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);

  const filteredData = useMemo(() => {
    const filtered = data.filter((order) => {
      // Search term filtering (by order number)
      const searchMatch =
        !searchTerm ||
        order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase());

      // Status filtering
      const statusMatch =
        selectedStatuses.length === 0 ||
        selectedStatuses.includes(order.status);

      // Payment status filtering
      const paymentStatusMatch =
        selectedPaymentStatuses.length === 0 ||
        selectedPaymentStatuses.includes(order.paymentStatus);

      return searchMatch && statusMatch && paymentStatusMatch;
    });

    return filtered;
  }, [data, searchTerm, selectedStatuses, selectedPaymentStatuses]);

  const table = useReactTable({
    data: filteredData || [],
    columns,
    state: {
      pagination,
      sorting,
    },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const [pageSizeSelectMounted, setPageSizeSelectMounted] = useState(false);
  useLayoutEffect(() => setPageSizeSelectMounted(true), []);

  return (
    <div className="poppins mt-0">
      {/* Show Table Skeleton while loading - matches exact table structure */}
      {isLoading ? (
        <TableSkeleton rows={pagination.pageSize} columns={columns.length} />
      ) : (
        <>
          <div className="rounded-[28px] border dark:border-white/10   backdrop-blur-sm overflow-hidden">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow
                    key={headerGroup.id}
                    className="bg-white/40 dark:bg-white/10"
                  >
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row, index) => (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && "selected"}
                      className={
                        index % 2 === 0
                          ? "bg-white/30 dark:bg-white/5"
                          : "bg-white/20 dark:bg-white/10"
                      }
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="text-center text-gray-900 dark:text-white"
                    >
                      No orders found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination Footer: Rows per page (left) | Page controls (right) */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 mt-4">
            {/* Rows per page - Left (defer Select until mount to avoid Radix aria-controls hydration mismatch) */}
            <div className="flex items-center gap-3">
              <div className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                Rows per page
              </div>
              {!pageSizeSelectMounted ? (
                <div
                  className="h-10 rounded-[28px] border text-gray-700 dark:text-white px-2 w-16 sm:w-20 flex items-center justify-between font-medium"
                  aria-hidden
                >
                  <span>{pagination.pageSize}</span>
                  <ChevronDown className="h-4 w-4 opacity-70" />
                </div>
              ) : (
                <Select
                  value={pagination.pageSize.toString()}
                  onValueChange={(value) =>
                    setPagination((prev) => ({
                      ...prev,
                      pageSize: Number(value),
                    }))
                  }
                >
                  <SelectTrigger className="h-10 rounded-[28px] border text-gray-700 dark:text-white  backdrop-blur-sm transition duration-200 dark: font-medium px-2 w-16 sm:w-20">
                    <SelectValue placeholder={pagination.pageSize.toString()} />
                  </SelectTrigger>
                  <SelectContent
                    position="popper"
                    sideOffset={5}
                    className="rounded-[28px] border dark:border-white/10 bg-white/80 dark:bg-popover/50 backdrop-blur-sm "
                  >
                    {[4, 6, 8, 10, 15, 20, 30].map((size) => (
                      <SelectItem
                        key={size}
                        value={size.toString()}
                        className="text-gray-700 dark:text-white/80 focus:bg-violet-100 dark:focus:bg-white/10 focus:text-gray-900 dark:focus:text-white"
                      >
                        {size}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Pagination Buttons - Right */}
            <div className="flex items-center justify-center sm:justify-end gap-2 sm:gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
                className="h-10 rounded-[28px] border text-gray-700 dark:text-white  backdrop-blur-sm transition duration-200 dark: disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <BiFirstPage />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                className="h-10 rounded-[28px] border text-gray-700 dark:text-white  backdrop-blur-sm transition duration-200 dark: disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <GrFormPrevious />
              </Button>
              <span className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                Page {pagination.pageIndex + 1} of {table.getPageCount()}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                className="h-10 rounded-[28px] border text-gray-700 dark:text-white  backdrop-blur-sm transition duration-200 dark: disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <GrFormNext />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
                className="h-10 rounded-[28px] border text-gray-700 dark:text-white  backdrop-blur-sm transition duration-200 dark: disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <BiLastPage />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
});
