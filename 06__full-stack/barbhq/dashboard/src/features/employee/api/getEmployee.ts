import api from "../../../api/axios";
import type { Employee } from "../../../types";
import type { ApiResponseEnvelope } from "../../auth/types";

export const getEmployee = async (id: string): Promise<Employee> => {
  const { data } = await api.get<ApiResponseEnvelope<Employee>>(`/employees/${id}`);
  return data.data;
};
