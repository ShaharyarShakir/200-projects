import api from "../../../api/axios";
import type { Attendance } from "../../../types";
import type { ApiResponseEnvelope } from "../../auth/types";

export interface ClockOutInput {
  employeeId: string;
  notes?: string;
}

export const clockOut = async (input: ClockOutInput): Promise<Attendance> => {
  const { data } = await api.post<ApiResponseEnvelope<Attendance>>("/attendance/clock-out", input);
  return data.data;
};
