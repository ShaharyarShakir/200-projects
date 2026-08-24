import { createFileRoute } from "@tanstack/react-router";
import { AttendanceDetailPage } from "../features/attendance/pages/attendance-detail-page";

export const Route = createFileRoute("/app/attendance/$attendanceId")({
  component: AttendanceDetailPage,
});
