const { Resend } = require('resend');
const config = require('../../config');

let resendClient = null;

/**
 * Initializes and returns the Resend HTTPS API SDK client.
 */
const getResendClient = () => {
  const apiKey = process.env.RESEND_API_KEY || config.email?.resendApiKey;
  if (apiKey && !resendClient) {
    resendClient = new Resend(apiKey);
  }
  return resendClient;
};

/**
 * Dispatches an email via the official Resend HTTPS API.
 * ZERO SMTP / Nodemailer dependencies are used in this provider.
 */
const sendEmailViaProvider = async ({ to, subject, htmlContent, reqId = '' }) => {
  const reqPrefix = reqId ? `[${reqId}]` : '[OTP]';
  const maskedTo = to ? to.replace(/^(.{2})(.*)(@.*)$/, '$1***$3') : 'none';

  // Check if Resend API Key is configured in backend environment
  const apiKey = process.env.RESEND_API_KEY || config.email?.resendApiKey;
  if (!apiKey) {
    console.error(`${reqPrefix} Provider: RESEND_API | FAILED: RESEND_API_KEY is not configured in backend environment.`);
    return {
      success: false,
      code: 'RESEND_NOT_CONFIGURED',
      error: 'RESEND_API_KEY is not configured in server environment.',
    };
  }

  const resend = getResendClient();
  const fromAddress = process.env.RESEND_FROM_EMAIL || config.email?.from || 'Shree DJM High School <onboarding@resend.dev>';

  try {
    const response = await resend.emails.send({
      from: fromAddress,
      to: [to],
      subject: subject,
      html: htmlContent,
    });

    if (response.error) {
      console.error(`${reqPrefix} Provider: RESEND_API | Recipient: ${maskedTo} | Error:`, response.error);

      let classifiedCode = 'OTP_DELIVERY_FAILED';
      if (response.error.name === 'validation_error') {
        classifiedCode = 'INVALID_RECIPIENT';
      } else if (response.error.name === 'rate_limit_exceeded') {
        classifiedCode = 'RESEND_RATE_LIMITED';
      } else if (response.error.statusCode === 401 || response.error.statusCode === 403) {
        classifiedCode = 'RESEND_AUTH_FAILED';
      }

      return {
        success: false,
        code: classifiedCode,
        error: response.error.message || 'Resend API rejected email dispatch.',
      };
    }

    const messageId = response.data?.id || 'resend_submitted';
    console.log(`${reqPrefix} Provider: RESEND_API | Recipient: ${maskedTo} | Status: SUBMITTED FOR DELIVERY (Message ID: ${messageId})`);

    return {
      success: true,
      channel: 'RESEND_API',
      messageId,
    };
  } catch (err) {
    console.error(`${reqPrefix} Provider: RESEND_API | Recipient: ${maskedTo} | Network Exception: ${err.message}`);
    return {
      success: false,
      code: 'NETWORK_ERROR',
      error: err.message || 'Network exception while connecting to Resend HTTPS API.',
    };
  }
};

module.exports = {
  sendEmailViaProvider,
};
