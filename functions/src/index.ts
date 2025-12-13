import { onSchedule } from "firebase-functions/v2/scheduler";
import { onDocumentCreated, onDocumentUpdated } from "firebase-functions/v2/firestore";
import * as admin from "firebase-admin";
import * as nodemailer from "nodemailer";
import { defineString } from "firebase-functions/params";

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();
const DATABASE_ID = "development";

// Define configuration parameters
const emailUser = defineString("EMAIL_USER");
const emailPassword = defineString("EMAIL_PASSWORD");

// Configure email transporter (using Gmail as example)
function getTransporter() {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: emailUser.value(),
      pass: emailPassword.value(),
    },
  });
}

// Helper function to get users with specific permission
async function getUsersWithPermission(permission: string): Promise<string[]> {
  const usersSnapshot = await db.collection("users")
    .where("active", "==", true)
    .get();

  const userIds: string[] = [];

  for (const doc of usersSnapshot.docs) {
    const userData = doc.data();
    const role = userData.role;
    
    // Get role permissions
    const rolePermissions = await getRolePermissions(role);
    const customPermissions = userData.customPermissions || [];
    
    const allPermissions = [...rolePermissions, ...customPermissions];
    
    if (allPermissions.includes(permission)) {
      userIds.push(doc.id);
    }
  }

  return userIds;
}

async function getRolePermissions(role: string): Promise<string[]> {
  const roleDoc = await db.collection("roles").doc(role).get();
  if (!roleDoc.exists) return [];
  return roleDoc.data()?.permissions || [];
}

// Helper function to create notification
async function createNotification(
  userId: string,
  type: string,
  title: string,
  message: string,
  data: any,
  actionUrl?: string,
  priority = "medium"
) {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30); // Expire after 30 days

  const notification = {
    userId,
    type,
    title,
    message,
    priority,
    data,
    actionUrl,
    read: false,
    emailSent: false,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    expiresAt: admin.firestore.Timestamp.fromDate(expiresAt),
  };

  await db.collection("notifications").add(notification);
}

// Helper function to send email
async function sendEmailNotification(
  userEmail: string,
  subject: string,
  htmlContent: string
) {
  try {
    const transporter = getTransporter();
    await transporter.sendMail({
      from: `"Devlata Villa" <${emailUser.value()}>`,
      to: userEmail,
      subject,
      html: htmlContent,
    });
    return true;
  } catch (error) {
    console.error("Error sending email:", error);
    return false;
  }
}

