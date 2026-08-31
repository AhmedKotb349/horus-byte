// One-off generator: produces db/init.sql with a large, realistic
// fake dataset for the UHIS training portal. Not part of the app runtime.

const fs = require('fs');

const CITIZEN_HASH = '$2a$10$lGtDCBcZ0o3DEXavAfXilet7OzXz4huu3KJmAhJyoBO/bzmJtLHCS'; // Citizen@123
const DOCTOR_HASH  = '$2a$10$lYd.wmRk6BPrf3us9lIEVeJ8erYaLMYgNuCheEjnNnKOvmcFQpzOa'; // Doctor@123
const ADMIN_HASH   = '$2a$10$hb/wjFo7zjRRGAPbYq80uukkUVfQRGqNusjbFlVr03uM.wJDpfkh.'; // Admin@123

const governorates = [
  'Cairo', 'Alexandria', 'Giza', 'Port Said', 'Luxor',
  'Aswan', 'Ismailia', 'South Sinai', 'Suez', 'Dakahlia'
];
const govCode = { 'Cairo':'01','Alexandria':'02','Giza':'03','Port Said':'04','Luxor':'05',
  'Aswan':'06','Ismailia':'07','South Sinai':'08','Suez':'09','Dakahlia':'10' };

const maleFirst = ['Ahmed','Mohamed','Omar','Kareem','Mostafa','Youssef','Khaled','Tarek','Hassan','Sherif','Amr','Mahmoud','Ali','Sameh','Waleed'];
const femaleFirst = ['Mona','Laila','Nourhan','Salma','Dina','Heba','Rania','Yasmin','Nadia','Farida','Mai','Aya','Shaimaa','Hind','Rasha'];
const lastNames = ['Fathy','Zaki','Adel','Nabil','Mostafa','Kamal','Fouad','Gaber','Salem','Ibrahim','Hassan','Saad','Ezz','Rashad','Anwar','Farouk','Sabry','Hegazy','Aziz','Nasr'];

