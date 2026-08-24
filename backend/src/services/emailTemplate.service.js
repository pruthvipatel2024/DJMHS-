const config = require('../config');

const SCHOOL_NAME = config.schoolName || 'Shree Dhaneshkumar Jasvantlal Maheta High School';
const ESTABLISHED = config.establishedYear || '1959';
const LOCATION = config.location || 'Bhavnagar, Gujarat';
const PORTAL_URL = process.env.FRONTEND_URL || 'https://djmhs-frontend.vercel.app';

/**
 * Base Wrapper for all DJMHS Institutional Emails
 */
const wrapBaseTemplate = (title, contentHtml) => {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 30px 15px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(15, 23, 42, 0.08); border: 1px solid #e2e8f0;">
          
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #1e3a8a 0%, #0f172a 100%); padding: 32px 24px; text-align: center; border-bottom: 4px solid #f59e0b;">
              <div style="font-size: 12px; font-weight: 700; color: #fbbf24; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 8px;">
                ${LOCATION} &bull; EST. ${ESTABLISHED}
              </div>
              <h1 style="margin: 0; color: #ffffff; font-size: 20px; font-weight: 800; line-height: 1.3; text-transform: uppercase; letter-spacing: 0.5px;">
                ${SCHOOL_NAME}
              </h1>
              <div style="font-size: 13px; color: #94a3b8; margin-top: 6px; font-weight: 500;">
                Commerce Stream &bull; Standards 9 to 12 ERP
              </div>
            </td>
          </tr>

          <!-- Content Body -->
          <tr>
            <td style="padding: 32px 28px; background-color: #ffffff;">
              ${contentHtml}
            </td>
          </tr>

          <!-- Official Institutional Footer -->
          <tr>
            <td style="background-color: #f1f5f9; padding: 24px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b; line-height: 1.6;">
              <p style="margin: 0 0 6px 0; font-weight: 600; color: #334155;">
                &copy; ${new Date().getFullYear()} ${SCHOOL_NAME}. All rights reserved.
              </p>
              <p style="margin: 0 0 10px 0;">
                Near Water Tank, Crescent Circle, Bhavnagar, Gujarat - 364001
              </p>
              <div style="margin-top: 12px; font-size: 11px; color: #94a3b8;">
                This is an automated system notification from the DJMHS ERP Gateway. Please do not reply directly to this email.
              </div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};

/**
 * Student Login OTP Email Template
 */
const getStudentOtpTemplate = ({ studentName, grNumber, otp }) => {
  const content = `
    <div style="text-align: center; margin-bottom: 24px;">
      <span style="background-color: #dbeafe; color: #1e40af; font-size: 12px; font-weight: 700; padding: 6px 14px; border-radius: 9999px; text-transform: uppercase; letter-spacing: 1px;">
        Student / Parent Portal Authentication
      </span>
    </div>
    
    <h2 style="margin: 0 0 12px 0; font-size: 20px; color: #0f172a; font-weight: 700; text-align: center;">
      Verification Security OTP Code
    </h2>
    
    <p style="font-size: 15px; color: #475569; line-height: 1.6; margin-bottom: 24px; text-align: center;">
      Hello <strong>${studentName || 'Student'}</strong> (GR Number: <code style="background: #f1f5f9; padding: 2px 6px; border-radius: 4px; color: #1e3a8a;">${grNumber}</code>),<br/>
      Use the following 6-digit One-Time Password (OTP) to sign in to your DJMHS Portal account.
    </p>

    <!-- OTP Code Box -->
    <div style="background: linear-gradient(135deg, #f8fafc 0%, #eff6ff 100%); border: 2px dashed #3b82f6; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
      <div style="font-size: 12px; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 8px;">
        Your 6-Digit OTP Code
      </div>
      <div style="font-size: 36px; font-weight: 800; color: #1e3a8a; letter-spacing: 8px; font-family: monospace;">
        ${otp}
      </div>
      <div style="font-size: 12px; color: #d97706; font-weight: 600; margin-top: 10px;">
        &x23F1; Valid for 5 Minutes &bull; Do not share code
      </div>
    </div>

    <p style="font-size: 13px; color: #64748b; line-height: 1.5; text-align: center; margin-top: 24px;">
      If you did not initiate this OTP login request, please disregard this email or contact the school administration immediately.
    </p>
  `;

  return wrapBaseTemplate('DJMHS Student Portal Verification OTP', content);
};

/**
 * Faculty / Staff Onboarding Credentials Email Template
 */
