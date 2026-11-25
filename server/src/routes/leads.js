const router = require('express').Router();
const mongoose = require('mongoose');
const { Lead, STATUSES, SOURCES } = require('../models/Lead');

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE = /^\+?[\d\s()-]{7,20}$/;

function validate(b, partial = false) {
  const errors = {};
  const req = (k, label) => { if (!partial || k in b) if (!String(b[k] ?? '').trim()) errors[k] = `${label} is required`; };
  req('name', 'Name'); req('email', 'Email'); req('phone', 'Phone'); req('company', 'Company');
  if (b.email && !EMAIL.test(b.email)) errors.email = 'Invalid email address';
  if (b.phone && !PHONE.test(b.phone)) errors.phone = 'Invalid phone number';
  if (b.status && !STATUSES.includes(b.status)) errors.status = `Status must be one of ${STATUSES.join(', ')}`;
  if (b.source && !SOURCES.includes(b.source)) errors.source = `Source must be one of ${SOURCES.join(', ')}`;
  return errors;
}
const pick = (b) => Object.fromEntries(['name', 'email', 'phone', 'company', 'source', 'status']
  .filter((k) => b[k] !== undefined).map((k) => [k, typeof b[k] === 'string' ? b[k].trim() : b[k]]));
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

router.get('/stats', async (req, res) => {
  const rows = await Lead.aggregate([{ $match: { owner: new mongoose.Types.ObjectId(req.user.id) } }, { $group: { _id: '$status', n: { $sum: 1 } } }]);
  const stats = Object.fromEntries(STATUSES.map((s) => [s, 0]));
  rows.forEach((r) => { stats[r._id] = r.n; });
  stats.total = Object.values(stats).reduce((a, b) => a + b, 0);
  res.json(stats);
});

router.get('/', async (req, res) => {
  const { q, status, source } = req.query;
  const filter = { owner: req.user.id };
  if (status) filter.status = status;
  if (source) filter.source = source;
  if (q) { const re = new RegExp(esc(String(q)), 'i'); filter.$or = [{ name: re }, { email: re }, { company: re }, { phone: re }]; }
  res.json(await Lead.find(filter).sort({ createdAt: -1 }));
});

router.get('/:id', async (req, res) => {
  const lead = await Lead.findOne({ _id: req.params.id, owner: req.user.id });
  if (!lead) return res.status(404).json({ message: 'Lead not found' });
  res.json(lead);
});

router.post('/', async (req, res) => {
  const errors = validate(req.body);
  if (Object.keys(errors).length) return res.status(400).json({ message: 'Validation failed', errors });
  res.status(201).json(await Lead.create({ ...pick(req.body), owner: req.user.id }));
});

router.put('/:id', async (req, res) => {
  const errors = validate(req.body, true);
  if (Object.keys(errors).length) return res.status(400).json({ message: 'Validation failed', errors });
  const lead = await Lead.findOneAndUpdate({ _id: req.params.id, owner: req.user.id }, pick(req.body), { new: true, runValidators: true });
  if (!lead) return res.status(404).json({ message: 'Lead not found' });
  res.json(lead);
});

router.delete('/:id', async (req, res) => {
  const lead = await Lead.findOneAndDelete({ _id: req.params.id, owner: req.user.id });
  if (!lead) return res.status(404).json({ message: 'Lead not found' });
  res.status(204).end();
});
module.exports = router;
