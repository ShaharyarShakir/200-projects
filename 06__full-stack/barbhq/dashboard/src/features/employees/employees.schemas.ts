import { z } from "zod";

export const employeeFormSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  role: z.enum(["OWNER", "MANAGER", "RECEPTIONIST", "BARBER"]),
  employmentType: z.enum(["FULL_TIME", "PART_TIME", "CONTRACT"]),
  salary: z.coerce.number().min(0, "Salary cannot be negative"),
  commissionRate: z.coerce.number().min(0, "Commission rate cannot be negative").max(100, "Maximum commission is 100%").optional(),
  password: z.string().optional(),
});

export type EmployeeFormValues = z.infer<typeof employeeFormSchema>;
