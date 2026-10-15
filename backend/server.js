import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dns from 'dns';
import ProductModel, { CATEGORIES } from './models/Product.js';
import Sale from './models/Sale.js';
dotenv.config();
// Custom DNS helps resolve Atlas SRV records on some local networks; Vercel's own DNS works fine.
if (!process.env.VERCEL) dns.setServers(["1.1.1.1","8.8.8.8"]);

const app = express();
// Behind Vercel's proxy, use X-Forwarded-For so req.ip is the real client IP.
app.set('trust proxy', true);
app.use(cors());
app.use(express.json());

// --- Demo data ---
const demoProducts = [

];

let products = [...demoProducts];
let dbConnected = false;
let Product = ProductModel;

// --- MongoDB ---
// The connection is cached so serverless invocations on Vercel reuse it across requests.
let connectionPromise = null;

async function connectToMongo() {
  if (dbConnected) return;
  if (!connectionPromise) {
    const dbName = process.env.DB_NAME || "inventoryDb";
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error('MONGODB_URI is not set.');

    connectionPromise = (async () => {
      await mongoose.connect(uri, { dbName, serverSelectionTimeoutMS: 10000 });
      const count = await Product.countDocuments();
      if (count === 0 && demoProducts.length) {
        await Product.insertMany(demoProducts);
      }
      dbConnected = true;
      console.log("Connected to MongoDB:", dbName);
    })().catch((error) => {
      connectionPromise = null;
      throw error;
    });
  }
  await connectionPromise;
}

// Ensure the database is connected before any API route runs.
app.use('/api', async (_req, res, next) => {
  try {
    await connectToMongo();
    next();
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    res.status(503).json({ message: 'Database unavailable. Please try again.' });
  }
});

async function loadProducts() {
  if (dbConnected && Product) return Product.find({}).sort({ name: 1 }).lean();
  return products;
}

