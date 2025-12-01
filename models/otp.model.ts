import { Timestamp } from "firebase-admin/firestore";

export type OTPPurpose = "email_verification" | "password_reset" | "login_2fa";

export interface OTPModel {
  email: string;
  otp: string;
  expiresAt: Timestamp | Date;
  purpose: OTPPurpose;
  verified: boolean;
  createdAt: Timestamp | Date;
}

export interface OTPCreateInput {
  email: string;
  purpose: OTPPurpose;
}

export interface OTPVerifyInput {
  email: string;
  otp: string;
  purpose: OTPPurpose;
}