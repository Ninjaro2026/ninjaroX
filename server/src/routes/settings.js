const Settings = require('../models/Settings');

async function settingsRoutes(fastify, opts) {
  // GET /api/settings/top-offer
  fastify.get('/top-offer', async (request, reply) => {
    try {
      const setting = await Settings.findOne({ key: 'topOfferText' });
      const defaultText = '🎁 Free Shipping Order Above ₹249 & Apply 5% Discount on Checkout';
      return { topOfferText: setting ? setting.value : defaultText };
    } catch (err) {
      return reply.code(500).send({ error: err.message });
    }
  });

  // PUT /api/settings/top-offer (Admin Only)
  fastify.put('/top-offer', { preHandler: [fastify.requireAdmin] }, async (request, reply) => {
    try {
      const { topOfferText } = request.body || {};
      if (typeof topOfferText !== 'string') {
        return reply.code(400).send({ error: 'topOfferText must be a string' });
      }

      const updated = await Settings.findOneAndUpdate(
        { key: 'topOfferText' },
        { key: 'topOfferText', value: topOfferText.trim() },
        { upsert: true, new: true }
      );

      return { success: true, topOfferText: updated.value };
    } catch (err) {
      return reply.code(500).send({ error: err.message });
    }
  });
}

module.exports = settingsRoutes;
