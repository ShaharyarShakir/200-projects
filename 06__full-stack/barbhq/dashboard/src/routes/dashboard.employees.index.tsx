import { createFileRoute } from "@tanstack/react-router";
import { EmployeesPage } from "../features/employees";

export const Route = createFileRoute("/dashboard/employees/")({
  component: EmployeesRoute,
});

function EmployeesRoute() {
  return <EmployeesPage />;
}

export default EmployeesRoute;
