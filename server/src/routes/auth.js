const User = require('../models/User');

async function authRoutes(fastify, opts) {
  // POST /api/auth/register
  fastify.post('/register', async (request, reply) => {
    const { name, email, password } = request.body || {};

    if (!name || !email || !password) {
      return reply.code(400).send({ error: 'Please provide name, email and password' });
    }

    try {
      const exists = await User.findOne({ email: email.toLowerCase() });
      if (exists) {
        return reply.code(400).send({ error: 'Email already registered' });
      }

      // Enforce: standard registration cannot create admin users
      const user = new User({
        name,
        email: email.toLowerCase(),
        password,
        role: 'customer'
      });

      await user.save();

      const token = fastify.jwt.sign({ id: user._id, email: user.email, role: user.role });
      
      return {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          addresses: user.addresses
        }
      };
    } catch (err) {
      return reply.code(500).send({ error: err.message });
    }
  });

  // POST /api/auth/login
  fastify.post('/login', async (request, reply) => {
    const { email, password } = request.body || {};

    if (!email || !password) {
      return reply.code(400).send({ error: 'Please provide email and password' });
    }

    try {
      const user = await User.findOne({ email: email.toLowerCase() });
      if (!user) {
        return reply.code(401).send({ error: 'Invalid email or password' });
      }

      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return reply.code(401).send({ error: 'Invalid email or password' });
      }

      const token = fastify.jwt.sign({ id: user._id, email: user.email, role: user.role });

      return {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          addresses: user.addresses
        }
      };
    } catch (err) {
      return reply.code(500).send({ error: err.message });
    }
  });

  // GET /api/auth/me
  fastify.get('/me', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const user = request.currentUser;
    return {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        addresses: user.addresses
      }
    };
  });

  // GET /api/auth/addresses
  fastify.get('/addresses', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    return request.currentUser.addresses;
  });

  // POST /api/auth/addresses
  fastify.post('/addresses', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { label, street, city, state, zip, isDefault } = request.body || {};

    if (!label || !street || !city || !state || !zip) {
      return reply.code(400).send({ error: 'Missing address fields' });
    }

    try {
      const user = request.currentUser;
      
      // If setting this address as default, unset previous default
      if (isDefault) {
        user.addresses.forEach(a => a.isDefault = false);
      }

      const newAddress = {
        label,
        street,
        city,
        state,
        zip,
        isDefault: isDefault || user.addresses.length === 0
      };

      user.addresses.push(newAddress);
      await user.save();

      return user.addresses;
    } catch (err) {
      return reply.code(500).send({ error: err.message });
    }
  });

  // DELETE /api/auth/addresses/:id
  fastify.delete('/addresses/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { id } = request.params;
    
    try {
      const user = request.currentUser;
      const index = user.addresses.findIndex(a => a._id.toString() === id);
      if (index === -1) {
        return reply.code(404).send({ error: 'Address not found' });
      }

      const wasDefault = user.addresses[index].isDefault;
      user.addresses.splice(index, 1);

      // If we deleted the default address, set another one as default
      if (wasDefault && user.addresses.length > 0) {
        user.addresses[0].isDefault = true;
      }

      await user.save();
      return user.addresses;
    } catch (err) {
      return reply.code(500).send({ error: err.message });
    }
  });
}

module.exports = authRoutes;
