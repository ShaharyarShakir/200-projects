import { createFileRoute } from "@tanstack/react-router";
import { AttendancePage } from "../features/attendance/pages/attendance-page";

export const Route = createFileRoute("/attendance")({
  component: AttendancePage,
});

export default AttendancePage;
