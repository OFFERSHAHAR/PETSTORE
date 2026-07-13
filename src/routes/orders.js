const express = require('express');
const router = express.Router();
const db = require('../models/db');

router.get('/', (req, res) => {
  const { status, phone } = req.query;
  if (phone) return res.json(db.getOrdersByCustomer(phone));
  res.json(db.listOrders(status || null));
});

router.get('/:id', (req, res) => {
  const order = db.getOrder(req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  order.customer = db.getCustomer(order.customer_phone);
  res.json(order);
});

router.post('/', (req, res) => {
  const { customer_phone, items, delivery_address, notes } = req.body;
  if (!customer_phone || !items || !items.length) {
    return res.status(400).json({ error: 'customer_phone and items are required' });
  }
  try {
    const order = db.createOrder(customer_phone, items, delivery_address, notes);
    res.status(201).json(order);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.patch('/:id/status', (req, res) => {
  const { status } = req.body;
  const valid = ['pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'];
  if (!valid.includes(status)) {
    return res.status(400).json({ error: `Status must be one of: ${valid.join(', ')}` });
  }
  const result = db.updateOrderStatus(req.params.id, status);
  if (result.changes === 0) return res.status(404).json({ error: 'Order not found' });
  res.json(db.getOrder(req.params.id));
});

module.exports = router;
