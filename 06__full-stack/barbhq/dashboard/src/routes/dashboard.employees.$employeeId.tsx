import { createFileRoute, Outlet, Link, useLocation, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, createContext, useContext, useEffect } from "react";
import toast from "react-hot-toast";
import { ArrowLeft, Edit, LogIn, LogOut, UserX } from "lucide-react";
import { PageContainer } from "../components/layout/PageContainer";
import { Button } from "../components/ui/button";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { useAuthStore } from "../store/authStore";
import {
  getEmployee,
  clockIn,
  clockOut,
  deleteEmployee,
  EmployeeAvatar,
  EmployeeStatusBadge,
  EmployeeRoleBadge,
} from "../features/employee";
import type { Employee } from "../types";

interface EmployeeDetailsContextType {
  employee: Employee;
  isLoading: boolean;
}

const EmployeeDetailsContext = createContext<EmployeeDetailsContextType | null>(null);

export const useEmployeeDetails = () => {
  const context = useContext(EmployeeDetailsContext);
  if (!context) {
    throw new Error("useEmployeeDetails must be used within EmployeeDetailsLayout");
  }
  return context;
};

export const Route = createFileRoute("/dashboard/employees/$employeeId")({
  component: EmployeeDetailsLayout,
});

function EmployeeDetailsLayout() {
  const { employeeId } = Route.useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuthStore();

  const [showDeactivateDialog, setShowDeactivateDialog] = useState(false);

  // 1. Fetch Employee
  const { data: employee, isLoading, isError } = useQuery<Employee>({
    queryKey: ["employee", employeeId],
    queryFn: () => getEmployee(employeeId),
    retry: false,
  });

  // 2. Mutations
  const clockInMutation = useMutation({
    mutationFn: clockIn,
    onSuccess: () => {
      toast.success("Clocked in successfully");
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      queryClient.invalidateQueries({ queryKey: ["employee", employeeId] });
      queryClient.invalidateQueries({ queryKey: ["attendance", employeeId] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Clock-in failed");
    },
  });

  const clockOutMutation = useMutation({
    mutationFn: clockOut,
    onSuccess: () => {
      toast.success("Clocked out successfully");
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      queryClient.invalidateQueries({ queryKey: ["employee", employeeId] });
      queryClient.invalidateQueries({ queryKey: ["attendance", employeeId] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Clock-out failed");
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: deleteEmployee,
    onSuccess: (data) => {
      toast.success(`${data.firstName} ${data.lastName} deactivated successfully`);
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      queryClient.invalidateQueries({ queryKey: ["employee", employeeId] });
      navigate({ to: "/dashboard/employees" });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Deactivation failed");
    },
  });

  // 3. Barber restriction: Barber can only view their own profile
  const isBarber = currentUser?.role === "BARBER";
  const isReceptionist = currentUser?.role === "RECEPTIONIST";

  useEffect(() => {
    if (isBarber && employee && currentUser && employee.id !== currentUser.id) {
      toast.error("Unauthorized: You are only allowed to view your own profile");
    }
  }, [isBarber, employee, currentUser]);

  if (isBarber && employee && currentUser && employee.id !== currentUser.id) {
    return (
      <PageContainer>
        <div className="py-10 text-center select-none">
          <p className="font-semibold text-destructive">Unauthorized Access</p>
          <p className="mt-2 text-muted-foreground text-xs">Redirecting to console...</p>
        </div>
      </PageContainer>
    );
  }

  if (isLoading) {
    return (
      <PageContainer className="space-y-6 select-none">
        <div className="bg-secondary/35 rounded-md w-32 h-6 animate-pulse" />
        <div className="bg-secondary/20 border border-border rounded-xl h-44 animate-pulse" />
      </PageContainer>
    );
  }

  if (isError || !employee) {
    return (
      <PageContainer className="space-y-6 py-12 text-center select-none">
        <h2 className="font-serif font-bold text-foreground text-lg">Employee Profile Not Found</h2>
        <p className="text-muted-foreground text-xs">The staff identifier may be invalid or belongs to another shop.</p>
        <Button onClick={() => navigate({ to: "/dashboard/employees" })} className="mt-4">
          Return to Employees
        </Button>
      </PageContainer>
    );
  }

  // Action Permissions
  const isSelf = employee.email === currentUser?.email;
  const targetIsOwner = employee.role === "OWNER";
  const canEdit = currentUser?.role === "OWNER" || (currentUser?.role === "MANAGER" && !targetIsOwner);
  const canDeactivate = canEdit && !isSelf;
  const canClock = currentUser?.role === "OWNER" || (currentUser?.role === "MANAGER" && !targetIsOwner) || isSelf;

  const currentTab = location.pathname.endsWith("/attendance")
    ? "attendance"
    : location.pathname.endsWith("/edit")
    ? "edit"
    : location.pathname.endsWith("/activity")
    ? "activity"
    : "overview";

  return (
    <PageContainer className="space-y-6">
      {/* Back link */}
      {!isBarber && (
        <Link to="/dashboard/employees" className="inline-flex items-center gap-1.5 font-bold text-muted-foreground hover:text-foreground text-xs transition-colors select-none">
          <ArrowLeft className="w-4 h-4" />
          Back to Roster List
        </Link>
      )}

      {/* Shared Roster Header Card */}
      <div className="flex md:flex-row flex-col justify-between md:items-center gap-6 bg-card shadow-md p-6 border border-border/80 rounded-2xl font-sans select-none">
        <div className="flex items-start gap-4">
          <EmployeeAvatar src={employee.avatar} firstName={employee.firstName} lastName={employee.lastName} size="lg" />
          <div className="space-y-1.5 mt-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-serif font-bold text-foreground text-xl">
                {employee.firstName} {employee.lastName}
              </h2>
              <EmployeeStatusBadge status={employee.status} />
            </div>
            <div className="flex items-center gap-2 text-muted-foreground text-xs">
              <span className="font-mono font-bold text-foreground/80 tracking-wide">{employee.employeeCode}</span>
              <span>•</span>
              <EmployeeRoleBadge role={employee.role} />
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Clock In / Clock Out Button */}
          {canClock && !isReceptionist && (
            <>
              {employee.isClockedIn ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => clockOutMutation.mutate({ employeeId: employee.id })}
                  isLoading={clockOutMutation.isPending}
                  className="flex items-center gap-1.5 hover:bg-amber-500/10 border-amber-500/20 h-9 font-semibold text-amber-600 text-xs cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  Clock Out
                </Button>
              ) : employee.status === "ACTIVE" ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => clockInMutation.mutate({ employeeId: employee.id })}
                  isLoading={clockInMutation.isPending}
                  className="flex items-center gap-1.5 hover:bg-emerald-500/10 border-emerald-500/20 h-9 font-semibold text-emerald-600 text-xs cursor-pointer"
                >
                  <LogIn className="w-4 h-4" />
                  Clock In
                </Button>
              ) : null}
            </>
          )}

          {/* Edit Button */}
          {canEdit && !isBarber && !isReceptionist && currentTab !== "edit" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate({ to: `/dashboard/employees/${employee.id}/edit` })}
              className="flex items-center gap-1.5 h-9 font-semibold text-xs cursor-pointer"
            >
              <Edit className="w-4 h-4" />
              Edit Profile
            </Button>
          )}

          {/* Deactivate Button */}
          {canDeactivate && employee.status === "ACTIVE" && !isBarber && !isReceptionist && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDeactivateDialog(true)}
              className="flex items-center gap-1.5 hover:bg-destructive/10 border-destructive/20 h-9 font-semibold text-destructive text-xs cursor-pointer"
            >
              <UserX className="w-4 h-4" />
              Deactivate
            </Button>
          )}
        </div>
      </div>

      {/* Tabs navigation */}
      <div className="flex items-center gap-4 border-border/80 border-b select-none">
        <Link
          to="/dashboard/employees/$employeeId"
          params={{ employeeId }}
          className={`pb-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
            currentTab === "overview"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Overview
        </Link>
        <Link
          to="/dashboard/employees/$employeeId/attendance"
          params={{ employeeId }}
          className={`pb-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
            currentTab === "attendance"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Attendance
        </Link>
        <Link
          to="/dashboard/employees/$employeeId/activity"
          params={{ employeeId }}
          className={`pb-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
            currentTab === "activity"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Activity
        </Link>
        {canEdit && !isBarber && !isReceptionist && (
          <Link
            to="/dashboard/employees/$employeeId/edit"
            params={{ employeeId }}
            className={`pb-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
              currentTab === "edit"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Edit Settings
          </Link>
        )}
      </div>

      {/* Child tab view outlet wrapped in provider */}
      <EmployeeDetailsContext.Provider value={{ employee, isLoading }}>
        <div>
          <Outlet />
        </div>
      </EmployeeDetailsContext.Provider>

      {/* Confirm Deactivation Dialog */}
      <ConfirmDialog
        isOpen={showDeactivateDialog}
        onClose={() => setShowDeactivateDialog(false)}
        onConfirm={() => {
          setShowDeactivateDialog(false);
          deactivateMutation.mutate(employee.id);
        }}
        title="Deactivate Employee Profile"
        message={`Are you sure you want to deactivate ${employee.firstName} ${employee.lastName}? They will be marked as inactive and blocked from clocking in.`}
        confirmText="Deactivate"
        variant="destructive"
        isLoading={deactivateMutation.isPending}
      />
    </PageContainer>
  );
}

export default EmployeeDetailsLayout;
