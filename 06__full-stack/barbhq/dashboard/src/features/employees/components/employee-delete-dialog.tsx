import React from "react";
import { ConfirmDialog } from "../../../components/ui/ConfirmDialog";
import type { Employee } from "../employees.types";

interface EmployeeDeleteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  employee: Employee | null;
  isLoading?: boolean;
}

export const EmployeeDeleteDialog: React.FC<EmployeeDeleteDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  employee,
  isLoading,
}) => {
  if (!employee) return null;

  return (
    <ConfirmDialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title="Deactivate Employee?"
      message={`${employee.firstName} ${employee.lastName} will no longer appear as an active staff member, but historical attendance, sales, and payroll records will remain available.`}
      confirmText="Deactivate"
      variant="destructive"
      isLoading={isLoading}
    />
  );
};
