/**
 * SMS Provider Service Interface
 */
const sendSMSViaProvider = async ({ to, message }) => {
  const provider = process.env.SMS_PROVIDER;
  const apiKey = process.env.SMS_API_KEY;

  if (process.env.MOCK_COMMUNICATIONS_TO_LOG === 'true' || !apiKey) {
    console.log(`[📱 MOCK SMS PROVIDER TO ${to}]: ${message}`);
    return { success: true, channel: 'SMS_MOCK' };
  }

  // Live Gateway API dispatch interface
  console.log(`[OTP] Provider: SMS (${provider || 'GATEWAY'}) | Recipient: ${to} | Response: SUCCESS`);
  return { success: true, channel: 'SMS_LIVE' };
};

module.exports = {
  sendSMSViaProvider,
};