// Function 1: Check-in Reminder (Runs every 15 minutes)
export const checkInReminderScheduled = onSchedule(
  {
    schedule: "*/15 * * * *",
    timeZone: "Asia/Kolkata",
  },
  async (event) => {
    console.log("Running check-in reminder scheduler...");

    const now = new Date();
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
    const fifteenMinutesFromNow = new Date(now.getTime() + 75 * 60 * 1000);

    try {
      // Get all active bookings
      const customersSnapshot = await db
        .collection("customers")
        .where("status", "==", "active")
        .get();

      const usersWithPermission = await getUsersWithPermission("customers.view");

      for (const doc of customersSnapshot.docs) {
        const customer = doc.data();
        const checkInDate = customer.checkIn.toDate();
        const checkInTime = customer.checkInTime || "12:00";
        
        // Combine date and time
        const [hours, minutes] = checkInTime.split(":");
        const checkInDateTime = new Date(checkInDate);
        checkInDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

        // Check if check-in is between 1 hour and 1 hour 15 minutes from now
        if (checkInDateTime >= oneHourFromNow && checkInDateTime <= fifteenMinutesFromNow) {
          console.log(`Creating check-in reminder for customer: ${customer.name}`);

          // Create notification for all users with permission
          for (const userId of usersWithPermission) {
            await createNotification(
              userId,
              "check_in_reminder",
              "Upcoming Check-in",
              `${customer.name} is checking in at ${checkInTime}. Vehicle: ${customer.vehicleNumber}`,
              {
                customerId: doc.id,
                customerName: customer.name,
                checkInDate: checkInDate.toISOString(),
                checkInTime: checkInTime,
                vehicleNumber: customer.vehicleNumber,
              },
              `/customers/${doc.id}`,
              "high"
            );
          }

          // Send email to staff
          for (const userId of usersWithPermission) {
            const userDoc = await db.collection("users").doc(userId).get();
            const userData = userDoc.data();
            
            if (userData?.email) {
              const emailContent = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <h2 style="color: #007baf;">Upcoming Check-in Reminder</h2>
                  <p>Dear ${userData.name},</p>
                  <p><strong>${customer.name}</strong> is scheduled to check in at <strong>${checkInTime}</strong> today.</p>
                  <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <p><strong>Guest Details:</strong></p>
                    <ul>
                      <li>Phone: ${customer.phone}</li>
                      <li>Email: ${customer.email}</li>
                      <li>Vehicle Number: ${customer.vehicleNumber}</li>
                      <li>Check-out: ${customer.checkOut.toDate().toLocaleDateString()}</li>
                    </ul>
                  </div>
                  <p>Please ensure the room is ready for their arrival.</p>
                  <p>Best regards,<br>Devlata Villa Management System</p>
                </div>
              `;
              
              await sendEmailNotification(
                userData.email,
                `Check-in Reminder: ${customer.name} at ${checkInTime}`,
                emailContent
              );
            }
          }
        }
      }

      console.log("Check-in reminder scheduler completed successfully");
      return;
    } catch (error) {
      console.error("Error in check-in reminder scheduler:", error);
      throw error;
    }
  }
);

// Function 2: Check-out Reminder with Payment Due (Runs every 15 minutes)
export const checkOutReminderScheduled = onSchedule(
  {
    schedule: "*/15 * * * *",
    timeZone: "Asia/Kolkata",
  },
  async (event) => {
    console.log("Running check-out reminder scheduler...");

    const now = new Date();
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
    const fifteenMinutesFromNow = new Date(now.getTime() + 75 * 60 * 1000);

    try {
      // Get all active bookings
      const customersSnapshot = await db
        .collection("customers")
        .where("status", "==", "active")
        .get();

      const usersWithPermission = await getUsersWithPermission("customers.view");

      for (const doc of customersSnapshot.docs) {
        const customer = doc.data();
        const checkOutDate = customer.checkOut.toDate();
        const checkOutTime = customer.checkOutTime || "10:00";
        
        // Combine date and time
        const [hours, minutes] = checkOutTime.split(":");
        const checkOutDateTime = new Date(checkOutDate);
        checkOutDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

        // Check if check-out is between 1 hour and 1 hour 15 minutes from now
        if (checkOutDateTime >= oneHourFromNow && checkOutDateTime <= fifteenMinutesFromNow) {
          console.log(`Creating check-out reminder for customer: ${customer.name}`);

          const balanceAmount = customer.balanceAmount || 0;
          const hasPendingDues = balanceAmount > 0;

          const message = hasPendingDues
            ? `${customer.name} is checking out at ${checkOutTime}. ⚠️ Pending dues: ₹${balanceAmount.toLocaleString()}`
            : `${customer.name} is checking out at ${checkOutTime}. All payments cleared.`;

          // Create notification for all users with permission
          for (const userId of usersWithPermission) {
            await createNotification(
              userId,
              hasPendingDues ? "payment_due" : "check_out_reminder",
              hasPendingDues ? "Check-out with Pending Dues" : "Upcoming Check-out",
              message,
              {
                customerId: doc.id,
                customerName: customer.name,
                checkOutDate: checkOutDate.toISOString(),
                checkOutTime: checkOutTime,
                balanceAmount: balanceAmount,
                hasPendingDues: hasPendingDues,
              },
              `/customers/${doc.id}`,
              hasPendingDues ? "high" : "medium"
            );
          }

          // Send email to staff
          for (const userId of usersWithPermission) {
            const userDoc = await db.collection("users").doc(userId).get();
            const userData = userDoc.data();
            
            if (userData?.email) {
              const emailContent = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <h2 style="color: ${hasPendingDues ? "#ef4444" : "#007baf"};">Upcoming Check-out ${hasPendingDues ? "⚠️ Payment Due" : ""}</h2>
                  <p>Dear ${userData.name},</p>
                  <p><strong>${customer.name}</strong> is scheduled to check out at <strong>${checkOutTime}</strong> today.</p>
                  <div style="background: ${hasPendingDues ? "#fef2f2" : "#f5f5f5"}; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <p><strong>Guest Details:</strong></p>
                    <ul>
                      <li>Phone: ${customer.phone}</li>
                      <li>Total Amount: ₹${customer.totalAmount.toLocaleString()}</li>
                      <li>Received: ₹${customer.receivedAmount.toLocaleString()}</li>
                      <li><strong style="color: ${hasPendingDues ? "#dc2626" : "#16a34a"};">
                        ${hasPendingDues ? `Pending: ₹${balanceAmount.toLocaleString()}` : "All Paid ✓"}
                      </strong></li>
                    </ul>
                  </div>
                  ${hasPendingDues ? "<p style=\"color: #dc2626;\"><strong>Please collect the pending payment before check-out.</strong></p>" : "<p style=\"color: #16a34a;\">All payments have been received.</p>"}
                  <p>Best regards,<br>Devlata Villa Management System</p>
                </div>
              `;
              
              await sendEmailNotification(
                userData.email,
                `Check-out Reminder: ${customer.name} - ${hasPendingDues ? "Payment Pending" : "All Clear"}`,
                emailContent
              );
            }
          }
        }
      }

      console.log("Check-out reminder scheduler completed successfully");
      return;
    } catch (error) {
      console.error("Error in check-out reminder scheduler:", error);
      throw error;
    }
  }
);

