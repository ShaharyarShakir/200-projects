import { useQuery } from "@tanstack/react-query";
import { attendanceApi } from "./attendance.api";
import type { AttendanceFilterParams } from "./attendance.types";

export const useTodayAttendanceQuery = (params?: AttendanceFilterParams) => {
  return useQuery({
    queryKey: ["attendance", "today", params],
    queryFn: () => attendanceApi.getToday(params),
    refetchInterval: 30000, // Refresh every 30 seconds for live monitoring
  });
};

export const useAttendanceHistoryQuery = (filters?: AttendanceFilterParams) => {
  return useQuery({
    queryKey: ["attendance", "history", filters],
    queryFn: () => attendanceApi.getHistory(filters),
  });
};

export const useMyAttendanceQuery = () => {
  return useQuery({
    queryKey: ["attendance", "me"],
    queryFn: () => attendanceApi.getMyAttendance(),
    refetchInterval: 15000, // Refresh employee status every 15s
  });
};

export const useAttendanceDetailQuery = (id: string | undefined) => {
  return useQuery({
    queryKey: ["attendance", "detail", id],
    queryFn: () => (id ? attendanceApi.getById(id) : Promise.reject("No attendance ID")),
    enabled: !!id,
  });
};
