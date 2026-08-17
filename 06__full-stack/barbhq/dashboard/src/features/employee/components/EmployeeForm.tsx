import React, { useEffect } from "react";
import { useForm, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { employeeFormSchema } from "../schemas/employee.schema";
import { Input } from "../../../components/ui/input";
import { Switch } from "../../../components/ui/switch";
import { NativeSelect, NativeSelectOption } from "../../../components/ui/native-select";
import { Button } from "../../../components/ui/button";
import type { Employee, EmployeeStatus, EmploymentType, SalaryType } from "../../../types";

interface EmployeeFormProps {
  initialData?: Employee;
  onSubmit: (data: any) => void | Promise<void>;
  isLoading?: boolean;
  onCancel: () => void;
}

export const EmployeeForm: React.FC<EmployeeFormProps> = ({
  initialData,
  onSubmit,
  isLoading = false,
  onCancel,
}) => {
  const isEditMode = !!initialData;

  // Format initial date to YYYY-MM-DD if available
  const defaultHireDate = initialData?.hireDate
    ? new Date(initialData.hireDate).toISOString().split("T")[0]!
    : new Date().toISOString().split("T")[0]!;

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<any>({
    resolver: zodResolver(employeeFormSchema),
    defaultValues: {
      firstName: initialData?.firstName || "",
      lastName: initialData?.lastName || "",
      email: initialData?.email || "",
      phone: initialData?.phone || "",
      role: initialData?.role || "BARBER",
      employmentType: initialData?.employmentType || "FULL_TIME",
      hireDate: defaultHireDate,
      salaryType: initialData?.salaryType || "MONTHLY",
      salary: initialData?.salary ?? 0,
      commissionEnabled: initialData?.commissionEnabled || false,
      commissionRate: initialData?.commissionRate || 0,
      avatar: initialData?.avatar || "",
      status: initialData?.status || "ACTIVE",
    },
  });

  const commissionEnabled = useWatch({ control, name: "commissionEnabled" });
  const roleValue = useWatch({ control, name: "role" });
  const employmentTypeValue = useWatch({ control, name: "employmentType" });
  const statusValue = useWatch({ control, name: "status" });
  const salaryTypeValue = useWatch({ control, name: "salaryType" });

  // Reset commission rate if disabled
  useEffect(() => {
    if (!commissionEnabled) {
      setValue("commissionRate", 0);
    }
  }, [commissionEnabled, setValue]);

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-6 bg-card shadow-lg p-6 md:p-8 border border-border/80 rounded-2xl max-w-3xl animate-fade-in select-none"
    >
      <div className="pb-4 border-border/60 border-b">
        <h2 className="font-serif font-bold text-foreground text-lg">
          {isEditMode ? "Edit Staff Roster Card" : "Invite New Staff Member"}
        </h2>
        <p className="mt-1 text-muted-foreground text-xs">
          {isEditMode
            ? `Modify settings for ${initialData?.firstName} ${initialData?.lastName}`
            : "Register new staff credentials, employment status and commission details."}
        </p>
      </div>

      {isEditMode && initialData && (
        <div className="flex md:flex-row flex-col justify-between md:items-center gap-3 bg-secondary/40 p-4 border border-border/60 rounded-xl text-sm">
          <div>
            <span className="block font-bold text-[10px] text-muted-foreground uppercase tracking-widest">
              Employee Identifier
            </span>
            <span className="font-mono font-bold text-foreground">{initialData.employeeCode}</span>
          </div>
          <div>
            <span className="block font-bold text-[10px] text-muted-foreground uppercase tracking-widest">
              Date Rostered
            </span>
            <span className="font-semibold text-foreground">
              {initialData.createdAt
                ? (() => {
                    const createdAt = new Date(initialData.createdAt);
                    return Number.isNaN(createdAt.getTime())
                      ? "—"
                      : createdAt.toLocaleDateString();
                  })()
                : "—"}
            </span>
          </div>
        </div>
      )}

      {/* 1. PERSONAL INFORMATION */}
      <div className="space-y-4">
        <h3 className="pl-2 border-primary border-l-2 font-bold text-primary text-xs uppercase tracking-wider">
          Personal Information
        </h3>
        <div className="gap-4 grid sm:grid-cols-2">
          <Input
            label="First Name"
            placeholder="John"
            error={errors.firstName?.message as string}
            disabled={isLoading}
            {...register("firstName")}
          />
          <Input
            label="Last Name"
            placeholder="Doe"
            error={errors.lastName?.message as string}
            disabled={isLoading}
            {...register("lastName")}
          />
        </div>
        <div className="gap-4 grid sm:grid-cols-2">
          <Input
            label="Email Address"
            placeholder="john.doe@barbhq.com"
            error={errors.email?.message as string}
            disabled={isLoading}
            {...register("email")}
          />
          <Input
            label="Phone Number"
            placeholder="+1 (555) 000-0000"
            error={errors.phone?.message as string}
            disabled={isLoading}
            {...register("phone")}
          />
        </div>
        <Input
          label="Avatar URL (Optional)"
          placeholder="https://unsplash.com/... or leave blank"
          error={errors.avatar?.message as string}
          disabled={isLoading}
          {...register("avatar")}
        />
      </div>

      {/* 2. EMPLOYMENT */}
      <div className="space-y-4 pt-4 border-border/40 border-t">
        <h3 className="pl-2 border-primary border-l-2 font-bold text-primary text-xs uppercase tracking-wider">
          Employment Profile
        </h3>
        <div className="gap-4 grid sm:grid-cols-3">
          <div className="flex flex-col gap-1.5 w-full">
            <label className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">
              Roster Role
            </label>
            <NativeSelect
              value={roleValue}
              onChange={(e) =>
                setValue("role", e.target.value as any, { shouldValidate: true })
              }
              className="w-full h-[40.4px]"
              disabled={isLoading}
            >
              <NativeSelectOption value="BARBER">Barber</NativeSelectOption>
              <NativeSelectOption value="MANAGER">Manager</NativeSelectOption>
              <NativeSelectOption value="RECEPTIONIST">Receptionist</NativeSelectOption>
              <NativeSelectOption value="OWNER">Owner</NativeSelectOption>
            </NativeSelect>
            {errors.role && (
              <span className="mt-1 text-destructive text-xs">{(errors.role as any).message}</span>
            )}
          </div>

          <div className="flex flex-col gap-1.5 w-full">
            <label className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">
              Employment Type
            </label>
            <NativeSelect
              value={employmentTypeValue}
              onChange={(e) =>
                setValue("employmentType", e.target.value as EmploymentType, {
                  shouldValidate: true,
                })
              }
              className="w-full h-[40.4px]"
              disabled={isLoading}
            >
              <NativeSelectOption value="FULL_TIME">Full Time</NativeSelectOption>
              <NativeSelectOption value="PART_TIME">Part Time</NativeSelectOption>
              <NativeSelectOption value="CONTRACT">Contract</NativeSelectOption>
            </NativeSelect>
            {errors.employmentType && (
              <span className="mt-1 text-destructive text-xs">
                {(errors.employmentType as any).message}
              </span>
            )}
          </div>

          <Input
            label="Hire Date"
            type="date"
            error={errors.hireDate?.message as string}
            disabled={isLoading}
            {...register("hireDate")}
          />
        </div>

        {isEditMode && (
          <div className="flex flex-col gap-1.5 w-full max-w-xs">
            <label className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">
              Operational Status
            </label>
            <NativeSelect
              value={statusValue}
              onChange={(e) =>
                setValue("status", e.target.value as EmployeeStatus, {
                  shouldValidate: true,
                })
              }
              className="w-full h-[40.4px]"
              disabled={isLoading}
            >
              <NativeSelectOption value="ACTIVE">Active</NativeSelectOption>
              <NativeSelectOption value="INACTIVE">Inactive</NativeSelectOption>
              <NativeSelectOption value="SUSPENDED">Suspended</NativeSelectOption>
              <NativeSelectOption value="ON_LEAVE">On Leave</NativeSelectOption>
            </NativeSelect>
          </div>
        )}
      </div>

      {/* 3. COMPENSATION */}
      <div className="space-y-4 pt-4 border-border/40 border-t">
        <h3 className="pl-2 border-primary border-l-2 font-bold text-primary text-xs uppercase tracking-wider">
          Compensation Settings
        </h3>
        <div className="gap-4 grid sm:grid-cols-2">
          <div className="flex flex-col gap-1.5 w-full">
            <label className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">
              Payment Model
            </label>
            <NativeSelect
              value={salaryTypeValue}
              onChange={(e) =>
                setValue("salaryType", e.target.value as SalaryType, {
                  shouldValidate: true,
                })
              }
              className="w-full h-[40.4px]"
              disabled={isLoading}
            >
              <NativeSelectOption value="MONTHLY">Monthly Salary</NativeSelectOption>
              <NativeSelectOption value="HOURLY">Hourly Wage</NativeSelectOption>
              <NativeSelectOption value="COMMISSION_ONLY">Commission Only</NativeSelectOption>
            </NativeSelect>
            {errors.salaryType && (
              <span className="mt-1 text-destructive text-xs">
                {(errors.salaryType as any).message}
              </span>
            )}
          </div>

          <Input
            label="Base Pay Rate ($)"
            type="number"
            placeholder="0.00"
            error={errors.salary?.message as string}
            disabled={isLoading || salaryTypeValue === "COMMISSION_ONLY"}
            {...register("salary")}
          />
        </div>

        {/* Commission settings toggle */}
        <div className="flex flex-col gap-4 bg-secondary/20 p-4 border border-border/40 rounded-xl">
          <div className="flex justify-between items-center">
            <div>
              <label className="font-semibold text-foreground text-xs uppercase tracking-wider">
                Commission Splits
              </label>
              <span className="block mt-0.5 text-[10px] text-muted-foreground">
                Enable incentive-based earnings on service volume.
              </span>
            </div>
            <Controller
              control={control}
              name="commissionEnabled"
              render={({ field }) => (
                <Switch
                  checked={field.value}
                  onCheckedChange={(val) => {
                    field.onChange(val);
                    if (!val) setValue("commissionRate", 0);
                  }}
                  disabled={isLoading}
                />
              )}
            />
          </div>

          {commissionEnabled && (
            <div className="w-full max-w-xs animate-slide-up">
              <Input
                label="Commission Rate (%)"
                type="number"
                placeholder="10"
                error={errors.commissionRate?.message as string}
                disabled={isLoading}
                {...register("commissionRate")}
              />
            </div>
          )}
        </div>
      </div>

      {/* SUBMIT BUTTONS */}
      <div className="flex justify-end items-center gap-3 pt-6 border-border/60 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
          className="cursor-pointer"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          isLoading={isLoading}
          className="font-semibold cursor-pointer"
        >
          {isEditMode ? "Save Changes" : "Create Roster Record"}
        </Button>
      </div>
    </form>
  );
};

export default EmployeeForm;
