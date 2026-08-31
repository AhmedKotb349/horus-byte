const express = require('express');
const router = express.Router();
const pool = require('../db');

// ============================================================
// GET /stats
// Aggregate counts for the dashboard widgets. Safe: no user
// input is used in the query.
// ============================================================
router.get('/stats', (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: 'Not logged in' });

  pool.query(
    `SELECT
      (SELECT COUNT(*) FROM users WHERE role='citizen') AS citizens,
      (SELECT COUNT(*) FROM users WHERE role='doctor') AS doctors,
      (SELECT COUNT(*) FROM insurance_cases WHERE status='active') AS active_cases,
      (SELECT COUNT(*) FROM insurance_cases WHERE status='pending') AS pending_cases,
      (SELECT COUNT(*) FROM insurance_cases WHERE status='suspended') AS suspended_cases`,
    (err, rows) => {
      if (err) return res.status(500).json({ error: 'Server error' });
      res.json(rows[0]);
    }
  );
});

// ============================================================
// GET /stats/governorates
// Case count grouped by governorate, for the governorate widget.
// ============================================================
router.get('/stats/governorates', (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: 'Not logged in' });

  pool.query(
    `SELECT governorate, COUNT(*) AS total FROM insurance_cases GROUP BY governorate ORDER BY total DESC`,
    (err, rows) => {
      if (err) return res.status(500).json({ error: 'Server error' });
      res.json(rows);
    }
  );
});

// ============================================================
// GET /doctors
// Public directory of doctors (name + governorate only -- no
// sensitive data). Parameterized/no input, safe by design.
// ============================================================
router.get('/doctors', (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: 'Not logged in' });

  pool.query(
    `SELECT id, full_name, governorate FROM users WHERE role='doctor' ORDER BY governorate, full_name`,
    (err, rows) => {
      if (err) return res.status(500).json({ error: 'Server error' });
      res.json(rows);
    }
  );
});

// ============================================================
// GET /my-patients
// A doctor's OWN patient files only -- correctly filtered by
// doctor_id from the session, not from user input. Shown here
// deliberately alongside the vulnerable /patient/:id endpoint
// so a hunter can compare "what I'm supposed to see" against
// "what I can actually reach by changing the URL".
// ============================================================
router.get('/my-patients', (req, res) => {
  if (!req.session.user || req.session.user.role !== 'doctor') {
    return res.status(403).json({ error: 'Doctors only' });
  }

  pool.query(
    `SELECT pf.id, pf.national_id, u.full_name, pf.governorate, pf.diagnosis_summary
     FROM patient_files pf
     JOIN users u ON pf.national_id = u.national_id
     WHERE pf.doctor_id = ?`,
    [req.session.user.id],
    (err, rows) => {
      if (err) return res.status(500).json({ error: 'Server error' });
      res.json(rows);
    }
  );
});

module.exports = router;