function generateBarcode() {
  return `SKU-${Date.now().toString().slice(-6)}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

function getSaleDate(date = new Date()) {
  const timeZone = process.env.SALES_TIME_ZONE || 'Asia/Kolkata';
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const value = Object.fromEntries(parts.map(({ type, value: partValue }) => [type, partValue]));
  return `${value.year}-${value.month}-${value.day}`;
}

// --- Admin auth middleware (IP + password) ---
function adminAuth(req, res, next) {
  const allowedIPs = (process.env.ADMIN_IPS || '127.0.0.1,::1,::ffff:127.0.0.1')
    .split(',').map((ip) => ip.trim());
  const clientIP = req.ip || req.socket?.remoteAddress || '';
  // ADMIN_IPS=* disables the IP allowlist (password is still required).
  if (!allowedIPs.includes('*') && !allowedIPs.includes(clientIP)) {
    console.warn(`Admin access denied for IP: ${clientIP}`);
    return res.status(403).json({ message: 'Access denied: IP not allowed.' });
  }
  const adminPassword = process.env.ADMIN_PASSWORD || '';
  const authHeader = req.headers['authorization'] || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  if (!adminPassword || token !== adminPassword) {
    return res.status(401).json({ message: 'Invalid admin password.' });
  }
  next();
}

// --- Public: GET all products (costPrice hidden) ---
app.get('/api/products', async (_req, res) => {
  try {
    const items = await loadProducts();
    const safe = items.map(({ costPrice, ...rest }) => rest);
    res.json(safe);
  } catch (error) { res.status(500).json({ message: error.message }); }
});

// --- Create product ---
app.post('/api/products', async (req, res) => {
  try {
    let { name, price, costPrice, stock, barcode, details, category } = req.body;
    name = String(name || '').trim();
    price = Number(price);
    costPrice = Number(costPrice);
    stock = Number(stock);
    barcode = String(barcode || '').trim();
    details = String(details || '').trim();
    category = String(category || '').trim();

    if (!name) return res.status(400).json({ message: 'Product name is required.' });
    if (isNaN(price) || price < 0) return res.status(400).json({ message: 'Price must be a positive number.' });
    if (isNaN(costPrice) || costPrice < 0) return res.status(400).json({ message: 'Cost price must be a positive number.' });
    if (isNaN(stock) || stock < 0) return res.status(400).json({ message: 'Stock must be a non-negative number.' });
    if (!CATEGORIES.includes(category)) return res.status(400).json({ message: `Category must be one of: ${CATEGORIES.join(', ')}.` });

    if (!barcode) barcode = generateBarcode();

    if (dbConnected && Product) {
      const existing = await Product.findOne({ barcode });
      if (existing) return res.status(400).json({ message: `Barcode ${barcode} already exists.` });
      const newProduct = new Product({ name, price, costPrice, stock, barcode, details, category });
      await newProduct.save();
      const obj = newProduct.toObject();
      delete obj.costPrice;
      return res.json(obj);
    } else {
      const existing = products.find((p) => p.barcode === barcode);
      if (existing) return res.status(400).json({ message: `Barcode ${barcode} already exists.` });
      const newProduct = { name, price, costPrice, stock, barcode, details, category };
      products.push(newProduct);
      const { costPrice: _cp, ...safe } = newProduct;
      return res.json(safe);
    }
  } catch (error) { res.status(500).json({ message: error.message }); }
});

// --- Update product ---
app.put('/api/products/:barcode', async (req, res) => {
  try {
    const barcode = String(req.params.barcode).trim();
    let { name, price, costPrice, stock, details, category } = req.body;
    if (category !== undefined && !CATEGORIES.includes(String(category).trim()))
      return res.status(400).json({ message: `Category must be one of: ${CATEGORIES.join(', ')}.` });

    if (dbConnected && Product) {
      const product = await Product.findOne({ barcode });
      if (!product) return res.status(404).json({ message: 'Product not found.' });
      if (name !== undefined) product.name = String(name).trim();
      if (price !== undefined) product.price = Number(price);
      if (costPrice !== undefined) product.costPrice = Number(costPrice);
      if (stock !== undefined) product.stock = Number(stock);
      if (details !== undefined) product.details = String(details).trim();
      if (category !== undefined) product.category = String(category).trim();
      await product.save();
      return res.json(product);
    } else {
      const index = products.findIndex((p) => p.barcode === barcode);
      if (index === -1) return res.status(404).json({ message: 'Product not found.' });
      if (name !== undefined) products[index].name = String(name).trim();
      if (price !== undefined) products[index].price = Number(price);
      if (costPrice !== undefined) products[index].costPrice = Number(costPrice);
      if (stock !== undefined) products[index].stock = Number(stock);
      if (details !== undefined) products[index].details = String(details).trim();
      if (category !== undefined) products[index].category = String(category).trim();
      return res.json(products[index]);
    }
  } catch (error) { res.status(500).json({ message: error.message }); }
});

// --- Delete product ---
app.delete('/api/products/:barcode', async (req, res) => {
  try {
    const barcode = String(req.params.barcode).trim();
    if (dbConnected && Product) {
      const result = await Product.deleteOne({ barcode });
      if (result.deletedCount === 0) return res.status(404).json({ message: 'Product not found.' });
      return res.json({ message: 'Product deleted successfully', barcode });
    } else {
      const index = products.findIndex((p) => p.barcode === barcode);
      if (index === -1) return res.status(404).json({ message: 'Product not found.' });
      products.splice(index, 1);
      return res.json({ message: 'Product deleted successfully', barcode });
    }
  } catch (error) { res.status(500).json({ message: error.message }); }
});

// --- Scan (costPrice intentionally excluded) ---
app.post('/api/scan', async (req, res) => {
  try {
    console.log('BODY:', req.body);
    const barcode = String(req.body.barcode || '').trim();
    const action = req.body.action || 'details';
    const quantity = Number(req.body.quantity);

    if (!barcode) return res.status(400).json({ found: false, message: 'Barcode is required.' });
    if (action === 'sell' && (!Number.isInteger(quantity) || quantity < 1))
      return res.status(400).json({ found: false, message: 'Invalid quantity' });

    const lowStockResponse = (stock) => ({ lowStock: stock < 3 });

    if (dbConnected && Product) {
      const product = await Product.findOne({ barcode });
      if (!product) return res.status(404).json({ found: false, message: 'Product not found' });
      if (action === 'sell') {
        if (product.stock < quantity) return res.status(400).json({ found: false, message: 'Insufficient stock' });
        product.stock -= quantity;
        await product.save();
        await Sale.create({
          barcode: product.barcode,
          productName: product.name,
          category: product.category,
          unitPrice: product.price,
          quantity,
          total: product.price * quantity,
          soldAt: new Date(),
          saleDate: getSaleDate(),
        });
        console.log('Updated Stock:', product.stock);
      }
      return res.json({
        found: true, barcode: product.barcode, name: product.name,
        price: product.price, stock: product.stock, category: product.category,
        details: product.details || '', ...lowStockResponse(product.stock),
      });
    }

    const found = products.find((item) => item.barcode === barcode);
    if (!found) return res.status(404).json({ found: false, message: 'Product not found' });
    if (action === 'sell') {
      if (found.stock < quantity) return res.status(400).json({ found: false, message: 'Insufficient stock' });
      found.stock -= quantity;
    }
    return res.json({
      found: true, barcode: found.barcode, name: found.name,
      price: found.price, stock: found.stock, category: found.category,
      details: found.details || '', ...lowStockResponse(found.stock),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: error.message });
  }
});

// --- Admin: GET all products with costPrice ---
app.get('/api/admin/products', adminAuth, async (_req, res) => {
  try {
    const items = await loadProducts();
    res.json(items);
  } catch (error) { res.status(500).json({ message: error.message }); }
});

// --- Admin: daily sales history (retained for at least 370 days) ---
app.get('/api/admin/sales', adminAuth, async (req, res) => {
  try {
    const date = String(req.query.date || getSaleDate()).trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ message: 'Date must use YYYY-MM-DD format.' });
    }

    const sales = await Sale.find({ saleDate: date }).sort({ soldAt: -1 }).lean();
    const summary = sales.reduce((totals, sale) => ({
      transactions: totals.transactions + 1,
      quantity: totals.quantity + sale.quantity,
      revenue: totals.revenue + sale.total,
    }), { transactions: 0, quantity: 0, revenue: 0 });

    res.json({ date, sales, summary });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// --- Start (local only; on Vercel the app is exported to api/index.js) ---
if (!process.env.VERCEL) {
  const port = Number(process.env.PORT) || 5000;
  connectToMongo().then(() => {
    app.listen(port, () => {
      console.log(`Inventory server running on http://localhost:${port}`);
      console.log(`Admin endpoint: http://localhost:${port}/api/admin/products`);
    });
  }).catch((error) => {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  });
}

export default app;
