const express = require('express');
const router = express.Router();
const pool = require('../db');

// ============================================================
// GET /search?national_id=...
//
// [FIXED — was TRAINING VULNERABILITY #1 — SQL INJECTION]
// Originally built a raw SQL string via concatenation. Now uses
// a parameterized query, so user input is always treated as data,
// never as part of the SQL statement itself. Verbose DB error
// details are also no longer returned to the client.
// ============================================================
router.get('/search', (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: 'Not logged in' });

  const nationalId = req.query.national_id || '';

  const query =
    "SELECT ic.id, ic.national_id, ic.status, ic.governorate, ic.registration_date, u.full_name " +
    "FROM insurance_cases ic JOIN users u ON ic.national_id = u.national_id " +
    "WHERE ic.national_id = ?";

  pool.query(query, [nationalId], (err, rows) => {
    if (err) {
      // No longer leaking err.sqlMessage to the client
      return res.status(500).json({ error: 'Query failed' });
    }
    res.json(rows);
  });
});

module.exports = router;
