import api from "./axios";
import type { Employee } from "../types";

export const employeeApi = {
  getEmployees: async (): Promise<Employee[]> => {
    const { data } = await api.get<Employee[]>("/employees");
    return data;
  },

  getEmployeeById: async (id: string): Promise<Employee> => {
    const { data } = await api.get<Employee>(`/employees/${id}`);
    return data;
  },

  createEmployee: async (
    employee: Omit<Employee, "id" | "createdAt" | "updatedAt">,
  ): Promise<Employee> => {
    const { data } = await api.post<Employee>("/employees", employee);
    return data;
  },

  updateEmployee: async (
    id: string,
    employee: Partial<Employee>,
  ): Promise<Employee> => {
    const { data } = await api.put<Employee>(`/employees/${id}`, employee);
    return data;
  },

  deleteEmployee: async (id: string): Promise<void> => {
    await api.delete(`/employees/${id}`);
  },
};
