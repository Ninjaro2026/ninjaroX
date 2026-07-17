const fp = require('fastify-plugin');
const jwt = require('@fastify/jwt');
const User = require('../models/User');

async function authPlugin(fastify, opts) {
  fastify.register(jwt, {
    secret: process.env.JWT_SECRET || 'supersecretjwtkeyforninjarobrandjwt',
    sign: {
      expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15d'
    }
  });

  fastify.decorate('authenticate', async function (request, reply) {
    try {
      await request.jwtVerify();
      const user = await User.findById(request.user.id);
      if (!user) {
        reply.code(401).send({ error: 'User not found' });
        return;
      }
      request.currentUser = user;
    } catch (err) {
      reply.code(401).send({ error: 'Unauthorized: Invalid token' });
    }
  });

  fastify.decorate('requireAdmin', async function (request, reply) {
    try {
      await request.jwtVerify();
      const user = await User.findById(request.user.id);
      if (!user || user.role !== 'admin') {
        reply.code(403).send({ error: 'Forbidden: Admin access required' });
        return;
      }
      request.currentUser = user;
    } catch (err) {
      reply.code(401).send({ error: 'Unauthorized: Invalid token' });
    }
  });
}

module.exports = fp(authPlugin);
