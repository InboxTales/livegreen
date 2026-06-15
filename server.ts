import express from "express";
// Removed top-level vite import to prevent Vercel bundling errors
import path from "path";
import { fileURLToPath } from "url";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import Razorpay from "razorpay";
import { db as pool } from "./src/lib/db.js";
import { ICarryClient } from "./src/lib/icarry.js";
import multer from "multer";
import fs from "fs";
import crypto from "crypto";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const JWT_SECRET = process.env.JWT_SECRET || 'livegreen_secure_jwt_secret_2026';

// Middleware for Admin Auth
const verifyAdmin = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    (req as any).user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

const app = express();
const PORT = 4502;

// Setup Multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = './public/uploads';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage });
const memoryUpload = multer({ storage: multer.memoryStorage() });

app.use(express.json());

// Middleware to handle legacy .php extensions
app.use((req, res, next) => {
  if (req.url.includes('.php')) {
    req.url = req.url.replace(/\.php(\?|$)/, '$1');
  }
  next();
});

// Helper to fetch settings
const getSetting = async (key: string) => {
  const [rows]: any = await pool.query("SELECT key_value FROM app_settings WHERE key_name = ?", [key]);
  return rows.length > 0 ? rows[0].key_value : null;
};

// Helper to log audit actions
const logAudit = async (admin: string, action: string, type: string, id: string, details: string, ip: string) => {
  await pool.query(
    "INSERT INTO audit_log (admin_user, action, entity_type, entity_id, details, ip_address, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [admin, action, type, id, details, ip, new Date().toISOString()]
  );
};

// Helper to fetch iCarry Client
const getICarryClient = async () => {
  const username = await getSetting('icarry_username') || process.env.ICARRY_USERNAME;
  const key = await getSetting('icarry_key') || process.env.ICARRY_KEY;
  const baseUrl = await getSetting('icarry_base_url') || 'https://www.icarry.in';
  
  if (username && key) {
    return new ICarryClient(username, key, baseUrl);
  }
  return null;
};

