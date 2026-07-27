require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const mongoose = require('mongoose');
const Product = require('./src/models/Product');
const Order = require('./src/models/Order');

async function updateDbPngToJpeg() {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    throw new Error('MONGO_URI environment variable is missing.');
  }
  console.log('Connecting to MongoDB...');
  await mongoose.connect(mongoUri);
  console.log('Connected.');

  // Update Products
  const products = await Product.find();
  console.log(`Found ${products.length} products in DB.`);

  let updatedProdCount = 0;
  for (const prod of products) {
    let modified = false;
    if (prod.imageSrc && prod.imageSrc.endsWith('.png')) {
      const oldImg = prod.imageSrc;
      prod.imageSrc = prod.imageSrc.replace(/\.png$/i, '.jpeg');
      modified = true;
      console.log(`Product [${prod.name}]: ${oldImg} -> ${prod.imageSrc}`);
    }
    if (modified) {
      await prod.save();
      updatedProdCount++;
    }
  }
  console.log(`Updated ${updatedProdCount} products in DB.`);

  // Update Orders
  const orders = await Order.find();
  let updatedOrderCount = 0;
  for (const order of orders) {
    let modified = false;
    if (order.items && Array.isArray(order.items)) {
      for (const item of order.items) {
        if (item.img && item.img.endsWith('.png')) {
          const oldImg = item.img;
          item.img = item.img.replace(/\.png$/i, '.jpeg');
          modified = true;
          console.log(`Order Item [${item.name}]: ${oldImg} -> ${item.img}`);
        }
      }
    }
    if (modified) {
      await order.save();
      updatedOrderCount++;
    }
  }
  console.log(`Updated ${updatedOrderCount} orders in DB.`);

  await mongoose.disconnect();
  console.log('Done DB update.');
}

updateDbPngToJpeg().catch(err => {
  console.error('Error updating DB:', err);
  process.exit(1);
});
