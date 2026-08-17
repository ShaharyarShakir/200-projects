import api from "../../../api/axios";
import type { Employee } from "../../../types";
import type { ApiResponseEnvelope } from "../../auth/types";

export const deleteEmployee = async (id: string): Promise<Employee> => {
  const { data } = await api.delete<ApiResponseEnvelope<Employee>>(`/employees/${id}`);
  return data.data;
};
