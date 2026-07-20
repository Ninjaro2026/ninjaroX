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

// Plugins
fastify.register(cors, {
  origin: '*', // For development - allows all origins
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
});

fastify.register(require('./src/plugins/auth'));

// Register Routes
fastify.register(require('./src/routes/auth'), { prefix: '/api/auth' });
fastify.register(require('./src/routes/products'), { prefix: '/api/products' });
fastify.register(require('./src/routes/orders'), { prefix: '/api/orders' });

async function seedData() {
  try {
    // Database Reset completed. (Uncomment below lines if manual wipe is needed)
    // const orderPurge = await Order.deleteMany({});
    // const customerPurge = await User.deleteMany({ role: { $ne: 'admin' } });

    // 1. Seed Admin User
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@ninjaro.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'AdminNinjaro2026!';
    
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
            street: '77 Mocktail Towers, Phase 1',
            city: 'Mumbai',
            state: 'Maharashtra',
            zip: '400051',
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
      const defaultProductImg = defaultProduct ? defaultProduct.imageSrc : '/combo1.png';

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
  } catch (err) {
    console.error(`\x1b[31m  ✗ Data seeding failed: ${err.message}\x1b[0m`);
  }
}

// Start Server
const start = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb+srv://ninjaroin_db_user:moc21G1lwsoPfAMN@cluster0.1cdpz4o.mongodb.net/ninjaro?appName=Cluster0';
    await connectDB(mongoUri);
    console.log(`\n\x1b[1m\x1b[32m[Database]\x1b[0m MongoDB connection established successfully.`);
    await seedData();
    
    const port = process.env.PORT || 5000;
    await fastify.listen({ port, host: '0.0.0.0' });
    console.log(`
\x1b[1m\x1b[35m┌────────────────────────────────────────────────────────┐
│                                                        │
│  \x1b[32m✦ NINJARO BACKEND API SERVER RUNNING\x1b[35m                  │
│                                                        │
│  - Storefront API:   \x1b[36mhttp://localhost:${port}/api\x1b[35m              │
│  - Active Node Env:  \x1b[33mdevelopment\x1b[35m                       │
│                                                        │
└────────────────────────────────────────────────────────┘\x1b[0m
`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
