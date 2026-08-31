# Egyptian Hunting Range — UHIS Mini Portal
### مضمار الاصطياد المصري — Horus Byte

An intentionally vulnerable web application for penetration testing
practice, simulating a small portal for Egypt's Universal Health
Insurance System (UHIS). Built by **Ahmed Kotb** for a
Penetration Testing & Application Security training project.

⚠️ **This is a personal student prototype for educational use only.**
It is **not affiliated with, endorsed by, or connected to** the
Egyptian government, the Universal Health Insurance Authority, or any
official entity. All data is entirely fictional and generated for
this exercise. Do not deploy this application anywhere publicly
reachable — it is deliberately insecure by design.

---

## Quick start

```bash
docker compose up --build
```

Then open **http://localhost:3000**

Seed accounts and shared role passwords are listed in
[`db/CREDENTIALS.md`](db/CREDENTIALS.md).

To reset the lab to a clean state at any time:

```bash
docker compose down -v
docker compose up --build
```

---

## What's inside

- **Backend:** Node.js / Express, session-based auth
- **Database:** MySQL 8, schema + a large generated dataset in `db/init.sql`
  (regenerate anytime with `node db/generate_seed.js`)
- **Frontend:** plain HTML/CSS/JS, multi-page portal (`backend/public/index.html`)
  — includes a dark/light theme toggle, an Arabic/English language toggle,
  and a live session timer
- **Roles:** citizen, doctor, admin
- **Scale:** ~78 citizens, ~16 doctors, 3 admins across 10 governorates —
  not just one or two sample records

## Pages / widgets

| Page | What it shows |
|---|---|
| **Dashboard** | Stat widgets (citizens, doctors, case status counts), a case-distribution-by-governorate bar chart, a doctor's own "My Patients" list, and direct file-ID lookup |
| **Search** | Insurance case lookup by national ID (vulnerable — see below) |
| **Doctors** | Public directory of all doctors, filterable by governorate |
| **Patient file** | Diagnosis summary + medical notes, opened from the dashboard |

## Three planted vulnerabilities

| # | Vulnerability | Where | OWASP category |
|---|---|---|---|
| 1 | SQL Injection (error-based + UNION-based) | `GET /api/search?national_id=` | A03:2021 – Injection |
| 2 | Stored XSS | Medical notes on a patient file | A03:2021 – Injection |
| 3 | Broken Access Control (IDOR) | `GET /api/patient/:id` | A01:2021 – Broken Access Control |

Each vulnerability is marked with a `[TRAINING VULNERABILITY]` comment
directly in the source code (see `backend/routes/search.js` and
`backend/routes/patient.js`) — but try to find them black-box first,
before reading the source.

The `/api/stats`, `/api/doctors`, and `/api/my-patients` endpoints in
`backend/routes/dashboard.js` are deliberately written **securely** —
useful as a contrast when writing up "what good code looks like here"
in your report.

## Suggested hunting methodology

1. **Recon** — log in with a seed account, map every page, form, and
   API call (Burp Suite's proxy history is ideal for this).
2. **Manual probing** — try `'`, `"`, and boolean payloads in the
   search box; try incrementing IDs in the patient file URL (compare
   against what "My Patients" legitimately shows you); try posting a
   `<script>` tag as a medical note.
3. **Confirm & exploit** — use Burp Suite Repeater to confirm each
   finding, then SQLMap against the search endpoint to automate and
   deepen the SQL injection.
4. **Document** — screenshot each step, the request/response pair,
   and the impact, then write up a CVSS-scored finding for each bug.

## Remediation (for the "after" report)

- Search endpoint: replace string concatenation with a parameterized
  query.
- Medical notes: HTML-escape `note_text` before rendering, or render
  as `textContent` instead of `innerHTML`.
- Patient file endpoint: add an authorization check comparing
  `req.session.user` against the file's `doctor_id` / `national_id`
  before returning data (see `/api/my-patients` for the correct
  pattern already used elsewhere in this codebase).

## License / use

Educational use only, for this training project and for any student
who wants to practice the same methodology afterward.

