const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('../config/db');
require('dotenv').config();

const router = express.Router();

// ─── ADMIN LOGIN ──────────────────────────────────────────────
router.post('/admin/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password required' });
  }

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const valid = bcrypt.compareSync(password, user.password_hash);
  if (!valid) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, name: user.name, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );

  res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
});

// ─── CUSTOMER OTP SEND ────────────────────────────────────────
router.post('/customer/send-otp', (req, res) => {
  const { name, mobile } = req.body;
  if (!name || !mobile) {
    return res.status(400).json({ message: 'Name and mobile number required' });
  }

  // Generate a 4-digit OTP (in production use a real SMS service)
  const otp = Math.floor(1000 + Math.random() * 9000).toString();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5 min

  // Upsert customer
  let customer = db.prepare('SELECT * FROM customers WHERE mobile = ?').get(mobile);
  if (!customer) {
    const customerId = 'CUST-' + Date.now().toString(36).toUpperCase();
    db.prepare(`
      INSERT INTO customers (customer_id, name, mobile, otp_code, otp_expires_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(customerId, name, mobile, otp, expiresAt);
  } else {
    db.prepare(`UPDATE customers SET otp_code = ?, otp_expires_at = ?, name = ? WHERE mobile = ?`)
      .run(otp, expiresAt, name, mobile);
  }

  // In production, send OTP via SMS. For now, return it in response (dev only).
  console.log(`📱 OTP for ${mobile}: ${otp}`);
  res.json({ message: 'OTP sent successfully', otp_dev: otp });
});

// ─── CUSTOMER OTP VERIFY ──────────────────────────────────────
router.post('/customer/verify-otp', (req, res) => {
  const { mobile, otp } = req.body;
  if (!mobile || !otp) {
    return res.status(400).json({ message: 'Mobile and OTP required' });
  }

  const customer = db.prepare('SELECT * FROM customers WHERE mobile = ?').get(mobile);
  if (!customer) {
    return res.status(404).json({ message: 'Customer not found' });
  }

  if (customer.otp_code !== otp) {
    return res.status(401).json({ message: 'Invalid OTP' });
  }

  if (new Date(customer.otp_expires_at) < new Date()) {
    return res.status(401).json({ message: 'OTP expired' });
  }

  // Mark verified
  db.prepare('UPDATE customers SET is_verified = 1, otp_code = NULL, otp_expires_at = NULL WHERE id = ?')
    .run(customer.id);

  const token = jwt.sign(
    { id: customer.id, mobile: customer.mobile, name: customer.name, role: 'customer' },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.json({
    token,
    customer: {
      id: customer.id,
      customer_id: customer.customer_id,
      name: customer.name,
      mobile: customer.mobile,
      has_purchased: customer.has_purchased,
      eligible_for_benefit: customer.eligible_for_benefit
    }
  });
});

// ─── VERIFY TOKEN (for frontend auth check) ──────────────────
router.get('/me', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: 'No token' });

  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    res.json(payload);
  } catch {
    res.status(401).json({ message: 'Invalid token' });
  }
});

module.exports = router;
