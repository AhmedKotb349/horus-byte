const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');

const authRoutes = require('./routes/auth');
const searchRoutes = require('./routes/search');
const patientRoutes = require('./routes/patient');
const dashboardRoutes = require('./routes/dashboard');

const app = express();

app.use(bodyParser.json());
app.use(
  session({
    secret: 'uhis-training-lab-secret', // intentionally weak, static secret
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true },
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