async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS products (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      price INT NOT NULL,
      originalPrice INT,
      description TEXT,
      image TEXT,
      features TEXT,
      category VARCHAR(100),
      stock INT DEFAULT 100,
      seoTitle VARCHAR(255),
      seoDescription TEXT,
      seoKeywords TEXT,
      subtitle VARCHAR(255),
      rating_override DECIMAL(3,1),
      bought_count VARCHAR(255),
      about_items TEXT,
      purity_profile TEXT,
      product_info TEXT
    );
  `);

  const tables = [
    `CREATE TABLE IF NOT EXISTS blogs (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      excerpt TEXT,
      content TEXT,
      author VARCHAR(100),
      date VARCHAR(100),
      image TEXT,
      category VARCHAR(100),
      seoTitle VARCHAR(255),
      seoDescription TEXT,
      seoKeywords TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS orders (
      id VARCHAR(50) PRIMARY KEY,
      customerName VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      phone VARCHAR(50) NOT NULL,
      address TEXT NOT NULL,
      city VARCHAR(100) NOT NULL,
      state VARCHAR(100) NOT NULL,
      zip VARCHAR(20) NOT NULL,
      items TEXT NOT NULL,
      totalAmount INT NOT NULL,
      paymentMethod VARCHAR(50) NOT NULL,
      paymentId VARCHAR(100),
      status VARCHAR(50) DEFAULT 'pending',
      date VARCHAR(100) NOT NULL,
      icarry_shipment_id TEXT,
      icarry_awb TEXT,
      icarry_tracking_url TEXT,
      icarry_status TEXT,
      is_subscription INTEGER DEFAULT 0,
      promoCodeId INTEGER
    )`,
    `CREATE TABLE IF NOT EXISTS customers (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      phone VARCHAR(50) NOT NULL,
      totalSpent INT DEFAULT 0,
      ordersCount INT DEFAULT 0,
      joinDate VARCHAR(100) NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS admin_users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(100) NOT NULL UNIQUE,
      passwordHash VARCHAR(255) NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS promo_codes (
      id SERIAL PRIMARY KEY,
      code VARCHAR(50) NOT NULL UNIQUE,
      discountType VARCHAR(50) NOT NULL,
      discountValue INT NOT NULL,
      minSpend INT DEFAULT 0,
      expiryDate VARCHAR(100),
      status VARCHAR(50) DEFAULT 'active'
    )`,
    `CREATE TABLE IF NOT EXISTS referrals (
      id SERIAL PRIMARY KEY,
      referrerEmail VARCHAR(255) NOT NULL,
      referredEmail VARCHAR(255) NOT NULL,
      status VARCHAR(50) DEFAULT 'pending',
      rewardCode VARCHAR(100),
      date VARCHAR(100) NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS inquiries (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      subject VARCHAR(255) NOT NULL,
      message TEXT NOT NULL,
      status VARCHAR(50) DEFAULT 'unread',
      date VARCHAR(100) NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS reviews (
      id SERIAL PRIMARY KEY,
      productId INT NOT NULL,
      customerName VARCHAR(255) NOT NULL,
      rating INT NOT NULL,
      comment TEXT,
      status VARCHAR(50) DEFAULT 'pending',
      date VARCHAR(100) NOT NULL,
      FOREIGN KEY(productId) REFERENCES products(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS app_settings (
      id SERIAL PRIMARY KEY,
      key_name VARCHAR(100) NOT NULL UNIQUE,
      key_value TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS subscriptions (
      id SERIAL PRIMARY KEY,
      orderId VARCHAR(50) NOT NULL,
      email VARCHAR(255) NOT NULL,
      status VARCHAR(50) DEFAULT 'active',
      frequency VARCHAR(50) DEFAULT 'monthly',
      nextBillingDate VARCHAR(100),
      items TEXT,
      totalAmount INT
    )`,
    `CREATE TABLE IF NOT EXISTS bundles (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      slug VARCHAR(255) UNIQUE,
      description TEXT,
      discount_percent INT DEFAULT 0,
      discount_amount INT DEFAULT 0,
      image TEXT,
      is_active INTEGER DEFAULT 1,
      items TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS notifications (
      id SERIAL PRIMARY KEY,
      type VARCHAR(50),
      title VARCHAR(255),
      message TEXT,
      is_read INTEGER DEFAULT 0,
      priority VARCHAR(20) DEFAULT 'normal',
      created_at VARCHAR(100)
    )`,
    `CREATE TABLE IF NOT EXISTS audit_log (
      id SERIAL PRIMARY KEY,
      admin_user VARCHAR(100),
      action VARCHAR(255),
      entity_type VARCHAR(100),
      entity_id VARCHAR(100),
      details TEXT,
      ip_address VARCHAR(50),
      created_at VARCHAR(100)
    )`,
    `CREATE TABLE IF NOT EXISTS email_campaigns (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255),
      subject VARCHAR(255),
      content TEXT,
      status VARCHAR(50) DEFAULT 'draft',
      recipients_count INT DEFAULT 0,
      sent_at VARCHAR(100)
    )`,
    `CREATE TABLE IF NOT EXISTS nps_surveys (
      id SERIAL PRIMARY KEY,
      score INT NOT NULL,
      comment TEXT,
      date VARCHAR(100)
    )`,
    `CREATE TABLE IF NOT EXISTS video_testimonials (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255),
      location VARCHAR(255),
      title VARCHAR(255),
      duration VARCHAR(50),
      thumbnail_url TEXT,
      video_url TEXT,
      status VARCHAR(50) DEFAULT 'active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS google_reviews (
      id SERIAL PRIMARY KEY,
      reviewerName VARCHAR(255) NOT NULL,
      rating INT NOT NULL,
      reviewText TEXT,
      reviewDate VARCHAR(100),
      profilePhoto TEXT,
      isVisible INTEGER DEFAULT 1,
      product_id INTEGER,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`
  ];

  for (const tableSql of tables) {
    await pool.query(tableSql);
  }

  // Ensure products table has all columns (Migration support)
  const [columnRows]: any = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'products'");
  const columnNames = columnRows.map((c: any) => c.column_name.toLowerCase());
  
  const expectedColumns = [
    { name: 'stock', type: 'INT DEFAULT 100' },
    { name: 'seoTitle', type: 'VARCHAR(255)' },
    { name: 'seoDescription', type: 'TEXT' },
    { name: 'seoKeywords', type: 'TEXT' },
    { name: 'subtitle', type: 'VARCHAR(255)' },
    { name: 'rating_override', type: 'DECIMAL(3,1)' },
    { name: 'bought_count', type: 'VARCHAR(255)' },
    { name: 'about_items', type: 'TEXT' },
    { name: 'purity_profile', type: 'TEXT' },
    { name: 'product_info', type: 'TEXT' },
    { name: 'ribbon', type: 'TEXT' }
  ];

  for (const col of expectedColumns) {
    if (!columnNames.includes(col.name.toLowerCase())) {
      console.log(`Adding missing column ${col.name} to products table...`);
      await pool.query(`ALTER TABLE products ADD COLUMN ${col.name} ${col.type}`);
    }
  }

  // Ensure orders table has iCarry columns
  const [orderColumnRows]: any = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'orders'");
  const orderColumnNames = orderColumnRows.map((c: any) => c.column_name.toLowerCase());
  const expectedOrderCols = [
    { name: 'icarry_shipment_id', type: 'TEXT' },
    { name: 'icarry_awb', type: 'TEXT' },
    { name: 'icarry_tracking_url', type: 'TEXT' },
    { name: 'icarry_status', type: 'TEXT' },
    { name: 'is_subscription', type: 'INTEGER DEFAULT 0' },
    { name: 'promoCodeId', type: 'INTEGER' }
  ];

  for (const col of expectedOrderCols) {
    if (!orderColumnNames.includes(col.name.toLowerCase())) {
      await pool.query(`ALTER TABLE orders ADD COLUMN ${col.name} ${col.type}`);
    }
  }

  // Seed default settings 
  const defaultSettings = [
    ['razorpay_key', process.env.RAZORPAY_KEY || ''],
    ['razorpay_secret', process.env.RAZORPAY_SECRET || ''],
    ['icarry_username', process.env.ICARRY_USERNAME || ''],
    ['icarry_key', process.env.ICARRY_KEY || ''],
    ['icarry_base_url', 'https://www.icarry.in'],
    ['icarry_pickup_address_id', process.env.ICARRY_PICKUP_ADDRESS_ID || '84128'],
    ['hf_api_key', process.env.HF_API_KEY || '']
  ];

  for (const [key, val] of defaultSettings) {
    await pool.query("INSERT INTO app_settings (key_name, key_value) VALUES ($1, $2) ON CONFLICT (key_name) DO NOTHING", [key, val]);
  }

  // Ensure pickup address ID is always up to date from env (won't override if already customised via admin UI)
  // Only update if the DB value is empty
  const [existingPickup]: any = await pool.query("SELECT key_value FROM app_settings WHERE key_name = 'icarry_pickup_address_id'");
  if (existingPickup.length > 0 && !existingPickup[0].key_value && process.env.ICARRY_PICKUP_ADDRESS_ID) {
    await pool.query("UPDATE app_settings SET key_value = $1 WHERE key_name = 'icarry_pickup_address_id'", [process.env.ICARRY_PICKUP_ADDRESS_ID]);
  }

  const [adminCnt]: any = await pool.query("SELECT count(*) as count FROM admin_users");
  if (Number(adminCnt[0].count) === 0) {
    const defaultPass = await bcrypt.hash('password', 10);
    await pool.query("INSERT INTO admin_users (username, passwordHash) VALUES (?, ?) ON CONFLICT (username) DO NOTHING", ['admin', defaultPass]);
  }

  const [prodCnt]: any = await pool.query("SELECT count(*) as count FROM products");
  if (Number(prodCnt[0].count) === 0) {
    const seedProds = [
      ["Live Green Raw Honey (500g)", 599, 799, "Our signature honey is harvested from the deep forests of Uttarakhand, ensuring a rich taste and high nutritional value. It's never heated or processed, preserving all the natural enzymes and antioxidants.", "https://images.unsplash.com/photo-1587049352846-4a222e784d38?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80", JSON.stringify(["100% Raw & Unprocessed", "Rich in Antioxidants", "Boosts Immunity", "Sourced from Sustainable Farms"]), "Raw Honey"],
      ["Wild Forest Honey (350g)", 449, 599, "Collected from the wild forests of the Western Ghats, this dark amber honey has a bold, complex flavor profile with notes of wild herbs and flowers. Perfect for those who love intense flavors.", "https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80", JSON.stringify(["Wild Harvested", "Dark Amber Color", "Complex Flavor Profile", "High Mineral Content"]), "Wild Honey"],
      ["Acacia Honey (250g)", 399, 549, "Light, golden, and delicately sweet — our Acacia honey is one of the purest varieties available. It stays liquid longer than most honeys and has a mild, floral taste that pairs beautifully with cheese and fruits.", "https://images.unsplash.com/photo-1612438214708-f428a707dd4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80", JSON.stringify(["Light & Golden", "Slow Crystallization", "Mild Floral Taste", "Pairs with Cheese"]), "Acacia Honey"],
      ["Multiflora Honey (1kg)", 999, 1299, "Our premium Multiflora honey is sourced from apiaries surrounded by diverse wildflowers. This family-size jar is perfect for daily use — in your tea, on toast, or as a natural sweetener in recipes.", "/images/multiflora-honey.png", JSON.stringify(["Family Size 1kg", "Multi-Floral Blend", "Daily Use", "Rich in Enzymes"]), "Multiflora"],
      ["Honeycomb Box (200g)", 699, 899, "Experience honey in its most natural form — straight from the comb. Our honeycomb is hand-cut from frames and sealed in food-safe boxes. Chew it, spread it on warm bread, or pair it with cheese for a gourmet snack.", "/images/pollen-honey.png", JSON.stringify(["Raw Honeycomb", "Hand-Cut Pieces", "Gourmet Snack", "Contains Beeswax & Propolis"]), "Honeycomb"],
      ["Jamun Honey (500g)", 649, 849, "Harvested during the Jamun (Indian Blackberry) flowering season, this honey has a rich, slightly tangy flavor and a dark color. Traditionally used in Ayurveda, it's believed to support blood sugar management.", "/images/jamun-honey.png", JSON.stringify(["Seasonal Harvest", "Ayurvedic Properties", "Low Glycemic Index", "Rich Dark Color"]), "Specialty"]
    ];
    for (const p of seedProds) {
      await pool.query("INSERT INTO products (name, price, originalPrice, description, image, features, category) VALUES (?, ?, ?, ?, ?, ?, ?)", p);
    }
  }

  const [blogCnt]: any = await pool.query("SELECT count(*) as count FROM blogs");
  if (blogCnt[0].count === 0) {
    const seedBlogs = [
      ["Why Crystallization is a Sign of Purity", "Many people mistake crystallized honey for spoiled or fake honey. Here's why it's actually a good sign.", "Honey crystallization is a natural process where glucose separates from water and forms crystals. It proves that the honey is raw and unprocessed.", "Dr. Bee", new Date().toISOString(), "/images/multiflora-honey.png", "Education"]
    ];
    for (const b of seedBlogs) {
      await pool.query("INSERT INTO blogs (title, excerpt, content, author, date, image, category) VALUES (?, ?, ?, ?, ?, ?, ?)", b);
    }
  }

  const [reviewCnt]: any = await pool.query("SELECT count(*) as count FROM google_reviews");
  if (reviewCnt[0].count === 0) {
    const seedReviews = [
      ["Aditya Verma", 5, "Hands down the best raw honey I've purchased online. You can immediately tell the difference in aroma and taste compared to store-bought processed brands. Packaged nicely in a glass jar. Highly recommend!", "2 weeks ago"],
      ["Meera Nair", 5, "I stopped using refined sugar for my morning tea and switched to Live Green Honey. It's truly raw and unpasteurized. You can see the natural crystallization over time, which is the hallmark of purity. Extremely happy with the quality!", "1 month ago"],
      ["Dr. Rajesh K.", 5, "As someone who is very conscious about food sourcing, I am impressed by their laboratory reports and commitment to zero adulteration. It tastes amazing and feels great to support a direct-from-farm initiative. Five stars.", "3 weeks ago"],
      ["Priya Sundaram", 5, "My kids love this honey on their pancakes! It has a very smooth texture and a natural, rich sweetness that isn't cloying. It's great to know I'm giving them something healthy and pure. Excellent service and fast delivery.", "3 days ago"]
    ];
    for (const r of seedReviews) {
      await pool.query("INSERT INTO google_reviews (reviewerName, rating, reviewText, reviewDate, isVisible) VALUES (?, ?, ?, ?, 1)", r);
    }
  }
}

async function startServer() {
  await initDB();

  // Chat/HF Proxy
  app.post("/api/chat", async (req, res) => {
    const hfKey = await getSetting('hf_api_key');
    if (!hfKey) return res.status(500).json({ error: "HF API Key not configured." });

    try {
      const response = await fetch("https://router.huggingface.co/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${hfKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(req.body)
      });
      const data = await response.json();
      res.json(data);
    } catch (e) {
      res.status(500).json({ error: "Failed to communicate with AI provider" });
    }
  });

  // Analytics Dashboard
  app.get("/api/dashboard_analytics", verifyAdmin, async (req, res) => {
    const { from, to } = req.query;
    try {
      const [revRows]: any = await pool.query("SELECT SUM(totalAmount) as revenue, COUNT(*) as ordersCount FROM orders WHERE status != 'cancelled' AND SUBSTRING(date, 1, 10) BETWEEN ? AND ?", [from, to]);
      const [prevRevRows]: any = await pool.query("SELECT SUM(totalAmount) as revenue FROM orders WHERE status != 'cancelled' AND SUBSTRING(date, 1, 10) < ?", [from]);
      
      const revenue = revRows[0].revenue || 0;
      const totalOrders = revRows[0].ordersCount || 0;
      const prevRevenue = prevRevRows[0].revenue || 0;
      const revenueChange = prevRevenue === 0 ? 100 : ((revenue - prevRevenue) / prevRevenue) * 100;

      const [statusRows]: any = await pool.query("SELECT status, COUNT(*) as count FROM orders GROUP BY status");
      const [revenueTrend]: any = await pool.query("SELECT SUBSTRING(date, 1, 10) as date, SUM(totalAmount) as revenue, COUNT(*) as orders FROM orders WHERE status != 'cancelled' GROUP BY SUBSTRING(date, 1, 10) ORDER BY date DESC LIMIT 30");

      res.json({
        revenue,
        revenueChange,
        totalOrders,
        ordersChange: 0, // Placeholder
        avgOrderValue: totalOrders === 0 ? 0 : revenue / totalOrders,
        conversionRate: 3.5, // Mocked
        cac: 150, // Mocked
        newCustomers: 12, // Mocked
        clv: 2500, // Mocked
        repeatRate: 15, // Mocked
        repeatCustomers: 5, // Mocked
        totalCustomers: 120, // Mocked
        cartAbandonmentRate: 65, // Mocked
        csatAvg: 4.8,
        csatPercent: 95,
        csatCount: 45,
        ratingDistribution: [{ rating: 5, count: 35 }, { rating: 4, count: 8 }, { rating: 3, count: 2 }],
        npsScore: 78,
        npsTotal: 40,
        npsBreakdown: [{ name: 'Promoters', value: 30 }, { name: 'Passives', value: 8 }, { name: 'Detractors', value: 2 }],
        trafficSources: [{ name: 'Direct', value: 400 }, { name: 'Social', value: 300 }, { name: 'Email', value: 200 }],
        revenueTrend: revenueTrend.reverse(),
        ordersByStatus: statusRows.map((r: any) => ({ status: r.status, count: r.count })),
        recentOrders: [], // Handled in /api/dashboard
        unreadInquiries: 0,
        pendingReviews: 0,
        visits: 1250,
        dateRange: { from, to }
      });
    } catch (e) { res.status(500).json({ error: 'Analytics error' }); }
  });

  // Notifications
  app.get("/api/notifications", verifyAdmin, async (req, res) => {
    const [rows]: any = await pool.query("SELECT * FROM notifications ORDER BY created_at DESC LIMIT 50");
    const [unread]: any = await pool.query("SELECT count(*) as count FROM notifications WHERE is_read = 0");
    res.json({ notifications: rows, unreadCount: unread[0].count });
  });

  app.put("/api/notifications", verifyAdmin, async (req, res) => {
    const { markAllRead } = req.body;
    if (markAllRead) {
      await pool.query("UPDATE notifications SET is_read = 1");
    }
    res.json({ success: true });
  });

  // Audit Log
  app.get("/api/audit_log", verifyAdmin, async (req, res) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = 20;
    const offset = (page - 1) * limit;
    const [rows]: any = await pool.query("SELECT * FROM audit_log ORDER BY created_at DESC LIMIT ? OFFSET ?", [limit, offset]);
    const [total]: any = await pool.query("SELECT count(*) as count FROM audit_log");
    res.json({ logs: rows, total: total[0].count, page, pages: Math.ceil(total[0].count / limit) });
  });

  // Dashboard
  app.get("/api/dashboard", verifyAdmin, async (req, res) => {
    const [revRow]: any = await pool.query("SELECT SUM(totalAmount) as total FROM orders WHERE status != 'cancelled'");
    const [ordRow]: any = await pool.query("SELECT count(*) as count FROM orders");
    const [custRow]: any = await pool.query("SELECT count(*) as count FROM customers");
    const [inqRow]: any = await pool.query("SELECT count(*) as count FROM inquiries WHERE status = 'unread'");
    const [revwRow]: any = await pool.query("SELECT count(*) as count FROM reviews WHERE status = 'pending'");
    const [recentOrders]: any = await pool.query("SELECT * FROM orders ORDER BY date DESC LIMIT 5");

    res.json({
      totalRevenue: revRow[0].total || 0,
      totalOrders: ordRow[0].count,
      totalCustomers: custRow[0].count,
      unreadInquiries: inqRow[0].count,
      pendingReviews: revwRow[0].count,
      recentOrders: recentOrders.map((o: any) => ({ ...o, items: JSON.parse(o.items || "[]") }))
    });
  });

  // Bundles
  app.get("/api/bundles", async (req, res) => {
    const [rows]: any = await pool.query("SELECT * FROM bundles WHERE is_active = 1");
    res.json(rows.map((r: any) => ({ ...r, items: JSON.parse(r.items || "[]") })));
  });

  app.post("/api/bundles", verifyAdmin, async (req, res) => {
    const { name, slug, description, discount_percent, discount_amount, image, items } = req.body;
    const [info]: any = await pool.query(
      "INSERT INTO bundles (name, slug, description, discount_percent, discount_amount, image, items) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [name, slug, description, discount_percent, discount_amount, image, JSON.stringify(items || [])]
    );
    res.json({ id: info.insertId || info.lastID });
  });

  // NPS Survey
  app.post("/api/nps_survey", async (req, res) => {
    const { score, comment } = req.body;
    await pool.query("INSERT INTO nps_surveys (score, comment, date) VALUES (?, ?, ?)", [score, comment, new Date().toISOString()]);
    res.json({ success: true });
  });

  // Video Testimonials
  app.get("/api/video_testimonials", async (req, res) => {
    try {
      const [rows]: any = await pool.query("SELECT * FROM video_testimonials ORDER BY created_at DESC");
      res.json(rows);
    } catch (e) { res.status(500).json({ error: 'DB Error' }); }
  });

  app.post("/api/video_testimonials", verifyAdmin, upload.fields([{ name: 'video', maxCount: 1 }]), async (req: any, res) => {
    try {
      const { id, name, location, title, duration, thumbnail_url } = req.body;
      let video_url = req.body.video_url;

      if (req.files && req.files['video']) {
        video_url = `/uploads/${req.files['video'][0].filename}`;
      }

      if (id) {
        await pool.query(
          "UPDATE video_testimonials SET name = ?, location = ?, title = ?, duration = ?, thumbnail_url = ?, video_url = ? WHERE id = ?",
          [name, location, title, duration, thumbnail_url, video_url, id]
        );
      } else {
        await pool.query(
          "INSERT INTO video_testimonials (name, location, title, duration, thumbnail_url, video_url) VALUES (?, ?, ?, ?, ?, ?)",
          [name, location, title, duration, thumbnail_url, video_url]
        );
      }
      res.json({ success: true });
    } catch (e) { res.status(500).json({ error: 'DB Error' }); }
  });

  app.delete("/api/video_testimonials", verifyAdmin, async (req, res) => {
    try {
      const { id } = req.query;
      await pool.query("DELETE FROM video_testimonials WHERE id = ?", [id]);
      res.json({ success: true });
    } catch (e) { res.status(500).json({ error: 'DB Error' }); }
  });

  // Waitlist
  app.post("/api/waitlist", async (req, res) => {
    const { email, productId } = req.body;
    try {
      await pool.query("CREATE TABLE IF NOT EXISTS waitlist (id SERIAL PRIMARY KEY, email VARCHAR(255), product_id INT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)");
      await pool.query("INSERT INTO waitlist (email, product_id) VALUES (?, ?)", [email, productId]);
      res.json({ success: true });
    } catch (e) { res.status(500).json({ error: 'DB Error' }); }
  });

  // Settings API (Duplicate Cleanup - handled above)

  // Public Settings API — only safe/public keys exposed here
  app.get("/api/public_settings", async (req, res) => {
    try {
      // SECURITY: only expose the public Razorpay key — NEVER the secret
      const [rows]: any = await pool.query(
        "SELECT key_name, key_value FROM app_settings WHERE key_name = ?",
        ['razorpay_key']
      );
      const settings: any = {};
      rows.forEach((r: any) => settings[r.key_name] = r.key_value);
      res.json(settings);
    } catch (e) { res.status(500).json({ error: 'DB Error' }); }
  });

  // Google Reviews
  app.get("/api/google_reviews", async (req, res) => {
    try {
      const [rows]: any = await pool.query("SELECT * FROM google_reviews WHERE isVisible = 1 ORDER BY created_at DESC");
      let reviewsList = rows;
      if (!reviewsList || reviewsList.length === 0) {
        reviewsList = [
          {
            id: 1,
            reviewerName: "Aditya Verma",
            rating: 5,
            reviewText: "Hands down the best raw honey I've purchased online. You can immediately tell the difference in aroma and taste compared to store-bought processed brands. Packaged nicely in a glass jar. Highly recommend!",
            reviewDate: "2 weeks ago",
            profilePhoto: "",
            isVisible: 1
          },
          {
            id: 2,
            reviewerName: "Meera Nair",
            rating: 5,
            reviewText: "I stopped using refined sugar for my morning tea and switched to Live Green Honey. It's truly raw and unpasteurized. You can see the natural crystallization over time, which is the hallmark of purity. Extremely happy with the quality!",
            reviewDate: "1 month ago",
            profilePhoto: "",
            isVisible: 1
          },
          {
            id: 3,
            reviewerName: "Dr. Rajesh K.",
            rating: 5,
            reviewText: "As someone who is very conscious about food sourcing, I am impressed by their laboratory reports and commitment to zero adulteration. It tastes amazing and feels great to support a direct-from-farm initiative. Five stars.",
            reviewDate: "3 weeks ago",
            profilePhoto: "",
            isVisible: 1
          },
          {
            id: 4,
            reviewerName: "Priya Sundaram",
            rating: 5,
            reviewText: "My kids love this honey on their pancakes! It has a very smooth texture and a natural, rich sweetness that isn't cloying. It's great to know I'm giving them something healthy and pure. Excellent service and fast delivery.",
            reviewDate: "3 days ago",
            profilePhoto: "",
            isVisible: 1
          }
        ];
      }
      res.json({ 
        reviews: reviewsList,
        aggregate: { rating: "5.0", totalReviews: String(reviewsList.length + 120), mapsUrl: "https://g.page/livegreenhoney/review" } 
      });
    } catch (e) { res.status(500).json({ error: 'DB Error' }); }
  });

  app.post("/api/google_reviews", verifyAdmin, async (req, res) => {
    try {
      const { reviewerName, rating, reviewText, reviewDate, product_id, isVisible } = req.body;
      const [result]: any = await pool.query(
        "INSERT INTO google_reviews (reviewerName, rating, reviewText, reviewDate, product_id, isVisible) VALUES (?, ?, ?, ?, ?, ?)",
        [reviewerName, rating, reviewText, reviewDate, product_id, isVisible ?? 1]
      );
      res.json({ success: true, id: result.insertId });
    } catch (e) { res.status(500).json({ error: 'DB Error' }); }
  });

  app.put("/api/google_reviews/:id", verifyAdmin, async (req, res) => {
    try {
      const { reviewerName, rating, reviewText, reviewDate, product_id, isVisible } = req.body;
      await pool.query(
        "UPDATE google_reviews SET reviewerName = ?, rating = ?, reviewText = ?, reviewDate = ?, product_id = ?, isVisible = ? WHERE id = ?",
        [reviewerName, rating, reviewText, reviewDate, product_id, isVisible, req.params.id]
      );
      res.json({ success: true });
    } catch (e) { res.status(500).json({ error: 'DB Error' }); }
  });

  app.delete("/api/google_reviews/:id", verifyAdmin, async (req, res) => {
    try {
      await pool.query("DELETE FROM google_reviews WHERE id = ?", [req.params.id]);
      res.json({ success: true });
    } catch (e) { res.status(500).json({ error: 'DB Error' }); }
  });

  // Active Promos API
  app.get("/api/active_promos", async (req, res) => {
    try {
      const [rows]: any = await pool.query("SELECT code, discountType, discountValue, minSpend, expiryDate FROM promo_codes WHERE status = 'active'");
      res.json({ success: true, promos: rows });
    } catch (e) { res.status(500).json({ error: 'DB Error' }); }
  });


  // Settings API (Protected) - Unified
  app.get(["/api/admin/settings", "/api/settings"], verifyAdmin, async (req, res) => {
    try {
      const [rows]: any = await pool.query("SELECT key_name, key_value FROM app_settings");
      res.json(rows);
    } catch (e) { res.status(500).json({ error: 'DB Error' }); }
  });

  app.put(["/api/admin/settings", "/api/settings"], verifyAdmin, async (req, res) => {
    const { key_name, key_value } = req.body;
    try {
      await pool.query(
        "INSERT INTO app_settings (key_name, key_value) VALUES (?, ?) ON CONFLICT (key_name) DO UPDATE SET key_value = EXCLUDED.key_value",
        [key_name, key_value]
      );
      await logAudit((req as any).user.username, 'UPDATE_SETTING', 'setting', key_name, `Updated ${key_name}`, req.ip);
      res.json({ success: true });
    } catch (e) { res.status(500).json({ error: 'DB Error' }); }
  });

  // Products
  app.get("/api/products", async (req, res) => {
    const [products]: any = await pool.query("SELECT * FROM products");
    const parsedProducts = products.map((p: any) => ({
      ...p,
      features: JSON.parse(p.features || "[]"),
      about_items: JSON.parse(p.about_items || "[]"),
      purity_profile: JSON.parse(p.purity_profile || "{}"),
      product_info: JSON.parse(p.product_info || "{}")
    }));
    res.json(parsedProducts);
  });

  app.get("/api/products/:id", async (req, res) => {
    const [rows]: any = await pool.query("SELECT * FROM products WHERE id = ?", [req.params.id]);
    if (rows.length > 0) {
      const product = rows[0];
      product.features = JSON.parse(product.features || "[]");
      product.about_items = JSON.parse(product.about_items || "[]");
      product.purity_profile = JSON.parse(product.purity_profile || "{}");
      product.product_info = JSON.parse(product.product_info || "{}");
      res.json(product);
    } else {
      res.status(404).json({ error: "Product not found" });
    }
  });

  app.post("/api/products", verifyAdmin, async (req, res) => {
    const { 
      name, price, originalPrice, description, image, features, category, stock, seoTitle, seoDescription, seoKeywords,
      subtitle, rating_override, bought_count, about_items, purity_profile, product_info, ribbon
    } = req.body;
    const [info]: any = await pool.query(
      "INSERT INTO products (name, price, originalPrice, description, image, features, category, stock, seoTitle, seoDescription, seoKeywords, subtitle, rating_override, bought_count, about_items, purity_profile, product_info, ribbon) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        name, price, originalPrice, description, image, JSON.stringify(features || []), category, stock ?? 100, seoTitle, seoDescription, seoKeywords,
        subtitle, rating_override, bought_count, JSON.stringify(about_items || []), JSON.stringify(purity_profile || {}), JSON.stringify(product_info || {}), ribbon
      ]
    );
    const newId = info.insertId || info.lastID;
    await logAudit((req as any).user.username, 'CREATE_PRODUCT', 'product', String(newId), `Created ${name}`, req.ip);
    res.json({ id: newId });
  });

  app.put("/api/products/:id", verifyAdmin, async (req, res) => {
    const { 
      name, price, originalPrice, description, image, features, category, stock, seoTitle, seoDescription, seoKeywords,
      subtitle, rating_override, bought_count, about_items, purity_profile, product_info, ribbon
    } = req.body;
    await pool.query(
      "UPDATE products SET name = ?, price = ?, originalPrice = ?, description = ?, image = ?, features = ?, category = ?, stock = ?, seoTitle = ?, seoDescription = ?, seoKeywords = ?, subtitle = ?, rating_override = ?, bought_count = ?, about_items = ?, purity_profile = ?, product_info = ?, ribbon = ? WHERE id = ?",
      [
        name, price, originalPrice, description, image, JSON.stringify(features || []), category, stock ?? 100, seoTitle, seoDescription, seoKeywords,
        subtitle, rating_override, bought_count, JSON.stringify(about_items || []), JSON.stringify(purity_profile || {}), JSON.stringify(product_info || {}),
        ribbon, req.params.id
      ]
    );
    await logAudit((req as any).user.username, 'UPDATE_PRODUCT', 'product', req.params.id, `Updated ${name}`, req.ip);
    res.json({ success: true });
  });

  app.delete("/api/products/:id", verifyAdmin, async (req, res) => {
    await pool.query("DELETE FROM products WHERE id = ?", [req.params.id]);
    await logAudit((req as any).user.username, 'DELETE_PRODUCT', 'product', req.params.id, `Deleted product ${req.params.id}`, req.ip);
    res.json({ success: true });
  });

  // Blogs
  app.get("/api/blogs", async (req, res) => {
    const [blogs]: any = await pool.query("SELECT * FROM blogs ORDER BY date DESC");
    res.json(blogs);
  });

  app.get("/api/blogs/:id", async (req, res) => {
    const [rows]: any = await pool.query("SELECT * FROM blogs WHERE id = ?", [req.params.id]);
    res.json(rows[0] || null);
  });

  app.post("/api/blogs", verifyAdmin, async (req, res) => {
    const { title, excerpt, content, author, date, image, category, seoTitle, seoDescription, seoKeywords } = req.body;
    const [info]: any = await pool.query("INSERT INTO blogs (title, excerpt, content, author, date, image, category, seoTitle, seoDescription, seoKeywords) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [title, excerpt, content, author, date, image, category, seoTitle, seoDescription, seoKeywords]);
    res.json({ id: info.insertId });
  });

  app.put("/api/blogs/:id", verifyAdmin, async (req, res) => {
    const { title, excerpt, content, author, date, image, category, seoTitle, seoDescription, seoKeywords } = req.body;
    await pool.query("UPDATE blogs SET title = ?, excerpt = ?, content = ?, author = ?, date = ?, image = ?, category = ?, seoTitle = ?, seoDescription = ?, seoKeywords = ? WHERE id = ?",
      [title, excerpt, content, author, date, image, category, seoTitle, seoDescription, seoKeywords, req.params.id]);
    res.json({ success: true });
  });

  app.delete("/api/blogs/:id", verifyAdmin, async (req, res) => {
    await pool.query("DELETE FROM blogs WHERE id = ?", [req.params.id]);
    res.json({ success: true });
  });

  // Email Campaigns
  app.get("/api/email_campaigns", verifyAdmin, async (req, res) => {
    const [rows] = await pool.query("SELECT * FROM email_campaigns ORDER BY sent_at DESC");
    res.json(rows);
  });

  app.post("/api/email_campaigns", verifyAdmin, async (req, res) => {
    const { name, subject, content } = req.body;
    const [info]: any = await pool.query("INSERT INTO email_campaigns (name, subject, content, status) VALUES (?, ?, ?, 'draft')", [name, subject, content]);
    res.json({ id: info.insertId });
  });

  // Subscriptions
  app.get("/api/subscriptions", verifyAdmin, async (req, res) => {
    const [rows] = await pool.query("SELECT * FROM subscriptions ORDER BY nextBillingDate ASC");
    res.json(rows);
  });

  // Helper for Supabase Storage uploads
  async function uploadToSupabase(fileBuffer: Buffer, fileName: string, mimeType: string): Promise<string | null> {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) return null;

    try {
      const bucket = 'uploads';
      const uploadUrl = `${supabaseUrl}/storage/v1/object/${bucket}/${fileName}`;
      const response = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'apikey': supabaseKey,
          'Content-Type': mimeType,
        },
        body: fileBuffer as any
      });

      if (response.ok) {
        return `${supabaseUrl}/storage/v1/object/public/${bucket}/${fileName}`;
      } else {
        const errText = await response.text();
        console.error('[Supabase Upload Error]:', errText);
        return null;
      }
    } catch (err: any) {
      console.error('[Supabase Upload Exception]:', err.message);
      return null;
    }
  }

  // Image Upload
  app.post("/api/upload", verifyAdmin, memoryUpload.single('image'), async (req: any, res) => {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const fileName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(req.file.originalname)}`;
    
    // 1. Try to upload to Supabase Storage if configured
    if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
      const publicUrl = await uploadToSupabase(req.file.buffer, fileName, req.file.mimetype);
      if (publicUrl) {
        return res.json({ success: true, url: publicUrl, filename: fileName });
      }
    }

    // 2. Fallback to local storage (for local dev)
    try {
      const dir = './public/uploads';
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      const filePath = path.join(dir, fileName);
      fs.writeFileSync(filePath, req.file.buffer);
      res.json({ success: true, url: `/uploads/${fileName}`, filename: fileName });
    } catch (err: any) {
      console.error("Local upload fallback failed:", err.message);
      res.status(500).json({ error: "Failed to upload image", details: err.message });
    }
  });

  // Promo Codes
  app.get("/api/promo_codes", verifyAdmin, async (req, res) => {
    const [promos] = await pool.query("SELECT * FROM promo_codes ORDER BY id DESC");
    res.json(promos);
  });

  app.post("/api/promo_codes", verifyAdmin, async (req, res) => {
    const { code, discountType, discountValue, minSpend, expiryDate } = req.body;
    try {
      const [info]: any = await pool.query("INSERT INTO promo_codes (code, discountType, discountValue, minSpend, expiryDate) VALUES (?, ?, ?, ?, ?)",
        [code.toUpperCase(), discountType, discountValue, minSpend, expiryDate]);
      res.json({ id: info.insertId });
    } catch (e: any) {
      if (e.code === 'ER_DUP_ENTRY') {
        res.status(400).json({ error: "Promo code already exists" });
      } else {
        res.status(500).json({ error: "Database error" });
      }
    }
  });

  app.put("/api/promo_codes/:id/status", verifyAdmin, async (req, res) => {
    const { status } = req.body;
    await pool.query("UPDATE promo_codes SET status = ? WHERE id = ?", [status, req.params.id]);
    res.json({ success: true });
  });

  app.post("/api/promo_codes/validate", async (req, res) => {
    const { code, cartTotal } = req.body;
    const [rows]: any = await pool.query("SELECT * FROM promo_codes WHERE code = ?", [code.toUpperCase()]);
    const promo = rows[0];

    if (!promo) return res.status(404).json({ error: "Invalid promo code" });
    if (promo.status !== "active") return res.status(400).json({ error: "Promo code is no longer active" });
    if (promo.expiryDate && new Date(promo.expiryDate) < new Date()) return res.status(400).json({ error: "Promo code has expired" });
    if (promo.minSpend > 0 && cartTotal < promo.minSpend) return res.status(400).json({ error: `Minimum spend of ₹${promo.minSpend} required` });

    res.json({ success: true, discountType: promo.discountType, discountValue: promo.discountValue });
  });

  // Inquiries
  app.get("/api/inquiries", verifyAdmin, async (req, res) => {
    const [inquiries] = await pool.query("SELECT * FROM inquiries ORDER BY date DESC");
    res.json(inquiries);
  });

  app.post("/api/inquiries", async (req, res) => {
    const { name, email, subject, message } = req.body;
    const [info]: any = await pool.query("INSERT INTO inquiries (name, email, subject, message, date) VALUES (?, ?, ?, ?, ?)",
      [name, email, subject, message, new Date().toISOString()]);
    res.json({ id: info.insertId });
  });

  app.put("/api/inquiries/:id/status", verifyAdmin, async (req, res) => {
    const { status } = req.body;
    await pool.query("UPDATE inquiries SET status = ? WHERE id = ?", [status, req.params.id]);
    res.json({ success: true });
  });

  // Reviews
  app.get("/api/reviews", verifyAdmin, async (req, res) => {
    const [reviews] = await pool.query(`
      SELECT reviews.*, products.name as productName 
      FROM reviews 
      JOIN products ON reviews.productId = products.id 
      ORDER BY date DESC
    `);
    res.json(reviews);
  });

  app.get("/api/products/:id/reviews", async (req, res) => {
    const [reviews] = await pool.query("SELECT * FROM reviews WHERE productId = ? AND status IN ('approved', 'pending') ORDER BY date DESC", [req.params.id]);
    res.json(reviews);
  });

  app.post("/api/reviews", async (req, res) => {
    const { productId, customerName, rating, comment } = req.body;
    const [info]: any = await pool.query("INSERT INTO reviews (productId, customerName, rating, comment, date) VALUES (?, ?, ?, ?, ?)",
      [productId, customerName, rating, comment, new Date().toISOString()]);
    res.json({ id: info.insertId });
  });

  app.put("/api/reviews/:id/status", verifyAdmin, async (req, res) => {
    const { status } = req.body;
    await pool.query("UPDATE reviews SET status = ? WHERE id = ?", [status, req.params.id]);
    res.json({ success: true });
  });

  // Referrals
  app.get("/api/referrals", verifyAdmin, async (req, res) => {
    const [referrals] = await pool.query("SELECT * FROM referrals ORDER BY date DESC");
    res.json(referrals);
  });

  app.post("/api/referrals", async (req, res) => {
    const { referrerEmail, referredEmail } = req.body;
    const [info]: any = await pool.query("INSERT INTO referrals (referrerEmail, referredEmail, date) VALUES (?, ?, ?)",
      [referrerEmail, referredEmail, new Date().toISOString()]);
    res.json({ id: info.insertId });
  });

  // Orders
  app.get("/api/orders", verifyAdmin, async (req, res) => {
    const [orders]: any = await pool.query("SELECT * FROM orders ORDER BY date DESC");
    res.json(orders.map((o: any) => ({ ...o, items: JSON.parse(o.items || "[]") })));
  });

  app.post("/api/orders", async (req, res) => {
    const { id, customerName, email, phone, address, city, state, zip, items, totalAmount, paymentMethod, paymentId, date, icarry_shipment_id, icarry_awb, icarry_tracking_url, icarry_status } = req.body;

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const [existingCust]: any = await connection.query("SELECT * FROM customers WHERE email = ?", [email]);
      if (existingCust.length > 0) {
        await connection.query("UPDATE customers SET totalSpent = totalSpent + ?, ordersCount = ordersCount + 1 WHERE email = ?", [totalAmount, email]);
      } else {
        await connection.query("INSERT INTO customers (name, email, phone, totalSpent, ordersCount, joinDate) VALUES (?, ?, ?, ?, ?, ?)",
          [customerName, email, phone, totalAmount, 1, date]);
      }

      for (const item of items) {
        await connection.query("UPDATE products SET stock = GREATEST(0, stock - ?) WHERE id = ?", [item.quantity, item.id]);
      }

      await connection.query("INSERT INTO orders (id, customerName, email, phone, address, city, state, zip, items, totalAmount, paymentMethod, paymentId, status, date, icarry_shipment_id, icarry_awb, icarry_tracking_url, icarry_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [id, customerName, email, phone, address, city, state, zip, JSON.stringify(items), totalAmount, paymentMethod, paymentId, 'pending', date, icarry_shipment_id, icarry_awb, icarry_tracking_url, icarry_status]);

      // Create notification
      await connection.query("INSERT INTO notifications (type, title, message, priority, created_at) VALUES (?, ?, ?, ?, ?)",
        ['order', 'New Order Received', `Order ${id} from ${customerName} for ₹${totalAmount}`, 'high', new Date().toISOString()]);

      await connection.commit();

      // Automatic iCarry Booking if possible
      const icarryClient = await getICarryClient();
      if (icarryClient && !icarry_shipment_id) {
        const pickupId = await getSetting('icarry_pickup_address_id');
        if (pickupId) {
          try {
            const weightGrams = Math.max(500, items.reduce((sum: number, i: any) => sum + (i.quantity || 1) * 500, 0));
            const bookingResult = await icarryClient.bookShipment({
              pickup_address_id: pickupId,
              client_order_id: id,
              consignee: {
                name: customerName,
                mobile: phone.replace(/[^0-9]/g, '').slice(-10),
                address: address,
                city: city,
                pincode: zip,
                state: ICarryClient.getStateCode(state),
              },
              parcel: {
                type: paymentMethod === 'cod' ? 'COD' : 'Prepaid',
                value: Math.max(1, totalAmount),
                contents: items.map((i: any) => i.name).join(', '),
              },
              measurements: {
                weight: weightGrams,
                length: 15,
                breadth: 15,
                height: 10,
              },
            });

            if (bookingResult?.shipment_id) {
              await pool.query(
                "UPDATE orders SET icarry_shipment_id = ?, icarry_awb = ?, icarry_tracking_url = ?, icarry_status = 'booked', status = 'processing' WHERE id = ?",
                [bookingResult.shipment_id, bookingResult.awb, bookingResult.tracking_url, id]
              );
              console.log(`[iCarry] COD shipment ${bookingResult.shipment_id} booked for order ${id} — AWB: ${bookingResult.awb}`);
            }
          } catch (e: any) {
            console.error('[iCarry] Auto-booking failed (order still recorded):', e.message);
          }
        } else {
          console.warn('[iCarry] pickup_address_id not configured — skipping auto-shipment');
        }
      }

      res.json({ success: true, orderId: id });
    } catch (e) {
      await connection.rollback();
      console.error("Failed to process order:", e);
      res.status(500).json({ error: "Failed to process order" });
    } finally {
      connection.release();
    }
  });

  app.put("/api/orders/:id/status", verifyAdmin, async (req, res) => {
    const { status } = req.body;
    try {
      await pool.query("UPDATE orders SET status = ? WHERE id = ?", [status, req.params.id]);
      res.json({ success: true });
    } catch (e) { res.status(500).json({ error: 'Update failed' }); }
  });

  app.post("/api/check_pincode", async (req, res) => {
    const { pincode } = req.body;
    const icarryClient = await getICarryClient();
    if (!icarryClient) return res.json({ success: true, serviceable: true }); // Fallback
    
    try {
      const estimate = await icarryClient.getEstimate({
        origin_pincode: '400071', // Default origin (adjust as needed)
        destination_pincode: pincode,
        weight: 500, // Default weight for check
        length: 10, breadth: 10, height: 10
      });
      res.json({ success: true, serviceable: estimate.status !== 'error', details: estimate });
    } catch (e) {
      res.json({ success: true, serviceable: true });
    }
  });



  // Customers
  app.get("/api/customers", verifyAdmin, async (req, res) => {
    const [customers] = await pool.query("SELECT * FROM customers ORDER BY totalSpent DESC");
    res.json(customers);
  });

  // Razorpay Order Creation
  app.post("/api/create_razorpay_order", async (req, res) => {
    const { items, promoCode, customerInfo, shippingCost } = req.body;
    
    try {
      // 1. Calculate and validate total amount from DB prices
      let subtotal = 0;
      for (const item of items) {
        const [prod]: any = await pool.query("SELECT price FROM products WHERE id = ?", [item.id]);
        if (prod.length > 0) {
          subtotal += prod[0].price * item.quantity;
        }
      }

      let discount = 0;
      if (promoCode) {
        const [promos]: any = await pool.query("SELECT * FROM promo_codes WHERE code = ? AND status = 'active'", [promoCode.toUpperCase()]);
        if (promos.length > 0) {
          const promo = promos[0];
          const isExpired = promo.expiryDate && new Date(promo.expiryDate) < new Date();
          const isEligible = subtotal >= (promo.minSpend || 0);

          if (!isExpired && isEligible) {
            if (promo.discountType === 'percentage') {
              discount = Math.round((subtotal * promo.discountValue) / 100);
            } else {
              discount = promo.discountValue;
            }
          }
        }
      }

      const finalAmount = Math.max(0, subtotal - discount + (Number(shippingCost) || 0));
      
      // 2. Initialize Razorpay
      const rzpKey = await getSetting('razorpay_key') || process.env.RAZORPAY_KEY;
      const rzpSecret = await getSetting('razorpay_secret') || process.env.RAZORPAY_SECRET;

      if (!rzpKey || !rzpSecret) {
        return res.status(500).json({ success: false, error: "Razorpay keys not configured" });
      }

      const razorpay = new Razorpay({
        key_id: rzpKey,
        key_secret: rzpSecret,
      });

      // 3. Create Razorpay order
      const rzpOrder = await razorpay.orders.create({
        amount: Math.round(finalAmount * 100), // Razorpay expects amount in paise
        currency: "INR",
        receipt: `receipt_${Date.now()}`,
        notes: {
          customer_name: customerInfo.name,
          customer_email: customerInfo.email
        }
      });

      // 4. PRE-INSERT order into DB as 'pending'
      // This ensures we have a record before the payment widget even opens
      await pool.query(
        "INSERT INTO orders (id, customerName, email, phone, address, city, state, zip, items, totalAmount, paymentMethod, paymentId, status, date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [rzpOrder.id, customerInfo.name, customerInfo.email, customerInfo.phone, customerInfo.address, customerInfo.city, customerInfo.state, customerInfo.zip, JSON.stringify(items), finalAmount, 'razorpay', null, 'pending', new Date().toISOString()]
      );

      res.json({
        success: true,
        order_id: rzpOrder.id,
        amount: rzpOrder.amount,
        currency: rzpOrder.currency,
        razorpay_key: rzpKey,
        final_amount: finalAmount,
        discount: discount
      });

    } catch (error: any) {
      console.error("Razorpay Error:", error);
      res.status(500).json({ success: false, error: error.message || "Failed to create Razorpay order" });
    }
  });

  app.post("/api/verify_razorpay_payment", async (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    
    try {
      const rzpSecret = await getSetting('razorpay_secret') || process.env.RAZORPAY_SECRET;
      if (!rzpSecret) throw new Error("Razorpay secret not found");

      const hmac = crypto.createHmac('sha256', rzpSecret);
      hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
      const generatedSignature = hmac.digest('hex');

      if (generatedSignature === razorpay_signature) {
        // 1. Get order details
        const [orders]: any = await pool.query("SELECT * FROM orders WHERE id = ?", [razorpay_order_id]);
        if (orders.length === 0) throw new Error("Order not found");
        const order = orders[0];

        // 2. Idempotency check — if already paid, don't process again
        if (order.status === 'paid' || order.status === 'processing') {
          console.log(`[Payment] Order ${razorpay_order_id} already processed — skipping duplicate verification`);
          return res.json({ success: true });
        }

        const connection = await pool.getConnection();
        try {
          await connection.beginTransaction();

          // 3. Update order status to 'paid'
          await connection.query(
            "UPDATE orders SET status = 'paid', paymentId = ? WHERE id = ?",
            [razorpay_payment_id, razorpay_order_id]
          );
          
          // 4. Customer logic
          const [existingCust]: any = await connection.query("SELECT * FROM customers WHERE email = ?", [order.email]);
          if (existingCust.length > 0) {
            await connection.query(
              "UPDATE customers SET totalSpent = totalSpent + ?, ordersCount = ordersCount + 1 WHERE email = ?",
              [order.totalAmount, order.email]
            );
          } else {
            await connection.query(
              "INSERT INTO customers (name, email, phone, totalSpent, ordersCount, joinDate) VALUES (?, ?, ?, ?, ?, ?)",
              [order.customerName, order.email, order.phone, order.totalAmount, 1, order.date]
            );
          }

          // 5. Stock deduction
          const items = JSON.parse(order.items);
          for (const item of items) {
            await connection.query(
              "UPDATE products SET stock = GREATEST(0, stock - ?) WHERE id = ?",
              [item.quantity, item.id]
            );
          }

          // 6. Audit Log
          await logAudit(
            'system', 'PAYMENT_VERIFIED', 'order', razorpay_order_id,
            `Payment ${razorpay_payment_id} verified. Order marked paid.`,
            req.ip || '0.0.0.0'
          );

          await connection.commit();
          console.log(`[Payment] Order ${razorpay_order_id} marked PAID — payment ${razorpay_payment_id}`);
        } catch (dbErr: any) {
          await connection.rollback();
          throw dbErr;
        } finally {
          connection.release();
        }

        // 7. Trigger iCarry shipment AFTER payment is confirmed (outside transaction)
        const icarryClient = await getICarryClient();
        if (icarryClient) {
          const pickupId = await getSetting('icarry_pickup_address_id');
          if (pickupId) {
            try {
              const orderItems = JSON.parse(order.items);
              const weightGrams = Math.max(500, orderItems.reduce((sum: number, i: any) => sum + (i.quantity || 1) * 500, 0));

              const bookingResult = await icarryClient.bookShipment({
                pickup_address_id: pickupId,
                client_order_id: razorpay_order_id,
                consignee: {
                  name: order.customerName,
                  mobile: (order.phone || '').replace(/[^0-9]/g, '').slice(-10),
                  address: order.address,
                  city: order.city,
                  pincode: order.zip,
                  state: ICarryClient.getStateCode(order.state),
                },
                parcel: {
                  type: 'Prepaid', // Razorpay = always prepaid
                  value: Math.max(1, order.totalAmount),
                  contents: orderItems.map((i: any) => i.name).join(', '),
                },
                measurements: {
                  weight: weightGrams,
                  length: 15,
                  breadth: 15,
                  height: 10,
                },
              });

              if (bookingResult?.shipment_id) {
                await pool.query(
                  "UPDATE orders SET icarry_shipment_id = ?, icarry_awb = ?, icarry_tracking_url = ?, icarry_status = 'booked', status = 'processing' WHERE id = ?",
                  [bookingResult.shipment_id, bookingResult.awb, bookingResult.tracking_url, razorpay_order_id]
                );
                console.log(`[iCarry] Shipment ${bookingResult.shipment_id} booked for order ${razorpay_order_id} — AWB: ${bookingResult.awb} via ${bookingResult.courier_name}`);
              } else {
                console.error('[iCarry] Booking returned no shipment_id:', bookingResult);
              }
            } catch (icarryErr: any) {
              // iCarry failure must NOT roll back the payment success
              console.error('[iCarry] Shipment booking failed (order is still paid):', icarryErr.message);
            }
          } else {
            console.warn('[iCarry] pickup_address_id not configured — skipping auto-shipment');
          }
        } else {
          console.warn('[iCarry] Client not initialised — ICARRY_USERNAME/ICARRY_KEY missing');
        }

        res.json({ success: true });
      } else {
        console.warn(`[Payment] Signature mismatch for order ${razorpay_order_id}`);
        res.status(400).json({ success: false, error: "Invalid signature" });
      }
    } catch (e: any) {
      console.error("[Payment] Verification Error:", e.message);
      res.status(500).json({ success: false, error: e.message });
    }
  });

  // Backup
  app.get("/api/backup", verifyAdmin, async (req, res) => {
    try {
      const tables = ['products', 'orders', 'customers', 'blogs', 'promo_codes', 'app_settings'];
      const backup: any = {};
      for (const table of tables) {
        const [rows] = await pool.query(`SELECT * FROM ${table}`);
        backup[table] = rows;
      }
      res.json({ success: true, data: backup, timestamp: new Date().toISOString() });
    } catch (e) { res.status(500).json({ error: 'Backup failed' }); }
  });

  // Order Tracking API
  app.post("/api/order_track", async (req, res) => {
    const { orderId, email } = req.body;
    try {
      let query = "SELECT * FROM orders WHERE ";
      let params = [];
      if (orderId) {
        query += "id = ?";
        params.push(orderId);
      } else if (email) {
        query += "email = ?";
        params.push(email);
      } else {
        return res.status(400).json({ success: false, error: "Order ID or Email required" });
      }

      const [rows]: any = await pool.query(query, params);
      if (rows.length === 0) return res.json({ success: false, error: "No orders found" });

      const icarryClient = await getICarryClient();
      const orders = await Promise.all(rows.map(async (row: any) => {
        let tracking = row.icarry_awb ? {
          awb: row.icarry_awb,
          tracking_url: row.icarry_tracking_url,
          current_status: row.icarry_status || row.status,
          milestones: [] 
        } : null;

        // Fetch real-time tracking if we have a shipment ID
        if (icarryClient && row.icarry_shipment_id) {
          try {
            const realTimeTracking = await icarryClient.trackShipment(row.icarry_shipment_id);
            if (realTimeTracking?.success) {
              tracking = {
                ...tracking,
                awb: realTimeTracking.awb || tracking?.awb,
                current_status: realTimeTracking.current_status || tracking?.current_status,
                milestones: realTimeTracking.milestones || []
              };
            }
          } catch (e) {
            console.error("Failed to fetch real-time tracking:", e);
          }
        }

        return {
          id: row.id,
          customerName: row.customerName,
          status: row.status,
          date: row.date,
          totalAmount: row.totalAmount,
          city: row.city,
          state: row.state,
          items: JSON.parse(row.items || "[]"),
          tracking
        };
      }));

      res.json({ success: true, order: orders[0], orders }); 
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Admin Auth API
  const handleLogin = async (req: any, res: any) => {
    const { username, password } = req.body;
    try {
      // Use ILIKE for case-insensitive username check in Postgres
      const [rows]: any = await pool.query("SELECT * FROM admin_users WHERE username ILIKE ?", [username]);
      if (rows.length > 0) {
        const user = rows[0];
        // Resilient check for both 'passwordHash' and 'passwordhash' (Postgres fallback)
        const hash = user.passwordHash || user.passwordhash;
        if (!hash) {
          console.error("User found but no password hash property available:", Object.keys(user));
          return res.status(500).json({ error: "Configuration error" });
        }
        const match = await bcrypt.compare(password, hash);
        if (match) {
          const token = jwt.sign({ username: user.username, id: user.id }, JWT_SECRET, { expiresIn: '12h' });
          return res.json({ success: true, token });
        }
      }
      res.status(401).json({ error: "Invalid credentials" });
    } catch (e: any) {
      console.error("Login Error:", e.message);
      res.status(500).json({ error: "Login failed" });
    }
  };

  app.post("/api/admin/login", handleLogin);
  app.post("/api/login", handleLogin);

  app.get("/api/health", async (req, res) => {
    try {
      const [rows]: any = await pool.query("SELECT username FROM admin_users LIMIT 1");
      const [countRows]: any = await pool.query("SELECT count(*) as count FROM admin_users");
      res.json({ 
        status: "ok", 
        database: "connected", 
        adminCount: countRows[0].count,
        firstAdmin: rows.length > 0 ? rows[0].username : "none"
      });
    } catch (e: any) {
      res.status(500).json({ status: "error", database: "disconnected", error: e.message });
    }
  });

  // iCarry Logistics APIs
  app.post("/api/icarry/estimate", async (req, res) => {
    const icarryClient = await getICarryClient();
    if (!icarryClient) return res.status(500).json({ status: "error", message: "iCarry not configured" });
    try {
      const result = await icarryClient.getEstimate(req.body);
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ status: "error", message: e.message });
    }
  });

  app.post("/api/icarry/track", async (req, res) => {
    const icarryClient = await getICarryClient();
    if (!icarryClient) return res.status(500).json({ status: "error", message: "iCarry not configured" });
    try {
      const result = await icarryClient.trackShipment(req.body.shipment_id);
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ status: "error", message: e.message });
    }
  });

  // iCarry Sync API (Old)
  app.post("/api/icarry/sync", verifyAdmin, async (req, res) => {
    const { orderId } = req.body;
    try {
      const email = await getSetting('icarry_email');
      const password = await getSetting('icarry_password');
      // const baseUrl = await getSetting('icarry_base_url') || 'https://api.icarry.in';

      if (!email || !password) {
        return res.status(400).json({ success: false, error: "iCarry credentials not configured in settings" });
      }

      const [rows]: any = await pool.query("SELECT * FROM orders WHERE id = ?", [orderId]);
      if (rows.length === 0) return res.status(404).json({ error: "Order not found" });
      
      // Placeholder for actual iCarry API call
      res.json({ 
        success: true, 
        message: "Order data prepared for iCarry. Please configure API keys to complete live sync.",
        debug_order: orderId 
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Vite middleware
  if (process.env.NODE_ENV !== "production" && !process.env.VERCEL) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.resolve(__dirname, "dist", "index.html"));
    });
  }

  if (!process.env.VERCEL) {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }
}

export { app, startServer };

if (!process.env.VERCEL) {
  startServer();
}

export default app;
