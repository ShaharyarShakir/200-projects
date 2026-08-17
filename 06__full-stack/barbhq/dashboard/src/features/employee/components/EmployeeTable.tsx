import React, { useState, useMemo, useEffect } from "react";
import { format } from "date-fns";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  UserCheck,
  UserMinus,
  Settings2,
} from "lucide-react";
import {
  TableWrapper,
  Table,
  TableHead,
  TableRow,
  TableHeader,
  TableBody,
  TableCell,
} from "../../../components/ui/TableWrapper";
import { Button } from "../../../components/ui/button";
import { Checkbox } from "../../../components/ui/checkbox";
import { Dropdown } from "../../../components/ui/Dropdown";
import { EmployeeAvatar } from "./EmployeeAvatar";
import { EmployeeStatusBadge } from "./EmployeeStatusBadge";
import { EmployeeRoleBadge } from "./EmployeeRoleBadge";
import { EmployeeActions } from "./EmployeeActions";
import type { Employee, User } from "../../../types";

interface EmployeeTableProps {
  employees: Employee[];
  currentUser: User | null;
  isLoading?: boolean;
  onView: (employee: Employee) => void;
  onEdit: (employee: Employee) => void;
  onClockIn: (employee: Employee) => void;
  onClockOut: (employee: Employee) => void;
  onDeactivate: (employee: Employee) => void;
  searchTerm: string;
  statusFilter: string;
  roleFilter: string;
  employmentTypeFilter: string;
}

type SortField = "name" | "role" | "status" | "employmentType" | "hireDate" | "isClockedIn";
type SortOrder = "asc" | "desc" | null;

interface SortState {
  field: SortField;
  order: SortOrder;
}

