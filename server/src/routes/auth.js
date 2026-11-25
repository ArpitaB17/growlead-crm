const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = mongoose.models.User || mongoose.model('User', new mongoose.Schema({
  name: String, email: { type: String, unique: true }, password: String }));

const displayName = (u) => u.name || u.email.split('@')[0];
const sign = (u) => jwt.sign({ id: u._id, email: u.email, name: displayName(u) }, process.env.JWT_SECRET, { expiresIn: '8h' });
const session = (u) => ({ token: sign(u), name: displayName(u), email: u.email });

router.post('/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ message: 'Email and password are required' });
  const user = await User.findOne({ email: String(email).trim().toLowerCase() });
  if (!user || !(await bcrypt.compare(password, user.password)))
    return res.status(401).json({ message: 'Invalid credentials' });
  res.json(session(user));
});

router.post('/register', async (req, res) => {
  const { name, email, password } = req.body || {};
  const n = String(name || '').trim();
  const e = String(email || '').trim().toLowerCase();
  if (n.length < 2) return res.status(400).json({ message: 'Please enter your full name' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) return res.status(400).json({ message: 'Enter a valid email address' });
  if (String(password || '').length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters' });
  if (await User.findOne({ email: e })) return res.status(409).json({ message: 'An account with this email already exists' });
  const user = await User.create({ name: n, email: e, password: await bcrypt.hash(password, 10) });
  res.status(201).json(session(user));
});

async function seedAdmin() {
  const email = (process.env.ADMIN_EMAIL || 'admin@example.com').toLowerCase();
  let admin = await User.findOne({ email });
  if (!admin) admin = await User.create({ name: 'Admin', email, password: await bcrypt.hash(process.env.ADMIN_PASSWORD || 'admin123', 10) });
  return admin;
}
module.exports = { router, seedAdmin };
