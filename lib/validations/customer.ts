import { z } from "zod";

export const customerFormSchema = z.object({
  // Personal Details
  name: z.string().min(2, "Name must be at least 2 characters"),
  age: z.number().min(1, "Age is required").max(120, "Invalid age"),
  phone: z.string().regex(/^\+?[0-9]{10,15}$/, "Invalid phone number"),
  email: z.string().email("Invalid email address"),
  address: z.string().min(5, "Address must be at least 5 characters"),

  // ID Proof (flexible - either idValue OR idProofUrl required)
  idType: z.enum(["Aadhar", "PAN", "Driving License", "Passport", "Other"]),
  idValue: z.string().optional(),
  idProofUrl: z.string().optional(),

  // Vehicle
  vehicleNumber: z.string().min(1, "Vehicle number is required"),

  // Booking Details
  checkIn: z.date(),
  checkOut: z.date(),
  checkInTime: z.string().default("12:00"),
  checkOutTime: z.string().default("10:00"),
  instructions: z.string().optional(),

  // Financial
  stayCharges: z.number().min(0, "Stay charges must be positive"),
  cuisineCharges: z.number().min(0, "Cuisine charges must be positive").default(0),
  receivedAmount: z.number().min(0, "Received amount must be positive").default(0),
  advancePaymentMode: z.enum(["cash", "UPI", "bank"]).optional(),
  advanceReceiptUrl: z.string().optional(),
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