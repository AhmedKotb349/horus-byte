const express = require('express');
const router = express.Router();
const pool = require('../db');

// ============================================================
// GET /search?national_id=...
//
// [TRAINING VULNERABILITY #1 — SQL INJECTION]
// This endpoint builds a raw SQL string via concatenation instead
// of using a parameterized query. It intentionally mirrors the
// pattern practiced in the PortSwigger SQLi labs (blind conditional
// response, blind conditional error, visible error-based) so the
// same manual + Burp Suite + SQLMap methodology applies here.
//
// DO NOT copy this pattern into real applications.
// ============================================================
router.get('/search', (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: 'Not logged in' });

  const nationalId = req.query.national_id || '';

  const query =
    "SELECT ic.id, ic.national_id, ic.status, ic.governorate, ic.registration_date, u.full_name " +
    "FROM insurance_cases ic JOIN users u ON ic.national_id = u.national_id " +
    "WHERE ic.national_id = '" + nationalId + "'";

  pool.query(query, (err, rows) => {
    if (err) {
      // Verbose error output -- intentionally supports error-based SQLi
      return res.status(500).json({ error: 'Query failed', details: err.sqlMessage });
    }
    res.json(rows);
  });
});

module.exports = router;
