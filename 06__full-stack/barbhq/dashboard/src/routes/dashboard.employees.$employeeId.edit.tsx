import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import toast from "react-hot-toast";
import { useEmployeeDetails } from "./dashboard.employees.$employeeId";
import { useAuthStore } from "../store/authStore";
import { updateEmployee, EmployeeForm, type EmployeeFormValues } from "../features/employee";

export const Route = createFileRoute(
  "/dashboard/employees/$employeeId/edit"
)({
  component: EditEmployeeTab,
});

function EditEmployeeTab() {
  const { employeeId } = Route.useParams();
  const { employee } = useEmployeeDetails();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuthStore();

  const isBarber = currentUser?.role === "BARBER";
  const isReceptionist = currentUser?.role === "RECEPTIONIST";
  const targetIsOwner = employee?.role === "OWNER";

  // Enforce write permissions
  const canEdit = currentUser?.role === "OWNER" || (currentUser?.role === "MANAGER" && !targetIsOwner);

  useEffect(() => {
    if (isBarber || isReceptionist || !canEdit) {
      toast.error("Access Forbidden: Insufficient permissions to edit this roster profile");
      navigate({
        to: `/dashboard/employees/${employeeId}`,
        replace: true,
      });
    }
  }, [isBarber, isReceptionist, canEdit, employeeId, navigate]);

  const updateMutation = useMutation({
    mutationFn: updateEmployee,
    onSuccess: (data) => {
      toast.success(`${data.firstName} ${data.lastName} updated successfully`);
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      queryClient.invalidateQueries({ queryKey: ["employee", employeeId] });
      navigate({ to: `/dashboard/employees/${employeeId}` });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update employee settings");
    },
  });

  const onSubmit = (values: EmployeeFormValues) => {
    updateMutation.mutate({ id: employeeId, employee: values });
  };

  const handleCancel = () => {
    navigate({ to: `/dashboard/employees/${employeeId}` });
  };

  if (isBarber || isReceptionist || !canEdit) return null;

  return (
    <div className="mt-4">
      <EmployeeForm
        initialData={employee}
        onSubmit={onSubmit}
        isLoading={updateMutation.isPending}
        onCancel={handleCancel}
      />
    </div>
  );
}

export default EditEmployeeTab;
