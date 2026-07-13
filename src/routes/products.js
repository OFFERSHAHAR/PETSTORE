const express = require('express');
const router = express.Router();
const db = require('../models/db');
const { v4: uuidv4 } = require('uuid');

router.get('/', (req, res) => {
  const { query } = req.query;
  const products = query ? db.searchProducts(query) : db.listProducts();
  res.json(products);
});

router.get('/categories', (req, res) => {
  res.json(db.listCategories());
});

router.get('/:id', (req, res) => {
  const product = db.getProduct(req.params.id);
  if (!product) return res.status(404).json({ error: 'Product not found' });
  res.json(product);
});

router.post('/', (req, res) => {
  const { name, category, price, stock, description } = req.body;
  if (!name || !category || !price) {
    return res.status(400).json({ error: 'name, category, and price are required' });
  }
  const { getDatabase } = require('../database');
  const db2 = getDatabase();
  const id = uuidv4();
  db2.prepare(`
    INSERT INTO products (id, name, category, price, stock, description)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, name, category, price, stock || 0, description || null);
  res.status(201).json(db.getProduct(id));
});

router.put('/:id', (req, res) => {
  const { name, category, price, stock, description, active } = req.body;
  const { getDatabase } = require('../database');
  const db2 = getDatabase();

  const existing = db.getProduct(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Product not found' });

  db2.prepare(`
    UPDATE products SET name = COALESCE(?, name), category = COALESCE(?, category),
    price = COALESCE(?, price), stock = COALESCE(?, stock),
    description = COALESCE(?, description), active = COALESCE(?, active)
    WHERE id = ?
  `).run(name || null, category || null, price || null, stock != null ? stock : null, description ?? null, active != null ? (active ? 1 : 0) : null, req.params.id);

  res.json(db.getProduct(req.params.id));
});

module.exports = router;
