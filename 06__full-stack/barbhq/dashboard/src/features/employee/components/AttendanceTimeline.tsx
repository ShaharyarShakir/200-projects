import React, { useState, useMemo, useEffect } from "react";
import { format } from "date-fns";
import { Clock } from "lucide-react";
import {
  TableWrapper,
  Table,
  TableHead,
  TableRow,
  TableHeader,
  TableBody,
  TableCell,
} from "../../../components/ui/TableWrapper";
import { Button } from "../../../components/ui/button";
import type { Attendance } from "../../../types";

interface AttendanceTimelineProps {
  attendanceRecords: Attendance[];
  isLoading?: boolean;
}

export const AttendanceTimeline: React.FC<AttendanceTimelineProps> = ({
  attendanceRecords,
  isLoading = false,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const totalPages = Math.ceil(attendanceRecords.length / pageSize) || 1;
  const effectivePage = Math.min(currentPage, totalPages);

  useEffect(() => {
    if (currentPage !== effectivePage) {
      setCurrentPage(effectivePage);
    }
  }, [currentPage, effectivePage]);

  // Pagination bounds
  const paginatedRecords = useMemo(() => {
    const start = (effectivePage - 1) * pageSize;
    return attendanceRecords.slice(start, start + pageSize);
  }, [attendanceRecords, effectivePage]);

  // Format minutes helper
  const formatDuration = (minutes: number) => {
    if (!minutes || minutes <= 0) return "0 mins";
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hrs > 0 ? `${hrs}h ${mins}m` : `${mins} min`;
  };

  // Format Status Badge
  const renderStatus = (status: string) => {
    const styles: Record<string, string> = {
      PRESENT: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20",
      LATE: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20",
      ABSENT: "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20",
      HALF_DAY: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20",
    };

    const labelMap: Record<string, string> = {
      PRESENT: "Present",
      LATE: "Late",
      ABSENT: "Absent",
      HALF_DAY: "Half Day",
    };

    const style = styles[status] || "bg-muted text-muted-foreground border";
    const label = labelMap[status] || status;

    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${style}`}>
        <span className="bg-current rounded-full w-1.5 h-1.5" />
        {label}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-3 animate-pulse select-none">
        <div className="bg-secondary/35 border rounded-lg w-64 h-8" />
        <div className="bg-secondary/20 border rounded-xl h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-4 font-sans select-none">
      <div className="bg-card shadow-sm border border-border/80 rounded-xl overflow-hidden">
        <TableWrapper>
          <Table className="w-full text-sm">
            <TableHead className="bg-secondary/40 border-border border-b">
              <TableRow>
                <TableHeader className="px-4 py-3 text-left">Date</TableHeader>
                <TableHeader className="px-4 py-3 text-left">Clock In</TableHeader>
                <TableHeader className="px-4 py-3 text-left">Clock Out</TableHeader>
                <TableHeader className="px-4 py-3 text-center">Worked Hours</TableHeader>
                <TableHeader className="px-4 py-3 text-center">Overtime</TableHeader>
                <TableHeader className="px-4 py-3 text-center">Status</TableHeader>
                <TableHeader className="px-4 py-3 text-left">Notes</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedRecords.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-12 text-muted-foreground text-center">
                    <div className="flex flex-col justify-center items-center gap-2">
                      <Clock className="w-8 h-8 text-muted-foreground/45" />
                      <p className="font-semibold text-foreground text-sm">No attendance records</p>
                      <p className="text-xs">There are no logged sessions in this date range.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedRecords.map((rec) => (
                  <TableRow key={rec.id} className="hover:bg-secondary/20 transition-colors">
                    {/* Date */}
                    <TableCell className="px-4 py-3.5 font-bold text-foreground align-middle">
                      {(() => {
                        const parsedDate = new Date(rec.date + "T00:00:00");
                        return Number.isNaN(parsedDate.getTime())
                          ? "—"
                          : format(parsedDate, "EEE, MMM dd, yyyy");
                      })()}
                    </TableCell>

                    {/* Clock In */}
                    <TableCell className="px-4 py-3.5 font-mono font-semibold text-foreground/80 text-xs align-middle">
                      {(() => {
                        const parsedClockIn = new Date(rec.clockIn);
                        return Number.isNaN(parsedClockIn.getTime())
                          ? "—"
                          : format(parsedClockIn, "hh:mm a");
                      })()}
                    </TableCell>

                    {/* Clock Out */}
                    <TableCell className="px-4 py-3.5 font-mono font-semibold text-xs align-middle">
                      {rec.clockOut ? (
                        (() => {
                          const parsedClockOut = new Date(rec.clockOut);
                          return Number.isNaN(parsedClockOut.getTime())
                            ? "—"
                            : format(parsedClockOut, "hh:mm a");
                        })()
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-primary/10 px-2 py-0.5 border border-primary/20 rounded font-extrabold text-[10px] text-primary uppercase animate-pulse">
                          Session Open
                        </span>
                      )}
                    </TableCell>

                    {/* Worked Hours */}
                    <TableCell className="px-4 py-3.5 font-semibold text-center align-middle">
                      {formatDuration(rec.workedMinutes)}
                    </TableCell>

                    {/* Overtime */}
                    <TableCell className="px-4 py-3.5 font-semibold text-center align-middle">
                      {rec.overtimeMinutes > 0 ? (
                        <span className="bg-emerald-500/10 px-2 py-0.5 rounded font-bold text-emerald-600 dark:text-emerald-400">
                          +{formatDuration(rec.overtimeMinutes)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground/60">-</span>
                      )}
                    </TableCell>

                    {/* Status */}
                    <TableCell className="px-4 py-3.5 text-center align-middle">
                      {renderStatus(rec.status)}
                    </TableCell>

                    {/* Notes */}
                    <TableCell className="px-4 py-3.5 max-w-xs text-muted-foreground text-xs truncate align-middle" title={rec.notes}>
                      {rec.notes || <span className="text-muted-foreground/40 italic">None</span>}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableWrapper>
      </div>

      {/* Pagination */}
      {attendanceRecords.length > 0 && (
        <div className="flex justify-between items-center px-1">
          <div className="font-bold text-muted-foreground text-xs">
            Showing <span className="text-foreground">{(effectivePage - 1) * pageSize + 1}</span> to{" "}
            <span className="text-foreground">
              {Math.min(effectivePage * pageSize, attendanceRecords.length)}
            </span>{" "}
            of <span className="text-foreground">{attendanceRecords.length}</span> sessions
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={effectivePage === 1}
              aria-label="Previous page"
              className="flex justify-center items-center p-0 rounded-lg w-8 h-8 cursor-pointer"
            >
              &lt;
            </Button>
            <span className="font-bold text-muted-foreground text-xs">
              Page {effectivePage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={effectivePage === totalPages}
              aria-label="Next page"
              className="flex justify-center items-center p-0 rounded-lg w-8 h-8 cursor-pointer"
            >
              &gt;
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceTimeline;
