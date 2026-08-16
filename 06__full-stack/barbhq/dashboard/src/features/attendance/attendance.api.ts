import { api } from "../../lib/api";
import type {
  AttendanceRecord,
  AttendanceFilterParams,
  ClockInPayload,
  ClockOutPayload,
  UpdateAttendancePayload,
  AttendanceStatusType,
} from "./attendance.types";

export const mapBackendAttendance = (data: any): AttendanceRecord => {
  let employeeObj: any = undefined;

  if (data.employeeId && typeof data.employeeId === "object") {
    employeeObj = {
      id: data.employeeId._id || data.employeeId.id,
      firstName: data.employeeId.firstName || "Employee",
      lastName: data.employeeId.lastName || "",
      email: data.employeeId.email || "",
      role: data.employeeId.role || "BARBER",
      avatar: data.employeeId.avatar,
    };
  }

  let derivedStatus: AttendanceStatusType = data.status || "NOT_STARTED";
  if (data.clockIn && !data.clockOut) {
    derivedStatus = data.lateMinutes > 5 ? "LATE" : "WORKING";
  } else if (data.clockIn && data.clockOut) {
    derivedStatus = data.status === "HALF_DAY" ? "HALF_DAY" : "COMPLETED";
  }

  return {
    id: data._id || data.id,
    shopId: data.shopId || "",
    employeeId: employeeObj ? employeeObj.id : (data.employeeId || ""),
    employee: employeeObj,
    date: data.date || new Date().toISOString().split("T")[0],
    scheduledStart: data.scheduledStart,
    scheduledEnd: data.scheduledEnd,
    clockIn: data.clockIn,
    clockOut: data.clockOut,
    breakStart: data.breakStart,
    breakEnd: data.breakEnd,
    workedMinutes: data.workedMinutes ?? 0,
    lateMinutes: data.lateMinutes ?? 0,
    overtimeMinutes: data.overtimeMinutes ?? 0,
    earlyLeaveMinutes: data.earlyLeaveMinutes ?? 0,
    status: derivedStatus,
    notes: data.notes || "",
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
};

export const attendanceApi = {
  getToday: async (params?: AttendanceFilterParams): Promise<AttendanceRecord[]> => {
    const today = new Date().toISOString().split("T")[0];
    const queryParams = { date: today, ...params };
    const rawData = await api.get<any[]>("/attendance", queryParams);
    const list = Array.isArray(rawData) ? rawData : [];
    return list.map(mapBackendAttendance);
  },

  getHistory: async (params?: AttendanceFilterParams): Promise<AttendanceRecord[]> => {
    const rawData = await api.get<any[]>("/attendance", params as Record<string, any>);
    const list = Array.isArray(rawData) ? rawData : [];
    return list.map(mapBackendAttendance);
  },

  getMyAttendance: async (): Promise<AttendanceRecord[]> => {
    const rawData = await api.get<any[]>("/attendance/me");
    const list = Array.isArray(rawData) ? rawData : [];
    return list.map(mapBackendAttendance);
  },

  getById: async (id: string): Promise<AttendanceRecord> => {
    const list = await attendanceApi.getHistory();
    const found = list.find((rec) => rec.id === id);
    if (!found) {
      throw new Error(`Attendance record with ID ${id} not found`);
    }
    return found;
  },

  clockIn: async (payload?: ClockInPayload): Promise<AttendanceRecord> => {
    const rawData = await api.post<any>("/attendance/clock-in", payload || {});
    return mapBackendAttendance(rawData);
  },

  clockOut: async (payload?: ClockOutPayload): Promise<AttendanceRecord> => {
    const rawData = await api.post<any>("/attendance/clock-out", payload || {});
    return mapBackendAttendance(rawData);
  },

  startBreak: async (): Promise<AttendanceRecord> => {
    const rawData = await api.post<any>("/attendance/break/start");
    return mapBackendAttendance(rawData);
  },

  endBreak: async (): Promise<AttendanceRecord> => {
    const rawData = await api.post<any>("/attendance/break/end");
    return mapBackendAttendance(rawData);
  },

  updateAttendance: async (
    id: string,
    payload: UpdateAttendancePayload,
  ): Promise<AttendanceRecord> => {
    const rawData = await api.patch<any>(`/attendance/${id}`, payload);
    return mapBackendAttendance(rawData);
  },
};
