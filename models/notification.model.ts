import { Timestamp } from "firebase-admin/firestore";

export type NotificationType = 
  | "check_in_reminder" 
  | "check_out_reminder" 
  | "payment_due"
  | "new_lead"
  | "booking_cancelled"
  | "booking_created";

export type NotificationPriority = "low" | "medium" | "high";

export interface Notification {
  uid: string;
  userId: string; // User who should see this notification
  type: NotificationType;
  title: string;
  message: string;
  priority: NotificationPriority;
  data: {
    customerId?: string;
    customerName?: string;
    leadId?: string;
    leadName?: string;
    checkInDate?: string;
    checkOutDate?: string;
    balanceAmount?: number;
    [key: string]: any;
  };
  read: boolean;
  actionUrl?: string; // Deep link to related page
  createdAt: Date | Timestamp;
  expiresAt?: Date | Timestamp; // Auto-delete after 30 days
  emailSent?: boolean; // Track if email notification was sent
}

export interface NotificationCreateInput {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  priority?: NotificationPriority;
  data?: Record<string, any>;
  actionUrl?: string;
  expiresAt?: Date;
}