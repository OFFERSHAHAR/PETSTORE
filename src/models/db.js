const { getDatabase } = require('../database');
const { v4: uuidv4 } = require('uuid');

// ─── Products ───────────────────────────────────────────
function searchProducts(query) {
  const db = getDatabase();
  const like = `%${query}%`;
  return db.prepare(`
    SELECT * FROM products
    WHERE active = 1
      AND (name LIKE ? OR category LIKE ? OR description LIKE ?)
    ORDER BY category, name
  `).all(like, like, like);
}

function getProduct(id) {
  const db = getDatabase();
  return db.prepare('SELECT * FROM products WHERE id = ? AND active = 1').get(id);
}

function listProducts() {
  const db = getDatabase();
  return db.prepare('SELECT * FROM products WHERE active = 1 ORDER BY category, name').all();
}

function listCategories() {
  const db = getDatabase();
  return db.prepare('SELECT DISTINCT category FROM products WHERE active = 1 ORDER BY category').all();
}

function updateProductStock(id, quantity) {
  const db = getDatabase();
  return db.prepare('UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?').run(quantity, id, quantity);
}

// ─── Customers ──────────────────────────────────────────
function getCustomer(phone) {
  const db = getDatabase();
  return db.prepare('SELECT * FROM customers WHERE phone = ?').get(phone);
}

function upsertCustomer(phone, name, address) {
  const db = getDatabase();
  const existing = getCustomer(phone);
  if (existing) {
    db.prepare('UPDATE customers SET name = ?, address = COALESCE(?, address) WHERE phone = ?')
      .run(name, address || null, phone);
    return getCustomer(phone);
  }
  db.prepare('INSERT INTO customers (phone, name, address) VALUES (?, ?, ?)')
    .run(phone, name, address || null);
  return getCustomer(phone);
}

function listCustomers() {
  const db = getDatabase();
  return db.prepare('SELECT * FROM customers ORDER BY created_at DESC').all();
}

// ─── Orders ─────────────────────────────────────────────
function createOrder(customerPhone, items, deliveryAddress, notes) {
  const db = getDatabase();
  const orderId = uuidv4();
  const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const parsed = JSON.stringify(items.map(i => ({ product_id: i.product_id, name: i.name, quantity: i.quantity, price: i.price })));

  db.prepare(`
    INSERT INTO orders (id, customer_phone, items, total, delivery_address, notes)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(orderId, customerPhone, parsed, total, deliveryAddress || null, notes || null);

  for (const item of items) {
    updateProductStock(item.product_id, item.quantity);
  }

  return getOrder(orderId);
}

function getOrder(id) {
  const db = getDatabase();
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
  if (order) order.items = JSON.parse(order.items);
  return order;
}

function getOrdersByCustomer(phone) {
  const db = getDatabase();
  const orders = db.prepare('SELECT * FROM orders WHERE customer_phone = ? ORDER BY created_at DESC').all();
  return orders.map(o => ({ ...o, items: JSON.parse(o.items) }));
}

function listOrders(status) {
  const db = getDatabase();
  let query = 'SELECT * FROM orders';
  const params = [];
  if (status) {
    query += ' WHERE status = ?';
    params.push(status);
  }
  query += ' ORDER BY created_at DESC';
  return db.prepare(query).all(...params).map(o => ({ ...o, items: JSON.parse(o.items) }));
}

function updateOrderStatus(id, status) {
  const db = getDatabase();
  return db.prepare("UPDATE orders SET status = ?, updated_at = datetime('now') WHERE id = ?").run(status, id);
}

// ─── Conversations ──────────────────────────────────────
function saveMessage(phone, role, content) {
  const db = getDatabase();
  const id = uuidv4();
  db.prepare('INSERT INTO conversations (id, customer_phone, role, content) VALUES (?, ?, ?, ?)')
    .run(id, phone, role, content);
  return id;
}

function getConversationHistory(phone, limit = 20) {
  const db = getDatabase();
  return db.prepare(`
    SELECT role, content FROM conversations
    WHERE customer_phone = ?
    ORDER BY created_at DESC
    LIMIT ?
  `).all(phone, limit).reverse();
}

module.exports = {
  searchProducts,
  getProduct,
  listProducts,
  listCategories,
  updateProductStock,
  getCustomer,
  upsertCustomer,
  listCustomers,
  createOrder,
  getOrder,
  getOrdersByCustomer,
  listOrders,
  updateOrderStatus,
  saveMessage,
  getConversationHistory,
};
