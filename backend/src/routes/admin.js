const express = require('express');
const db = require('../config/db');
const { verifyAdmin, logActivity } = require('../middleware/auth');
const router = express.Router();

// All admin routes require authentication
router.use(verifyAdmin);

// ═══════════════════════════════════════════════════════════════
//  DASHBOARD
// ═══════════════════════════════════════════════════════════════
router.get('/dashboard', (req, res) => {
  const totalCustomers = db.prepare('SELECT COUNT(*) as count FROM customers').get().count;
  const totalScooters = db.prepare('SELECT COUNT(*) as count FROM scooters').get().count;
  const availableScooters = db.prepare("SELECT COUNT(*) as count FROM scooters WHERE status = 'Available'").get().count;
  const soldOutScooters = db.prepare("SELECT COUNT(*) as count FROM scooters WHERE status = 'Sold Out'").get().count;
  const limitedStock = db.prepare("SELECT COUNT(*) as count FROM scooters WHERE status = 'Limited Stock'").get().count;
  const comingSoon = db.prepare("SELECT COUNT(*) as count FROM scooters WHERE status = 'Coming Soon'").get().count;
  const totalSales = db.prepare('SELECT COUNT(*) as count FROM scooter_sales').get().count;
  const pendingTestRides = db.prepare("SELECT COUNT(*) as count FROM test_rides WHERE status = 'Pending'").get().count;
  const pendingEnquiries = db.prepare("SELECT COUNT(*) as count FROM enquiries WHERE status = 'New'").get().count;
  const pendingIntroductions = db.prepare("SELECT COUNT(*) as count FROM introductions WHERE status = 'Introduction Submitted'").get().count;
  const successfulIntroductions = db.prepare("SELECT COUNT(*) as count FROM introductions WHERE status = 'Purchase Completed'").get().count;
  const pendingBenefits = db.prepare("SELECT COUNT(*) as count FROM benefits WHERE status IN ('Benefit Pending','Benefit Approved')").get().count;
  const approvedBenefits = db.prepare("SELECT COUNT(*) as count FROM benefits WHERE status = 'Benefit Approved'").get().count;
  const paidBenefits = db.prepare("SELECT COUNT(*) as count FROM benefits WHERE status = 'Benefit Paid'").get().count;
  const activeOffers = db.prepare("SELECT COUNT(*) as count FROM offers WHERE active = 1").get().count;
  const pendingServices = db.prepare("SELECT COUNT(*) as count FROM service_bookings WHERE status = 'Pending'").get().count;
  const inProgressServices = db.prepare("SELECT COUNT(*) as count FROM service_bookings WHERE status = 'In Service'").get().count;
  const readyServices = db.prepare("SELECT COUNT(*) as count FROM service_bookings WHERE status = 'Ready for Pickup'").get().count;
  const completedServices = db.prepare("SELECT COUNT(*) as count FROM service_bookings WHERE status = 'Completed'").get().count;
  const totalServiceCenters = db.prepare("SELECT COUNT(*) as count FROM service_centers WHERE is_active = 1").get().count;

  res.json({
    totalCustomers, totalScooters, availableScooters, soldOutScooters,
    limitedStock, comingSoon, totalSales, pendingTestRides, pendingEnquiries,
    pendingIntroductions, successfulIntroductions, pendingBenefits,
    approvedBenefits, paidBenefits, activeOffers,
    pendingServices, inProgressServices, readyServices, completedServices, totalServiceCenters
  });
});

// ═══════════════════════════════════════════════════════════════
//  SCOOTER MANAGEMENT
// ═══════════════════════════════════════════════════════════════
router.get('/scooters', (req, res) => {
  const { status, model, search } = req.query;
  let query = 'SELECT * FROM scooters WHERE 1=1';
  const params = [];
  if (status) { query += ' AND status = ?'; params.push(status); }
  if (model) { query += ' AND model LIKE ?'; params.push(`%${model}%`); }
  if (search) { query += ' AND (name LIKE ? OR model LIKE ? OR variant LIKE ?)'; params.push(`%${search}%`, `%${search}%`, `%${search}%`); }
  query += ' ORDER BY date_added DESC';

  const scooters = db.prepare(query).all(...params);
  const colorStmt = db.prepare('SELECT * FROM colors WHERE scooter_id = ?');
  const result = scooters.map(s => ({
    ...s,
    features: s.features ? JSON.parse(s.features) : [],
    images: s.images ? JSON.parse(s.images) : [],
    colors: colorStmt.all(s.id)
  }));
  res.json(result);
});

