import * as z from "zod";

export const signupSchema = z.object({
  shopName: z
    .string()
    .min(2, { message: "Shop name must be at least 2 characters" }),
  ownerFirstName: z
    .string()
    .min(1, { message: "First name is required" }),
  ownerLastName: z
    .string()
    .min(1, { message: "Last name is required" }),
  ownerEmail: z
    .string()
    .min(1, { message: "Email address is required" })
    .email({ message: "Please enter a valid email address" }),
  ownerPassword: z
    .string()
    .min(6, { message: "Password must be at least 6 characters long" }),
  phone: z.string().optional(),
  agreeTerms: z.boolean().refine((val) => val === true, {
    message: "You must accept the terms of service",
  }),
});

export type SignupFormValues = z.infer<typeof signupSchema>;
