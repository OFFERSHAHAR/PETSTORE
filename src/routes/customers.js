const express = require('express');
const router = express.Router();
const db = require('../models/db');

router.get('/', (req, res) => {
  res.json(db.listCustomers());
});

router.get('/:phone', (req, res) => {
  const customer = db.getCustomer(req.params.phone);
  if (!customer) return res.status(404).json({ error: 'Customer not found' });
  res.json(customer);
});

router.post('/', (req, res) => {
  const { phone, name, address } = req.body;
  if (!phone || !name) {
    return res.status(400).json({ error: 'phone and name are required' });
  }
  const customer = db.upsertCustomer(phone, name, address || null);
  res.status(200).json(customer);
});

module.exports = router;
