import React, { useState } from "react";
import { PageContainer } from "../../../components/layout/PageContainer";
import { AttendanceDetails } from "../components/attendance-details";
import { AttendanceCorrectionDialog } from "../components/attendance-correction-dialog";
import { useAttendanceDetailQuery } from "../attendance.queries";
import { useUpdateAttendanceMutation } from "../attendance.mutations";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useNavigate, useParams } from "@tanstack/react-router";

export const AttendanceDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const params = useParams({ strict: false }) as { attendanceId?: string };
  const attendanceId = params?.attendanceId || "";

  const [isCorrecting, setIsCorrecting] = useState(false);

  const { data: record, isLoading, error } = useAttendanceDetailQuery(attendanceId);

  const updateMutation = useUpdateAttendanceMutation(attendanceId, () =>
    setIsCorrecting(false),
  );

  if (isLoading) {
    return (
      <PageContainer className="flex h-[70vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm font-semibold text-muted-foreground">
            Loading attendance record details...
          </p>
        </div>
      </PageContainer>
    );
  }

  if (error || !record) {
    return (
      <PageContainer className="space-y-6">
        <button
          onClick={() => navigate({ to: "/app/attendance" })}
          className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Attendance</span>
        </button>
        <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-8 text-center text-rose-500 space-y-2">
          <h3 className="text-lg font-bold">Attendance Record Not Found</h3>
          <p className="text-sm opacity-90">
            The requested attendance record could not be retrieved.
          </p>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer className="space-y-6 max-w-4xl mx-auto">
      <div>
        <button
          onClick={() => navigate({ to: "/app/attendance" })}
          className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Attendance List</span>
        </button>
      </div>

      <AttendanceDetails
        record={record}
        onCorrect={() => setIsCorrecting(true)}
      />

      {isCorrecting && (
        <AttendanceCorrectionDialog
          record={record}
          isOpen={isCorrecting}
          onClose={() => setIsCorrecting(false)}
          onSave={async (payload) => {
            await updateMutation.mutateAsync(payload);
          }}
          isSubmitting={updateMutation.isPending}
        />
      )}
    </PageContainer>
  );
};

export default AttendanceDetailPage;
