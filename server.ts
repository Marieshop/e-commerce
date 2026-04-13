import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import db from './db';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure upload directory exists
const uploadDir = path.join(process.cwd(), 'public/uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());
  app.use('/uploads', express.static(path.join(process.cwd(), 'public/uploads')));

  // Multer setup for image uploads
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, uniqueSuffix + path.extname(file.originalname));
    }
  });
  const upload = multer({ 
    storage,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
  });

  // API Routes
  
  // Products
  app.get('/api/products', (req, res) => {
    try {
      const products = db.prepare('SELECT * FROM products').all();
      res.json(products.map((p: any) => {
        let images = [];
        try {
          images = p.images ? JSON.parse(p.images) : [];
        } catch (e) {
          console.error(`Error parsing images for product ${p.id}:`, e);
        }
        return { ...p, images };
      }));
    } catch (error) {
      console.error('Error fetching products:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.get('/api/products/:id', (req, res) => {
    try {
      const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id) as any;
      if (product) {
        let images = [];
        try {
          images = product.images ? JSON.parse(product.images) : [];
        } catch (e) {
          console.error(`Error parsing images for product ${product.id}:`, e);
        }
        res.json({ ...product, images });
      } else {
        res.status(404).json({ error: 'Product not found' });
      }
    } catch (error) {
      console.error('Error fetching product:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.post('/api/products', upload.array('images'), (req: any, res) => {
    try {
      console.log('POST /api/products - Body:', req.body);
      console.log('POST /api/products - Files:', req.files?.length || 0);

      const { name, category, description } = req.body;
      const price = parseFloat(req.body.price) || 0;
      const cost_price = parseFloat(req.body.cost_price) || 0;
      const stock = parseInt(req.body.stock) || 0;
      
      const images = (req.files as any[] || []).map(f => `/uploads/${f.filename}`);
      
      const result = db.prepare(`
        INSERT INTO products (name, category, price, cost_price, description, images, stock)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(name, category, price, cost_price, description, JSON.stringify(images), stock);
      
      res.json({ id: result.lastInsertRowid });
    } catch (error) {
      console.error('Error creating product:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.put('/api/products/:id', upload.array('images'), (req: any, res) => {
    try {
      console.log(`PUT /api/products/${req.params.id} - Body:`, req.body);
      console.log(`PUT /api/products/${req.params.id} - Files:`, req.files?.length || 0);

      const { name, category, description } = req.body;
      const price = parseFloat(req.body.price) || 0;
      const cost_price = parseFloat(req.body.cost_price) || 0;
      const stock = parseInt(req.body.stock) || 0;
      
      let images = [];
      if (req.body.existingImages) {
        try {
          images = typeof req.body.existingImages === 'string' ? JSON.parse(req.body.existingImages) : req.body.existingImages;
          if (!Array.isArray(images)) images = [images];
        } catch (e) {
          console.error('Error parsing existingImages from body:', e);
        }
      }
      
      if (req.files && req.files.length > 0) {
        const newImages = (req.files as any[]).map(f => `/uploads/${f.filename}`);
        images = [...images, ...newImages];
      }

      db.prepare(`
        UPDATE products SET name = ?, category = ?, price = ?, cost_price = ?, description = ?, stock = ?, images = ?
        WHERE id = ?
      `).run(name, category, price, cost_price, description, stock, JSON.stringify(images), req.params.id);
      
      res.json({ success: true });
    } catch (error) {
      console.error('Error updating product:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.delete('/api/products/:id', (req, res) => {
    db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  });

  // Orders
  app.post('/api/orders', (req, res) => {
    const { product_id, quantity, customer_info } = req.body;
    
    const product = db.prepare('SELECT stock, price, name FROM products WHERE id = ?').get(product_id) as { stock: number, price: number, name: string };
    if (!product || product.stock < quantity) {
      return res.status(400).json({ error: 'Insufficient stock' });
    }

    const totalAmount = product.price * quantity;

    const transaction = db.transaction(() => {
      // Create order
      db.prepare(`
        INSERT INTO orders (product_id, quantity, customer_info, total_amount)
        VALUES (?, ?, ?, ?)
      `).run(product_id, quantity, JSON.stringify(customer_info), totalAmount);

      // Update stock
      db.prepare('UPDATE products SET stock = stock - ? WHERE id = ?').run(quantity, product_id);

      // Record stock movement
      db.prepare(`
        INSERT INTO stock_movements (product_id, type, quantity)
        VALUES (?, 'out', ?)
      `).run(product_id, quantity);

      // Record income
      db.prepare(`
        INSERT INTO income (source, amount, description)
        VALUES (?, ?, ?)
      `).run('Sale', totalAmount, `Sale of ${quantity}x ${product.name}`);
    });

    transaction();
    res.json({ success: true });
  });

  app.get('/api/orders', (req, res) => {
    try {
      const orders = db.prepare(`
        SELECT o.*, p.name as product_name 
        FROM orders o 
        JOIN products p ON o.product_id = p.id
        ORDER BY o.date DESC
      `).all();
      res.json(orders.map((o: any) => {
        let customer_info = {};
        try {
          customer_info = o.customer_info ? JSON.parse(o.customer_info) : {};
        } catch (e) {
          console.error(`Error parsing customer_info for order ${o.id}:`, e);
        }
        return { ...o, customer_info };
      }));
    } catch (error) {
      console.error('Error fetching orders:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.delete('/api/orders/:id', (req, res) => {
    try {
      db.prepare('DELETE FROM orders WHERE id = ?').run(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting order:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Stock Movements
  app.get('/api/stock', (req, res) => {
    const movements = db.prepare(`
      SELECT sm.*, p.name as product_name 
      FROM stock_movements sm 
      JOIN products p ON sm.product_id = p.id
      ORDER BY sm.date DESC
    `).all();
    res.json(movements);
  });

  app.post('/api/stock/in', (req, res) => {
    const { product_id, quantity } = req.body;
    
    const product = db.prepare('SELECT name, cost_price FROM products WHERE id = ?').get(product_id) as { name: string, cost_price: number };
    const totalCost = (product?.cost_price || 0) * quantity;

    const transaction = db.transaction(() => {
      db.prepare('UPDATE products SET stock = stock + ? WHERE id = ?').run(quantity, product_id);
      db.prepare(`
        INSERT INTO stock_movements (product_id, type, quantity)
        VALUES (?, 'in', ?)
      `).run(product_id, quantity);

      // Record as expense
      if (totalCost > 0) {
        db.prepare(`
          INSERT INTO expenses (description, amount, category)
          VALUES (?, ?, ?)
        `).run(`Restock: ${quantity}x ${product.name}`, totalCost, 'Purchase');
      }
    });

    transaction();
    res.json({ success: true });
  });

  // Ledger: Expenses
  app.get('/api/expenses', (req, res) => {
    const expenses = db.prepare('SELECT * FROM expenses ORDER BY date DESC').all();
    res.json(expenses);
  });

  app.post('/api/expenses', (req, res) => {
    const { description, category, date } = req.body;
    const amount = parseFloat(req.body.amount) || 0;
    const result = db.prepare(`
      INSERT INTO expenses (description, amount, category, date)
      VALUES (?, ?, ?, COALESCE(?, CURRENT_TIMESTAMP))
    `).run(description, amount, category || 'Other', date || null);
    res.json({ id: result.lastInsertRowid });
  });

  app.delete('/api/expenses/:id', (req, res) => {
    db.prepare('DELETE FROM expenses WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  });

  // Ledger: Income
  app.get('/api/income', (req, res) => {
    const income = db.prepare('SELECT * FROM income ORDER BY date DESC').all();
    res.json(income);
  });

  app.post('/api/income', (req, res) => {
    const { source, description, date } = req.body;
    const amount = parseFloat(req.body.amount) || 0;
    const result = db.prepare(`
      INSERT INTO income (source, amount, description, date)
      VALUES (?, ?, ?, COALESCE(?, CURRENT_TIMESTAMP))
    `).run(source, amount, description, date || null);
    res.json({ id: result.lastInsertRowid });
  });

  app.delete('/api/income/:id', (req, res) => {
    db.prepare('DELETE FROM income WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  });

  // Ledger: Summary
  app.get('/api/ledger/summary', (req, res) => {
    const totalIncome = db.prepare('SELECT SUM(amount) as total FROM income').get() as { total: number };
    const totalExpenses = db.prepare('SELECT SUM(amount) as total FROM expenses').get() as { total: number };
    const stockValue = db.prepare('SELECT SUM(stock * cost_price) as total FROM products').get() as { total: number };
    const potentialRevenue = db.prepare('SELECT SUM(stock * price) as total FROM products').get() as { total: number };

    const income = totalIncome.total || 0;
    const expenses = totalExpenses.total || 0;
    const profit = income - expenses;

    res.json({
      totalIncome: income,
      totalExpenses: expenses,
      profit: profit,
      stockValue: stockValue.total || 0,
      potentialRevenue: potentialRevenue.total || 0
    });
  });

  // Analytics
  app.get('/api/analytics', (req, res) => {
    try {
      const totalSales = db.prepare('SELECT SUM(quantity) as total FROM orders').get() as { total: number };
      const lowStock = db.prepare('SELECT COUNT(*) as count FROM products WHERE stock < 10').get() as { count: number };
      const revenue = db.prepare(`
        SELECT SUM(o.quantity * p.price) as total 
        FROM orders o 
        JOIN products p ON o.product_id = p.id
      `).get() as { total: number };

      res.json({
        totalSales: totalSales.total || 0,
        lowStockCount: lowStock.count || 0,
        totalRevenue: revenue.total || 0
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Global error handler
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
