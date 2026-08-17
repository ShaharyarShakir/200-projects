import { useQuery } from "@tanstack/react-query";
import { employeesApi } from "./employees.api";
import type { EmployeeFilterParams } from "./employees.types";

export const useEmployeesQuery = (filters?: EmployeeFilterParams) => {
  return useQuery({
    queryKey: ["employees", filters],
    queryFn: () => employeesApi.list(filters),
  });
};

export const useEmployeeDetailsQuery = (id: string | undefined) => {
  return useQuery({
    queryKey: ["employee", id],
    queryFn: () => (id ? employeesApi.get(id) : Promise.reject("No employee ID")),
    enabled: !!id,
  });
};
