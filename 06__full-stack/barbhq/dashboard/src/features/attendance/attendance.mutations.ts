import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { attendanceApi } from "./attendance.api";
import type {
  ClockInPayload,
  ClockOutPayload,
  UpdateAttendancePayload,
} from "./attendance.types";

export const useClockInMutation = (onSuccessCallback?: () => void) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload?: ClockInPayload) => attendanceApi.clockIn(payload),
    onSuccess: (record) => {
      const formattedTime = record.clockIn
        ? new Date(record.clockIn).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })
        : "now";
      toast.success(`Clocked in successfully at ${formattedTime} 🟢`);
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      onSuccessCallback?.();
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to clock in");
    },
  });
};

export const useClockOutMutation = (onSuccessCallback?: () => void) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload?: ClockOutPayload) => attendanceApi.clockOut(payload),
    onSuccess: (record) => {
      const hours = Math.floor(record.workedMinutes / 60);
      const mins = record.workedMinutes % 60;
      const durationStr = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;

      toast.success(
        `Clocked out successfully! Total worked: ${durationStr} 🔵`,
      );
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      onSuccessCallback?.();
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to clock out");
    },
  });
};

export const useStartBreakMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => attendanceApi.startBreak(),
    onSuccess: () => {
      toast.success("Break started ☕");
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to start break");
    },
  });
};

export const useEndBreakMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => attendanceApi.endBreak(),
    onSuccess: () => {
      toast.success("Break ended. Back to work! 💪");
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to end break");
    },
  });
};

export const useUpdateAttendanceMutation = (
  id: string,
  onSuccessCallback?: () => void,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateAttendancePayload) =>
      attendanceApi.updateAttendance(id, payload),
    onSuccess: () => {
      toast.success("Attendance correction saved successfully ✓");
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      onSuccessCallback?.();
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to update attendance record");
    },
  });
};
