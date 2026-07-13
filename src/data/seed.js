const { getDatabase } = require('../database');
const { v4: uuidv4 } = require('uuid');

const products = [
  { id: uuidv4(), name: 'Premium Dog Kibble - Chicken', category: 'Dog Food', price: 29.99, stock: 50, description: 'High-protein chicken kibble for adult dogs. Rich in omega-3 for healthy coat.' },
  { id: uuidv4(), name: 'Premium Dog Kibble - Salmon', category: 'Dog Food', price: 34.99, stock: 40, description: 'Grain-free salmon recipe for sensitive stomachs.' },
  { id: uuidv4(), name: 'Puppy Starter Pack', category: 'Dog Food', price: 24.99, stock: 30, description: 'Specially formulated for growing puppies under 12 months.' },
  { id: uuidv4(), name: 'Gourmet Cat Kibble - Tuna', category: 'Cat Food', price: 22.99, stock: 60, description: 'Real tuna first ingredient. Complete nutrition for adult cats.' },
  { id: uuidv4(), name: 'Gourmet Cat Kibble - Salmon', category: 'Cat Food', price: 24.99, stock: 45, description: 'Salmon & brown rice recipe for healthy digestion.' },
  { id: uuidv4(), name: 'Kitten Formula', category: 'Cat Food', price: 19.99, stock: 35, description: 'DHA-rich formula for healthy brain development in kittens.' },
  { id: uuidv4(), name: 'Hamster & Gerbil Mix', category: 'Small Pet Food', price: 9.99, stock: 80, description: 'Fortified seed mix with vitamins and minerals.' },
  { id: uuidv4(), name: 'Rabbit Pellets', category: 'Small Pet Food', price: 12.99, stock: 55, description: 'Timothy hay-based pellets with added vitamin C.' },
  { id: uuidv4(), name: 'Premium Bird Seed Mix', category: 'Bird Food', price: 14.99, stock: 40, description: 'Sunflower seeds, millet, and cracked corn blend.' },
  { id: uuidv4(), name: 'Tropical Fish Flakes', category: 'Fish Food', price: 7.99, stock: 100, description: 'Color-enhancing flakes for tropical freshwater fish.' },
  { id: uuidv4(), name: 'Dog Dental Chews', category: 'Treats', price: 15.99, stock: 70, description: 'Natural dental chews that clean teeth and freshen breath.' },
  { id: uuidv4(), name: 'Cat Tuna Treats', category: 'Treats', price: 6.99, stock: 90, description: 'Freeze-dried tuna flakes cats go crazy for.' },
  { id: uuidv4(), name: 'Large Dog Bed', category: 'Accessories', price: 49.99, stock: 20, description: 'Orthopedic memory foam bed for dogs up to 100 lbs.' },
  { id: uuidv4(), name: 'Cat Scratching Post', category: 'Accessories', price: 34.99, stock: 25, description: 'Sisal rope scratching post with toy attachment.' },
  { id: uuidv4(), name: 'Premium Litter Box', category: 'Accessories', price: 29.99, stock: 30, description: 'Large covered litter box with carbon filter.' },
];

function seed() {
  const db = getDatabase();

  const existing = db.prepare('SELECT COUNT(*) as count FROM products').get();
  if (existing.count > 0) {
    console.log('Database already has data. Skipping seed.');
    return;
  }

  const insert = db.prepare(`
    INSERT INTO products (id, name, category, price, stock, description)
    VALUES (@id, @name, @category, @price, @stock, @description)
  `);

  const insertMany = db.transaction((items) => {
    for (const item of items) {
      insert.run(item);
    }
  });

  insertMany(products);
  console.log(`Seeded ${products.length} products.`);
}

seed();
