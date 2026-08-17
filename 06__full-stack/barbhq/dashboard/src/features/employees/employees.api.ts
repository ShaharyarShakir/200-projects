import { api } from "../../lib/api";
import type {
  Employee,
  EmployeeFilterParams,
  CreateEmployeePayload,
  UpdateEmployeePayload,
} from "./employees.types";

const mapBackendEmployee = (data: any): Employee => {
  const isActive = data.isActive ?? true;
  return {
    id: data.id || data._id,
    shopId: data.shopId || "",
    firstName: data.firstName || "",
    lastName: data.lastName || "",
    email: data.email || "",
    role: data.role || "BARBER",
    phone: data.phone || "",
    avatar: data.avatar || "",
    isActive,
    status: data.status || (isActive ? "ACTIVE" : "INACTIVE"),
    employeeCode: data.employeeCode || `EMP-${(data.id || "000").slice(-4).toUpperCase()}`,
    employmentType: data.employmentType || "FULL_TIME",
    salaryType: data.salaryType || "MONTHLY",
    salary: data.salary ?? 45000,
    hourlyRate: data.hourlyRate ?? 0,
    commissionEnabled: data.commissionEnabled ?? true,
    commissionRate: data.commissionRate ?? 10,
    isClockedIn: data.isClockedIn ?? false,
    hireDate: data.createdAt || data.hireDate || new Date().toISOString(),
    createdAt: data.createdAt || new Date().toISOString(),
    updatedAt: data.updatedAt || new Date().toISOString(),
  };
};

export const employeesApi = {
  list: async (params?: EmployeeFilterParams): Promise<Employee[]> => {
    const rawData = await api.get<any[]>("/employees", params as Record<string, any>);
    const list = Array.isArray(rawData) ? rawData : [];
    return list.map(mapBackendEmployee);
  },

  get: async (id: string): Promise<Employee> => {
    const rawData = await api.get<any>(`/employees/${id}`);
    return mapBackendEmployee(rawData);
  },

  create: async (payload: CreateEmployeePayload): Promise<Employee> => {
    const rawData = await api.post<any>("/employees", payload);
    return mapBackendEmployee(rawData);
  },

  update: async (id: string, payload: UpdateEmployeePayload): Promise<Employee> => {
    const rawData = await api.patch<any>(`/employees/${id}`, payload);
    return mapBackendEmployee(rawData);
  },

  toggleStatus: async (id: string, isActive: boolean): Promise<Employee> => {
    const rawData = await api.patch<any>(`/employees/${id}/toggle-status`, { isActive });
    return mapBackendEmployee(rawData);
  },

  deactivate: async (id: string): Promise<Employee> => {
    return employeesApi.toggleStatus(id, false);
  },
};
