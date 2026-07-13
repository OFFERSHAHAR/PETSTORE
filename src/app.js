const express = require('express');
const path = require('path');
const expressLayouts = require('express-ejs-layouts');

const webhookRoutes = require('./routes/webhook');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');
const customerRoutes = require('./routes/customers');
const adminRoutes = require('./routes/admin');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '..', 'public')));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '..', 'views'));
app.use(expressLayouts);
app.set('layout', 'layout');

app.use('/webhook', webhookRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/customers', customerRoutes);
app.use('/admin', adminRoutes);

app.get('/store', (req, res) => res.redirect('/'));

app.get('/', (req, res) => {
  res.json({
    service: 'Paws & Claws Pet Store Bot',
    version: '1.0.0',
    endpoints: {
      webhook: 'GET/POST /webhook',
      products: 'GET/POST /api/products',
      orders: 'GET/POST /api/orders',
      admin: 'GET /admin',
    },
  });
});

module.exports = app;
