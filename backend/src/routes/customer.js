const express = require('express');
const db = require('../config/db');
const { verifyCustomer } = require('../middleware/auth');
const router = express.Router();

router.use(verifyCustomer);

// ─── MY PROFILE ──────────────────────────────────────────────
router.get('/profile', (req, res) => {
  const customer = db.prepare('SELECT id, customer_id, name, mobile, email, address, has_purchased, purchased_scooter_id, purchased_variant, purchased_color, purchase_date, eligible_for_benefit, created_at FROM customers WHERE id = ?').get(req.user.id);
  if (!customer) return res.status(404).json({ message: 'Not found' });

  let scooterName = null;
  if (customer.purchased_scooter_id) {
    const s = db.prepare('SELECT name FROM scooters WHERE id = ?').get(customer.purchased_scooter_id);
    if (s) scooterName = s.name;
  }

  res.json({ ...customer, purchased_scooter_name: scooterName });
});

// ─── MY INTRODUCTIONS ────────────────────────────────────────
router.get('/introductions', (req, res) => {
  const introductions = db.prepare('SELECT * FROM introductions WHERE existing_customer_id = ? ORDER BY created_at DESC').all(req.user.id);
  res.json(introductions);
});

// ─── MY BENEFITS ─────────────────────────────────────────────
router.get('/benefits', (req, res) => {
  const benefits = db.prepare('SELECT * FROM benefits WHERE customer_id = ? ORDER BY created_at DESC').all(req.user.id);

  const summary = {
    pending: 0,
    approved: 0,
    paid: 0,
    total_earned: 0,
    items: benefits
  };

  benefits.forEach(b => {
    if (b.status === 'Benefit Pending') summary.pending += b.amount;
    if (b.status === 'Benefit Approved') summary.approved += b.amount;
    if (b.status === 'Benefit Paid') { summary.paid += b.amount; summary.total_earned += b.amount; }
  });

  res.json(summary);
});

// ─── AVAILABLE OFFERS ────────────────────────────────────────
router.get('/offers', (req, res) => {
  const now = new Date().toISOString();
  const offers = db.prepare(`SELECT * FROM offers WHERE active = 1 AND (start_date IS NULL OR start_date <= ?) AND (end_date IS NULL OR end_date >= ?) ORDER BY created_at DESC`).all(now, now);
  res.json(offers);
});

module.exports = router;
