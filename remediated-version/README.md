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

| # | Vulnerability | Where | OWASP category | Status |
|---|---|---|---|---|
| 1 | SQL Injection (error-based + UNION-based) | `GET /api/search?national_id=` | A03:2021 – Injection | ✅ Fixed |
| 2 | Stored XSS | Medical notes on a patient file | A03:2021 – Injection | ✅ Fixed |
| 3 | Broken Access Control (IDOR) | `GET /api/patient/:id` | A01:2021 – Broken Access Control | ✅ Fixed |
| 4 | Missing rate limiting on login | `POST /api/login` | A07:2021 – Auth Failures | ✅ Fixed |
| 5 | Missing `SameSite` cookie attribute | Session cookie | A05:2021 – Security Misconfiguration | ✅ Fixed |
| 6 | `X-Powered-By` framework disclosure | All responses | A05:2021 – Security Misconfiguration | ✅ Fixed |

All six were found using a black-box **OWASP WSTG** methodology (see
below) rather than being hunted one-by-one from a known list — #4-6
were only discovered *because* the testing followed the full WSTG
category set instead of stopping at the three originally-planted
bugs. All six are now fixed in this codebase; see the `[FIXED — was
TRAINING VULNERABILITY ...]` comments in `backend/routes/search.js`,
`backend/routes/patient.js`, `backend/routes/auth.js`,
`backend/server.js`, and `backend/public/index.html` for exactly
what changed and why.

To re-create the *vulnerable* state for a fresh hunting exercise,
check out the version of this repo before the remediation commit, or
ask for the pre-fix source of any single file.

The `/api/stats`, `/api/doctors`, and `/api/my-patients` endpoints in
`backend/routes/dashboard.js` were written **securely from the
start** — useful as a contrast when writing up "what good code looks
like here" in your report.

## Suggested hunting methodology

This project was hunted using the **OWASP Web Security Testing Guide
(WSTG) v4.2** black-box methodology — "the tester knows nothing, or
as little as possible, about the application" — rather than jumping
straight to known bugs. Categories used, in order:

1. **WSTG-INFO** (Information Gathering) — map every endpoint via
   Burp's proxy history; check response headers for tech disclosure.
2. **WSTG-CONF** (Configuration & Deployment) — probe for exposed
   files (`/.env`, `/package.json`), check allowed HTTP methods,
   directory listing.
3. **WSTG-ATHN** (Authentication Testing) — test error message
   consistency (user enumeration), brute-force/rate-limit behavior.
4. **WSTG-SESS** (Session Management) — inspect cookie flags
   (`HttpOnly`, `Secure`, `SameSite`), test session invalidation on
   logout.
5. **WSTG-ATHZ** (Authorization Testing) — compare a doctor's
   legitimate file list (`/api/my-patients`) against what IDs are
   actually reachable via `/api/patient/:id`.
6. **WSTG-INPV** (Input Validation) — test every input field (search
   box, note field) with a single quote and a harmless HTML tag
   first, before a full payload, to confirm sanitization is absent.

Then: **confirm & exploit** each finding in Burp Repeater, deepen the
SQL injection with SQLMap, and **document** every step with
screenshots and a CVSS score per finding.

## Remediation applied

- **SQL Injection**: `search.js` now uses a parameterized query
  (`WHERE ic.national_id = ?`) instead of string concatenation, and
  no longer returns `err.sqlMessage` to the client.
- **Stored XSS**: the frontend now builds each note as separate DOM
  nodes with `textContent` instead of concatenating raw HTML into
  `innerHTML`, so note text is always treated as plain text.
- **Broken Access Control**: `GET /api/patient/:id` now checks that
  the requester is an admin, the file's assigned doctor, or the
  file's own citizen before returning any data.
- **Missing rate limiting**: `POST /api/login` is now limited to 5
  attempts per 15 minutes per IP via `express-rate-limit`.
- **Missing `SameSite`**: the session cookie now sets
  `sameSite: 'lax'` alongside `httpOnly`.
- **`X-Powered-By` disclosure**: disabled globally via
  `app.disable('x-powered-by')`.

## License / use

Educational use only, for this training project and for any student
who wants to practice the same methodology afterward.
