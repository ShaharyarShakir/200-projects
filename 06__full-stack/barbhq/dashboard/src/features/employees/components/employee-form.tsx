import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X } from "lucide-react";
import { Input } from "../../../components/ui/input";
import { Button } from "../../../components/ui/button";
import { employeeFormSchema, type EmployeeFormValues } from "../employees.schemas";
import type { Employee } from "../employees.types";

interface EmployeeFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: EmployeeFormValues) => void;
  initialData?: Employee | null;
  isLoading?: boolean;
}

export const EmployeeForm: React.FC<EmployeeFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isLoading,
}) => {
  const isEditing = !!initialData;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeFormSchema) as any,
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      role: "BARBER",
      employmentType: "FULL_TIME",
      salary: 45000,
      commissionRate: 10,
      password: "",
    },
  });

  useEffect(() => {
    if (initialData) {
      reset({
        firstName: initialData.firstName || "",
        lastName: initialData.lastName || "",
        email: initialData.email || "",
        phone: initialData.phone || "",
        role: initialData.role || "BARBER",
        employmentType: initialData.employmentType || "FULL_TIME",
        salary: initialData.salary || 0,
        commissionRate: initialData.commissionRate || 0,
        password: "",
      });
    } else {
      reset({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        role: "BARBER",
        employmentType: "FULL_TIME",
        salary: 45000,
        commissionRate: 10,
        password: "",
      });
    }
  }, [initialData, reset, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-card shadow-2xl overflow-hidden select-none">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h3 className="font-serif font-bold text-lg text-foreground">
              {isEditing ? "Edit Employee Profile" : "Add New Employee"}
            </h3>
            <p className="text-xs text-muted-foreground font-medium">
              {isEditing
                ? "Update staff credentials and compensation terms"
                : "Register a new barber or manager to your shop roster"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit(onSubmit as any)} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="First Name"
              placeholder="Ali"
              error={errors.firstName?.message}
              disabled={isLoading}
              {...register("firstName")}
            />
            <Input
              label="Last Name"
              placeholder="Khan"
              error={errors.lastName?.message}
              disabled={isLoading}
              {...register("lastName")}
            />
          </div>

          <Input
            label="Email Address"
            type="email"
            placeholder="ali.khan@barbhq.com"
            error={errors.email?.message}
            disabled={isLoading || isEditing}
            {...register("email")}
          />

          <Input
            label="Phone Number"
            placeholder="+92 300 1234567"
            error={errors.phone?.message}
            disabled={isLoading}
            {...register("phone")}
          />

          {!isEditing && (
            <Input
              label="Temporary Password"
              type="password"
              placeholder="••••••••"
              error={errors.password?.message}
              disabled={isLoading}
              {...register("password")}
            />
          )}

          <div className="grid grid-cols-2 gap-3">
            {/* Role Select */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Role</label>
              <select
                disabled={isLoading}
                {...register("role")}
                className="w-full px-3 py-2 text-xs font-semibold rounded-lg border border-border bg-background text-foreground hover:bg-secondary/50 focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
              >
                <option value="BARBER">Barber</option>
                <option value="RECEPTIONIST">Receptionist</option>
                <option value="MANAGER">Manager</option>
                <option value="OWNER">Owner</option>
              </select>
              {errors.role?.message && (
                <p className="text-[11px] font-semibold text-destructive">{errors.role.message}</p>
              )}
            </div>

            {/* Employment Type */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Employment Type</label>
              <select
                disabled={isLoading}
                {...register("employmentType")}
                className="w-full px-3 py-2 text-xs font-semibold rounded-lg border border-border bg-background text-foreground hover:bg-secondary/50 focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
              >
                <option value="FULL_TIME">Full Time</option>
                <option value="PART_TIME">Part Time</option>
                <option value="CONTRACT">Contract</option>
              </select>
              {errors.employmentType?.message && (
                <p className="text-[11px] font-semibold text-destructive">{errors.employmentType.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <Input
              label="Base Salary (PKR)"
              type="number"
              placeholder="45000"
              error={errors.salary?.message}
              disabled={isLoading}
              {...register("salary")}
            />
            <Input
              label="Commission (%)"
              type="number"
              placeholder="10"
              error={errors.commissionRate?.message}
              disabled={isLoading}
              {...register("commissionRate")}
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-border mt-6">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isLoading}>
              {isEditing ? "Save Changes" : "Create Employee"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
