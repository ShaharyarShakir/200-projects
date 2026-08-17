import api from "../../../api/axios";
import type { Attendance } from "../../../types";
import type { ApiResponseEnvelope } from "../../auth/types";

export interface ClockInInput {
  employeeId: string;
  notes?: string;
}

export const clockIn = async (input: ClockInInput): Promise<Attendance> => {
  const { data } = await api.post<ApiResponseEnvelope<Attendance>>("/attendance/clock-in", input);
  return data.data;
};