// Training IDs are intentionally 10 digits — clearly different from
// Egypt's real 14-digit national ID format, so nobody mistakes this
// prototype's identifiers for real ones.
// Format: 9 (fake-data marker, real IDs start with 2 or 3) + governorate
// code (2) + sequence (3) + random (4) = 10 digits.
let nidSeq = 100;
function makeNID(gov){
  const seq = String(nidSeq++).padStart(3,'0');
  const rand = String(Math.floor(Math.random()*10000)).padStart(4,'0');
  return '9' + govCode[gov] + seq + rand;
}
function pick(arr){ return arr[Math.floor(Math.random()*arr.length)]; }
function esc(s){ return s.replace(/'/g, "''"); }

const users = []; // {national_id, full_name, hash, role, governorate}
const doctorsByGov = {};

// --- Admins (3, based in Cairo) ---
const adminNames = ['Khaled Mostafa','Nermeen Sabry','Ayman Farouk'];
adminNames.forEach(name => {
  const nid = makeNID('Cairo');
  users.push({national_id: nid, full_name: name, hash: ADMIN_HASH, role:'admin', governorate:'Cairo'});
});

// --- Doctors (18, spread across governorates) ---
let isFirstDoctor = true;
governorates.forEach(gov => {
  const count = gov === 'Cairo' || gov === 'Alexandria' || gov === 'Giza' ? 3 : 1;
  doctorsByGov[gov] = [];
  for(let i=0;i<count;i++){
    let name;
    if(isFirstDoctor){
      name = 'Dr. Ahmed Kotb';
      isFirstDoctor = false;
    } else {
      const first = pick(Math.random()<0.5?maleFirst:femaleFirst);
      const last = pick(lastNames);
      name = 'Dr. ' + first + ' ' + last;
    }
    const nid = makeNID(gov);
    const user = {national_id: nid, full_name: name, hash: DOCTOR_HASH, role:'doctor', governorate: gov};
    users.push(user);
    doctorsByGov[gov].push(user);
  }
});

// --- Citizens (70, spread across governorates) ---
const citizens = [];
governorates.forEach(gov => {
  const count = gov === 'Cairo' || gov === 'Alexandria' || gov === 'Giza' ? 12 : 6;
  for(let i=0;i<count;i++){
    const first = pick(Math.random()<0.5?maleFirst:femaleFirst);
    const last = pick(lastNames);
    const name = first + ' ' + last;
    const nid = makeNID(gov);
    const user = {national_id: nid, full_name: name, hash: CITIZEN_HASH, role:'citizen', governorate: gov};
    users.push(user);
    citizens.push(user);
  }
});

// --- Insurance cases (one per citizen) ---
const statuses = ['active','active','active','pending','pending','suspended'];
const cases = citizens.map(c => ({
  national_id: c.national_id,
  status: pick(statuses),
  governorate: c.governorate,
  registration_date: `202${1+Math.floor(Math.random()*5)}-${String(1+Math.floor(Math.random()*12)).padStart(2,'0')}-${String(1+Math.floor(Math.random()*28)).padStart(2,'0')}`
}));

// --- Patient files (one per citizen, assigned to a doctor in same governorate) ---
const diagnoses = [
  'Routine checkup - stable', 'Follow-up required next month', 'Mild hypertension, monitoring',
  'Seasonal flu, prescribed rest', 'Post-surgery recovery on track', 'Diabetes management, stable',
  'Referred to specialist for further tests', 'Annual screening - no concerns', 'Physiotherapy course ongoing',
  'Vaccination record updated'
];
const files = citizens.map((c, idx) => {
  const docList = doctorsByGov[c.governorate];
  const doctor = docList[idx % docList.length];
  return { national_id: c.national_id, doctor, governorate: c.governorate, diagnosis: pick(diagnoses) };
});

const noteTexts = [
  'Patient in good general condition. No action needed.',
  'Blood pressure slightly elevated, recommend recheck in 2 weeks.',
  'Lab results within normal range.',
  'Advised patient to reduce salt intake and increase physical activity.',
  'Scheduled follow-up appointment for next visit.',
  'Prescribed medication course for 7 days.',
  'Patient reports improvement since last visit.'
];
const noteTypes = ['exam','diagnosis','follow_up'];

// ============================================================
// Build SQL
// ============================================================
let sql = `-- ============================================================
-- UHIS Mini Portal — Database Schema
-- Egyptian Hunting Range (مضمار الاصطياد المصري)
-- Personal student training prototype — NOT an official or
-- government system. All data below is entirely fictional,
-- generated for penetration-testing practice only.
-- ============================================================
-- WARNING: This schema intentionally contains insecure patterns
-- (raw SQL concatenation, unescaped rendering) for educational
-- penetration testing purposes only. Never use in production.
-- ============================================================

CREATE DATABASE IF NOT EXISTS uhis_portal;
USE uhis_portal;

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    national_id VARCHAR(10) NOT NULL UNIQUE,
    full_name VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('citizen', 'doctor', 'admin') NOT NULL DEFAULT 'citizen',
    governorate VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE insurance_cases (
    id INT AUTO_INCREMENT PRIMARY KEY,
    national_id VARCHAR(10) NOT NULL,
    status ENUM('active', 'pending', 'suspended') NOT NULL DEFAULT 'pending',
    governorate VARCHAR(50) NOT NULL,
    registration_date DATE NOT NULL,
    FOREIGN KEY (national_id) REFERENCES users(national_id)
);

CREATE TABLE patient_files (
    id INT AUTO_INCREMENT PRIMARY KEY,
    national_id VARCHAR(10) NOT NULL,
    doctor_id INT NOT NULL,
    governorate VARCHAR(50) NOT NULL,
    diagnosis_summary VARCHAR(255),
    FOREIGN KEY (national_id) REFERENCES users(national_id),
    FOREIGN KEY (doctor_id) REFERENCES users(id)
);

CREATE TABLE medical_notes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    file_id INT NOT NULL,
    doctor_id INT NOT NULL,
    note_text TEXT NOT NULL,
    note_type ENUM('exam', 'diagnosis', 'follow_up') NOT NULL DEFAULT 'exam',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (file_id) REFERENCES patient_files(id),
    FOREIGN KEY (doctor_id) REFERENCES users(id)
);

-- ============================================================
-- SEED DATA (fake / synthetic only — never real citizen data)
-- ============================================================

INSERT INTO users (national_id, full_name, password_hash, role, governorate) VALUES\n`;

sql += users.map(u =>
  `('${u.national_id}', '${esc(u.full_name)}', '${u.hash}', '${u.role}', '${u.governorate}')`
).join(',\n') + ';\n\n';

sql += `INSERT INTO insurance_cases (national_id, status, governorate, registration_date) VALUES\n`;
sql += cases.map(c =>
  `('${c.national_id}', '${c.status}', '${c.governorate}', '${c.registration_date}')`
).join(',\n') + ';\n\n';

// patient_files reference doctor_id by position (1-indexed, after admins+doctors, computed at insert time)
// We instead insert files using a subquery on national_id for doctor lookup, since AUTO_INCREMENT ids
// aren't known ahead of time in this script.
sql += `INSERT INTO patient_files (national_id, doctor_id, governorate, diagnosis_summary) VALUES\n`;
sql += files.map(f =>
  `('${f.national_id}', (SELECT id FROM users WHERE national_id='${f.doctor.national_id}'), '${f.governorate}', '${esc(f.diagnosis)}')`
).join(',\n') + ';\n\n';

// medical_notes: one note per file, file_id looked up by national_id (files are 1:1 with citizens here)
sql += `INSERT INTO medical_notes (file_id, doctor_id, note_text, note_type) VALUES\n`;
sql += files.map(f => {
  const note = pick(noteTexts);
  const ntype = pick(noteTypes);
  return `((SELECT id FROM patient_files WHERE national_id='${f.national_id}'), (SELECT id FROM users WHERE national_id='${f.doctor.national_id}'), '${esc(note)}', '${ntype}')`;
}).join(',\n') + ';\n';

fs.writeFileSync('/home/claude/uhis-range/db/init.sql', sql);

// Also regenerate CREDENTIALS.md with shared role passwords + a sample of accounts
let cred = `# Seed Accounts (fake / synthetic data — training use only)

This prototype ships with a large generated dataset so hunting doesn't rely
on just 1-2 records. All passwords are shared per role for convenience.

| Role | Password |
|---|---|
| citizen | Citizen@123 |
| doctor | Doctor@123 |
| admin | Admin@123 |

## Sample accounts to start with

| Name | National ID (login) | Role | Governorate |
|---|---|---|---|
`;
[...users.filter(u=>u.role==='admin'), ...users.filter(u=>u.role==='doctor').slice(0,6), ...users.filter(u=>u.role==='citizen').slice(0,6)]
  .forEach(u => { cred += `| ${u.full_name} | ${u.national_id} | ${u.role} | ${u.governorate} |\n`; });

cred += `\nFull dataset: **${users.filter(u=>u.role==='citizen').length} citizens**, **${users.filter(u=>u.role==='doctor').length} doctors**, **${users.filter(u=>u.role==='admin').length} admins** across ${governorates.length} governorates — query \`users\` table directly for the complete list. All names, IDs, and records are fictional.\n`;

fs.writeFileSync('/home/claude/uhis-range/db/CREDENTIALS.md', cred);

console.log('Generated:', users.length, 'users /', citizens.length, 'citizens /', files.length, 'files');
