import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEmployeeDetails } from "./dashboard.employees.$employeeId";
import { getAttendance, ActivityTimeline } from "../features/employee";
import { ErrorState } from "../components/ui/ErrorStates";
import type { Attendance } from "../types";

export const Route = createFileRoute(
  "/dashboard/employees/$employeeId/activity"
)({
  component: EmployeeActivityTab,
});

function EmployeeActivityTab() {
  const { employeeId } = Route.useParams();
  const { employee } = useEmployeeDetails();

  // Fetch all attendance logs for timeline audit mapping
  const { data: attendanceRecords = [], isLoading, isError } = useQuery<Attendance[]>({
    queryKey: ["attendance", employeeId, "all"],
    queryFn: () => getAttendance({ employeeId }),
  });

  if (isError) {
    return (
      <div className="mt-4">
        <ErrorState
          title="Attendance history unavailable"
          description="We could not load the activity timeline right now. Please try again shortly."
        />
      </div>
    );
  }

  return (
    <div className="mt-4">
      <ActivityTimeline
        employee={employee}
        attendanceRecords={attendanceRecords}
        isLoading={isLoading}
      />
    </div>
  );
}

export default EmployeeActivityTab;
