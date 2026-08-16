import React from "react";
import {
  TableWrapper,
  Table,
  TableHead,
  TableRow,
  TableHeader,
  TableBody,
  TableCell,
} from "./TableWrapper";
import { SearchBar } from "./SearchBar";
import { Button } from "./button";
import { EmptyState } from "./EmptyState";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "../../lib/utils";

export interface DataTableColumn<T> {
  header: string;
  accessor: keyof T | ((row: T) => React.ReactNode);
  className?: string;
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  isLoading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyIcon?: React.ReactNode;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  filterComponent?: React.ReactNode;
  pagination?: {
    pageIndex: number;
    pageSize: number;
    totalItems: number;
    onPageChange: (page: number) => void;
  };
  onRowClick?: (row: T) => void;
  className?: string;
}

export function DataTable<T>({
  columns,
  data,
  isLoading = false,
  emptyTitle = "No records found",
  emptyDescription = "There are no records matching your criteria.",
  emptyIcon,
  searchPlaceholder = "Search...",
  searchValue,
  onSearchChange,
  filterComponent,
  pagination,
  onRowClick,
  className,
}: DataTableProps<T>) {
  // Compute pagination values
  const pageStart =
    pagination && pagination.totalItems > 0
      ? (pagination.pageIndex - 1) * pagination.pageSize + 1
      : 0;
  const pageEnd = pagination
    ? Math.min(
        pagination.pageIndex * pagination.pageSize,
        pagination.totalItems,
      )
    : 0;
  const totalPages = pagination
    ? Math.ceil(pagination.totalItems / pagination.pageSize)
    : 0;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Top Search & Filter Bar */}
      {(onSearchChange || filterComponent) && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 select-none">
          {onSearchChange && (
            <div className="w-full sm:max-w-xs">
              <SearchBar
                placeholder={searchPlaceholder}
                value={searchValue || ""}
                onChange={(e) => onSearchChange(e.target.value)}
              />
            </div>
          )}
          {filterComponent && (
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              {filterComponent}
            </div>
          )}
        </div>
      )}

      {/* Table Element */}
      <TableWrapper>
        <Table>
          <TableHead>
            <TableRow>
              {columns.map((col, idx) => (
                <TableHeader key={idx} className={col.className}>
                  {col.header}
                </TableHeader>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="text-center py-10"
                >
                  <div className="flex justify-center items-center gap-2 text-muted-foreground font-semibold">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    Loading records...
                  </div>
                </TableCell>
              </TableRow>
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="p-0">
                  <div className="border-0 rounded-none bg-transparent">
                    <EmptyState
                      title={emptyTitle}
                      description={emptyDescription}
                      icon={emptyIcon}
                    />
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              data.map((row, rowIdx) => (
                <TableRow
                  key={rowIdx}
                  onClick={() => onRowClick && onRowClick(row)}
                  className={cn(onRowClick ? "cursor-pointer" : "")}
                >
                  {columns.map((col, colIdx) => {
                    const value =
                      typeof col.accessor === "function"
                        ? col.accessor(row)
                        : (row[col.accessor] as React.ReactNode);
                    return (
                      <TableCell key={colIdx} className={col.className}>
                        {value}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableWrapper>

      {/* Pagination Bar */}
      {pagination && pagination.totalItems > 0 && (
        <div className="flex items-center justify-between px-2 select-none">
          <div className="text-xs font-semibold text-muted-foreground">
            Showing <span className="text-foreground">{pageStart}</span> to{" "}
            <span className="text-foreground">{pageEnd}</span> of{" "}
            <span className="text-foreground">{pagination.totalItems}</span>{" "}
            entries
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => pagination.onPageChange(pagination.pageIndex - 1)}
              disabled={pagination.pageIndex <= 1}
              className="h-8.5 w-8.5 p-0 flex items-center justify-center rounded-lg cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-xs font-bold text-muted-foreground">
              Page {pagination.pageIndex} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => pagination.onPageChange(pagination.pageIndex + 1)}
              disabled={pagination.pageIndex >= totalPages}
              className="h-8.5 w-8.5 p-0 flex items-center justify-center rounded-lg cursor-pointer"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