const getStaffOnboardingTemplate = ({ staffName, empId, designation, department, email, initialPassword }) => {
  const content = `
    <div style="text-align: center; margin-bottom: 20px;">
      <span style="background-color: #dcfce7; color: #166534; font-size: 12px; font-weight: 700; padding: 6px 14px; border-radius: 9999px; text-transform: uppercase; letter-spacing: 1px;">
        Faculty Welcome & Onboarding
      </span>
    </div>

    <h2 style="margin: 0 0 12px 0; font-size: 20px; color: #0f172a; font-weight: 700; text-align: center;">
      Welcome to DJMHS Faculty Team!
    </h2>

    <p style="font-size: 15px; color: #475569; line-height: 1.6; margin-bottom: 24px;">
      Dear <strong>${staffName}</strong>,<br/>
      We are delighted to welcome you to the faculty team of <strong>${SCHOOL_NAME}</strong>. Your institutional ERP account has been successfully created.
    </p>

    <!-- Faculty Details Card -->
    <table width="100%" cellpadding="10" cellspacing="0" style="background-color: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0; margin-bottom: 24px; font-size: 14px;">
      <tr>
        <td style="color: #64748b; font-weight: 600; width: 40%; border-bottom: 1px solid #e2e8f0;">Employee ID:</td>
        <td style="color: #0f172a; font-weight: 700; border-bottom: 1px solid #e2e8f0;">${empId}</td>
      </tr>
      <tr>
        <td style="color: #64748b; font-weight: 600; border-bottom: 1px solid #e2e8f0;">Designation:</td>
        <td style="color: #0f172a; font-weight: 600; border-bottom: 1px solid #e2e8f0;">${designation}</td>
      </tr>
      <tr>
        <td style="color: #64748b; font-weight: 600; border-bottom: 1px solid #e2e8f0;">Department:</td>
        <td style="color: #0f172a; font-weight: 600; border-bottom: 1px solid #e2e8f0;">${department}</td>
      </tr>
      <tr>
        <td style="color: #64748b; font-weight: 600; border-bottom: 1px solid #e2e8f0;">Login Identifier:</td>
        <td style="color: #1e3a8a; font-weight: 700; border-bottom: 1px solid #e2e8f0;">${email}</td>
      </tr>
      <tr>
        <td style="color: #64748b; font-weight: 600;">Initial Password:</td>
        <td style="color: #b45309; font-weight: 700; font-family: monospace; font-size: 16px;">${initialPassword}</td>
      </tr>
    </table>

    <div style="text-align: center; margin: 28px 0;">
      <a href="${PORTAL_URL}/login" target="_blank" style="background-color: #1e3a8a; color: #ffffff; font-weight: 700; font-size: 15px; padding: 14px 28px; border-radius: 8px; text-decoration: none; display: inline-block; shadow: 0 4px 12px rgba(30, 58, 138, 0.25);">
        Sign In to Faculty Portal &rarr;
      </a>
    </div>

    <p style="font-size: 13px; color: #94a3b8; line-height: 1.5; text-align: center;">
      &bull; Security Notice: For your account protection, please change your password upon your initial sign-in.
    </p>
  `;

  return wrapBaseTemplate('DJMHS Faculty Onboarding & Portal Credentials', content);
};

/**
 * Student Admission & Parent Portal Credentials Template
 */
const getStudentAdmissionTemplate = ({ studentName, grNumber, standardName, divisionName, parentName, loginIdentifier, initialPassword }) => {
  const content = `
    <div style="text-align: center; margin-bottom: 20px;">
      <span style="background-color: #fef3c7; color: #92400e; font-size: 12px; font-weight: 700; padding: 6px 14px; border-radius: 9999px; text-transform: uppercase; letter-spacing: 1px;">
        Official Admission Confirmation
      </span>
    </div>

    <h2 style="margin: 0 0 12px 0; font-size: 20px; color: #0f172a; font-weight: 700; text-align: center;">
      Student Admission Confirmed
    </h2>

    <p style="font-size: 15px; color: #475569; line-height: 1.6; margin-bottom: 24px;">
      Respected Parent / Guardian <strong>${parentName || 'Parent'}</strong>,<br/>
      We are pleased to confirm the enrollment of <strong>${studentName}</strong> at <strong>${SCHOOL_NAME}</strong>.
    </p>

    <!-- Admission Record Card -->
    <table width="100%" cellpadding="10" cellspacing="0" style="background-color: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0; margin-bottom: 24px; font-size: 14px;">
      <tr>
        <td style="color: #64748b; font-weight: 600; width: 40%; border-bottom: 1px solid #e2e8f0;">Student Name:</td>
        <td style="color: #0f172a; font-weight: 700; border-bottom: 1px solid #e2e8f0;">${studentName}</td>
      </tr>
      <tr>
        <td style="color: #64748b; font-weight: 600; border-bottom: 1px solid #e2e8f0;">GR Number:</td>
        <td style="color: #1e3a8a; font-weight: 700; border-bottom: 1px solid #e2e8f0;">${grNumber}</td>
      </tr>
      <tr>
        <td style="color: #64748b; font-weight: 600; border-bottom: 1px solid #e2e8f0;">Class & Division:</td>
        <td style="color: #0f172a; font-weight: 600; border-bottom: 1px solid #e2e8f0;">${standardName || 'High School'} &bull; Div ${divisionName || 'A'}</td>
      </tr>
      <tr>
        <td style="color: #64748b; font-weight: 600; border-bottom: 1px solid #e2e8f0;">Portal Login ID:</td>
        <td style="color: #1e3a8a; font-weight: 700; border-bottom: 1px solid #e2e8f0;">${loginIdentifier}</td>
      </tr>
      <tr>
        <td style="color: #64748b; font-weight: 600;">Initial Password:</td>
        <td style="color: #b45309; font-weight: 700; font-family: monospace; font-size: 16px;">${initialPassword}</td>
      </tr>
    </table>

    <div style="text-align: center; margin: 28px 0;">
      <a href="${PORTAL_URL}/login" target="_blank" style="background-color: #15803d; color: #ffffff; font-weight: 700; font-size: 15px; padding: 14px 28px; border-radius: 8px; text-decoration: none; display: inline-block;">
        Open Student & Parent Portal &rarr;
      </a>
    </div>

    <p style="font-size: 13px; color: #64748b; line-height: 1.5; text-align: center;">
      You can track fees, attendance, report cards, and exam timetables directly from your portal dashboard.
    </p>
  `;

  return wrapBaseTemplate('DJMHS Admission Confirmed & Portal Access Details', content);
};

module.exports = {
  getStudentOtpTemplate,
  getStaffOnboardingTemplate,
  getStudentAdmissionTemplate,
};