// Function 3: New Lead Notification (Firestore Trigger)
export const onNewLeadCreated = onDocumentCreated(
  {
    document: "leads/{leadId}",
    database: DATABASE_ID,  // ← ADD THIS
  },
  async (event) => {
    console.log("New lead created, sending notifications...");

    try {
      const lead = event.data?.data();
      const leadId = event.params.leadId;

      if (!lead) {
        console.error("No lead data found");
        return;
      }

      // Get all users with leads.view permission
      const usersWithPermission = await getUsersWithPermission("leads.view");

      // Create notification for all users with permission
      for (const userId of usersWithPermission) {
        await createNotification(
          userId,
          "new_lead",
          "New Lead Received",
          `${lead.name} from ${lead.source} - ${lead.phone}`,
          {
            leadId: leadId,
            leadName: lead.name,
            leadPhone: lead.phone,
            leadEmail: lead.email,
            leadSource: lead.source,
            checkInDate: lead.checkInDate,
            checkOutDate: lead.checkOutDate,
          },
          `/leads/${leadId}`,
          "high"
        );
      }

      // Send email to staff
      for (const userId of usersWithPermission) {
        const userDoc = await db.collection("users").doc(userId).get();
        const userData = userDoc.data();
        
        if (userData?.email) {
          const emailContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #007baf;">New Lead Received! 🎯</h2>
              <p>Dear ${userData.name},</p>
              <p>A new booking inquiry has been received:</p>
              <div style="background: #f0f9ff; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #007baf;">
                <p><strong>Lead Details:</strong></p>
                <ul>
                  <li><strong>Name:</strong> ${lead.name}</li>
                  <li><strong>Phone:</strong> ${lead.phone}</li>
                  <li><strong>Email:</strong> ${lead.email}</li>
                  <li><strong>Source:</strong> ${lead.source}</li>
                  ${lead.checkInDate ? `<li><strong>Desired Check-in:</strong> ${lead.checkInDate}</li>` : ""}
                  ${lead.checkOutDate ? `<li><strong>Desired Check-out:</strong> ${lead.checkOutDate}</li>` : ""}
                  ${lead.numberOfGuests ? `<li><strong>Guests:</strong> ${lead.numberOfGuests}</li>` : ""}
                  ${lead.budget ? `<li><strong>Budget:</strong> ₹${lead.budget.toLocaleString()}</li>` : ""}
                </ul>
              </div>
              ${lead.notes ? `<div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p><strong>Notes:</strong></p>
                <p>${lead.notes}</p>
              </div>` : ""}
              <p><strong>Action Required:</strong> Please follow up with this lead as soon as possible.</p>
              <p>Best regards,<br>Devlata Villa Management System</p>
            </div>
          `;
          
          await sendEmailNotification(
            userData.email,
            `New Lead: ${lead.name} - ${lead.source}`,
            emailContent
          );
        }
      }

      console.log("New lead notifications sent successfully");
      return;
    } catch (error) {
      console.error("Error sending new lead notifications:", error);
      throw error;
    }
  }
);

// Function 4: Booking Created Notification
export const onBookingCreated = onDocumentCreated(
  {
    document: "customers/{customerId}",
    database: DATABASE_ID,  // ← ADD THIS
  },
  async (event) => {
    console.log("New booking created, sending notifications...");

    try {
      const customer = event.data?.data();
      const customerId = event.params.customerId;

      if (!customer) {
        console.error("No customer data found");
        return;
      }

      const usersWithPermission = await getUsersWithPermission("customers.view");

      for (const userId of usersWithPermission) {
        await createNotification(
          userId,
          "booking_created",
          "New Booking Created",
          `${customer.name} - ${customer.phone}`,
          {
            customerId: customerId,
            customerName: customer.name,
            checkInDate: customer.checkIn.toDate().toISOString(),
            checkOutDate: customer.checkOut.toDate().toISOString(),
          },
          `/customers/${customerId}`,
          "medium"
        );
      }

      console.log("Booking created notifications sent successfully");
      return;
    } catch (error) {
      console.error("Error sending booking created notifications:", error);
      throw error;
    }
  }
);

// Function 5: Booking Cancelled Notification
export const onBookingCancelled = onDocumentUpdated(
  {
    document: "customers/{customerId}",
    database: DATABASE_ID,  // ← ADD THIS
  },
  async (event) => {
    const before = event.data?.before.data();
    const after = event.data?.after.data();

    if (!before || !after) {
      return;
    }

    // Check if status changed to cancelled
    if (before.status !== "cancelled" && after.status === "cancelled") {
      console.log("Booking cancelled, sending notifications...");

      try {
        const customerId = event.params.customerId;
        const usersWithPermission = await getUsersWithPermission("customers.view");

        for (const userId of usersWithPermission) {
          await createNotification(
            userId,
            "booking_cancelled",
            "Booking Cancelled",
            `${after.name}'s booking has been cancelled`,
            {
              customerId: customerId,
              customerName: after.name,
              refundAmount: after.refundAmount || 0,
            },
            `/customers/${customerId}`,
            "medium"
          );
        }

        console.log("Booking cancelled notifications sent successfully");
        return;
      } catch (error) {
        console.error("Error sending booking cancelled notifications:", error);
        throw error;
      }
    }

    return;
  }
);

// Function 6: Clean up expired notifications (Daily at 2 AM)
export const cleanupExpiredNotifications = onSchedule(
  {
    schedule: "0 2 * * *",
    timeZone: "Asia/Kolkata",
  },
  async (event) => {
    console.log("Cleaning up expired notifications...");

    try {
      const now = admin.firestore.Timestamp.now();
      const expiredSnapshot = await db
        .collection("notifications")
        .where("expiresAt", "<=", now)
        .get();

      const batch = db.batch();
      expiredSnapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });

      await batch.commit();
      console.log(`Deleted ${expiredSnapshot.size} expired notifications`);
      return;
    } catch (error) {
      console.error("Error cleaning up expired notifications:", error);
      throw error;
    }
  }
);