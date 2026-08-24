import { createFileRoute } from "@tanstack/react-router";
import { MyAttendancePage } from "../features/attendance/pages/my-attendance-page";

export const Route = createFileRoute("/app/my-attendance")({
  component: MyAttendancePage,
});
