const express = require('express');
const router = express.Router();
const { User, Client } = require('../models');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  let user = await User.findOne({ where: { email } });
  let isClient = false;
  if (!user) {
    user = await Client.findOne({ where: { email } });
    isClient = true;
  }

  if (!user) return res.status(401).json({ error: 'Invalid credentials' });

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

  const payload = { id: user.id, email: user.email, role: isClient ? 'client' : user.role, name: user.name };

  // If we logged in via the User table but this user is a client, try to map to the client record
  if (!isClient && payload.role === 'client') {
    const client = await Client.findOne({ where: { email } });
    if (client) payload.clientId = client.id;
  }

  const token = jwt.sign(payload, process.env.JWT_SECRET || 'devsecret', { expiresIn: '8h' });
  res.json({ token, user: payload });
});

module.exports = router;
