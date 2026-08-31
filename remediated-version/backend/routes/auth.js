const express = require('express');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const pool = require('../db');

// FIXED — was WSTG-ATHN finding: no limit on failed login attempts,
// leaving the endpoint open to unthrottled brute-force attacks.
// Allows 5 attempts per 15 minutes per IP.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Please try again later.' },
});

// POST /login
router.post('/login', loginLimiter, (req, res) => {
  const { national_id, password } = req.body;

  // Parameterized query -- login itself is NOT the injected vulnerability
  pool.query(
    'SELECT * FROM users WHERE national_id = ?',
    [national_id],
    (err, rows) => {
      if (err) return res.status(500).json({ error: 'Server error' });
      if (rows.length === 0) return res.status(401).json({ error: 'Invalid credentials' });

      const user = rows[0];
      bcrypt.compare(password, user.password_hash, (err, match) => {
        if (err || !match) return res.status(401).json({ error: 'Invalid credentials' });

        req.session.user = {
          id: user.id,
          national_id: user.national_id,
          full_name: user.full_name,
          role: user.role,
          governorate: user.governorate,
        };
        res.json({ message: 'Logged in', user: req.session.user });
      });
    }
  );
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => res.json({ message: 'Logged out' }));
});

router.get('/me', (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: 'Not logged in' });
  res.json(req.session.user);
});

module.exports = router;
