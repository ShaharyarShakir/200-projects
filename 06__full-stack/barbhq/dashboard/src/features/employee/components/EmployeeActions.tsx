import React, { useState } from "react";
import { Eye, Edit, LogIn, LogOut, UserX, MoreVertical } from "lucide-react";
import { Dropdown, type DropdownItem } from "../../../components/ui/Dropdown";
import { ConfirmDialog } from "../../../components/ui/ConfirmDialog";
import { Button } from "../../../components/ui/button";
import type { Employee, User } from "../../../types";

interface EmployeeActionsProps {
  employee: Employee;
  currentUser: User | null;
  onView: (employee: Employee) => void;
  onEdit: (employee: Employee) => void;
  onClockIn: (employee: Employee) => void;
  onClockOut: (employee: Employee) => void;
  onDeactivate: (employee: Employee) => void;
}

export const EmployeeActions: React.FC<EmployeeActionsProps> = ({
  employee,
  currentUser,
  onView,
  onEdit,
  onClockIn,
  onClockOut,
  onDeactivate,
}) => {
  const [showDeactivateDialog, setShowDeactivateDialog] = useState(false);

  if (!currentUser) return null;

  const currentRole = currentUser.role;
  const isOwner = currentRole === "OWNER";
  const isManager = currentRole === "MANAGER";
  const isReceptionist = currentRole === "RECEPTIONIST";
  const isBarber = currentRole === "BARBER";

  // Action validation
  const targetIsOwner = employee.role === "OWNER";
  const isSelf = employee.id === currentUser.id;

  // Permissions logic
  const canEdit = isOwner || (isManager && !targetIsOwner);
  const canDeactivate = (isOwner || (isManager && !targetIsOwner)) && !isSelf;
  const canClock = isOwner || (isManager && !targetIsOwner) || isSelf;

  // Build items list
  const dropdownItems: DropdownItem[] = [
    {
      label: "View Profile",
      icon: <Eye className="w-4 h-4" />,
      onClick: () => onView(employee),
    },
  ];

  if (canEdit && !isReceptionist && !isBarber) {
    dropdownItems.push({
      label: "Edit Employee",
      icon: <Edit className="w-4 h-4" />,
      onClick: () => onEdit(employee),
    });
  }

  if (canClock && !isReceptionist) {
    if (employee.isClockedIn) {
      dropdownItems.push({
        label: "Clock Out",
        icon: <LogOut className="w-4 h-4 text-amber-500" />,
        onClick: () => onClockOut(employee),
      });
    } else if (employee.status === "ACTIVE") {
      dropdownItems.push({
        label: "Clock In",
        icon: <LogIn className="w-4 h-4 text-emerald-500" />,
        onClick: () => onClockIn(employee),
      });
    }
  }

  if (canDeactivate && employee.status === "ACTIVE" && !isReceptionist && !isBarber) {
    dropdownItems.push({
      label: "Deactivate",
      icon: <UserX className="w-4 h-4 text-destructive" />,
      onClick: () => setShowDeactivateDialog(true),
      variant: "destructive",
    });
  }

  return (
    <>
      <Dropdown
        trigger={
          <Button
            variant="ghost"
            size="sm"
            className="flex justify-center items-center p-1 rounded-full w-8 h-8 text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <MoreVertical className="w-4.5 h-4.5" />
          </Button>
        }
        items={dropdownItems}
      />

      <ConfirmDialog
        isOpen={showDeactivateDialog}
        onClose={() => setShowDeactivateDialog(false)}
        onConfirm={() => {
          onDeactivate(employee);
          setShowDeactivateDialog(false);
        }}
        title="Deactivate Employee"
        message={`Are you sure you want to deactivate ${employee.firstName} ${employee.lastName}? They will be marked as inactive and blocked from clocking in.`}
        confirmText="Deactivate"
        variant="destructive"
      />
    </>
  );
};

export default EmployeeActions;
