import { createFileRoute } from "@tanstack/react-router";
import { EmployeeDetailsPage } from "../features/employees";

export const Route = createFileRoute("/dashboard/employees/$employeeId/")({
  component: EmployeeDetailsRoute,
});

function EmployeeDetailsRoute() {
  return <EmployeeDetailsPage />;
}

export default EmployeeDetailsRoute;
