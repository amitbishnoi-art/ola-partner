const express = require('express');
const db = require('../config/db');
const router = express.Router();

// ─── GET ALL SCOOTERS (public catalogue) ──────────────────────
router.get('/scooters', (req, res) => {
  const { search, status, model, color, minPrice, maxPrice } = req.query;
  let query = 'SELECT * FROM scooters WHERE 1=1';
  const params = [];

  if (search) { query += ' AND (name LIKE ? OR model LIKE ? OR variant LIKE ?)'; params.push(`%${search}%`, `%${search}%`, `%${search}%`); }
  if (status) { query += ' AND status = ?'; params.push(status); }
  if (model) { query += ' AND model = ?'; params.push(model); }
  if (minPrice) { query += ' AND price >= ?'; params.push(Number(minPrice)); }
  if (maxPrice) { query += ' AND price <= ?'; params.push(Number(maxPrice)); }

  query += ' ORDER BY date_added DESC';
  const scooters = db.prepare(query).all(...params);

  // Attach colors to each scooter
  const colorStmt = db.prepare('SELECT * FROM colors WHERE scooter_id = ?');
  const result = scooters.map(s => ({
    ...s,
    features: s.features ? JSON.parse(s.features) : [],
    images: s.images ? JSON.parse(s.images) : [],
    colors: colorStmt.all(s.id)
  }));

  // Filter by color if requested
  if (color) {
    const filtered = result.filter(s => s.colors.some(c => c.name.toLowerCase() === color.toLowerCase()));
    return res.json(filtered);
  }

  res.json(result);
});

// ─── GET SINGLE SCOOTER BY SLUG ──────────────────────────────
router.get('/scooters/:slug', (req, res) => {
  const scooter = db.prepare('SELECT * FROM scooters WHERE slug = ?').get(req.params.slug);
  if (!scooter) return res.status(404).json({ message: 'Scooter not found' });

  const colors = db.prepare('SELECT * FROM colors WHERE scooter_id = ?').all(scooter.id);

  res.json({
    ...scooter,
    features: scooter.features ? JSON.parse(scooter.features) : [],
    images: scooter.images ? JSON.parse(scooter.images) : [],
    colors
  });
});

// ─── GET ACTIVE OFFERS ───────────────────────────────────────
router.get('/offers', (req, res) => {
  const now = new Date().toISOString();
  const offers = db.prepare(`
    SELECT * FROM offers 
    WHERE active = 1 
    AND (start_date IS NULL OR start_date <= ?) 
    AND (end_date IS NULL OR end_date >= ?)
    ORDER BY created_at DESC
  `).all(now, now);
  res.json(offers);
});

// ─── GET SHOWROOM SETTINGS ───────────────────────────────────
router.get('/showroom', (req, res) => {
  let settings = db.prepare('SELECT * FROM showroom_settings WHERE id = 1').get();
  if (!settings) {
    db.prepare(`INSERT INTO showroom_settings (id) VALUES (1)`).run();
    settings = db.prepare('SELECT * FROM showroom_settings WHERE id = 1').get();
  }
  res.json(settings);
});

// ─── GET BENEFIT SETTINGS ────────────────────────────────────
router.get('/benefit-settings', (req, res) => {
  let settings = db.prepare('SELECT * FROM benefit_settings WHERE id = 1').get();
  if (!settings) {
    db.prepare(`INSERT INTO benefit_settings (id) VALUES (1)`).run();
    settings = db.prepare('SELECT * FROM benefit_settings WHERE id = 1').get();
  }
  res.json(settings);
});

