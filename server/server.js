require('dotenv').config();
const fastify = require('fastify')({
  disableRequestLogging: true,
  logger: {
    level: 'error',
    transport: {
      target: 'pino-pretty',
      options: {
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname',
        colorize: true
      }
    }
  }
});
const cors = require('@fastify/cors');
const connectDB = require('./src/config/db');

// Models
const User = require('./src/models/User');
const Order = require('./src/models/Order');
const Product = require('./src/models/Product');

// Compact logging hook
fastify.addHook('onResponse', (request, reply, done) => {
  if (request.method === 'OPTIONS') {
    done();
    return;
  }
  
  const method = request.method;
  const url = request.url;
  const statusCode = reply.statusCode;
  const responseTime = Math.round(reply.elapsedTime || 0);
  
  let statusColor = '\x1b[32m'; // Green
  if (statusCode >= 500) statusColor = '\x1b[31m'; // Red
  else if (statusCode >= 400) statusColor = '\x1b[33m'; // Yellow
  else if (statusCode >= 300) statusColor = '\x1b[36m'; // Cyan

  const methodColor = method === 'GET' ? '\x1b[32m' : 
                      method === 'POST' ? '\x1b[34m' : 
                      method === 'PUT' ? '\x1b[33m' : 
                      method === 'DELETE' ? '\x1b[31m' : '\x1b[35m';
                      
  const reset = '\x1b[0m';
  const bold = '\x1b[1m';
  
  console.log(`  \x1b[90m[API]\x1b[0m ${bold}${methodColor}${method.padEnd(6)}${reset} ${url.padEnd(30)} → ${statusColor}${statusCode}${reset} \x1b[90m(${responseTime}ms)\x1b[0m`);
  done();
});

// Completely Unrestricted CORS — allow anywhere, any header, any method
fastify.register(cors, {
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'],
  allowedHeaders: ['*'],
  exposedHeaders: ['*'],
  credentials: false,
  preflightContinue: false,
  optionsSuccessStatus: 204
});

// Force CORS headers on every response BEFORE Vercel can issue redirects
fastify.addHook('onRequest', async (request, reply) => {
  reply.raw.setHeader('Access-Control-Allow-Origin', '*');
  reply.raw.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS');
  reply.raw.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-API-Key');
  // Immediately handle preflight — never allow Vercel to redirect an OPTIONS request
  if (request.method === 'OPTIONS') {
    reply.raw.statusCode = 204;
    reply.raw.end();
  }
});

fastify.register(require('./src/plugins/auth'));

// Register Routes
fastify.register(require('./src/routes/auth'), { prefix: '/api/auth' });
fastify.register(require('./src/routes/products'), { prefix: '/api/products' });
fastify.register(require('./src/routes/orders'), { prefix: '/api/orders' });
fastify.register(require('./src/routes/upload'), { prefix: '/api/upload' });

