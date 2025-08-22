const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const router = express.Router();

// Simple in-memory admin user (for demo)
const adminUser = {
  id: 'admin-1',
  email: process.env.ADMIN_EMAIL || 'admin@propeasecrm.local',
  // If ADMIN_HASH is provided, it takes precedence; otherwise hash default password 'admin123'
  passwordHash: process.env.ADMIN_HASH || bcrypt.hashSync(process.env.ADMIN_PASSWORD || 'admin123', 8),
};

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'Email and password required' });

  if (email !== adminUser.email) return res.status(401).json({ message: 'Invalid credentials' });
  const ok = await bcrypt.compare(password, adminUser.passwordHash);
  if (!ok) return res.status(401).json({ message: 'Invalid credentials' });

  const token = jwt.sign({ sub: adminUser.id, role: 'admin' }, process.env.JWT_SECRET || 'dev_secret', {
    expiresIn: '7d',
  });
  res.json({ token });
});

function authMiddleware(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ message: 'Missing token' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret');
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' });
  }
}

// Export the router directly
module.exports = router;


