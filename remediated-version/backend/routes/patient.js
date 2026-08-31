const express = require('express');
const router = express.Router();
const pool = require('../db');

// ============================================================
// GET /patient/:id
//
// [FIXED — was TRAINING VULNERABILITY #2 — BROKEN ACCESS CONTROL / IDOR]
// Previously only checked that *some* user was logged in, never
// that the logged-in doctor was actually assigned to this file, or
// that a citizen was viewing their own record. Now enforces:
//   - admin: full access
//   - doctor: only files where they are the assigned doctor_id
//   - citizen: only their own file (matched by national_id)
// ============================================================
router.get('/patient/:id', (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: 'Not logged in' });

  const fileId = req.params.id;

  pool.query('SELECT * FROM patient_files WHERE id = ?', [fileId], (err, files) => {
    if (err) return res.status(500).json({ error: 'Server error' });
    if (files.length === 0) return res.status(404).json({ error: 'Not found' });

    const file = files[0];
    const user = req.session.user;
    const isAuthorized =
      user.role === 'admin' ||
      (user.role === 'doctor' && user.id === file.doctor_id) ||
      (user.role === 'citizen' && user.national_id === file.national_id);

    if (!isAuthorized) {
      return res.status(403).json({ error: 'You are not authorized to view this file' });
    }

    pool.query('SELECT * FROM medical_notes WHERE file_id = ?', [fileId], (err, notes) => {
      if (err) return res.status(500).json({ error: 'Server error' });
      res.json({ file, notes });
    });
  });
});

// ============================================================
// POST /patient/:id/notes
//
// [TRAINING VULNERABILITY #3 — STORED XSS]
// note_text is stored and later re-rendered by the frontend as raw
// HTML, without escaping. A malicious <script> payload persists and
// fires for every future viewer of this file.
// ============================================================
router.post('/patient/:id/notes', (req, res) => {
  if (!req.session.user || req.session.user.role !== 'doctor') {
    return res.status(403).json({ error: 'Only doctors can add notes' });
  }

  const fileId = req.params.id;
  const { note_text, note_type } = req.body;

  pool.query(
    'INSERT INTO medical_notes (file_id, doctor_id, note_text, note_type) VALUES (?, ?, ?, ?)',
    [fileId, req.session.user.id, note_text, note_type || 'exam'],
    (err, result) => {
      if (err) return res.status(500).json({ error: 'Server error' });
      res.json({ message: 'Note added', id: result.insertId });
    }
  );
});

module.exports = router;
