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
 * The `to` address MUST come dynamically from the student's registered parent contact in PostgreSQL.
 * The `from` address MUST come exclusively from RESEND_FROM_EMAIL in the backend environment.
 */
const sendEmailViaProvider = async ({ to, subject, htmlContent, reqId = '' }) => {
  const reqPrefix = reqId ? `[${reqId}]` : '[OTP]';

  // 1. Audit Recipient Address
  if (!to || !to.includes('@')) {
    console.error(`${reqPrefix} Provider: RESEND_API | FAILED: Dynamic recipient address is missing or invalid (${to}).`);
    return {
      success: false,
      code: 'NO_REGISTERED_CONTACT',
      error: 'No valid recipient email address found for student parent contact.',
    };
  }

  const maskedTo = to.replace(/^(.{2})(.*)(@.*)$/, '$1***$3');

  // 2. Check if Resend API Key is configured in backend environment
  const apiKey = process.env.RESEND_API_KEY || config.email?.resendApiKey;
  if (!apiKey) {
    console.error(`${reqPrefix} Provider: RESEND_API | FAILED: RESEND_API_KEY is not configured in backend environment.`);
    return {
      success: false,
      code: 'RESEND_NOT_CONFIGURED',
      error: 'RESEND_API_KEY is not configured in server environment.',
    };
  }

  // 3. Sender Configuration from backend environment RESEND_FROM_EMAIL
  const fromAddress = process.env.RESEND_FROM_EMAIL || config.email?.resendFromEmail;
  if (!fromAddress) {
    console.error(`${reqPrefix} Provider: RESEND_API | FAILED: RESEND_FROM_EMAIL is not configured in backend environment.`);
    return {
      success: false,
      code: 'INVALID_SENDER',
      error: 'RESEND_FROM_EMAIL environment variable is not configured on server.',
    };
  }

  const resend = getResendClient();

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
    console.log(`${reqPrefix} Provider: RESEND_API | Recipient: ${maskedTo} | Status: ACCEPTED BY RESEND (Message ID: ${messageId})`);

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
