import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

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
              <h1>${process.env.APP_NAME}</h1>
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
              <h1>${process.env.APP_NAME}</h1>
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