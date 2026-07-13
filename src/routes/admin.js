const express = require('express');
const router = express.Router();
const config = require('../config');
const db = require('../models/db');

function basicAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Basic ')) {
    res.set('WWW-Authenticate', 'Basic realm="Pet Store Admin"');
    return res.status(401).send('Authentication required');
  }

  const encoded = auth.split(' ')[1];
  const decoded = Buffer.from(encoded, 'base64').toString('utf-8');
  const [username, password] = decoded.split(':');

  if (username !== config.admin.username || password !== config.admin.password) {
    return res.status(403).send('Invalid credentials');
  }

  next();
}

router.use(basicAuth);

router.get('/', (req, res) => {
  const products = db.listProducts();
  const orders = db.listOrders();
  const customers = db.listCustomers();
  res.render('index', { products, orders, customers });
});

router.get('/products', (req, res) => {
  const products = db.listProducts();
  res.render('products', { products });
});

router.get('/orders', (req, res) => {
  const orders = db.listOrders();
  const ordersWithCustomers = orders.map(o => ({
    ...o,
    customer: db.getCustomer(o.customer_phone),
  }));
  res.render('orders', { orders: ordersWithCustomers });
});

router.get('/customers', (req, res) => {
  const customers = db.listCustomers();
  res.render('customers', { customers });
});

module.exports = router;
