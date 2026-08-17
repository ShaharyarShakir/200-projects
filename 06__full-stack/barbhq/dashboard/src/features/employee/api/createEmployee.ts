import api from "../../../api/axios";
import type { Employee } from "../../../types";
import type { ApiResponseEnvelope } from "../../auth/types";

export type CreateEmployeeInput = Omit<
  Employee,
  "id" | "shopId" | "employeeCode" | "createdAt" | "updatedAt" | "isClockedIn" | "isActive" | "status"
>;

export const createEmployee = async (employee: CreateEmployeeInput): Promise<Employee> => {
  const { data } = await api.post<ApiResponseEnvelope<Employee>>("/employees", employee);
  return data.data;
};