// ─── SUBMIT TEST RIDE ────────────────────────────────────────
router.post('/test-rides', (req, res) => {
  const { name, mobile, scooter_id, scooter_name, preferred_date, preferred_time, message } = req.body;
  if (!name || !mobile) {
    return res.status(400).json({ message: 'Name and mobile required' });
  }

  const result = db.prepare(`
    INSERT INTO test_rides (name, mobile, scooter_id, scooter_name, preferred_date, preferred_time, message)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(name, mobile, scooter_id || null, scooter_name || '', preferred_date || '', preferred_time || '', message || '');

  res.json({ id: result.lastInsertRowid, message: 'Test ride booked successfully' });
});

// ─── SUBMIT ENQUIRY ──────────────────────────────────────────
router.post('/enquiries', (req, res) => {
  const { name, mobile, email, category, subject, message, scooter_id } = req.body;
  if (!name) {
    return res.status(400).json({ message: 'Name is required' });
  }

  const result = db.prepare(`
    INSERT INTO enquiries (name, mobile, email, category, subject, message, scooter_id)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(name, mobile || '', email || '', category || 'Other', subject || '', message || '', scooter_id || null);

  res.json({ id: result.lastInsertRowid, message: 'Enquiry submitted successfully' });
});

// ─── SUBMIT INTRODUCTION ─────────────────────────────────────
router.post('/introductions', (req, res) => {
  const { existing_customer_mobile, introduced_name, introduced_mobile, introduced_email, note } = req.body;
  if (!existing_customer_mobile || !introduced_name || !introduced_mobile) {
    return res.status(400).json({ message: 'Required fields missing' });
  }

  const customer = db.prepare('SELECT * FROM customers WHERE mobile = ?').get(existing_customer_mobile);
  if (!customer) {
    return res.status(404).json({ message: 'Customer not found. Please register first.' });
  }
  if (!customer.has_purchased) {
    return res.status(400).json({ message: 'Only verified purchasers can introduce others.' });
  }

  // Check duplicate
  const existing = db.prepare('SELECT * FROM introductions WHERE existing_customer_id = ? AND introduced_mobile = ?')
    .get(customer.id, introduced_mobile);
  if (existing) {
    return res.status(400).json({ message: 'This introduction already exists.' });
  }

  const { v4: uuidv4 } = require('uuid');
  const referenceId = 'REF-' + uuidv4().slice(0, 8).toUpperCase();

  const result = db.prepare(`
    INSERT INTO introductions (reference_id, existing_customer_id, existing_customer_name, existing_customer_mobile, introduced_name, introduced_mobile, introduced_email, note)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(referenceId, customer.id, customer.name, customer.mobile, introduced_name, introduced_mobile, introduced_email || '', note || '');

  // Create a pending benefit record
  const benefitSettings = db.prepare('SELECT * FROM benefit_settings WHERE id = 1').get();
  if (benefitSettings && benefitSettings.enabled) {
    db.prepare(`
      INSERT INTO benefits (customer_id, introduction_id, amount, status)
      VALUES (?, ?, ?, 'Introduction Submitted')
    `).run(customer.id, result.lastInsertRowid, benefitSettings.amount);
  }

  res.json({ reference_id: referenceId, message: 'Introduction submitted successfully!' });
});

// ═══════════════════════════════════════════════════════════════
//  SERVICE CENTERS & PRE-BOOKING (Public)
// ═══════════════════════════════════════════════════════════════

// GET all active service centers
router.get('/service-centers', (req, res) => {
  const centers = db.prepare('SELECT * FROM service_centers WHERE is_active = 1 ORDER BY id ASC').all();
  res.json(centers);
});

// SUBMIT a service pre-booking
router.post('/service-bookings', (req, res) => {
  const {
    customer_name,
    mobile,
    email,
    scooter_model,
    registration_number,
    service_type,
    issue_description,
    service_center_id,
    preferred_date,
    preferred_time_slot,
    pickup_required,
    pickup_address
  } = req.body;

  if (!customer_name || !mobile || !scooter_model || !registration_number || !service_type || !preferred_date) {
    return res.status(400).json({ message: 'Please fill in all required fields (Name, Mobile, Scooter Model, Registration Number, Service Type, Date).' });
  }

  // Get service center name if center id provided
  let centerName = 'OLA Showroom Service Centre';
  if (service_center_id) {
    const center = db.prepare('SELECT name FROM service_centers WHERE id = ?').get(service_center_id);
    if (center) centerName = center.name;
  }

  // Generate unique booking ID (e.g. SRV-7B2K9X)
  const randomSuffix = Math.random().toString(36).substring(2, 7).toUpperCase();
  const bookingId = `SRV-${randomSuffix}`;

  const result = db.prepare(`
    INSERT INTO service_bookings (
      booking_id, customer_name, mobile, email, scooter_model, registration_number,
      service_type, issue_description, service_center_id, service_center_name,
      preferred_date, preferred_time_slot, pickup_required, pickup_address,
      confirmed_service_time, estimated_completion_time, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending')
  `).run(
    bookingId,
    customer_name.trim(),
    mobile.trim(),
    email ? email.trim() : '',
    scooter_model,
    registration_number.toUpperCase().trim(),
    service_type,
    issue_description || '',
    service_center_id || 1,
    centerName,
    preferred_date,
    preferred_time_slot || 'Morning (9:30 AM - 1:00 PM)',
    pickup_required ? 1 : 0,
    pickup_address || '',
    'Awaiting Admin Confirmation',
    'Will be assigned upon inspection'
  );

  res.json({
    success: true,
    booking_id: bookingId,
    id: result.lastInsertRowid,
    message: 'Scooter service pre-booking submitted successfully! Showroom team will confirm your time slot shortly.'
  });
});

// TRACK service booking by Booking ID or Mobile number
router.get('/service-bookings/track/:identifier', (req, res) => {
  const { identifier } = req.params;
  const trimmed = identifier.trim().toUpperCase();

  // Try matching by booking_id
  let booking = db.prepare('SELECT * FROM service_bookings WHERE UPPER(booking_id) = ?').get(trimmed);

  // If not found, try by mobile number
  let bookings = [];
  if (booking) {
    bookings = [booking];
  } else {
    bookings = db.prepare('SELECT * FROM service_bookings WHERE mobile = ? ORDER BY created_at DESC').all(identifier.trim());
  }

  if (bookings.length === 0) {
    return res.status(404).json({ message: 'No service booking found with this ID or Mobile Number.' });
  }

  // Attach service center details
  const enriched = bookings.map(b => {
    let center = null;
    if (b.service_center_id) {
      center = db.prepare('SELECT * FROM service_centers WHERE id = ?').get(b.service_center_id);
    }
    return { ...b, center };
  });

  res.json(enriched);
});

module.exports = router;
