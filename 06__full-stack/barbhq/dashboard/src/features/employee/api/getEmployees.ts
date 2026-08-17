import api from "../../../api/axios";
import type { Employee } from "../../../types";
import type { ApiResponseEnvelope } from "../../auth/types";

export const getEmployees = async (): Promise<Employee[]> => {
  const { data } = await api.get<ApiResponseEnvelope<Employee[]>>("/employees");
  return data.data;
};
