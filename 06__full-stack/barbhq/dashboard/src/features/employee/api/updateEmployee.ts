import api from "../../../api/axios";
import type { Employee } from "../../../types";
import type { ApiResponseEnvelope } from "../../auth/types";

export type UpdateEmployeeInput = Partial<
  Omit<Employee, "id" | "shopId" | "employeeCode" | "createdAt" | "updatedAt" | "isClockedIn">
>;

export const updateEmployee = async ({
  id,
  employee,
}: {
  id: string;
  employee: UpdateEmployeeInput;
}): Promise<Employee> => {
  const { data } = await api.patch<ApiResponseEnvelope<Employee>>(`/employees/${id}`, employee);
  return data.data;
};