export const EmployeeTable: React.FC<EmployeeTableProps> = ({
  employees,
  currentUser,
  isLoading = false,
  onView,
  onEdit,
  onClockIn,
  onClockOut,
  onDeactivate,
  searchTerm,
  statusFilter,
  roleFilter,
  employmentTypeFilter,
}) => {
  // 1. Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // 2. Sorting State
  const [sort, setSort] = useState<SortState>({ field: "name", order: "asc" });

  // 3. Column Visibility State
  const [visibleColumns, setVisibleColumns] = useState({
    avatar: true,
    employee: true,
    role: true,
    phone: true,
    status: true,
    employmentType: true,
    clockStatus: true,
    hireDate: true,
  });

  // 4. Row Selection State
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Handle Sort cycling
  const handleSort = (field: SortField) => {
    setSort((prev) => {
      if (prev.field === field) {
        if (prev.order === "asc") return { field, order: "desc" };
        if (prev.order === "desc") return { field, order: null };
        return { field, order: "asc" };
      }
      return { field, order: "asc" };
    });
  };

  // Filter & Sort Employees list locally
  const processedEmployees = useMemo(() => {
    // A. Search & Filter
    let result = employees.filter((emp) => {
      const fullName = `${emp.firstName} ${emp.lastName}`.toLowerCase();
      const code = emp.employeeCode.toLowerCase();
      const email = emp.email.toLowerCase();
      const phone = emp.phone?.toLowerCase() || "";

      const matchesSearch =
        fullName.includes(searchTerm.toLowerCase()) ||
        code.includes(searchTerm.toLowerCase()) ||
        email.includes(searchTerm.toLowerCase()) ||
        phone.includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === "ALL" || emp.status === statusFilter;
      const matchesRole = roleFilter === "ALL" || emp.role === roleFilter;
      const matchesEmployment =
        employmentTypeFilter === "ALL" || emp.employmentType === employmentTypeFilter;

      return matchesSearch && matchesStatus && matchesRole && matchesEmployment;
    });

    // B. Sort
    if (sort.field && sort.order) {
      const field = sort.field;
      const orderMultiplier = sort.order === "asc" ? 1 : -1;

      result = [...result].sort((a, b) => {
        let valA: string | number;
        let valB: string | number;

        if (field === "name") {
          valA = `${a.firstName} ${a.lastName}`.toLowerCase();
          valB = `${b.firstName} ${b.lastName}`.toLowerCase();
        } else if (field === "hireDate") {
          valA = new Date(a.hireDate).getTime();
          valB = new Date(b.hireDate).getTime();
        } else {
          const rawA = a[field];
          const rawB = b[field];
          valA = typeof rawA === "string" ? rawA.toLowerCase() : typeof rawA === "number" ? rawA : typeof rawA === "boolean" ? (rawA ? 1 : 0) : "";
          valB = typeof rawB === "string" ? rawB.toLowerCase() : typeof rawB === "number" ? rawB : typeof rawB === "boolean" ? (rawB ? 1 : 0) : "";
        }

        if (valA < valB) return -1 * orderMultiplier;
        if (valA > valB) return 1 * orderMultiplier;
        return 0;
      });
    }

    return result;
  }, [employees, searchTerm, statusFilter, roleFilter, employmentTypeFilter, sort]);

  const totalPages = Math.ceil(processedEmployees.length / pageSize) || 1;
  const effectivePage = Math.min(currentPage, totalPages);

  useEffect(() => {
    if (currentPage !== effectivePage) {
      setCurrentPage(effectivePage);
    }
  }, [currentPage, effectivePage]);

  // Pagination bounds
  const paginatedEmployees = useMemo(() => {
    const start = (effectivePage - 1) * pageSize;
    return processedEmployees.slice(start, start + pageSize);
  }, [processedEmployees, effectivePage]);

  // Handle Select All rows
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = paginatedEmployees.map((emp) => emp.id);
      setSelectedIds(new Set(allIds));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectRow = (id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  };

  const isAllSelected =
    paginatedEmployees.length > 0 &&
    paginatedEmployees.every((emp) => selectedIds.has(emp.id));

  // Render sort icon helper
  const renderSortIcon = (field: SortField) => {
    if (sort.field !== field) return <ArrowUpDown className="ml-1.5 w-3.5 h-3.5 text-muted-foreground/60" />;
    if (sort.order === "asc") return <ArrowUp className="ml-1.5 w-3.5 h-3.5 text-primary" />;
    if (sort.order === "desc") return <ArrowDown className="ml-1.5 w-3.5 h-3.5 text-primary" />;
    return <ArrowUpDown className="ml-1.5 w-3.5 h-3.5 text-muted-foreground/60" />;
  };

  // Visibility toggle items
  const columnToggleItems = Object.keys(visibleColumns)
    .filter((col) => col !== "avatar" && col !== "employee") // exclude critical columns
    .map((col) => {
      const labelMap: Record<string, string> = {
        role: "Role",
        phone: "Phone",
        status: "Status",
        employmentType: "Employment Type",
        clockStatus: "Clock Status",
        hireDate: "Hire Date",
      };
      const key = col as keyof typeof visibleColumns;
      return {
        label: labelMap[col] || col,
        icon: visibleColumns[key] ? <Eye className="w-4 h-4 text-primary" /> : <EyeOff className="w-4 h-4 text-muted-foreground" />,
        onClick: () =>
          setVisibleColumns((prev) => ({ ...prev, [key]: !prev[key] })),
      };
    });

  return (
    <div className="space-y-4">
      {/* 1. Columns Controls / Selection actions bar */}
      <div className="flex justify-between items-center px-1 select-none">
        <div>
          {selectedIds.size > 0 && (
            <span className="bg-primary/10 px-3 py-1 border border-primary/20 rounded-full font-bold text-primary text-xs animate-fade-in">
              {selectedIds.size} staff members selected
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Dropdown
            trigger={
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-1.5 h-8.5 font-bold text-xs cursor-pointer"
              >
                <Settings2 className="w-3.5 h-3.5" />
                Columns
              </Button>
            }
            items={columnToggleItems}
          />
        </div>
      </div>

      {/* 2. Main Data Table with Sticky Header */}
      <TableWrapper className="relative bg-card shadow-md border border-border/80 rounded-xl overflow-x-auto">
        <Table className="w-full text-sm">
          <TableHead className="top-0 z-10 sticky bg-card border-border border-b">
            <TableRow>
              {/* Select Checkbox Column */}
              <TableHeader className="px-4 w-12 text-center">
                <Checkbox
                  checked={isAllSelected}
                  onCheckedChange={(checked) => handleSelectAll(!!checked)}
                />
              </TableHeader>

              {/* Avatar Column */}
              {visibleColumns.avatar && (
                <TableHeader className="px-4 w-16">Avatar</TableHeader>
              )}

              {/* Employee Column */}
              {visibleColumns.employee && (
                <TableHeader
                  className="hover:bg-secondary/40 px-4 font-bold text-left cursor-pointer select-none"
                  onClick={() => handleSort("name")}
                >
                  <div className="flex items-center">
                    Employee
                    {renderSortIcon("name")}
                  </div>
                </TableHeader>
              )}

              {/* Role Column */}
              {visibleColumns.role && (
                <TableHeader
                  className="hover:bg-secondary/40 px-4 cursor-pointer select-none"
                  onClick={() => handleSort("role")}
                >
                  <div className="flex items-center">
                    Role
                    {renderSortIcon("role")}
                  </div>
                </TableHeader>
              )}

              {/* Phone Column */}
              {visibleColumns.phone && (
                <TableHeader className="px-4 text-left">Phone</TableHeader>
              )}

              {/* Status Column */}
              {visibleColumns.status && (
                <TableHeader
                  className="hover:bg-secondary/40 px-4 cursor-pointer select-none"
                  onClick={() => handleSort("status")}
                >
                  <div className="flex items-center">
                    Status
                    {renderSortIcon("status")}
                  </div>
                </TableHeader>
              )}

              {/* Employment Type Column */}
              {visibleColumns.employmentType && (
                <TableHeader
                  className="hover:bg-secondary/40 px-4 cursor-pointer select-none"
                  onClick={() => handleSort("employmentType")}
                >
                  <div className="flex items-center">
                    Employment
                    {renderSortIcon("employmentType")}
                  </div>
                </TableHeader>
              )}

              {/* Clock Status Column */}
              {visibleColumns.clockStatus && (
                <TableHeader
                  className="hover:bg-secondary/40 px-4 cursor-pointer select-none"
                  onClick={() => handleSort("isClockedIn")}
                >
                  <div className="flex justify-center items-center text-center">
                    Clock Status
                    {renderSortIcon("isClockedIn")}
                  </div>
                </TableHeader>
              )}

              {/* Hire Date Column */}
              {visibleColumns.hireDate && (
                <TableHeader
                  className="hover:bg-secondary/40 px-4 cursor-pointer select-none"
                  onClick={() => handleSort("hireDate")}
                >
                  <div className="flex items-center">
                    Hire Date
                    {renderSortIcon("hireDate")}
                  </div>
                </TableHeader>
              )}

              {/* Actions Column */}
              <TableHeader className="px-4 w-16 text-right">Actions</TableHeader>
            </TableRow>
          </TableHead>

          <TableBody>
            {isLoading ? (
              Array.from({ length: pageSize }).map((_, idx) => (
                <TableRow key={idx}>
                  <TableCell colSpan={10} className="py-5 text-center">
                    <div className="bg-secondary/30 rounded-md w-full h-6 animate-pulse" />
                  </TableCell>
                </TableRow>
              ))
            ) : paginatedEmployees.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="py-12 text-muted-foreground text-center select-none">
                  <div className="flex flex-col justify-center items-center gap-2">
                    <p className="font-semibold text-foreground text-sm">No employees found</p>
                    <p className="text-xs">There are no rostered staff matching your query constraints.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              paginatedEmployees.map((emp) => {
                const isSelected = selectedIds.has(emp.id);
                return (
                  <TableRow
                    key={emp.id}
                    className={isSelected ? "bg-primary/5 dark:bg-primary/10 hover:bg-primary/10" : "hover:bg-secondary/20"}
                  >
                    {/* Checkbox */}
                    <TableCell className="px-4 w-12 text-center">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={(checked) => handleSelectRow(emp.id, !!checked)}
                      />
                    </TableCell>

                    {/* Avatar */}
                    {visibleColumns.avatar && (
                      <TableCell className="px-4 py-3 w-16 align-middle">
                        <EmployeeAvatar
                          src={emp.avatar}
                          firstName={emp.firstName}
                          lastName={emp.lastName}
                          size="sm"
                        />
                      </TableCell>
                    )}

                    {/* Employee Profile */}
                    {visibleColumns.employee && (
                      <TableCell className="px-4 py-3 font-sans align-middle">
                        <div className="flex flex-col select-all">
                          <span className="font-semibold text-foreground leading-normal">
                            {emp.firstName} {emp.lastName}
                          </span>
                          <span className="mt-0.5 font-bold text-[10px] text-muted-foreground uppercase tracking-wider">
                            {emp.employeeCode}
                          </span>
                          <span className="mt-0.5 text-muted-foreground/80 text-xs">
                            {emp.email}
                          </span>
                        </div>
                      </TableCell>
                    )}

                    {/* Role */}
                    {visibleColumns.role && (
                      <TableCell className="px-4 py-3 align-middle">
                        <EmployeeRoleBadge role={emp.role} />
                      </TableCell>
                    )}

                    {/* Phone */}
                    {visibleColumns.phone && (
                      <TableCell className="px-4 py-3 text-xs align-middle select-all">
                        {emp.phone || <span className="text-muted-foreground/50">N/A</span>}
                      </TableCell>
                    )}

                    {/* Status */}
                    {visibleColumns.status && (
                      <TableCell className="px-4 py-3 align-middle">
                        <EmployeeStatusBadge status={emp.status} />
                      </TableCell>
                    )}

                    {/* Employment Type */}
                    {visibleColumns.employmentType && (
                      <TableCell className="px-4 py-3 font-semibold text-xs align-middle">
                        {emp.employmentType === "FULL_TIME"
                          ? "Full Time"
                          : emp.employmentType === "PART_TIME"
                          ? "Part Time"
                          : "Contract"}
                      </TableCell>
                    )}

                    {/* Clock Status */}
                    {visibleColumns.clockStatus && (
                      <TableCell className="px-4 py-3 text-center align-middle">
                        <div className="flex justify-center items-center select-none">
                          {emp.isClockedIn ? (
                            <span className="inline-flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded font-extrabold text-[10px] text-emerald-600 dark:text-emerald-400 uppercase">
                              <UserCheck className="w-3 h-3" />
                              Clocked In
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 bg-muted px-2 py-0.5 border rounded font-extrabold text-[10px] text-muted-foreground uppercase">
                              <UserMinus className="w-3 h-3" />
                              Off Duty
                            </span>
                          )}
                        </div>
                      </TableCell>
                    )}

                    {/* Hire Date */}
                    {visibleColumns.hireDate && (
                      <TableCell className="px-4 py-3 font-semibold text-muted-foreground text-xs align-middle">
                        {(() => {
                          const hireDate = new Date(emp.hireDate);
                          return Number.isNaN(hireDate.getTime()) ? "—" : format(hireDate, "MMM dd, yyyy");
                        })()}
                      </TableCell>
                    )}

                    {/* Actions */}
                    <TableCell className="px-4 py-3 w-16 text-right align-middle">
                      <EmployeeActions
                        employee={emp}
                        currentUser={currentUser}
                        onView={onView}
                        onEdit={onEdit}
                        onClockIn={onClockIn}
                        onClockOut={onClockOut}
                        onDeactivate={onDeactivate}
                      />
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableWrapper>

      {/* 3. Pagination Controls */}
      {processedEmployees.length > 0 && (
        <div className="flex justify-between items-center px-2 select-none">
          <div className="font-bold text-muted-foreground text-xs">
            Showing <span className="text-foreground">{(currentPage - 1) * pageSize + 1}</span> to{" "}
            <span className="text-foreground">
              {Math.min(currentPage * pageSize, processedEmployees.length)}
            </span>{" "}
            of <span className="text-foreground">{processedEmployees.length}</span> entries
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="flex justify-center items-center p-0 rounded-lg w-8 h-8 cursor-pointer"
            >
              &lt;
            </Button>
            <span className="font-bold text-muted-foreground text-xs">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="flex justify-center items-center p-0 rounded-lg w-8 h-8 cursor-pointer"
            >
              &gt;
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeTable;
