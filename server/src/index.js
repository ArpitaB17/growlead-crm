require('dns').setServers(['8.8.8.8', '1.1.1.1']);
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const auth = require('./middleware/auth');
const { router: authRoutes, seedAdmin } = require('./routes/auth');
const leadRoutes = require('./routes/leads');

const app = express();
app.use(cors({ origin: process.env.CLIENT_ORIGIN || true }));
app.use(express.json());

// Express 4 does not catch async errors; wrap handlers so they reach the error middleware.
const wrap = (r) => { r.stack.forEach((l) => { if (l.route) l.route.stack.forEach((s) => {
  const fn = s.handle; s.handle = (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next); }); }); return r; };

app.get('/api/health', (_, res) => res.json({ ok: true }));
app.use('/api/auth', wrap(authRoutes));
app.use('/api/leads', auth, wrap(leadRoutes));

app.use((req, res) => res.status(404).json({ message: 'Route not found' }));
app.use((err, req, res, next) => {
  if (err.code === 11000) return res.status(409).json({ message: 'A lead with this email already exists', errors: { email: 'Email already exists' } });
  if (err.name === 'CastError') return res.status(400).json({ message: 'Invalid ID' });
  if (err.name === 'ValidationError') return res.status(400).json({ message: err.message });
  console.error(err);
  res.status(500).json({ message: 'Internal server error' });
});

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const admin = await seedAdmin();
  const { Lead } = require('./models/Lead');
  await Lead.syncIndexes(); // email is now unique per account, not globally
  await Lead.updateMany({ owner: { $exists: false } }, { owner: admin._id }); // existing leads go to admin
  app.listen(process.env.PORT || 5000, () => console.log('API running'));
}).catch((e) => { console.error('DB connection failed', e.message); process.exit(1); });
