import api from "../../../api/axios";
import type { Attendance } from "../../../types";
import type { ApiResponseEnvelope } from "../../auth/types";

export interface GetAttendanceFilters {
  employeeId?: string;
  startDate?: string;
  endDate?: string;
}

export const getAttendance = async (filters: GetAttendanceFilters = {}): Promise<Attendance[]> => {
  const { employeeId, ...rest } = filters;
  
  // Barbers can only call GET /attendance/:employeeId (restricted on backend for GET /attendance)
  // For OWNER/MANAGER, calling /attendance/:employeeId works perfectly as well.
  const path = employeeId ? `/attendance/${employeeId}` : "/attendance";
  
  const { data } = await api.get<ApiResponseEnvelope<Attendance[]>>(path, {
    params: rest,
  });
  return data.data;
};
