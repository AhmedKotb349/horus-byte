const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');

const authRoutes = require('./routes/auth');
const searchRoutes = require('./routes/search');
const patientRoutes = require('./routes/patient');
const dashboardRoutes = require('./routes/dashboard');

const app = express();

// FIXED — was WSTG-CONF finding: X-Powered-By leaked "Express" on
// every response, giving an attacker free framework fingerprinting.
app.disable('x-powered-by');

app.use(bodyParser.json());
app.use(
  session({
    secret: 'uhis-training-lab-secret', // intentionally weak, static secret
    resave: false,
    saveUninitialized: false,
    // FIXED — was WSTG-SESS finding: cookie had no SameSite attribute,
    // leaving no built-in CSRF protection at the cookie level.
    cookie: { httpOnly: true, sameSite: 'lax' },
  })
);

app.use(express.static(path.join(__dirname, 'public')));

app.use('/api', authRoutes);
app.use('/api', searchRoutes);
app.use('/api', patientRoutes);
app.use('/api', dashboardRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`UHIS mini portal (training lab) running on port ${PORT}`);
});
