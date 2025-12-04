import { z } from "zod";

export const customerFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  age: z.number().min(1, "Age is required").max(150),
  gender: z.enum(["male", "female", "other"]),
  phone: z.string().min(10, "Valid phone number required"),
  email: z.string().email("Valid email required"),
  address: z.string().min(5, "Address is required"),
  idType: z.enum(["Aadhar", "PAN", "Driving License", "Passport", "Other"]),
  idValue: z.string().optional(),
  idProofUrl: z.string().optional(),
  vehicleNumber: z.string().min(1, "Vehicle number required"),
  checkIn: z.date(),
  checkOut: z.date(),
  checkInTime: z.string().default("12:00"),
  checkOutTime: z.string().default("10:00"),
  instructions: z.string().optional(),
  stayCharges: z.number().min(0),
  cuisineCharges: z.number().min(0).default(0),
  receivedAmount: z.number().min(0).default(0),
  advancePaymentMode: z.enum(["cash", "UPI", "bank"]).default("cash"),
})
  .refine(
    (data) => data.checkOut > data.checkIn,
    {
      message: "Check-out must be after check-in",
      path: ["checkOut"],
    }
  )
  .refine(
    (data) => data.idValue || data.idProofUrl,
    {
      message: "Either ID number or ID proof image is required",
      path: ["idValue"],
    }
  );

export type CustomerFormData = z.infer<typeof customerFormSchema>;

// Group Member Schema
export const groupMemberSchema = z.object({
  name: z.string().min(2, "Name is required"),
  age: z.number().min(1, "Age is required").max(120, "Invalid age"),
  idType: z.enum(["Aadhar", "PAN", "Driving License", "Passport", "Other"]),
  idValue: z.string().optional(),
  idProofUrl: z.string().optional(),
}).refine(
  (data) => data.idValue || data.idProofUrl,
  {
    message: "Either ID number or ID proof image is required",
    path: ["idValue"],
  }
);

export type GroupMemberFormData = z.infer<typeof groupMemberSchema>;