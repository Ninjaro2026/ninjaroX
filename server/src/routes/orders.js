const Order = require('../models/Order');
const Product = require('../models/Product');
const Razorpay = require('razorpay');
const crypto = require('crypto');

// Initialize Razorpay SDK
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_glhF13Fdod0C1P',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'zEFHvSNSX7bSzm8n8Ph8z11f'
});

async function orderRoutes(fastify, opts) {
  // GET /api/orders
  // Admin gets all orders. Customer gets their own orders.
  fastify.get('/', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      const user = request.currentUser;
      let query = {};
      if (user.role !== 'admin') {
        query.userId = user._id;
      }
      const orders = await Order.find(query).sort({ createdAt: -1 });
      return orders;
    } catch (err) {
      return reply.code(500).send({ error: err.message });
    }
  });

  // GET /api/orders/track/:id (Public - for order tracking)
  fastify.get('/track/:id', async (request, reply) => {
    const { id } = request.params;
    try {
      const order = await Order.findOne({ id: id.toUpperCase() });
      if (!order) {
        return reply.code(404).send({ error: 'Order not found' });
      }
      return order;
    } catch (err) {
      return reply.code(500).send({ error: err.message });
    }
  });

  // POST /api/orders/payment (Create Razorpay payment order)
  fastify.post('/payment', async (request, reply) => {
    const { total } = request.body || {};
    if (!total) {
      return reply.code(400).send({ error: 'Please provide amount total' });
    }

    try {
      const options = {
        amount: Math.round(total * 100), // amount in paisa
        currency: "INR",
        receipt: "receipt_order_" + Math.floor(1000 + Math.random() * 9000)
      };
      const rzpOrder = await razorpay.orders.create(options);
      return {
        id: rzpOrder.id,
        amount: rzpOrder.amount,
        currency: rzpOrder.currency,
        key: process.env.RAZORPAY_KEY_ID || 'rzp_test_glhF13Fdod0C1P'
      };
    } catch (err) {
      return reply.code(500).send({ error: err.message });
    }
  });

  // POST /api/orders (Public / Authenticated - Create and verify order)
  fastify.post('/', async (request, reply) => {
    const orderData = request.body || {};
    
    // Check if token exists to link user
    let userId = null;
    try {
      const decoded = await request.jwtVerify();
      userId = decoded.id;
    } catch (err) {
      // Not logged in or guest checkout - continue
    }

    try {
      // 1. Generate unique custom ID like NZ-9942
      let idExists = true;
      let generatedId = '';
      while (idExists) {
        const randNum = Math.floor(1000 + Math.random() * 9000);
        generatedId = `NZ-${randNum}`;
        const match = await Order.findOne({ id: generatedId });
        if (!match) idExists = false;
      }

      // 2. Validate items & Update stocks
      const items = orderData.items || [];
      if (items.length === 0) {
        return reply.code(400).send({ error: 'No items in order' });
      }

      // 3. Verify payment signature for online store purchases
      if (!orderData.isPOS) {
        const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = orderData;
        if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
          return reply.code(400).send({ error: 'Missing Razorpay payment credentials' });
        }

        const generatedSignature = crypto
          .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'zEFHvSNSX7bSzm8n8Ph8z11f')
          .update(razorpayOrderId + "|" + razorpayPaymentId)
          .digest('hex');

        if (generatedSignature !== razorpaySignature) {
          return reply.code(400).send({ error: 'Payment signature verification failed' });
        }
      }

      const allProducts = await Product.find();

      // We need to decrement stock for ordered items
      for (const item of items) {
        const product = allProducts.find(p => p.name === item.name || p.name.includes(item.name) || item.name.includes(p.name));
        if (product) {
          if (product.isCombo && product.comboItems) {
            // Decrement components
            for (const cItem of product.comboItems) {
              const component = allProducts.find(p => p.id === cItem.productId);
              if (component) {
                const requiredStock = cItem.quantity * item.quantity;
                if (component.stock < requiredStock) {
                  return reply.code(400).send({ 
                    error: `Insufficient stock for component product: ${component.name}. Available: ${component.stock}` 
                  });
                }
                component.stock -= requiredStock;
                await component.save();
              }
            }
          } else {
            // Decrement single product
            if (product.stock < item.quantity) {
              return reply.code(400).send({ 
                error: `Insufficient stock for product: ${product.name}. Available: ${product.stock}` 
              });
            }
            product.stock -= item.quantity;
            await product.save();
          }
        }
      }

      // 4. Create Order in DB
      const newOrder = new Order({
        id: generatedId,
        userId: userId,
        date: orderData.date || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        status: orderData.isPOS ? 'Delivered' : (orderData.status || 'Processing'),
        total: orderData.total,
        eta: orderData.isPOS ? 'Delivered' : (orderData.eta || '3-5 business days'),
        trackingStep: orderData.isPOS ? 4 : (orderData.trackingStep || 1),
        customerName: orderData.customerName,
        shippingAddress: orderData.shippingAddress,
        shippingCity: orderData.shippingCity,
        shippingZip: orderData.shippingZip,
        shippingMethod: orderData.shippingMethod || 'standard',
        isPOS: orderData.isPOS || false,
        posPaymentMode: orderData.posPaymentMode,
        posCustomerPhone: orderData.posCustomerPhone,
        razorpayOrderId: orderData.razorpayOrderId,
        razorpayPaymentId: orderData.razorpayPaymentId,
        razorpaySignature: orderData.razorpaySignature
      });

      // Map items with images and prices
      newOrder.items = items.map(item => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        img: item.img || '/combo1.png'
      }));

      await newOrder.save();
      return newOrder;
    } catch (err) {
      return reply.code(500).send({ error: err.message });
    }
  });

  // PUT /api/orders/:id (Admin Only - Update order status & tracking)
  fastify.put('/:id', { preHandler: [fastify.requireAdmin] }, async (request, reply) => {
    const { id } = request.params; // Custom ID like NZ-9942
    const updateData = request.body || {};
    
    try {
      const order = await Order.findOne({ id: id.toUpperCase() });
      if (!order) {
        return reply.code(404).send({ error: 'Order not found' });
      }

      if (updateData.status) {
        order.status = updateData.status;
        
        // Auto update tracking step based on status
        if (updateData.status === 'Processing') order.trackingStep = 1;
        else if (updateData.status === 'Shipped') order.trackingStep = 2;
        else if (updateData.status === 'Out for Delivery') order.trackingStep = 3;
        else if (updateData.status === 'Delivered') order.trackingStep = 4;
        else if (updateData.status === 'Cancelled') order.trackingStep = 0;
      }

      if (updateData.trackingStep !== undefined) {
        order.trackingStep = updateData.trackingStep;
      }
      
      if (updateData.eta !== undefined) {
        order.eta = updateData.eta;
      }

      await order.save();
      return order;
    } catch (err) {
      return reply.code(500).send({ error: err.message });
    }
  });
}

module.exports = orderRoutes;
