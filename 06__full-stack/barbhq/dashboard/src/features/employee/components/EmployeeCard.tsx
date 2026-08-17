import React from "react";
import { Mail, Phone, CalendarDays, Wallet, BadgePercent, Clock } from "lucide-react";
import { Card, CardContent } from "../../../components/ui/card";
import { EmployeeAvatar } from "./EmployeeAvatar";
import { EmployeeStatusBadge } from "./EmployeeStatusBadge";
import { EmployeeRoleBadge } from "./EmployeeRoleBadge";
import type { Employee } from "../../../types";

interface EmployeeCardProps {
  employee: Employee;
  className?: string;
}

export const EmployeeCard: React.FC<EmployeeCardProps> = ({
  employee,
  className,
}) => {
  return (
    <Card className={className}>
      <CardContent className="p-6 space-y-6 select-none font-sans">
        {/* Header section with avatar, name, and badge status */}
        <div className="flex items-start gap-4">
          <EmployeeAvatar
            src={employee.avatar}
            firstName={employee.firstName}
            lastName={employee.lastName}
            size="lg"
          />
          <div className="flex-1 space-y-1 mt-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-serif text-lg font-bold text-foreground leading-none">
                {employee.firstName} {employee.lastName}
              </h3>
              <EmployeeStatusBadge status={employee.status} />
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="font-mono font-bold tracking-wide text-foreground/80">
                {employee.employeeCode}
              </span>
              <span>•</span>
              <EmployeeRoleBadge role={employee.role} />
            </div>
          </div>
        </div>

        {/* Essential contact details */}
        <div className="grid gap-3 text-xs text-muted-foreground/90 border-t border-b border-border/40 py-4 select-all">
          <div className="flex items-center gap-2.5">
            <Mail className="h-4 w-4 text-muted-foreground/60 shrink-0" />
            <span>{employee.email}</span>
          </div>
          <div className="flex items-center gap-2.5">
            <Phone className="h-4 w-4 text-muted-foreground/60 shrink-0" />
            <span>{employee.phone || "No phone added"}</span>
          </div>
          <div className="flex items-center gap-2.5">
            <CalendarDays className="h-4 w-4 text-muted-foreground/60 shrink-0" />
            <span>
              Hired: {new Date(employee.hireDate).toLocaleDateString(undefined, {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </span>
          </div>
        </div>

        {/* Financial pay & status specifications */}
        <div className="grid grid-cols-2 gap-4 text-xs select-none">
          <div className="bg-secondary/35 border border-border/40 rounded-xl p-3 space-y-1">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
              Wage System
            </span>
            <div className="flex items-center gap-1.5 font-bold text-foreground">
              <Wallet className="h-4 w-4 text-primary shrink-0" />
              <span>
                {employee.salaryType === "MONTHLY"
                  ? `$${employee.salary}/mo`
                  : employee.salaryType === "HOURLY"
                  ? `$${employee.salary}/hr`
                  : "Commission Only"}
              </span>
            </div>
          </div>

          <div className="bg-secondary/35 border border-border/40 rounded-xl p-3 space-y-1">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
              Commission
            </span>
            <div className="flex items-center gap-1.5 font-bold text-foreground">
              <BadgePercent className="h-4.5 w-4.5 text-primary shrink-0" />
              <span>
                {employee.commissionEnabled
                  ? `${employee.commissionRate}% Rate`
                  : "Disabled"}
              </span>
            </div>
          </div>
        </div>

        {/* Clock on duty summary */}
        <div className="flex items-center justify-between bg-primary/[0.03] border border-primary/10 rounded-xl p-4">
          <div className="flex items-center gap-2.5">
            <Clock className="h-4 w-4 text-primary" />
            <div>
              <span className="text-xs font-bold text-foreground block">
                {employee.isClockedIn ? "Currently Clocked In" : "Off Duty"}
              </span>
              <span className="text-[10px] text-muted-foreground block mt-0.5">
                {employee.isClockedIn ? "Logged active on shop floor" : "Rostered session closed"}
              </span>
            </div>
          </div>
          <span
            className={`h-2.5 w-2.5 rounded-full ${
              employee.isClockedIn
                ? "bg-emerald-500 animate-pulse"
                : "bg-muted-foreground/30"
            }`}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default EmployeeCard;