router.get('/scooters/:id', (req, res) => {
  const scooter = db.prepare('SELECT * FROM scooters WHERE id = ?').get(req.params.id);
  if (!scooter) return res.status(404).json({ message: 'Not found' });
  const colors = db.prepare('SELECT * FROM colors WHERE scooter_id = ?').all(scooter.id);
  res.json({ ...scooter, features: scooter.features ? JSON.parse(scooter.features) : [], images: scooter.images ? JSON.parse(scooter.images) : [], colors });
});

router.post('/scooters', (req, res) => {
  const { name, model, variant, description, price, ex_showroom_price, on_road_price, battery_info, range_km, top_speed, charging_time, motor_info, features, warranty, images, brochure_url, stock_quantity, status, additional_specs } = req.body;
  if (!name || !model) return res.status(400).json({ message: 'Name and model required' });

  const slug = (name + '-' + (variant || '')).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + Date.now().toString(36);

  const result = db.prepare(`
    INSERT INTO scooters (slug, name, model, variant, description, price, ex_showroom_price, on_road_price, battery_info, range_km, top_speed, charging_time, motor_info, features, warranty, images, brochure_url, stock_quantity, status, additional_specs)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(slug, name, model, variant || '', description || '', price || 0, ex_showroom_price || 0, on_road_price || 0, battery_info || '', range_km || '', top_speed || '', charging_time || '', motor_info || '', JSON.stringify(features || []), warranty || '', JSON.stringify(images || []), brochure_url || '', stock_quantity || 0, status || 'Available', additional_specs || '');

  logActivity(db, req.user.id, req.user.name, 'Added new scooter', 'scooter', result.lastInsertRowid, name);
  res.json({ id: result.lastInsertRowid, slug, message: 'Scooter added successfully' });
});

router.put('/scooters/:id', (req, res) => {
  const { name, model, variant, description, price, ex_showroom_price, on_road_price, battery_info, range_km, top_speed, charging_time, motor_info, features, warranty, images, brochure_url, stock_quantity, status, additional_specs } = req.body;

  const existing = db.prepare('SELECT * FROM scooters WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ message: 'Not found' });

  const dateDiscontinued = (status === 'Discontinued' || status === 'Sold Out') && existing.status !== status ? new Date().toISOString() : existing.date_discontinued;
  const dateStatusChanged = status !== existing.status ? new Date().toISOString() : existing.date_status_changed;

  db.prepare(`
    UPDATE scooters SET name=?, model=?, variant=?, description=?, price=?, ex_showroom_price=?, on_road_price=?, battery_info=?, range_km=?, top_speed=?, charging_time=?, motor_info=?, features=?, warranty=?, images=?, brochure_url=?, stock_quantity=?, status=?, additional_specs=?, date_discontinued=?, date_status_changed=?, updated_at=CURRENT_TIMESTAMP
    WHERE id=?
  `).run(name || existing.name, model || existing.model, variant ?? existing.variant, description ?? existing.description, price ?? existing.price, ex_showroom_price ?? existing.ex_showroom_price, on_road_price ?? existing.on_road_price, battery_info ?? existing.battery_info, range_km ?? existing.range_km, top_speed ?? existing.top_speed, charging_time ?? existing.charging_time, motor_info ?? existing.motor_info, features ? JSON.stringify(features) : existing.features, warranty ?? existing.warranty, images ? JSON.stringify(images) : existing.images, brochure_url ?? existing.brochure_url, stock_quantity ?? existing.stock_quantity, status || existing.status, additional_specs ?? existing.additional_specs, dateDiscontinued, dateStatusChanged, req.params.id);

  logActivity(db, req.user.id, req.user.name, `Updated scooter`, 'scooter', req.params.id, `Status: ${status || existing.status}`);
  res.json({ message: 'Scooter updated' });
});

router.delete('/scooters/:id', (req, res) => {
  db.prepare("UPDATE scooters SET status = 'Discontinued', date_discontinued = CURRENT_TIMESTAMP WHERE id = ?").run(req.params.id);
  logActivity(db, req.user.id, req.user.name, 'Archived scooter', 'scooter', req.params.id, '');
  res.json({ message: 'Scooter archived (not permanently deleted)' });
});

// ═══════════════════════════════════════════════════════════════
//  COLOR MANAGEMENT
// ═══════════════════════════════════════════════════════════════
router.get('/colors', (req, res) => {
  const { scooter_id } = req.query;
  if (scooter_id) {
    res.json(db.prepare('SELECT * FROM colors WHERE scooter_id = ?').all(scooter_id));
  } else {
    res.json(db.prepare('SELECT c.*, s.name as scooter_name FROM colors c LEFT JOIN scooters s ON c.scooter_id = s.id ORDER BY c.created_at DESC').all());
  }
});

router.post('/colors', (req, res) => {
  const { scooter_id, name, hex_code, image_url, stock_qty, status } = req.body;
  if (!scooter_id || !name) return res.status(400).json({ message: 'Scooter ID and color name required' });
  const result = db.prepare('INSERT INTO colors (scooter_id, name, hex_code, image_url, stock_qty, status) VALUES (?, ?, ?, ?, ?, ?)').run(scooter_id, name, hex_code || '#000000', image_url || '', stock_qty || 0, status || 'Available');
  logActivity(db, req.user.id, req.user.name, 'Added color', 'color', result.lastInsertRowid, `${name} for scooter #${scooter_id}`);
  res.json({ id: result.lastInsertRowid, message: 'Color added' });
});

router.put('/colors/:id', (req, res) => {
  const { name, hex_code, image_url, stock_qty, status } = req.body;
  db.prepare('UPDATE colors SET name=COALESCE(?,name), hex_code=COALESCE(?,hex_code), image_url=COALESCE(?,image_url), stock_qty=COALESCE(?,stock_qty), status=COALESCE(?,status) WHERE id=?').run(name, hex_code, image_url, stock_qty, status, req.params.id);
  logActivity(db, req.user.id, req.user.name, 'Updated color', 'color', req.params.id, `Status: ${status}`);
  res.json({ message: 'Color updated' });
});

router.delete('/colors/:id', (req, res) => {
  db.prepare('DELETE FROM colors WHERE id = ?').run(req.params.id);
  res.json({ message: 'Color deleted' });
});

// ═══════════════════════════════════════════════════════════════
//  OFFER MANAGEMENT
// ═══════════════════════════════════════════════════════════════
router.get('/offers', (req, res) => {
  res.json(db.prepare('SELECT * FROM offers ORDER BY created_at DESC').all());
});

router.post('/offers', (req, res) => {
  const { title, description, image_url, start_date, end_date, active, terms } = req.body;
  if (!title) return res.status(400).json({ message: 'Title required' });
  const result = db.prepare('INSERT INTO offers (title, description, image_url, start_date, end_date, active, terms) VALUES (?, ?, ?, ?, ?, ?, ?)').run(title, description || '', image_url || '', start_date || null, end_date || null, active ? 1 : 0, terms || '');
  logActivity(db, req.user.id, req.user.name, 'Created offer', 'offer', result.lastInsertRowid, title);
  res.json({ id: result.lastInsertRowid, message: 'Offer created' });
});

router.put('/offers/:id', (req, res) => {
  const { title, description, image_url, start_date, end_date, active, terms } = req.body;
  db.prepare('UPDATE offers SET title=COALESCE(?,title), description=COALESCE(?,description), image_url=COALESCE(?,image_url), start_date=COALESCE(?,start_date), end_date=COALESCE(?,end_date), active=COALESCE(?,active), terms=COALESCE(?,terms) WHERE id=?').run(title, description, image_url, start_date, end_date, active !== undefined ? (active ? 1 : 0) : null, terms, req.params.id);
  logActivity(db, req.user.id, req.user.name, 'Updated offer', 'offer', req.params.id, title || '');
  res.json({ message: 'Offer updated' });
});

router.delete('/offers/:id', (req, res) => {
  db.prepare('DELETE FROM offers WHERE id = ?').run(req.params.id);
  res.json({ message: 'Offer deleted' });
});

// ═══════════════════════════════════════════════════════════════
//  CUSTOMER MANAGEMENT
// ═══════════════════════════════════════════════════════════════
router.get('/customers', (req, res) => {
  const { search, has_purchased } = req.query;
  let query = 'SELECT * FROM customers WHERE 1=1';
  const params = [];
  if (search) { query += ' AND (name LIKE ? OR mobile LIKE ? OR email LIKE ?)'; params.push(`%${search}%`, `%${search}%`, `%${search}%`); }
  if (has_purchased !== undefined) { query += ' AND has_purchased = ?'; params.push(Number(has_purchased)); }
  query += ' ORDER BY created_at DESC';
  res.json(db.prepare(query).all(...params));
});

router.get('/customers/:id', (req, res) => {
  const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(req.params.id);
  if (!customer) return res.status(404).json({ message: 'Not found' });
  const introductions = db.prepare('SELECT * FROM introductions WHERE existing_customer_id = ?').all(customer.id);
  const benefits = db.prepare('SELECT * FROM benefits WHERE customer_id = ?').all(customer.id);
  res.json({ ...customer, introductions, benefits });
});

router.put('/customers/:id', (req, res) => {
  const { name, email, address, has_purchased, purchased_scooter_id, purchased_variant, purchased_color, purchase_date, eligible_for_benefit } = req.body;
  db.prepare(`UPDATE customers SET name=COALESCE(?,name), email=COALESCE(?,email), address=COALESCE(?,address), has_purchased=COALESCE(?,has_purchased), purchased_scooter_id=COALESCE(?,purchased_scooter_id), purchased_variant=COALESCE(?,purchased_variant), purchased_color=COALESCE(?,purchased_color), purchase_date=COALESCE(?,purchase_date), eligible_for_benefit=COALESCE(?,eligible_for_benefit) WHERE id=?`).run(name, email, address, has_purchased, purchased_scooter_id, purchased_variant, purchased_color, purchase_date, eligible_for_benefit, req.params.id);

  // If marking as purchased, also mark eligible for benefit
  if (has_purchased) {
    db.prepare('UPDATE customers SET eligible_for_benefit = 1 WHERE id = ? AND has_purchased = 1').run(req.params.id);

    // Record sale
    if (purchased_scooter_id) {
      db.prepare('INSERT INTO scooter_sales (customer_id, scooter_id, variant, color, sale_price, sale_date) VALUES (?, ?, ?, ?, (SELECT price FROM scooters WHERE id = ?), CURRENT_TIMESTAMP)').run(req.params.id, purchased_scooter_id, purchased_variant || '', purchased_color || '', purchased_scooter_id);
    }
  }

  logActivity(db, req.user.id, req.user.name, 'Updated customer', 'customer', req.params.id, '');
  res.json({ message: 'Customer updated' });
});

// ═══════════════════════════════════════════════════════════════
//  INTRODUCTION & BENEFIT MANAGEMENT
// ═══════════════════════════════════════════════════════════════
router.get('/introductions', (req, res) => {
  const { status } = req.query;
  let query = 'SELECT * FROM introductions';
  if (status) { query += ' WHERE status = ?'; return res.json(db.prepare(query).all(status)); }
  query += ' ORDER BY created_at DESC';
  res.json(db.prepare(query).all());
});

router.put('/introductions/:id', (req, res) => {
  const { status } = req.body;
  db.prepare('UPDATE introductions SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(status, req.params.id);

  // Update related benefit status
  if (status === 'Purchase Completed') {
    db.prepare("UPDATE benefits SET status = 'Benefit Pending', updated_at = CURRENT_TIMESTAMP WHERE introduction_id = ?").run(req.params.id);
  }

  logActivity(db, req.user.id, req.user.name, 'Updated introduction status', 'introduction', req.params.id, status);
  res.json({ message: 'Introduction updated' });
});

router.get('/benefits', (req, res) => {
  const { status } = req.query;
  let query = 'SELECT b.*, c.name as customer_name, c.mobile as customer_mobile FROM benefits b LEFT JOIN customers c ON b.customer_id = c.id';
  if (status) { query += ' WHERE b.status = ?'; return res.json(db.prepare(query).all(status)); }
  query += ' ORDER BY b.created_at DESC';
  res.json(db.prepare(query).all());
});

router.put('/benefits/:id', (req, res) => {
  const { status, amount } = req.body;
  if (status) db.prepare('UPDATE benefits SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(status, req.params.id);
  if (amount !== undefined) db.prepare('UPDATE benefits SET amount = ? WHERE id = ?').run(amount, req.params.id);
  logActivity(db, req.user.id, req.user.name, 'Updated benefit', 'benefit', req.params.id, status || '');
  res.json({ message: 'Benefit updated' });
});

// ─── BENEFIT SETTINGS ────────────────────────────────────────
router.get('/benefit-settings', (req, res) => {
  let s = db.prepare('SELECT * FROM benefit_settings WHERE id = 1').get();
  if (!s) { db.prepare('INSERT INTO benefit_settings (id) VALUES (1)').run(); s = db.prepare('SELECT * FROM benefit_settings WHERE id = 1').get(); }
  res.json(s);
});

router.put('/benefit-settings', (req, res) => {
  const { title, description, amount, enabled, eligibility_conditions, start_date, end_date, max_benefits } = req.body;
  db.prepare('UPDATE benefit_settings SET title=COALESCE(?,title), description=COALESCE(?,description), amount=COALESCE(?,amount), enabled=COALESCE(?,enabled), eligibility_conditions=COALESCE(?,eligibility_conditions), start_date=COALESCE(?,start_date), end_date=COALESCE(?,end_date), max_benefits=COALESCE(?,max_benefits), updated_at=CURRENT_TIMESTAMP WHERE id=1').run(title, description, amount, enabled !== undefined ? (enabled ? 1 : 0) : null, eligibility_conditions, start_date, end_date, max_benefits);
  logActivity(db, req.user.id, req.user.name, 'Updated benefit settings', 'benefit_settings', 1, `Amount: ${amount || 'unchanged'}`);
  res.json({ message: 'Benefit settings updated' });
});

// ═══════════════════════════════════════════════════════════════
//  TEST RIDES
// ═══════════════════════════════════════════════════════════════
router.get('/test-rides', (req, res) => {
  const { status } = req.query;
  let query = 'SELECT * FROM test_rides';
  if (status) { query += ' WHERE status = ?'; return res.json(db.prepare(query).all(status)); }
  query += ' ORDER BY created_at DESC';
  res.json(db.prepare(query).all());
});

router.put('/test-rides/:id', (req, res) => {
  const { status } = req.body;
  db.prepare('UPDATE test_rides SET status = ? WHERE id = ?').run(status, req.params.id);
  res.json({ message: 'Test ride updated' });
});

// ═══════════════════════════════════════════════════════════════
//  ENQUIRIES
// ═══════════════════════════════════════════════════════════════
router.get('/enquiries', (req, res) => {
  const { status } = req.query;
  let query = 'SELECT * FROM enquiries';
  if (status) { query += ' WHERE status = ?'; return res.json(db.prepare(query).all(status)); }
  query += ' ORDER BY created_at DESC';
  res.json(db.prepare(query).all());
});

router.put('/enquiries/:id', (req, res) => {
  const { status } = req.body;
  db.prepare('UPDATE enquiries SET status = ? WHERE id = ?').run(status, req.params.id);
  res.json({ message: 'Enquiry updated' });
});

// ═══════════════════════════════════════════════════════════════
//  SHOWROOM SETTINGS
// ═══════════════════════════════════════════════════════════════
router.get('/showroom', (req, res) => {
  let s = db.prepare('SELECT * FROM showroom_settings WHERE id = 1').get();
  if (!s) { db.prepare('INSERT INTO showroom_settings (id) VALUES (1)').run(); s = db.prepare('SELECT * FROM showroom_settings WHERE id = 1').get(); }
  res.json(s);
});

router.put('/showroom', (req, res) => {
  const { showroom_name, logo_url, address, google_maps_link, latitude, longitude, location_enabled, phone, whatsapp, email, opening_hours, about, instagram_url, facebook_url, twitter_url, youtube_url, photos } = req.body;
  db.prepare(`
    UPDATE showroom_settings SET 
      showroom_name=COALESCE(?,showroom_name), logo_url=COALESCE(?,logo_url), address=COALESCE(?,address),
      google_maps_link=COALESCE(?,google_maps_link), latitude=COALESCE(?,latitude), longitude=COALESCE(?,longitude),
      location_enabled=COALESCE(?,location_enabled),
      phone=COALESCE(?,phone), whatsapp=COALESCE(?,whatsapp), email=COALESCE(?,email),
      opening_hours=COALESCE(?,opening_hours), about=COALESCE(?,about),
      instagram_url=COALESCE(?,instagram_url), facebook_url=COALESCE(?,facebook_url),
      twitter_url=COALESCE(?,twitter_url), youtube_url=COALESCE(?,youtube_url),
      photos=COALESCE(?,photos), updated_at=CURRENT_TIMESTAMP
    WHERE id=1
  `).run(showroom_name, logo_url, address, google_maps_link, latitude, longitude, location_enabled !== undefined ? (location_enabled ? 1 : 0) : null, phone, whatsapp, email, opening_hours, about, instagram_url, facebook_url, twitter_url, youtube_url, photos ? JSON.stringify(photos) : null);
  logActivity(db, req.user.id, req.user.name, 'Updated showroom settings', 'showroom', 1, '');
  res.json({ message: 'Showroom settings updated' });
});

// ═══════════════════════════════════════════════════════════════
//  ACTIVITY LOGS
// ═══════════════════════════════════════════════════════════════
router.get('/activity-logs', (req, res) => {
  const logs = db.prepare('SELECT * FROM activity_logs ORDER BY created_at DESC LIMIT 200').all();
  res.json(logs);
});

// ═══════════════════════════════════════════════════════════════
//  REPORTS
// ═══════════════════════════════════════════════════════════════
router.get('/reports/sales', (req, res) => {
  const { from, to } = req.query;
  let query = 'SELECT ss.*, c.name as customer_name, s.name as scooter_name FROM scooter_sales ss LEFT JOIN customers c ON ss.customer_id = c.id LEFT JOIN scooters s ON ss.scooter_id = s.id WHERE 1=1';
  const params = [];
  if (from) { query += ' AND ss.sale_date >= ?'; params.push(from); }
  if (to) { query += ' AND ss.sale_date <= ?'; params.push(to); }
  query += ' ORDER BY ss.sale_date DESC';
  res.json(db.prepare(query).all(...params));
});

router.get('/reports/inventory', (req, res) => {
  const scooters = db.prepare('SELECT id, name, model, variant, stock_quantity, status FROM scooters ORDER BY name').all();
  const colorStmt = db.prepare('SELECT name, stock_qty, status FROM colors WHERE scooter_id = ?');
  const result = scooters.map(s => ({ ...s, colors: colorStmt.all(s.id) }));
  res.json(result);
});

router.get('/reports/benefits', (req, res) => {
  const benefits = db.prepare(`
    SELECT b.*, c.name as customer_name, c.mobile as customer_mobile 
    FROM benefits b LEFT JOIN customers c ON b.customer_id = c.id 
    ORDER BY b.created_at DESC
  `).all();
  res.json(benefits);
});

// CSV export helper
router.get('/reports/export/:type', (req, res) => {
  let data = [];
  const type = req.params.type;

  if (type === 'customers') {
    data = db.prepare('SELECT customer_id, name, mobile, email, address, has_purchased, purchase_date, eligible_for_benefit, created_at FROM customers ORDER BY created_at DESC').all();
  } else if (type === 'scooters') {
    data = db.prepare('SELECT name, model, variant, price, stock_quantity, status, date_added FROM scooters ORDER BY date_added DESC').all();
  } else if (type === 'sales') {
    data = db.prepare('SELECT ss.sale_date, c.name as customer, s.name as scooter, ss.variant, ss.color, ss.sale_price FROM scooter_sales ss LEFT JOIN customers c ON ss.customer_id=c.id LEFT JOIN scooters s ON ss.scooter_id=s.id ORDER BY ss.sale_date DESC').all();
  } else if (type === 'benefits') {
    data = db.prepare('SELECT b.amount, b.status, b.created_at, c.name as customer, c.mobile FROM benefits b LEFT JOIN customers c ON b.customer_id=c.id ORDER BY b.created_at DESC').all();
  } else if (type === 'services') {
    data = db.prepare('SELECT booking_id, customer_name, mobile, scooter_model, registration_number, service_type, service_center_name, preferred_date, confirmed_service_time, estimated_completion_time, estimated_cost, status, created_at FROM service_bookings ORDER BY created_at DESC').all();
  } else {
    return res.status(400).json({ message: 'Invalid export type' });
  }

  if (data.length === 0) return res.status(404).json({ message: 'No data' });

  const headers = Object.keys(data[0]);
  const csv = [headers.join(','), ...data.map(row => headers.map(h => `"${(row[h] ?? '').toString().replace(/"/g, '""')}"`).join(','))].join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename=${type}_export.csv`);
  res.send(csv);
});

// ═══════════════════════════════════════════════════════════════
//  SERVICE PRE-BOOKINGS MANAGEMENT
// ═══════════════════════════════════════════════════════════════

router.get('/service-bookings', (req, res) => {
  const { status, search, centerId } = req.query;
  let query = 'SELECT * FROM service_bookings WHERE 1=1';
  const params = [];

  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }
  if (centerId) {
    query += ' AND service_center_id = ?';
    params.push(centerId);
  }
  if (search) {
    query += ' AND (booking_id LIKE ? OR customer_name LIKE ? OR mobile LIKE ? OR registration_number LIKE ?)';
    params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
  }

  query += ' ORDER BY created_at DESC';
  const bookings = db.prepare(query).all(...params);
  res.json(bookings);
});

router.get('/service-bookings/:id', (req, res) => {
  const booking = db.prepare('SELECT * FROM service_bookings WHERE id = ?').get(req.params.id);
  if (!booking) return res.status(404).json({ message: 'Service booking not found' });
  res.json(booking);
});

router.put('/service-bookings/:id', (req, res) => {
  const {
    status,
    confirmed_service_time,
    estimated_completion_time,
    actual_delivery_time,
    estimated_cost,
    admin_notes,
    technician_name,
    service_center_id
  } = req.body;

  const existing = db.prepare('SELECT * FROM service_bookings WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ message: 'Service booking not found' });

  let centerName = existing.service_center_name;
  if (service_center_id && service_center_id !== existing.service_center_id) {
    const c = db.prepare('SELECT name FROM service_centers WHERE id = ?').get(service_center_id);
    if (c) centerName = c.name;
  }

  db.prepare(`
    UPDATE service_bookings SET
      status = COALESCE(?, status),
      confirmed_service_time = COALESCE(?, confirmed_service_time),
      estimated_completion_time = COALESCE(?, estimated_completion_time),
      actual_delivery_time = COALESCE(?, actual_delivery_time),
      estimated_cost = COALESCE(?, estimated_cost),
      admin_notes = COALESCE(?, admin_notes),
      technician_name = COALESCE(?, technician_name),
      service_center_id = COALESCE(?, service_center_id),
      service_center_name = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(
    status,
    confirmed_service_time,
    estimated_completion_time,
    actual_delivery_time,
    estimated_cost !== undefined ? Number(estimated_cost) : null,
    admin_notes,
    technician_name,
    service_center_id,
    centerName,
    req.params.id
  );

  logActivity(db, req.user.id, req.user.name, `Updated service booking ${existing.booking_id}`, 'service_booking', req.params.id, `Status: ${status || existing.status}`);
  res.json({ message: 'Service booking updated successfully' });
});

router.delete('/service-bookings/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM service_bookings WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ message: 'Not found' });
  db.prepare('DELETE FROM service_bookings WHERE id = ?').run(req.params.id);
  logActivity(db, req.user.id, req.user.name, `Deleted service booking ${existing.booking_id}`, 'service_booking', req.params.id, '');
  res.json({ message: 'Service booking deleted' });
});

// ═══════════════════════════════════════════════════════════════
//  SERVICE CENTERS MANAGEMENT
// ═══════════════════════════════════════════════════════════════

router.get('/service-centers', (req, res) => {
  const centers = db.prepare('SELECT * FROM service_centers ORDER BY id ASC').all();
  res.json(centers);
});

router.post('/service-centers', (req, res) => {
  const { name, address, city, contact_number, google_maps_link, latitude, longitude, opening_hours, capacity_per_day, is_active } = req.body;
  if (!name || !address) return res.status(400).json({ message: 'Center name and address are required' });

  const result = db.prepare(`
    INSERT INTO service_centers (name, address, city, contact_number, google_maps_link, latitude, longitude, opening_hours, capacity_per_day, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    name,
    address,
    city || '',
    contact_number || '',
    google_maps_link || '',
    latitude ? Number(latitude) : 0,
    longitude ? Number(longitude) : 0,
    opening_hours || 'Mon-Sat: 8:30 AM - 7:30 PM',
    capacity_per_day ? Number(capacity_per_day) : 12,
    is_active !== undefined ? (is_active ? 1 : 0) : 1
  );

  logActivity(db, req.user.id, req.user.name, `Added service center: ${name}`, 'service_center', result.lastInsertRowid, '');
  res.json({ id: result.lastInsertRowid, message: 'Service center added successfully' });
});

router.put('/service-centers/:id', (req, res) => {
  const { name, address, city, contact_number, google_maps_link, latitude, longitude, opening_hours, capacity_per_day, is_active } = req.body;
  const existing = db.prepare('SELECT * FROM service_centers WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ message: 'Service center not found' });

  db.prepare(`
    UPDATE service_centers SET
      name = COALESCE(?, name),
      address = COALESCE(?, address),
      city = COALESCE(?, city),
      contact_number = COALESCE(?, contact_number),
      google_maps_link = COALESCE(?, google_maps_link),
      latitude = COALESCE(?, latitude),
      longitude = COALESCE(?, longitude),
      opening_hours = COALESCE(?, opening_hours),
      capacity_per_day = COALESCE(?, capacity_per_day),
      is_active = COALESCE(?, is_active)
    WHERE id = ?
  `).run(
    name,
    address,
    city,
    contact_number,
    google_maps_link,
    latitude !== undefined ? Number(latitude) : null,
    longitude !== undefined ? Number(longitude) : null,
    opening_hours,
    capacity_per_day !== undefined ? Number(capacity_per_day) : null,
    is_active !== undefined ? (is_active ? 1 : 0) : null,
    req.params.id
  );

  logActivity(db, req.user.id, req.user.name, `Updated service center: ${name || existing.name}`, 'service_center', req.params.id, '');
  res.json({ message: 'Service center updated successfully' });
});

router.delete('/service-centers/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM service_centers WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ message: 'Service center not found' });
  db.prepare('DELETE FROM service_centers WHERE id = ?').run(req.params.id);
  logActivity(db, req.user.id, req.user.name, `Deleted service center: ${existing.name}`, 'service_center', req.params.id, '');
  res.json({ message: 'Service center deleted' });
});

module.exports = router;
