import { createFileRoute } from "@tanstack/react-router";
import { AttendancePage } from "../features/attendance/pages/attendance-page";

export const Route = createFileRoute("/app/attendance/")({
  component: AttendancePage,
});
