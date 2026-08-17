import React, { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { EmployeeStatusBadge } from "./employee-status-badge";
import { EmployeeRoleBadge } from "./employee-role-badge";
import { EmployeeActions } from "./employee-actions";
import type { Employee } from "../employees.types";

interface EmployeeTableProps {
  employees: Employee[];
  onView: (emp: Employee) => void;
  onEdit: (emp: Employee) => void;
  onDeactivate: (emp: Employee) => void;
  canEdit?: boolean;
  canDeactivate?: boolean;
  itemsPerPage?: number;
}

export const EmployeeTable: React.FC<EmployeeTableProps> = ({
  employees,
  onView,
  onEdit,
  onDeactivate,
  canEdit = true,
  canDeactivate = true,
  itemsPerPage = 10,
}) => {
  const [currentPage, setCurrentPage] = useState(1);

  const totalItems = employees.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedEmployees = employees.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  if (totalItems === 0) {
    return null; // Empty state rendered by parent page
  }

  return (
    <div className="space-y-4">
      {/* Desktop Data Table */}
      <div className="hidden md:block overflow-hidden rounded-xl border border-border bg-card shadow-xs select-none">
        <table className="w-full text-left text-xs">
          <thead className="bg-secondary/40 border-b border-border text-muted-foreground uppercase text-[10px] font-bold tracking-wider">
            <tr>
              <th className="py-3 px-4">Employee</th>
              <th className="py-3 px-4">Role</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Salary</th>
              <th className="py-3 px-4">Employment</th>
              <th className="py-3 px-4">Joined</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {paginatedEmployees.map((emp) => (
              <tr
                key={emp.id}
                className="hover:bg-secondary/30 transition-colors group cursor-pointer"
                onClick={() => onView(emp)}
              >
                <td className="py-3.5 px-4">
                  <div className="flex items-center gap-3">
                    {emp.avatar ? (
                      <img
                        src={emp.avatar}
                        alt={`${emp.firstName} ${emp.lastName}`}
                        className="h-9 w-9 rounded-full object-cover ring-2 ring-border"
                      />
                    ) : (
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs ring-2 ring-primary/20">
                        {emp.firstName?.[0]}
                        {emp.lastName?.[0]}
                      </div>
                    )}
                    <div>
                      <p className="font-bold text-foreground text-xs group-hover:text-primary transition-colors">
                        {emp.firstName} {emp.lastName}
                      </p>
                      <p className="text-[11px] text-muted-foreground font-medium">{emp.email}</p>
                    </div>
                  </div>
                </td>
                <td className="py-3.5 px-4">
                  <EmployeeRoleBadge role={emp.role} />
                </td>
                <td className="py-3.5 px-4">
                  <EmployeeStatusBadge status={emp.status} isActive={emp.isActive} />
                </td>
                <td className="py-3.5 px-4 font-bold text-foreground">
                  ₨{(emp.salary ?? 45000).toLocaleString()}
                </td>
                <td className="py-3.5 px-4 font-medium text-muted-foreground capitalize">
                  {(emp.employmentType || "FULL_TIME").replace("_", " ").toLowerCase()}
                </td>
                <td className="py-3.5 px-4 text-muted-foreground font-medium">
                  {new Date(emp.hireDate).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </td>
                <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                  <EmployeeActions
                    employee={emp}
                    onView={onView}
                    onEdit={onEdit}
                    onDeactivate={onDeactivate}
                    canEdit={canEdit}
                    canDeactivate={canDeactivate}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card Stack */}
      <div className="grid gap-3 md:hidden select-none">
        {paginatedEmployees.map((emp) => (
          <div
            key={emp.id}
            onClick={() => onView(emp)}
            className="p-4 rounded-xl border border-border bg-card shadow-xs space-y-3 cursor-pointer hover:border-primary/50 transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {emp.avatar ? (
                  <img
                    src={emp.avatar}
                    alt={`${emp.firstName} ${emp.lastName}`}
                    className="h-10 w-10 rounded-full object-cover ring-2 ring-border"
                  />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs ring-2 ring-primary/20">
                    {emp.firstName?.[0]}
                    {emp.lastName?.[0]}
                  </div>
                )}
                <div>
                  <h4 className="font-bold text-sm text-foreground">
                    {emp.firstName} {emp.lastName}
                  </h4>
                  <p className="text-xs text-muted-foreground">{emp.email}</p>
                </div>
              </div>
              <EmployeeStatusBadge status={emp.status} isActive={emp.isActive} />
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-border/50 text-xs">
              <div className="flex items-center gap-2">
                <EmployeeRoleBadge role={emp.role} />
                <span className="font-bold text-foreground">
                  ₨{(emp.salary ?? 45000).toLocaleString()}/mo
                </span>
              </div>
              <div onClick={(e) => e.stopPropagation()}>
                <EmployeeActions
                  employee={emp}
                  onView={onView}
                  onEdit={onEdit}
                  onDeactivate={onDeactivate}
                  canEdit={canEdit}
                  canDeactivate={canDeactivate}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Server & Client Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2 select-none">
          <p className="text-xs font-semibold text-muted-foreground">
            Showing <span className="text-foreground">{startIndex + 1}</span>–
            <span className="text-foreground">{Math.min(startIndex + itemsPerPage, totalItems)}</span> of{" "}
            <span className="text-foreground">{totalItems}</span> employees
          </p>

          <div className="flex items-center gap-1">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card hover:bg-secondary disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  page === currentPage
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "border border-border bg-card hover:bg-secondary text-foreground"
                }`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card hover:bg-secondary disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
