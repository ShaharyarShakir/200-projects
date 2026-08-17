import React, { useState } from "react";
import { useParams, useNavigate, Link } from "@tanstack/react-router";
import { ArrowLeft, Edit, UserX, DollarSign, TrendingUp, UserCheck } from "lucide-react";
import { PageContainer } from "../../../components/layout/PageContainer";
import { Button } from "../../../components/ui/button";
import { useAuth } from "../../auth";
import { useShop } from "../../shop";
import { can } from "../../../lib/permissions";
import { useEmployeeDetailsQuery } from "../employees.queries";
import { useDeactivateEmployeeMutation, useUpdateEmployeeMutation } from "../employees.mutations";
import { EmployeeStatusBadge } from "../components/employee-status-badge";
import { EmployeeRoleBadge } from "../components/employee-role-badge";
import { EmployeeDeleteDialog } from "../components/employee-delete-dialog";
import { EmployeeForm } from "../components/employee-form";
import type { EmployeeFormValues } from "../employees.schemas";

export const EmployeeDetailsPage: React.FC = () => {
  const { employeeId } = useParams({ strict: false }) as { employeeId?: string };
  const navigate = useNavigate();
  const { user } = useAuth();
  const { shop } = useShop();

  const [activeTab, setActiveTab] = useState<"overview" | "attendance" | "payroll" | "sales" | "leave">("overview");
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeactivateOpen, setIsDeactivateOpen] = useState(false);

  const currencySymbol = shop?.currency === "PKR" ? "₨" : "$";
  const canManage = can(user, "employees.manage");

  const { data: employee, isLoading, isError } = useEmployeeDetailsQuery(employeeId);
  const updateMutation = useUpdateEmployeeMutation(employeeId || "", () => setIsEditOpen(false));
  const deactivateMutation = useDeactivateEmployeeMutation();

  const handleDeactivate = () => {
    if (employeeId) {
      deactivateMutation.mutate(employeeId, {
        onSuccess: () => {
          setIsDeactivateOpen(false);
          navigate({ to: "/dashboard/employees" });
        },
      });
    }
  };

  const handleEditSubmit = (values: EmployeeFormValues) => {
    updateMutation.mutate({
      firstName: values.firstName,
      lastName: values.lastName,
      phone: values.phone,
      role: values.role,
      employmentType: values.employmentType,
      salary: values.salary,
      commissionRate: values.commissionRate,
    });
  };

  if (isLoading) {
    return (
      <PageContainer className="space-y-6 animate-pulse select-none">
        <div className="h-6 w-36 bg-secondary/50 rounded-md" />
        <div className="h-44 bg-card border border-border rounded-2xl" />
        <div className="grid grid-cols-3 gap-4">
          <div className="h-28 bg-card border border-border rounded-xl" />
          <div className="h-28 bg-card border border-border rounded-xl" />
          <div className="h-28 bg-card border border-border rounded-xl" />
        </div>
      </PageContainer>
    );
  }

  if (isError || !employee) {
    return (
      <PageContainer className="space-y-6 py-12 text-center select-none">
        <h2 className="font-serif font-bold text-foreground text-lg">Employee Profile Not Found</h2>
        <p className="text-muted-foreground text-xs">The employee record could not be loaded or may belong to another shop.</p>
        <Button onClick={() => navigate({ to: "/dashboard/employees" })} className="mt-4">
          Return to Employees Directory
        </Button>
      </PageContainer>
    );
  }

  return (
    <PageContainer className="space-y-6">
      {/* Back Link */}
      <Link
        to="/dashboard/employees"
        className="inline-flex items-center gap-1.5 font-bold text-muted-foreground hover:text-foreground text-xs transition-colors select-none"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Employee Directory
      </Link>

      {/* Header Profile Card */}
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-6 bg-card p-6 border border-border rounded-2xl shadow-xs select-none">
        <div className="flex items-start gap-4">
          {employee.avatar ? (
            <img
              src={employee.avatar}
              alt={`${employee.firstName} ${employee.lastName}`}
              className="h-16 w-16 rounded-full object-cover ring-4 ring-primary/10"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary font-serif font-bold text-xl ring-4 ring-primary/20">
              {employee.firstName?.[0]}
              {employee.lastName?.[0]}
            </div>
          )}
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-serif font-bold text-foreground text-xl">
                {employee.firstName} {employee.lastName}
              </h2>
              <EmployeeStatusBadge status={employee.status} isActive={employee.isActive} />
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground font-medium">
              <EmployeeRoleBadge role={employee.role} />
              <span>•</span>
              <span className="font-mono text-foreground font-bold">{employee.employeeCode}</span>
              <span>•</span>
              <span>
                Joined{" "}
                {new Date(employee.hireDate).toLocaleDateString(undefined, {
                  month: "short",
                  year: "numeric",
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        {canManage && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditOpen(true)}
              className="flex items-center gap-1.5 font-semibold text-xs cursor-pointer"
            >
              <Edit className="h-4 w-4" />
              Edit Profile
            </Button>
            {employee.isActive && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsDeactivateOpen(true)}
                className="flex items-center gap-1.5 hover:bg-destructive/10 border-destructive/20 font-semibold text-destructive text-xs cursor-pointer"
              >
                <UserX className="h-4 w-4" />
                Deactivate
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Performance Snapshot KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-3 select-none">
        <div className="bg-card p-4 rounded-xl border border-border shadow-xs flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500 font-bold">
            <DollarSign className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Sales This Month</p>
            <p className="font-serif font-extrabold text-lg text-foreground">{currencySymbol}85,000</p>
          </div>
        </div>

        <div className="bg-card p-4 rounded-xl border border-border shadow-xs flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500 font-bold">
            <UserCheck className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Attendance</p>
            <p className="font-serif font-extrabold text-lg text-foreground">94%</p>
          </div>
        </div>

        <div className="bg-card p-4 rounded-xl border border-border shadow-xs flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-500/10 text-purple-500 font-bold">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Commission Earned</p>
            <p className="font-serif font-extrabold text-lg text-foreground">{currencySymbol}8,500</p>
          </div>
        </div>
      </div>

      {/* Profile Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-border select-none">
        {[
          { id: "overview", label: "Overview" },
          { id: "attendance", label: "Attendance" },
          { id: "payroll", label: "Payroll" },
          { id: "sales", label: "Sales" },
          { id: "leave", label: "Leave" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`pb-2.5 px-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
              activeTab === tab.id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "overview" ? (
        <div className="grid md:grid-cols-2 gap-6 select-none">
          {/* Basic Information */}
          <div className="bg-card p-6 rounded-2xl border border-border space-y-4">
            <h3 className="border-l-2 border-primary pl-3 text-xs font-bold uppercase tracking-wider text-primary">
              Basic Information
            </h3>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="block font-bold text-muted-foreground uppercase text-[10px]">Full Name</span>
                <span className="block mt-0.5 font-bold text-foreground">
                  {employee.firstName} {employee.lastName}
                </span>
              </div>
              <div>
                <span className="block font-bold text-muted-foreground uppercase text-[10px]">Email Address</span>
                <span className="block mt-0.5 font-semibold text-foreground">{employee.email}</span>
              </div>
              <div>
                <span className="block font-bold text-muted-foreground uppercase text-[10px]">Phone Number</span>
                <span className="block mt-0.5 font-semibold text-foreground">{employee.phone || "Not provided"}</span>
              </div>
              <div>
                <span className="block font-bold text-muted-foreground uppercase text-[10px]">Employment Type</span>
                <span className="block mt-0.5 font-semibold text-foreground capitalize">
                  {(employee.employmentType || "FULL_TIME").replace("_", " ").toLowerCase()}
                </span>
              </div>
            </div>
          </div>

          {/* Compensation Terms */}
          <div className="bg-card p-6 rounded-2xl border border-border space-y-4">
            <h3 className="border-l-2 border-primary pl-3 text-xs font-bold uppercase tracking-wider text-primary">
              Compensation Agreement
            </h3>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="block font-bold text-muted-foreground uppercase text-[10px]">Base Salary</span>
                <span className="block mt-0.5 font-extrabold text-foreground">
                  {currencySymbol}{(employee.salary ?? 45000).toLocaleString()}/month
                </span>
              </div>
              <div>
                <span className="block font-bold text-muted-foreground uppercase text-[10px]">Commission Rate</span>
                <span className="block mt-0.5 font-extrabold text-foreground">
                  {employee.commissionRate ?? 10}%
                </span>
              </div>
              <div>
                <span className="block font-bold text-muted-foreground uppercase text-[10px]">Salary Model</span>
                <span className="block mt-0.5 font-semibold text-foreground">Monthly Fixed + Commission</span>
              </div>
              <div>
                <span className="block font-bold text-muted-foreground uppercase text-[10px]">Status</span>
                <span className="block mt-0.5 font-semibold text-foreground">{employee.isActive ? "Active Pay" : "On Hold"}</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-card p-12 text-center rounded-2xl border border-border space-y-2 select-none">
          <h4 className="font-serif font-bold text-foreground text-sm capitalize">{activeTab} Details Coming Soon</h4>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Full operational view for employee {activeTab} will be enabled in Phase 3 & Phase 6 integration.
          </p>
        </div>
      )}

      {/* Edit Form Modal */}
      <EmployeeForm
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        onSubmit={handleEditSubmit}
        initialData={employee}
        isLoading={updateMutation.isPending}
      />

      {/* Deactivate Dialog */}
      <EmployeeDeleteDialog
        isOpen={isDeactivateOpen}
        onClose={() => setIsDeactivateOpen(false)}
        onConfirm={handleDeactivate}
        employee={employee}
        isLoading={deactivateMutation.isPending}
      />
    </PageContainer>
  );
};
