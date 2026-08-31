# Horus Byte — UHIS Mini Portal (Hunting Range)

مضمار الاصطياد المصري — a self-built, intentionally-vulnerable training
lab simulating a portal for Egypt's Universal Health Insurance System
(UHIS). Built by **Ahmed Kotb** for a Penetration Testing & Application
Security project.

⚠️ **Educational use only.** Not affiliated with, endorsed by, or
connected to the Egyptian government or any official entity. All
accounts and data are entirely fictional.

## What's in this repo

| Folder | Purpose |
|---|---|
| [`vulnerable-version/`](vulnerable-version) | The original build — six deliberate vulnerabilities (SQLi, Stored XSS, IDOR, missing rate limiting, missing SameSite, X-Powered-By disclosure). **This is the live hunting range.** |
| [`remediated-version/`](remediated-version) | The same app with every finding fixed and re-verified. Use it to compare before/after or to check a fix you wrote yourself. |
| [`docs/`](docs) | The full penetration testing report (PDF), the exploitation walkthrough (HTML), and the presentation deck (PPTX). |

## 🎯 Live demo

**Hunting range (vulnerable version):** `<add your live URL here after deploying>`

Seed accounts and shared role passwords: [`vulnerable-version/db/CREDENTIALS.md`](vulnerable-version/db/CREDENTIALS.md).

This instance is deliberately exploitable — that's the point. Please:
- Only use it against this training instance, not real systems.
- Don't use it to store or submit real personal data.
- Expect the database to get reset periodically as other students test on it.

## Running it yourself

Each version is a self-contained Docker Compose stack:

```bash
cd vulnerable-version   # or remediated-version
docker compose up --build
```

Then open **http://localhost:3000**.

## Deploying (what this live demo runs on)

Both versions read their DB connection from environment variables
(`DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_SSL`) and
their HTTP port from `PORT`, so they deploy cleanly to any Node host
pointed at any MySQL host — see the deployment guide in this
conversation for the exact free-tier setup (Render + Aiven MySQL) used
for the live demo.

## Reports

- [Penetration Testing Report (PDF)](docs/Horus_Byte_Penetration_Testing_Report.pdf)
- [Exploitation Walkthrough (HTML)](docs/Horus_Byte_Breach_Walkthrough.html)
- [Presentation (PPTX)](docs/Horus_Byte_Presentation.pptx)
