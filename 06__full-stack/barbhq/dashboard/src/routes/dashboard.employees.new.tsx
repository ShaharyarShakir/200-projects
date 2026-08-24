import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import toast from "react-hot-toast";
import { PageContainer } from "../components/layout/PageContainer";
import { PageHeader } from "../components/layout/PageHeader";
import { useAuthStore } from "../store/authStore";
import { createEmployee, EmployeeForm, type EmployeeFormValues } from "../features/employee";

export const Route = createFileRoute("/dashboard/employees/new")({
  component: AddEmployeePage,
});

function AddEmployeePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuthStore();

  const isBarber = currentUser?.role === "BARBER";
  const isReceptionist = currentUser?.role === "RECEPTIONIST";

  // Prevent unauthorized roles from entering
  useEffect(() => {
    if (isBarber || isReceptionist) {
      toast.error("Access Forbidden: Insufficient credentials");
      navigate({ to: "/dashboard/employees", replace: true });
    }
  }, [isBarber, isReceptionist, navigate]);

  const createMutation = useMutation({
    mutationFn: createEmployee,
    onSuccess: (data) => {
      toast.success(`${data.firstName} ${data.lastName} added to roster`);
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      navigate({ to: "/dashboard/employees" });
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Failed to create employee card"
      );
    },
  });

  const onSubmit = (values: EmployeeFormValues) => {
    const payload = { ...values };
    delete payload.status;
    createMutation.mutate(payload);
  };

  const handleCancel = () => {
    navigate({ to: "/dashboard/employees" });
  };

  if (isBarber || isReceptionist) return null;

  return (
    <PageContainer>
      <PageHeader
        title="Add Staff Member"
        description="Roster a new employee with roles, payment contracts, and incentives splits."
      />
      <div className="mt-6">
        <EmployeeForm
          onSubmit={onSubmit}
          isLoading={createMutation.isPending}
          onCancel={handleCancel}
        />
      </div>
    </PageContainer>
  );
}

export default AddEmployeePage;
