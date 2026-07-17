const Product = require('../models/Product');

async function productRoutes(fastify, opts) {
  // GET /api/products
  fastify.get('/', async (request, reply) => {
    try {
      const products = await Product.find().sort({ priority: 1, createdAt: -1 });
      return products;
    } catch (err) {
      return reply.code(500).send({ error: err.message });
    }
  });

  // GET /api/products/:id
  fastify.get('/:id', async (request, reply) => {
    const { id } = request.params;
    try {
      const product = await Product.findOne({ id });
      if (!product) {
        return reply.code(404).send({ error: 'Product not found' });
      }
      return product;
    } catch (err) {
      return reply.code(500).send({ error: err.message });
    }
  });

  // POST /api/products (Admin Only)
  fastify.post('/', { preHandler: [fastify.requireAdmin] }, async (request, reply) => {
    try {
      const prodData = request.body || {};
      
      // Auto-assign custom id if not provided
      if (!prodData.id) {
        prodData.id = 'prod-' + Math.random().toString(36).substr(2, 9);
      }

      const product = new Product(prodData);
      await product.save();
      return product;
    } catch (err) {
      return reply.code(500).send({ error: err.message });
    }
  });

  // PUT /api/products/:id (Admin Only)
  fastify.put('/:id', { preHandler: [fastify.requireAdmin] }, async (request, reply) => {
    const { id } = request.params;
    try {
      const updatedProduct = await Product.findOneAndUpdate(
        { id },
        { $set: request.body },
        { new: true, runValidators: true }
      );

      if (!updatedProduct) {
        return reply.code(404).send({ error: 'Product not found' });
      }
      return updatedProduct;
    } catch (err) {
      return reply.code(500).send({ error: err.message });
    }
  });

  // DELETE /api/products/:id (Admin Only)
  fastify.delete('/:id', { preHandler: [fastify.requireAdmin] }, async (request, reply) => {
    const { id } = request.params;
    try {
      const result = await Product.findOneAndDelete({ id });
      if (!result) {
        return reply.code(404).send({ error: 'Product not found' });
      }
      return { success: true, message: 'Product deleted successfully' };
    } catch (err) {
      return reply.code(500).send({ error: err.message });
    }
  });
}

module.exports = productRoutes;
