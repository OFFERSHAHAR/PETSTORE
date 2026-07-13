const express = require('express');
const router = express.Router();
const config = require('../config');
const whatsapp = require('../services/whatsapp');
const agent = require('../services/agent');

router.get('/', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === config.whatsapp.verifyToken) {
    console.log('Webhook verified by Meta');
    res.status(200).send(challenge);
  } else {
    console.warn('Webhook verification failed');
    res.sendStatus(403);
  }
});

router.post('/', async (req, res) => {
  const parsed = whatsapp.parseIncomingMessage(req.body);

  if (!parsed) {
    return res.sendStatus(200);
  }

  console.log(`Message from ${parsed.phone}: "${parsed.text}"`);

  try {
    await whatsapp.sendMessage(parsed.phone, '🐾 תודה על ההודעה! שנייה אחת, אני בודק...');
    const reply = await agent.processMessage(parsed.phone, parsed.text);
    await whatsapp.sendMessage(parsed.phone, reply);
  } catch (err) {
    console.error('Error processing message:', err);
    try {
      await whatsapp.sendMessage(parsed.phone, 'מצטער, נתקלתי בתקלה קטנה. אפשר לנסות שוב בעוד רגע?');
    } catch (_) {}
  }

  res.sendStatus(200);
});

module.exports = router;
