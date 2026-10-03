/**
 * Vercel Serverless Function — wraps the Express backend as a single serverless handler.
 * On each cold start the in-memory SQLite database is initialised and seeded so that
 * Vercel's ephemeral filesystem doesn't cause data loss between restarts.
 */
const express = require('express');
const cors = require('cors');
const path = require('path');

// ── Database (custom wrapper around sql.js) ──────────────────
const db = require('../backend/src/config/db');

let _initialised = false;

async function ensureDB() {
  if (_initialised) return;

  await db.initDB();

  const { initializeDatabase } = require('../backend/src/models');
  initializeDatabase();

  // Auto-seed on every cold start so Vercel always has data
  const bcrypt = require('bcryptjs');

  // Seed admin
  const adminExists = db.prepare('SELECT COUNT(*) as count FROM users').get();
  if (!adminExists || adminExists.count === 0) {
    const hash = bcrypt.hashSync('admin123', 10);
    db.prepare('INSERT INTO users (email, password_hash, name, role) VALUES (?, ?, ?, ?)').run('admin@olashowroom.com', hash, 'Showroom Admin', 'admin');
  }

  // Seed showroom settings
  const settingsExist = db.prepare('SELECT COUNT(*) as count FROM showroom_settings').get();
  if (!settingsExist || settingsExist.count === 0) {
    db.prepare(`
      INSERT INTO showroom_settings (
        id, showroom_name, address, phone, whatsapp, email,
        opening_hours, about, google_maps_link, latitude, longitude, location_enabled,
        instagram_url, facebook_url
      ) VALUES (
        1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
      )
    `).run(
      'OLA Electric Showroom',
      'Plot 14, Auto Complex, Near Metro Gate 2, City Center',
      '8003356163',
      '8003356163',
      'info@olashowroom.com',
      'Mon-Sat: 9:00 AM - 8:00 PM | Sun: 10:00 AM - 6:00 PM',
      'Welcome to our authorized OLA Electric Showroom. We offer the latest range of OLA electric scooters with the best service, genuine parts, and comprehensive after-sales support.',
      'https://maps.google.com/?q=26.9124,75.7873',
      '26.9124',
      '75.7873',
      1,
      '',
      ''
    );
  }

  // Seed benefit settings
  const benefitExists = db.prepare('SELECT COUNT(*) as count FROM benefit_settings').get();
  if (!benefitExists || benefitExists.count === 0) {
    db.prepare(
      `INSERT INTO benefit_settings (id, title, description, amount, enabled) VALUES (1, ?, ?, ?, ?)`
    ).run(
      '₹501 Complimentary Benefit',
      'Purchase your scooter from us and introduce someone who purchases an eligible scooter from our showroom. You will receive a ₹501 complimentary benefit.',
      501,
      1
    );
  }

  // Seed sample scooters
  const scooterCount = db.prepare('SELECT COUNT(*) as count FROM scooters').get();
  if (!scooterCount || scooterCount.count === 0) {
    const scooters = [
      { slug: 'ola-s1-pro', name: 'OLA S1 Pro', model: 'S1', variant: 'Pro', description: 'The OLA S1 Pro is the ultimate electric scooter with best-in-class range, performance, and technology.', price: 139999, ex_showroom_price: 134999, on_road_price: 139999, battery_info: '3.97 kWh Li-ion NMC', range_km: '170 km (Eco mode)', top_speed: '120 km/h', charging_time: '6.5 hours (home charger)', motor_info: '8.5 kW mid-drive motor', features: JSON.stringify(['MoveOS 4', 'Cruise Control', 'Hill Assist', 'Reverse Mode', '7-inch Touchscreen', 'Navigation']), warranty: '3 years / unlimited km', stock_quantity: 15, status: 'Available' },
      { slug: 'ola-s1-air', name: 'OLA S1 Air', model: 'S1', variant: 'Air', description: 'The affordable and stylish OLA S1 Air brings electric mobility to everyone.', price: 109999, ex_showroom_price: 104999, on_road_price: 109999, battery_info: '2.5 kWh Li-ion', range_km: '100 km (Eco mode)', top_speed: '85 km/h', charging_time: '5 hours (home charger)', motor_info: '4.5 kW hub motor', features: JSON.stringify(['MoveOS 3', 'LED Headlamp', 'Bluetooth Connectivity']), warranty: '3 years / unlimited km', stock_quantity: 20, status: 'Available' },
      { slug: 'ola-s1-x-plus', name: 'OLA S1 X+', model: 'S1', variant: 'X+', description: 'The most affordable OLA scooter with a 3 kWh battery.', price: 89999, ex_showroom_price: 84999, on_road_price: 89999, battery_info: '3 kWh Li-ion', range_km: '151 km (Eco mode)', top_speed: '90 km/h', charging_time: '6 hours (home charger)', motor_info: '6 kW hub motor', features: JSON.stringify(['MoveOS 3', 'LED DRL', 'Geo-fencing', 'Smart Key']), warranty: '3 years / unlimited km', stock_quantity: 25, status: 'Available' },
      { slug: 'ola-roadster', name: 'OLA Roadster', model: 'Roadster', variant: 'Standard', description: 'The upcoming OLA Roadster electric motorcycle.', price: 199999, ex_showroom_price: 194999, on_road_price: 199999, battery_info: '6 kWh Li-ion', range_km: '200 km', top_speed: '140 km/h', charging_time: '45 min (fast charger)', motor_info: '11 kW motor', features: JSON.stringify(['MoveOS 5', 'AI Navigation', 'Traction Control']), warranty: '5 years / 100,000 km', stock_quantity: 0, status: 'Coming Soon' },
    ];

    const insertStmt = db.prepare(`INSERT INTO scooters (slug, name, model, variant, description, price, ex_showroom_price, on_road_price, battery_info, range_km, top_speed, charging_time, motor_info, features, warranty, images, stock_quantity, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
    scooters.forEach(s => {
      insertStmt.run(s.slug, s.name, s.model, s.variant, s.description, s.price, s.ex_showroom_price, s.on_road_price, s.battery_info, s.range_km, s.top_speed, s.charging_time, s.motor_info, s.features, s.warranty, JSON.stringify([]), s.stock_quantity, s.status);
    });

    const colorInsert = db.prepare('INSERT INTO colors (scooter_id, name, hex_code, stock_qty, status) VALUES (?, ?, ?, ?, ?)');
    colorInsert.run(1, 'Jet Black', '#1a1a1a', 5, 'Available');
    colorInsert.run(1, 'Porcelain White', '#f5f5f0', 4, 'Available');
    colorInsert.run(1, 'Liquid Silver', '#c0c0c0', 3, 'Limited Stock');
    colorInsert.run(1, 'Cherry Red', '#dc143c', 3, 'Available');
    colorInsert.run(2, 'Stellar Black', '#2b2b2b', 8, 'Available');
    colorInsert.run(2, 'Cloud White', '#f8f8ff', 6, 'Available');
    colorInsert.run(2, 'Coral Glow', '#ff7f50', 6, 'Available');
    colorInsert.run(3, 'Neo Black', '#0d0d0d', 10, 'Available');
    colorInsert.run(3, 'Pearl White', '#fafafa', 8, 'Available');
    colorInsert.run(3, 'Racing Green', '#006400', 7, 'Available');
    colorInsert.run(4, 'Thunder Black', '#0a0a0a', 0, 'Sold Out');
    colorInsert.run(4, 'Neon Yellow', '#ccff00', 0, 'Sold Out');
  }

  // Seed sample offers
  const offerCount = db.prepare('SELECT COUNT(*) as count FROM offers').get();
  if (!offerCount || offerCount.count === 0) {
    const insertOffer = db.prepare('INSERT INTO offers (title, description, active) VALUES (?, ?, ?)');
    insertOffer.run('Festive Season Offer', 'Get up to ₹10,000 off on all OLA S1 models this festive season!', 1);
    insertOffer.run('Exchange Bonus', 'Exchange your old petrol scooter and get an additional ₹5,000 off.', 1);
    insertOffer.run('Easy EMI Finance', 'Own your dream OLA scooter with easy EMI starting from ₹2,499/month.', 1);
  }

  // Seed sample customers
  const customerCount = db.prepare('SELECT COUNT(*) as count FROM customers').get();
  if (!customerCount || customerCount.count === 0) {
    const insertCust = db.prepare('INSERT INTO customers (customer_id, name, mobile, email, has_purchased, purchased_scooter_id, purchased_variant, purchased_color, eligible_for_benefit, is_verified) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)');
    insertCust.run('CUST-001', 'Rahul Sharma', '9876543210', 'rahul@example.com', 1, 1, 'Pro', 'Jet Black', 1);
    insertCust.run('CUST-002', 'Priya Patel', '9876543211', 'priya@example.com', 1, 2, 'Air', 'Cloud White', 1);
    insertCust.run('CUST-003', 'Amit Kumar', '9876543212', 'amit@example.com', 0, null, '', '', 0);
  }

  // Seed service centers
  const centerCount = db.prepare('SELECT COUNT(*) as count FROM service_centers').get();
  if (!centerCount || centerCount.count === 0) {
    const insertCenter = db.prepare(`INSERT INTO service_centers (name, address, city, contact_number, google_maps_link, latitude, longitude, opening_hours, capacity_per_day, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`);
    insertCenter.run('OLA Showroom Central Service Hub', 'Plot 14, Auto Complex, Near Metro Gate 2, Main High Street', 'Central Hub', '8003356163', 'https://maps.google.com/?q=26.9124,75.7873', 26.9124, 75.7873, 'Mon-Sat: 8:30 AM - 7:30 PM', 15);
    insertCenter.run('OLA Express Care Point - North Wing', 'Shop 4-5, Ring Road EV Square, North Sector', 'North Sector', '8003356163', 'https://maps.google.com/?q=26.9350,75.7980', 26.9350, 75.7980, 'Mon-Sun: 9:00 AM - 8:00 PM', 10);
    insertCenter.run('OLA Quick Diagnostic & Battery Center - South Hub', 'Opposite Tech Park Gate 1, Industrial Area Phase 2', 'South Hub', '8003356163', 'https://maps.google.com/?q=26.8850,75.7720', 26.8850, 75.7720, 'Mon-Sat: 8:00 AM - 7:00 PM', 12);
  }

  // Seed sample service bookings
  const srvCount = db.prepare('SELECT COUNT(*) as count FROM service_bookings').get();
  if (!srvCount || srvCount.count === 0) {
    const insertBooking = db.prepare(`INSERT INTO service_bookings (booking_id, customer_name, mobile, email, scooter_model, registration_number, service_type, issue_description, service_center_id, service_center_name, preferred_date, preferred_time_slot, confirmed_service_time, estimated_completion_time, estimated_cost, admin_notes, technician_name, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
    insertBooking.run('SRV-2026-0811', 'Rahul Sharma', '9876543210', 'rahul@example.com', 'OLA S1 Pro Gen 2', 'RJ14-EV-2024', 'Periodic Maintenance (10,000 KM)', 'General 10,000 km routine service', 1, 'OLA Showroom Central Service Hub', '2026-10-05', '10:30 AM', '10:30 AM, 05 Oct 2026', '03:30 PM, 05 Oct 2026', 450, 'Scooter checked in at Bay 2.', 'Vikram Singh (Senior Tech)', 'In Service');
    insertBooking.run('SRV-2026-0924', 'Priya Patel', '9876543211', 'priya@example.com', 'OLA S1 Air', 'RJ14-EV-5542', 'Battery & Electrical Diagnostics', 'Battery check and fast charging port inspection', 2, 'OLA Express Care Point - North Wing', '2026-10-06', '02:00 PM', '02:00 PM, 06 Oct 2026', '05:00 PM, 06 Oct 2026', 0, 'Warranty service approved.', 'Amit Verma', 'Confirmed');
  }

  _initialised = true;
  console.log('✅ Vercel serverless: DB initialised & seeded');
}

// ── Express app ────────────────────────────────────────────────
const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Ensure database before every request
app.use(async (req, res, next) => {
  try {
    await ensureDB();
    next();
  } catch (err) {
    console.error('DB init error:', err);
    res.status(500).json({ message: 'Database initialization failed' });
  }
});

// ── Routes ─────────────────────────────────────────────────────
app.use('/api/auth', require('../backend/src/routes/auth'));
app.use('/api/public', require('../backend/src/routes/public'));
app.use('/api/admin', require('../backend/src/routes/admin'));
app.use('/api/customer', require('../backend/src/routes/customer'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', env: 'vercel', timestamp: new Date().toISOString() });
});

// 404 catch-all for API routes
app.all('/api/*', (req, res) => {
  res.status(404).json({ message: 'API route not found' });
});

module.exports = app;
