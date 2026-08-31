const express = require('express');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const bodyParser = require('body-parser');
const path = require('path');

const pool = require('./db');
const authRoutes = require('./routes/auth');
const searchRoutes = require('./routes/search');
const patientRoutes = require('./routes/patient');
const dashboardRoutes = require('./routes/dashboard');

const app = express();

const sessionStore = new MySQLStore({}, pool);

app.use(bodyParser.json());
app.use(
  session({
    secret: 'uhis-training-lab-secret',
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: { httpOnly: true },
  })
);

app.use(express.static(path.join(__dirname, 'public')));

app.use('/api', authRoutes);
app.use('/api', searchRoutes);
app.use('/api', patientRoutes);
app.use('/api', dashboardRoutes);

const PORT = process.env.PORT || 3000;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`UHIS mini portal (training lab) running on port ${PORT}`);
  });
}

module.exports = app;
