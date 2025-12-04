import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// Send user creation email with temporary password
export async function sendUserCreationEmail(
  email: string,
  name: string,
  tempPassword: string,
  roleName: string
) {
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: email,
    subject: "Welcome to Devlata Villa - Your Account Has Been Created",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #171717; color: white; padding: 20px; text-align: center; }
            .content { background: #f9f9f9; padding: 30px; }
            .credentials {
              background: white;
              border: 2px solid #171717;
              border-radius: 8px;
              padding: 20px;
              margin: 20px 0;
            }
            .credential-row {
              padding: 10px 0;
              border-bottom: 1px solid #eee;
            }
            .credential-row:last-child {
              border-bottom: none;
            }
            .credential-label {
              font-weight: bold;
              color: #666;
            }
            .credential-value {
              font-size: 18px;
              color: #171717;
              font-family: 'Courier New', monospace;
            }
            .warning {
              background: #fff3cd;
              border: 1px solid #ffc107;
              padding: 15px;
              border-radius: 5px;
              margin: 20px 0;
            }
            .button {
              display: inline-block;
              padding: 12px 30px;
              background: #171717;
              color: white !important;
              text-decoration: none;
              border-radius: 5px;
              margin: 20px 0;
            }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Devlata Villa</h1>
            </div>
            <div class="content">
              <h2>Welcome, ${name}!</h2>
              <p>Your account has been created successfully. You can now access the Devlata Villa management system with the following credentials:</p>
              
              <div class="credentials">
                <div class="credential-row">
                  <div class="credential-label">Email:</div>
                  <div class="credential-value">${email}</div>
                </div>
                <div class="credential-row">
                  <div class="credential-label">Temporary Password:</div>
                  <div class="credential-value">${tempPassword}</div>
                </div>
                <div class="credential-row">
                  <div class="credential-label">Role:</div>
                  <div class="credential-value">${roleName}</div>
                </div>
              </div>

              <div class="warning">
                <strong>⚠️ Important Security Notice:</strong>
                <ul>
                  <li>This is a temporary password for first-time login</li>
                  <li>Please change your password immediately after logging in</li>
                  <li>Use the "Forgot Password" feature to set a new secure password</li>
                  <li>Do not share your credentials with anyone</li>
                </ul>
              </div>

              <div style="text-align: center;">
                <a href="${process.env.APP_URL}/login" class="button">Login Now</a>
              </div>

              <p>If you have any questions, please contact your system administrator.</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} Devlata Villa. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  });
}

// Send role change notification
export async function sendRoleChangeEmail(
  email: string,
  name: string,
  oldRole: string,
  newRole: string
) {
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: email,
    subject: "Your Role Has Been Updated - Devlata Villa",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #171717; color: white; padding: 20px; text-align: center; }
            .content { background: #f9f9f9; padding: 30px; }
            .role-change {
              background: white;
              border-left: 4px solid #171717;
              padding: 15px;
              margin: 20px 0;
            }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Devlata Villa</h1>
            </div>
            <div class="content">
              <h2>Hello ${name},</h2>
              <p>Your user role has been updated by the system administrator.</p>
              
              <div class="role-change">
                <p><strong>Previous Role:</strong> ${oldRole}</p>
                <p><strong>New Role:</strong> ${newRole}</p>
              </div>

              <p><strong>Important:</strong> Please log out and log back in for the changes to take effect.</p>
              
              <p>Your new role may have different permissions and access levels. If you have questions about your new permissions, please contact your administrator.</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} Devlata Villa. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  });
}

// Send account status change notification
export async function sendAccountStatusEmail(
  email: string,
  name: string,
  active: boolean
) {
  const status = active ? "Activated" : "Deactivated";
  const message = active
    ? "Your account has been activated. You can now log in to the system."
    : "Your account has been deactivated. You will not be able to log in until it is reactivated by an administrator.";

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: email,
    subject: `Account ${status} - Devlata Villa`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #171717; color: white; padding: 20px; text-align: center; }
            .content { background: #f9f9f9; padding: 30px; }
            .status-box {
              background: ${active ? "#d4edda" : "#f8d7da"};
              border: 1px solid ${active ? "#c3e6cb" : "#f5c6cb"};
              color: ${active ? "#155724" : "#721c24"};
              padding: 15px;
              border-radius: 5px;
              margin: 20px 0;
              text-align: center;
            }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Devlata Villa</h1>
            </div>
            <div class="content">
              <h2>Hello ${name},</h2>
              
              <div class="status-box">
                <h3>Account ${status}</h3>
              </div>

              <p>${message}</p>
              
              <p>If you have questions about your account status, please contact your system administrator.</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} Devlata Villa. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  });
}

