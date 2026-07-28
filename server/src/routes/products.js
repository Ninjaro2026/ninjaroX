const Product = require('../models/Product');
const { deleteFileFromDrive } = require('./upload');

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
      const existingProduct = await Product.findOne({ id });
      const updatedProduct = await Product.findOneAndUpdate(
        { id },
        { $set: request.body },
        { new: true, runValidators: true }
      );

      if (!updatedProduct) {
        return reply.code(404).send({ error: 'Product not found' });
      }

      // Clean up orphaned images removed during edit
      if (existingProduct) {
        const oldImages = new Set([
          ...(existingProduct.imageSrc ? [existingProduct.imageSrc] : []),
          ...(Array.isArray(existingProduct.images) ? existingProduct.images : [])
        ]);

        const newImages = new Set([
          ...(updatedProduct.imageSrc ? [updatedProduct.imageSrc] : []),
          ...(Array.isArray(updatedProduct.images) ? updatedProduct.images : [])
        ]);

        const removedImages = Array.from(oldImages).filter(img => !newImages.has(img));
        if (removedImages.length > 0) {
          console.log(`[Product Update] Cleaning up ${removedImages.length} removed Google Drive image(s)...`);
          Promise.all(removedImages.map(imgUrl => deleteFileFromDrive(imgUrl)))
            .catch(err => console.warn('[Product Update] Drive cleanup error:', err));
        }
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

      // Collect all image URLs associated with this product
      const imagesToDelete = new Set();
      if (result.imageSrc) imagesToDelete.add(result.imageSrc);
      if (Array.isArray(result.images)) {
        result.images.forEach(img => {
          if (img) imagesToDelete.add(img);
        });
      }

      // Synchronously await deletion of all associated files from Google Drive
      const driveErrors = [];
      if (imagesToDelete.size > 0) {
        console.log(`[Product Delete] Synchronously cleaning up ${imagesToDelete.size} Google Drive image(s) for product ${id}...`);
        const results = await Promise.allSettled(Array.from(imagesToDelete).map(imgUrl => deleteFileFromDrive(imgUrl)));
        results.forEach(res => {
          if (res.status === 'rejected') {
            driveErrors.push(res.reason?.message || 'Drive deletion failed');
          }
        });
      }

      if (driveErrors.length > 0) {
        return reply.code(200).send({ 
          success: true, 
          warning: `Product deleted, but Google Drive image deletion failed: ${driveErrors.join('; ')}`
        });
      }

      return { success: true, message: 'Product and associated Google Drive images deleted successfully' };
    } catch (err) {
      return reply.code(500).send({ error: err.message });
    }
  });
  // POST /api/products/:id/reviews (Add customer review)
  fastify.post('/:id/reviews', async (request, reply) => {
    const { id } = request.params;
    const { userName, rating, comment } = request.body || {};

    if (!userName || !rating || !comment) {
      return reply.code(400).send({ error: 'Name, rating (1-5), and comment are required.' });
    }

    try {
      const product = await Product.findOne({ id });
      if (!product) {
        return reply.code(404).send({ error: 'Product not found' });
      }

      const newReview = {
        id: 'rev-' + Math.random().toString(36).substr(2, 9),
        userName: userName.trim(),
        rating: Number(rating),
        comment: comment.trim(),
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        verified: true
      };

      if (!product.reviews) product.reviews = [];
      product.reviews.unshift(newReview);
      await product.save();

      return { success: true, reviews: product.reviews };
    } catch (err) {
      return reply.code(500).send({ error: err.message });
    }
  });
}

module.exports = productRoutes;
