const { sendEmailViaProvider } = require('./providers/email.provider');
const { sendSMSViaProvider } = require('./providers/sms.provider');

const sendSMS = async (to, message) => {
  return sendSMSViaProvider({ to, message });
};

const sendEmail = async (to, subject, htmlContent) => {
  return sendEmailViaProvider({ to, subject, htmlContent });
};

const sendOTP = async (user, otp) => {
  const { getStudentOtpTemplate } = require('./emailTemplate.service');
  const message = `Your Shree Dhaneshkumar Jasvantlal Maheta High School password reset OTP is ${otp}. Valid for 15 minutes. Do not share this code with anyone.`;
  
  let targetEmail = user.email;
  let targetPhone = user.phone;

  if (!targetEmail && user.studentProfile?.parents?.length) {
    const parentObj = user.studentProfile.parents[0]?.parent;
    if (parentObj?.email) targetEmail = parentObj.email;
    if (parentObj?.user?.email) targetEmail = parentObj.user.email;
    if (!targetPhone && parentObj?.phone) targetPhone = parentObj.phone;
  }
  if (!targetEmail && user.staffProfile?.email) {
    targetEmail = user.staffProfile.email;
  }

  const html = getStudentOtpTemplate({
    studentName: user.identifier,
    grNumber: user.identifier,
    otp: otp,
  });

  if (targetPhone) {
    sendSMS(targetPhone, message).catch(() => {});
  }
  if (targetEmail) {
    sendEmail(targetEmail, 'DJMHS ERP — Security Verification OTP', html).catch(() => {});
  }
  return true;
};

module.exports = {
  sendSMS,
  sendEmail,
  sendOTP,
};
