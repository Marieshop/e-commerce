import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.resolve(process.cwd(), 'database.sqlite');
const db = new Database(dbPath);

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    price REAL NOT NULL,
    cost_price REAL DEFAULT 0, -- Added for profit calculation
    description TEXT,
    images TEXT, -- JSON array of image paths
    stock INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER,
    quantity INTEGER,
    customer_info TEXT, -- JSON object
    total_amount REAL,
    date DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id)
  );

  CREATE TABLE IF NOT EXISTS expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    description TEXT NOT NULL,
    amount REAL NOT NULL,
    category TEXT DEFAULT 'Other', -- e.g., Transport, Purchase, etc.
    date DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS income (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source TEXT NOT NULL, -- e.g., 'Sale', 'Service', etc.
    amount REAL NOT NULL,
    description TEXT,
    date DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS stock_movements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER,
    type TEXT CHECK(type IN ('in', 'out')),
    quantity INTEGER,
    date DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id)
  );
`);

// Migration: Add cost_price if it doesn't exist
const tableInfo = db.prepare("PRAGMA table_info(products)").all() as any[];
const hasCostPrice = tableInfo.some(col => col.name === 'cost_price');
if (!hasCostPrice) {
  db.exec("ALTER TABLE products ADD COLUMN cost_price REAL DEFAULT 0");
}

const ordersInfo = db.prepare("PRAGMA table_info(orders)").all() as any[];
const hasTotalAmount = ordersInfo.some(col => col.name === 'total_amount');
if (!hasTotalAmount) {
  db.exec("ALTER TABLE orders ADD COLUMN total_amount REAL");
}

// Seed initial data if empty
const productCount = db.prepare('SELECT COUNT(*) as count FROM products').get() as { count: number };
if (productCount.count === 0) {
  const insertProduct = db.prepare(`
    INSERT INTO products (name, category, price, cost_price, description, images, stock)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const products = [
    ['Classic School Backpack', 'Abanyeshuri', 25000, 15000, 'Durable backpack for students with multiple compartments.', JSON.stringify(['https://picsum.photos/seed/bag1/400/400']), 50],
    ['Elegant Leather Handbag', 'Abakobwa', 45000, 28000, 'Stylish leather handbag for ladies.', JSON.stringify(['https://picsum.photos/seed/bag2/400/400']), 30],
    ['Urban Fashion Sling Bag', 'Urubyiruko', 15000, 8000, 'Trendy sling bag for youth fashion.', JSON.stringify(['https://picsum.photos/seed/bag3/400/400']), 100],
    ['Professional Laptop Briefcase', 'Abagabo', 55000, 35000, 'Sleek briefcase for professionals.', JSON.stringify(['https://picsum.photos/seed/bag4/400/400']), 20],
    ['Modern Tote Bag', 'Abagore', 35000, 22000, 'Spacious tote bag for everyday use.', JSON.stringify(['https://picsum.photos/seed/bag5/400/400']), 40]
  ];

  for (const p of products) {
    insertProduct.run(...p);
  }
}

export default db;
