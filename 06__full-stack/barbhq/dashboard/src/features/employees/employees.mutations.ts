import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { employeesApi } from "./employees.api";
import type { CreateEmployeePayload, UpdateEmployeePayload } from "./employees.types";

export const useCreateEmployeeMutation = (onSuccessCallback?: () => void) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateEmployeePayload) => employeesApi.create(payload),
    onSuccess: (newEmp) => {
      toast.success(`Employee ${newEmp.firstName} ${newEmp.lastName} created successfully ✓`);
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      onSuccessCallback?.();
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to create employee");
    },
  });
};

export const useUpdateEmployeeMutation = (id: string, onSuccessCallback?: () => void) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateEmployeePayload) => employeesApi.update(id, payload),
    onSuccess: (updated) => {
      toast.success(`Employee ${updated.firstName} ${updated.lastName} updated successfully ✓`);
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      queryClient.invalidateQueries({ queryKey: ["employee", id] });
      onSuccessCallback?.();
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to update employee");
    },
  });
};

export const useDeactivateEmployeeMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => employeesApi.deactivate(id),
    onSuccess: (deactivated) => {
      toast.success(`Employee ${deactivated.firstName} ${deactivated.lastName} deactivated ✓`);
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      queryClient.invalidateQueries({ queryKey: ["employee", deactivated.id] });
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to deactivate employee");
    },
  });
};