export async function sendOTPEmail(email: string, otp: string, purpose: string) {
  const subject =
    purpose === "email_verification"
      ? "Verify Your Email - Devlata Villa"
      : purpose === "password_reset"
      ? "Reset Your Password - Devlata Villa"
      : "Login Verification - Devlata Villa";

  const message =
    purpose === "email_verification"
      ? `Your email verification code is: <strong>${otp}</strong>. This code will expire in 10 minutes.`
      : purpose === "password_reset"
      ? `Your password reset code is: <strong>${otp}</strong>. This code will expire in 10 minutes.`
      : `Your login verification code is: <strong>${otp}</strong>. This code will expire in 10 minutes.`;

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: email,
    subject,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #171717; color: white; padding: 20px; text-align: center; }
            .content { background: #f9f9f9; padding: 30px; }
            .otp-code { 
              font-size: 32px; 
              font-weight: bold; 
              color: #171717; 
              text-align: center;
              padding: 20px;
              background: white;
              border: 2px dashed #171717;
              border-radius: 8px;
              margin: 20px 0;
              letter-spacing: 8px;
            }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Devlata Villa</h1>
            </div>
            <div class="content">
              <h2>Hello!</h2>
              <p>${message}</p>
              <div class="otp-code">${otp}</div>
              <p><strong>Do not share this code with anyone.</strong></p>
              <p>If you didn't request this code, please ignore this email.</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} Devlata Villa. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  });
}

export async function sendPasswordResetEmail(email: string, resetUrl: string) {
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: email,
    subject: "Reset Your Password - Devlata Villa",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #171717; color: white; padding: 20px; text-align: center; }
            .content { background: #f9f9f9; padding: 30px; }
            .button {
              display: inline-block;
              padding: 12px 30px;
              background: #171717;
              color: white !important;
              text-decoration: none;
              border-radius: 5px;
              margin: 20px 0;
            }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Devlata Villa</h1>
            </div>
            <div class="content">
              <h2>Password Reset Request</h2>
              <p>You requested to reset your password. Click the button below to proceed:</p>
              <div style="text-align: center;">
                <a href="${resetUrl}" class="button">Reset Password</a>
              </div>
              <p><small>Or copy this link: <a href="${resetUrl}">${resetUrl}</a></small></p>
              <p>This link will expire in 10 minutes.</p>
              <p><strong>If you didn't request this, please ignore this email.</strong></p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} Devlata Villa. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  });
}

export async function sendCancellationEmail(
  email: string,
  name: string,
  bookingId: string,
  checkIn: any,
  checkOut: any,
  originalAmount: number,
  refundAmount: number,
  remainingBalance: number
) {
  const formatDate = (date: any) => {
    const d = date instanceof Date ? date : date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: email,
    subject: "Booking Cancellation Confirmation - Devlata Villa",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #dc2626; color: white; padding: 20px; text-align: center; }
            .content { background: #f9f9f9; padding: 30px; }
            .info-box {
              background: white;
              border: 2px solid #e5e7eb;
              border-radius: 8px;
              padding: 20px;
              margin: 20px 0;
            }
            .info-row {
              padding: 10px 0;
              border-bottom: 1px solid #eee;
              display: flex;
              justify-content: space-between;
            }
            .info-row:last-child {
              border-bottom: none;
            }
            .info-label {
              font-weight: bold;
              color: #666;
            }
            .info-value {
              color: #171717;
            }
            .refund-amount {
              font-size: 24px;
              font-weight: bold;
              color: #dc2626;
              text-align: center;
              padding: 20px;
              background: #fee2e2;
              border-radius: 8px;
              margin: 20px 0;
            }
            .support-box {
              background: #dbeafe;
              border: 1px solid #3b82f6;
              padding: 15px;
              border-radius: 5px;
              margin: 20px 0;
            }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Booking Cancellation</h1>
            </div>
            <div class="content">
              <h2>Dear ${name},</h2>
              <p>Your booking has been successfully cancelled. Below are the details of your cancellation:</p>
              
              <div class="info-box">
                <div class="info-row">
                  <div class="info-label">Booking ID:</div>
                  <div class="info-value">${bookingId.slice(0, 8)}</div>
                </div>
                <div class="info-row">
                  <div class="info-label">Check-In Date:</div>
                  <div class="info-value">${formatDate(checkIn)}</div>
                </div>
                <div class="info-row">
                  <div class="info-label">Check-Out Date:</div>
                  <div class="info-value">${formatDate(checkOut)}</div>
                </div>
                <div class="info-row">
                  <div class="info-label">Total Paid:</div>
                  <div class="info-value">₹${originalAmount.toLocaleString()}</div>
                </div>
              </div>

              <div class="refund-amount">
                Refund Amount: ₹${refundAmount.toLocaleString()}
              </div>

              

              <p>The refund will be processed within 5-7 business days to your original payment method.</p>

              <div class="support-box">
                <strong>Need Help?</strong><br>
                If you have any questions about your cancellation or refund, please contact us at:<br>
                <strong>Email:</strong> support@devlatavilla.com<br>
                <strong>Phone:</strong> +91 98765 43210
              </div>

              <p>We're sorry to see you cancel and hope to serve you again in the future.</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} Devlata Villa. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  });
}