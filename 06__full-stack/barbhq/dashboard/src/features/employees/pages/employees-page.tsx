import React, { useState, useMemo } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Plus, Users, AlertCircle, RefreshCw } from "lucide-react";
import { PageContainer } from "../../../components/layout/PageContainer";
import { PageHeader } from "../../../components/layout/PageHeader";
import { Button } from "../../../components/ui/button";
import { useAuth } from "../../auth";
import { can } from "../../../lib/permissions";
import { useEmployeesQuery } from "../employees.queries";
import {
  useCreateEmployeeMutation,
  useUpdateEmployeeMutation,
  useDeactivateEmployeeMutation,
} from "../employees.mutations";
import { EmployeeFilters, type EmployeeFiltersState } from "../components/employee-filters";
import { EmployeeTable } from "../components/employee-table";
import { EmployeeForm } from "../components/employee-form";
import { EmployeeDeleteDialog } from "../components/employee-delete-dialog";
import type { Employee } from "../employees.types";
import type { EmployeeFormValues } from "../employees.schemas";

export const EmployeesPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const canManage = can(user, "employees.manage");
  const canEdit = can(user, "employees.manage");
  const canDeactivate = can(user, "employees.manage");

  // Filter State
  const [filters, setFilters] = useState<EmployeeFiltersState>({
    search: "",
    role: "ALL",
    status: "ALL",
    employmentType: "ALL",
  });

  // Dialog States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [deactivatingEmployee, setDeactivatingEmployee] = useState<Employee | null>(null);

  // Queries & Mutations
  const { data: employees = [], isLoading, isError, refetch } = useEmployeesQuery();

  const createMutation = useCreateEmployeeMutation(() => setIsFormOpen(false));
  const updateMutation = useUpdateEmployeeMutation(editingEmployee?.id || "", () => {
    setIsFormOpen(false);
    setEditingEmployee(null);
  });
  const deactivateMutation = useDeactivateEmployeeMutation();

  // Filter Data Client-Side for instant responsive filtering
  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      // Search text match
      if (filters.search) {
        const query = filters.search.toLowerCase();
        const fullName = `${emp.firstName} ${emp.lastName}`.toLowerCase();
        const email = (emp.email || "").toLowerCase();
        const phone = (emp.phone || "").toLowerCase();
        const code = (emp.employeeCode || "").toLowerCase();

        if (
          !fullName.includes(query) &&
          !email.includes(query) &&
          !phone.includes(query) &&
          !code.includes(query)
        ) {
          return false;
        }
      }

      // Role match
      if (filters.role && filters.role !== "ALL") {
        if (emp.role !== filters.role) return false;
      }

      // Status match
      if (filters.status && filters.status !== "ALL") {
        const activeFilter = filters.status === "ACTIVE";
        if (emp.isActive !== activeFilter) return false;
      }

      return true;
    });
  }, [employees, filters]);

  const handleOpenAddForm = () => {
    setEditingEmployee(null);
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (emp: Employee) => {
    setEditingEmployee(emp);
    setIsFormOpen(true);
  };

  const handleView = (emp: Employee) => {
    navigate({ to: `/dashboard/employees/${emp.id}` });
  };

  const handleDeactivateClick = (emp: Employee) => {
    setDeactivatingEmployee(emp);
  };

  const handleConfirmDeactivate = () => {
    if (deactivatingEmployee) {
      deactivateMutation.mutate(deactivatingEmployee.id, {
        onSuccess: () => setDeactivatingEmployee(null),
      });
    }
  };

  const handleFormSubmit = (values: EmployeeFormValues) => {
    if (editingEmployee) {
      updateMutation.mutate({
        firstName: values.firstName,
        lastName: values.lastName,
        phone: values.phone,
        role: values.role,
        employmentType: values.employmentType,
        salary: values.salary,
        commissionRate: values.commissionRate,
      });
    } else {
      createMutation.mutate({
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        phone: values.phone,
        password: values.password || "Password123!",
        role: values.role,
        employmentType: values.employmentType,
        salary: values.salary,
        commissionRate: values.commissionRate,
      });
    }
  };

  return (
    <PageContainer className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Employee Directory"
        description="Manage your shop staff members, roles, compensation, and active statuses"
        actions={
          canManage ? (
            <Button onClick={handleOpenAddForm} className="flex items-center gap-1.5 font-bold cursor-pointer">
              <Plus className="h-4 w-4" />
              Add Employee
            </Button>
          ) : null
        }
      />

      {/* Search & Filters */}
      <EmployeeFilters filters={filters} onFiltersChange={setFilters} />

      {/* Loading Skeleton */}
      {isLoading ? (
        <div className="space-y-3 bg-card p-6 rounded-xl border border-border">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-14 bg-secondary/50 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : isError ? (
        /* Error State */
        <div className="flex flex-col items-center justify-center p-12 text-center bg-card rounded-xl border border-border space-y-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <AlertCircle className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-serif font-bold text-foreground text-lg">Couldn't Load Employees</h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm">
              Something went wrong while fetching your shop workforce. Please verify backend connectivity and try again.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="flex items-center gap-1.5 font-semibold">
            <RefreshCw className="h-4 w-4" />
            Retry
          </Button>
        </div>
      ) : filteredEmployees.length === 0 ? (
        /* Empty State */
        <div className="flex flex-col items-center justify-center p-12 text-center bg-card rounded-xl border border-border space-y-4 select-none">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Users className="h-7 w-7" />
          </div>
          <div>
            <h3 className="font-serif font-bold text-foreground text-lg">
              {filters.search || (filters.role && filters.role !== "ALL") || (filters.status && filters.status !== "ALL")
                ? "No matching employees found"
                : "No employees yet"}
            </h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-md">
              {filters.search || (filters.role && filters.role !== "ALL") || (filters.status && filters.status !== "ALL")
                ? "Try adjusting your search criteria or role filters."
                : "Add your first barber or manager to start organizing your shop roster."}
            </p>
          </div>
          {canManage && (
            <Button onClick={handleOpenAddForm} className="flex items-center gap-1.5 font-semibold">
              <Plus className="h-4 w-4" />
              Add Employee
            </Button>
          )}
        </div>
      ) : (
        /* Main Table View */
        <EmployeeTable
          employees={filteredEmployees}
          onView={handleView}
          onEdit={handleOpenEditForm}
          onDeactivate={handleDeactivateClick}
          canEdit={canEdit}
          canDeactivate={canDeactivate}
        />
      )}

      {/* Add / Edit Form Modal */}
      <EmployeeForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingEmployee(null);
        }}
        onSubmit={handleFormSubmit}
        initialData={editingEmployee}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      {/* Soft Deactivation Dialog */}
      <EmployeeDeleteDialog
        isOpen={!!deactivatingEmployee}
        onClose={() => setDeactivatingEmployee(null)}
        onConfirm={handleConfirmDeactivate}
        employee={deactivatingEmployee}
        isLoading={deactivateMutation.isPending}
      />
    </PageContainer>
  );
};
