import React, { useState } from "react";
import { PageContainer } from "../../../components/layout/PageContainer";
import { PageHeader } from "../../../components/layout/PageHeader";
import { AttendanceSummaryCards } from "../components/attendance-summary";
import { AttendanceFilters } from "../components/attendance-filters";
import { AttendanceTable } from "../components/attendance-table";
import { AttendanceCorrectionDialog } from "../components/attendance-correction-dialog";
import {
  useTodayAttendanceQuery,
  useAttendanceHistoryQuery,
} from "../attendance.queries";
import { useUpdateAttendanceMutation } from "../attendance.mutations";
import { useEmployeesQuery } from "../../employees/employees.queries";
import type { AttendanceRecord } from "../attendance.types";
import { Clock } from "lucide-react";

export const AttendancePage: React.FC = () => {
  const todayStr = new Date().toISOString().split("T")[0];

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [fromDate, setFromDate] = useState(todayStr);
  const [toDate, setToDate] = useState(todayStr);

  const [selectedRecordForCorrection, setSelectedRecordForCorrection] =
    useState<AttendanceRecord | null>(null);

  // Fetch employees list for filtering
  const { data: employees = [] } = useEmployeesQuery();

  // Fetch today's summary / overview
  const { data: todayRecords = [] } = useTodayAttendanceQuery();

  // Fetch filtered attendance history
  const isDateRangeFilter = fromDate !== todayStr || toDate !== todayStr;

  const { data: historyRecords = [], isLoading } = useAttendanceHistoryQuery({
    date: !isDateRangeFilter ? fromDate : undefined,
    fromDate: isDateRangeFilter ? fromDate : undefined,
    toDate: isDateRangeFilter ? toDate : undefined,
    employeeId: selectedEmployeeId || undefined,
    status: selectedStatus || undefined,
  });

  const activeRecords = isDateRangeFilter ? historyRecords : todayRecords;

  // Filter records locally by search query if text typed
  const filteredRecords = activeRecords.filter((record) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const empName = record.employee
      ? `${record.employee.firstName} ${record.employee.lastName}`.toLowerCase()
      : "";
    return empName.includes(q) || record.date.includes(q);
  });

  const updateMutation = useUpdateAttendanceMutation(
    selectedRecordForCorrection?.id || "",
    () => setSelectedRecordForCorrection(null),
  );

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedEmployeeId("");
    setSelectedStatus("");
    setFromDate(todayStr);
    setToDate(todayStr);
  };

  const currentDateFormatted = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <PageContainer className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Workforce Attendance"
        description={`Today's workforce clock logs & attendance history (${currentDateFormatted})`}
        actions={
          <div className="flex items-center gap-2 bg-primary/10 text-primary px-3 py-1.5 rounded-xl text-xs font-bold">
            <Clock className="h-4 w-4 animate-pulse" />
            <span>Live Workforce Monitoring</span>
          </div>
        }
      />

      {/* Summary Cards */}
      <AttendanceSummaryCards
        records={todayRecords}
        totalEmployeesCount={employees.length}
      />

      {/* Filter Bar */}
      <div className="rounded-2xl border border-border bg-card p-4 shadow-xs">
        <AttendanceFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedEmployeeId={selectedEmployeeId}
          onEmployeeChange={setSelectedEmployeeId}
          selectedStatus={selectedStatus}
          onStatusChange={setSelectedStatus}
          fromDate={fromDate}
          onFromDateChange={setFromDate}
          toDate={toDate}
          onToDateChange={setToDate}
          employees={employees}
          onResetFilters={handleResetFilters}
        />
      </div>

      {/* Attendance Table */}
      <AttendanceTable
        records={filteredRecords}
        isLoading={isLoading}
        onCorrectRecord={(rec) => setSelectedRecordForCorrection(rec)}
      />

      {/* Correction Modal */}
      {selectedRecordForCorrection && (
        <AttendanceCorrectionDialog
          record={selectedRecordForCorrection}
          isOpen={!!selectedRecordForCorrection}
          onClose={() => setSelectedRecordForCorrection(null)}
          onSave={async (payload) => {
            await updateMutation.mutateAsync(payload);
          }}
          isSubmitting={updateMutation.isPending}
        />
      )}
    </PageContainer>
  );
};

export default AttendancePage;
