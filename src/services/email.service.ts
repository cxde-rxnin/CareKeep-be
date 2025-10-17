import nodemailer from "nodemailer";
import { EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS, EMAIL_FROM } from "../config/env";

// --- Email Transport Setup with Logging ---
console.log('📧 [EMAIL SERVICE] Initializing transporter with:', {
  host: EMAIL_HOST,
  port: EMAIL_PORT,
  user: EMAIL_USER ? '***configured***' : 'MISSING',
  from: EMAIL_FROM
});

const transporter = nodemailer.createTransport({
  host: EMAIL_HOST,
  port: parseInt(EMAIL_PORT),
  secure: true,
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
});

transporter
  .verify()
  .then(() => console.log('✅ [EMAIL SERVICE] Transporter verified and ready'))
  .catch(err => console.error('❌ [EMAIL SERVICE] Transporter verification failed:', err));

export const sendOTPEmail = async (email: string, otp: string, hospitalName: string) => {
  console.log('📧 [EMAIL SERVICE] Preparing OTP email', { to: email, hospitalName });

  const mailOptions = {
    from: EMAIL_FROM,
    to: email,
    subject: 'CareKeep - Email Verification',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #065f46; margin-bottom: 10px;">CareKeep</h1>
          <p style="color: #6b7280; font-size: 16px;">Medical Records Management System</p>
        </div>
        <div style="background-color: #f9fafb; padding: 30px; border-radius: 10px; margin-bottom: 20px;">
          <h2 style="color: #065f46; margin-bottom: 20px;">Email Verification</h2>
          <p style="color: #374151; font-size: 16px; margin-bottom: 20px;">Hello ${hospitalName},</p>
          <p style="color: #374151; font-size: 16px; margin-bottom: 20px;">Thank you for registering with CareKeep. Use the OTP below:</p>
          <div style="text-align: center; margin: 30px 0;">
            <div style="background-color: #065f46; color: white; font-size: 32px; font-weight: bold; padding: 20px; border-radius: 8px; letter-spacing: 8px;">${otp}</div>
          </div>
          <p style="color: #374151; font-size: 14px;">This OTP expires in 10 minutes.</p>
        </div>
        <div style="text-align: center; color: #6b7280; font-size: 12px;">
          <p>© 2025 CareKeep. All rights reserved.</p>
          <p>This is an automated message, do not reply.</p>
        </div>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ [EMAIL SERVICE] OTP email sent', { messageId: info.messageId, response: info.response });
    return info;
  } catch (err: any) {
    console.error('❌ [EMAIL SERVICE] Failed to send OTP email', { error: err.message, stack: err.stack });
    throw err;
  }
};

export const sendBackupEmail = async (
  email: string,
  hospitalName: string,
  filename: string,
  patientCount: number,
  csvContent: string | Buffer
) => {
  const mailOptions = {
    from: EMAIL_FROM,
    to: email,
    subject: 'CareKeep - Backup Report',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #065f46; margin-bottom: 10px;">CareKeep</h1>
          <p style="color: #6b7280; font-size: 16px;">Medical Records Management System</p>
        </div>
        <div style="background-color: #f9fafb; padding: 30px; border-radius: 10px; margin-bottom: 20px;">
          <h2 style="color: #065f46; margin-bottom: 20px;">Backup Complete</h2>
          <p style="color: #374151; font-size: 16px;">Dear ${hospitalName},</p>
          <p style="color: #374151; font-size: 16px;">Your scheduled backup has completed successfully.</p>
          <div style="background: #fff; padding: 16px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 4px 0;"><strong>Date:</strong> ${new Date().toLocaleString()}</p>
            <p style="margin: 4px 0;"><strong>Patient Records:</strong> ${patientCount}</p>
            <p style="margin: 4px 0; color:#059669; font-weight:bold;">Status: ✓ Completed</p>
          </div>
          <p style="color: #374151; font-size: 14px;">Backup file attached. Store securely.</p>
        </div>
        <div style="text-align: center; color: #6b7280; font-size: 12px;">
          <p>© 2025 CareKeep. All rights reserved.</p>
          <p>Automated message, do not reply.</p>
        </div>
      </div>
    `,
    attachments: [
      { filename, content: csvContent }
    ]
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ [EMAIL SERVICE] Backup email sent', { messageId: info.messageId });
    return info;
  } catch (err: any) {
    console.error('❌ [EMAIL SERVICE] Failed to send backup email', { error: err.message });
    throw err;
  }
};

export const generateOTP = (): string => Math.floor(100000 + Math.random() * 900000).toString();
