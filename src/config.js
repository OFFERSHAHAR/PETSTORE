require('dotenv').config();

const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  whatsapp: {
    token: process.env.WHATSAPP_TOKEN,
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
    verifyToken: process.env.WHATSAPP_VERIFY_TOKEN || 'petstore-bot-verify',
    apiVersion: process.env.WHATSAPP_API_VERSION || 'v22.0',
    apiBase: 'https://graph.facebook.com',
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
  },
  admin: {
    username: process.env.ADMIN_USERNAME || 'admin',
    password: process.env.ADMIN_PASSWORD || 'petstore123',
  },
};

module.exports = config;
