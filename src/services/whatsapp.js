const config = require('../config');

const API_BASE = `${config.whatsapp.apiBase}/${config.whatsapp.apiVersion}`;

async function sendMessage(to, text) {
  const url = `${API_BASE}/${config.whatsapp.phoneNumberId}/messages`;

  const body = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: to,
    type: 'text',
    text: { preview_url: false, body: text },
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.whatsapp.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const err = await response.text();
    console.error('WhatsApp send error:', err);
    throw new Error(`WhatsApp API error: ${response.status}`);
  }

  return response.json();
}

async function sendTemplateMessage(to, templateName, components) {
  const url = `${API_BASE}/${config.whatsapp.phoneNumberId}/messages`;

  const body = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: to,
    type: 'template',
    template: {
      name: templateName,
      language: { code: 'en' },
      components: components,
    },
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.whatsapp.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const err = await response.text();
    console.error('WhatsApp template send error:', err);
    throw new Error(`WhatsApp API error: ${response.status}`);
  }

  return response.json();
}

function parseIncomingMessage(body) {
  const entry = body?.entry?.[0];
  const change = entry?.changes?.[0];
  const message = change?.value?.messages?.[0];

  if (!message) return null;

  const phone = message.from;
  const text = message.text?.body?.trim();
  const msgId = message.id;
  const timestamp = message.timestamp;

  if (!text) return null;

  return { phone, text, msgId, timestamp };
}

module.exports = { sendMessage, sendTemplateMessage, parseIncomingMessage };
