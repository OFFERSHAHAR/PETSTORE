const app = require('./app');
const config = require('./config');
const { getDatabase } = require('./database');

getDatabase();
console.log('Database initialized');

app.listen(config.port, () => {
  console.log(`Pet Store Bot running on port ${config.port}`);
  console.log(`Admin dashboard: http://localhost:${config.port}/admin`);
  console.log(`Webhook endpoint: POST http://localhost:${config.port}/webhook`);
});