async function seedData() {
  try {
    // Database Reset completed. (Uncomment below lines if manual wipe is needed)
    // const orderPurge = await Order.deleteMany({});
    // const customerPurge = await User.deleteMany({ role: { $ne: 'admin' } });

    // 1. Seed Admin User
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;
    
    const adminExists = await User.findOne({ email: adminEmail });
    if (!adminExists) {
      const admin = new User({
        name: 'Ninjaro Admin',
        email: adminEmail,
        password: adminPassword,
        role: 'admin',
        addresses: [
          {
            label: 'Ninjaro Headquarters',
            street: 'Madhyamgram',
            city: 'Madhyamgram',
            district: 'Kolkata',
            state: 'West Bengal',
            zip: '700129',
            isDefault: true
          }
        ]
      });
      await admin.save();
      console.log(`\x1b[32m  ✦ Admin user seeded successfully:\x1b[0m ${adminEmail}`);
    } else {
      console.log(`\x1b[36m  ☞ Admin credentials ready:\x1b[0m ${adminEmail}`);
    }

    // 2. Fix historical POS orders that were created with "Processing" status
    const posFix = await Order.updateMany(
      { isPOS: true, status: { $ne: 'Delivered' } },
      { $set: { status: 'Delivered', trackingStep: 4, eta: 'Delivered' } }
    );
    if (posFix.modifiedCount > 0) {
      console.log(`\x1b[32m  ✦ Corrected ${posFix.modifiedCount} historical POS orders to 'Delivered' status\x1b[0m`);
    }

    // 3. Fix historical POS / Online orders that have no items array or empty items array
    const Product = require('./src/models/Product');
    const ordersWithNoItems = await Order.find({ $or: [{ items: { $exists: false } }, { items: { $size: 0 } }] });
    if (ordersWithNoItems.length > 0) {
      const defaultProduct = await Product.findOne();
      const defaultProductName = defaultProduct ? defaultProduct.name : 'Premium Classic Mocktail';
      const defaultProductImg = defaultProduct ? defaultProduct.imageSrc : '/combo1.jpeg';

      for (const order of ordersWithNoItems) {
        order.items = [{
          name: defaultProductName,
          quantity: 1,
          price: order.total,
          img: defaultProductImg
        }];
        await order.save();
      }
      console.log(`\x1b[32m  ✦ Corrected ${ordersWithNoItems.length} historical orders missing items array\x1b[0m`);
    }

    // 4. Convert all .png product and order image references to .jpeg in DB and ensure files exist
    const path = require('path');
    const fs = require('fs');
    const publicDir = path.join(__dirname, '../client/public');

    if (fs.existsSync(publicDir)) {
      const publicFiles = fs.readdirSync(publicDir);
      for (const file of publicFiles) {
        if (file.toLowerCase().endsWith('.png')) {
          const pngPath = path.join(publicDir, file);
          const jpegName = file.replace(/\.png$/i, '.jpeg');
          const jpegPath = path.join(publicDir, jpegName);
          if (!fs.existsSync(jpegPath)) {
            fs.copyFileSync(pngPath, jpegPath);
            console.log(`\x1b[32m  ✦ Copied public file:\x1b[0m ${file} -> ${jpegName}`);
          }
        }
      }
    }

    const allProds = await Product.find({ imageSrc: /\.png$/i });
    for (const p of allProds) {
      p.imageSrc = p.imageSrc.replace(/\.png$/i, '.jpeg');
      await p.save();
      console.log(`\x1b[32m  ✦ Updated product DB image:\x1b[0m ${p.name} -> ${p.imageSrc}`);
    }

    const allOrders = await Order.find({ 'items.img': /\.png$/i });
    for (const o of allOrders) {
      let modified = false;
      o.items.forEach(item => {
        if (item.img && item.img.endsWith('.png')) {
          item.img = item.img.replace(/\.png$/i, '.jpeg');
          modified = true;
        }
      });
      if (modified) await o.save();
    }
  } catch (err) {
    console.error(`\x1b[31m  ✗ Data seeding failed: ${err.message}\x1b[0m`);
  }
}

// Start Server for Local Development
const start = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (mongoUri) {
      await connectDB(mongoUri);
      console.log(`\n\x1b[1m\x1b[32m[Database]\x1b[0m MongoDB connection established successfully.`);
      await seedData();
    }
    
    const port = process.env.PORT;
    const serverUrl = process.env.SERVER_URL;
    await fastify.listen({ port: port ? Number(port) : 5000, host: '0.0.0.0' });
    console.log(`
\x1b[1m\x1b[35m┌────────────────────────────────────────────────────────┐
│                                                        │
│  \x1b[32m✦ NINJARO BACKEND API SERVER RUNNING\x1b[35m                  │
│                                                        │
│  - Storefront API:   \x1b[36m${serverUrl}/api\x1b[35m              │
│  - Active Node Env:  \x1b[33mdevelopment\x1b[35m                       │
│                                                        │
└────────────────────────────────────────────────────────┘\x1b[0m
`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

// Vercel Serverless Function Export
let isConnected = false;
const handler = async (req, res) => {
  // Always attach CORS headers to all responses immediately
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  // Finish OPTIONS preflight immediately with 204 No Content
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  try {
    if (!isConnected) {
      const mongoUri = process.env.MONGO_URI;
      if (mongoUri) {
        await connectDB(mongoUri);
        isConnected = true;
      }
    }
    await fastify.ready();
    fastify.server.emit('request', req, res);
  } catch (err) {
    console.error('Vercel Handler Exception:', err);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: err.message || 'Internal Server Error' }));
  }
};

if (!process.env.VERCEL) {
  start();
}

module.exports = handler;
module.exports.default = handler;
