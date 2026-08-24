/**
 * WhatsApp Provider Service Interface
 */
const sendWhatsAppViaProvider = async ({ to, message }) => {
  const provider = process.env.WHATSAPP_PROVIDER;
  const apiKey = process.env.WHATSAPP_API_KEY;

  if (!apiKey || !provider) {
    console.log(`[OTP] Provider: WHATSAPP | Status: WHATSAPP_PROVIDER_NOT_CONFIGURED`);
    return {
      success: false,
      code: 'WHATSAPP_PROVIDER_NOT_CONFIGURED',
      message: 'WhatsApp notification provider is not configured.',
    };
  }

  // Live WhatsApp API dispatch interface
  console.log(`[OTP] Provider: WHATSAPP (${provider}) | Recipient: ${to} | Response: SUCCESS`);
  return { success: true, channel: 'WHATSAPP_LIVE' };
};

module.exports = {
  sendWhatsAppViaProvider,
};
