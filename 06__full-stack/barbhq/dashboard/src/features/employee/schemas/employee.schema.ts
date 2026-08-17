import * as z from "zod";

export const employeeFormSchema = z.object({
  firstName: z
    .string()
    .min(2, { message: "First name must be at least 2 characters" })
    .max(50, { message: "First name cannot exceed 50 characters" }),
  lastName: z
    .string()
    .min(2, { message: "Last name must be at least 2 characters" })
    .max(50, { message: "Last name cannot exceed 50 characters" }),
  email: z
    .string()
    .min(1, { message: "Email address is required" })
    .email({ message: "Please enter a valid email address" }),
  phone: z.string().optional().or(z.literal("")),
  role: z.enum(["OWNER", "MANAGER", "RECEPTIONIST", "BARBER"]),
  employmentType: z.enum(["FULL_TIME", "PART_TIME", "CONTRACT"]),
  hireDate: z
    .string()
    .min(1, { message: "Hire date is required" }),
  salaryType: z.enum(["MONTHLY", "HOURLY", "COMMISSION_ONLY"]),
  salary: z.coerce
    .number()
    .min(0, { message: "Salary must be a positive number" }),
  commissionEnabled: z.boolean().default(false),
  commissionRate: z.coerce
    .number()
    .min(0, { message: "Rate must be at least 0" })
    .max(100, { message: "Rate cannot exceed 100" })
    .default(0),
  avatar: z.string().optional().or(z.literal("")),
  status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED", "ON_LEAVE"]).optional(),
});

export type EmployeeFormValues = z.infer<typeof employeeFormSchema>;
