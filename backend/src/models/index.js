const db = require('../config/db');

function initializeDatabase() {
  // ─── USERS (Admin accounts) ─────────────────────────────────
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT DEFAULT 'admin' CHECK(role IN ('admin','superadmin')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // ─── CUSTOMERS ──────────────────────────────────────────────
  db.exec(`
    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id TEXT UNIQUE,
      name TEXT NOT NULL,
      mobile TEXT UNIQUE NOT NULL,
      email TEXT,
      address TEXT,
      otp_code TEXT,
      otp_expires_at DATETIME,
      is_verified INTEGER DEFAULT 0,
      has_purchased INTEGER DEFAULT 0,
      purchased_scooter_id INTEGER,
      purchased_variant TEXT,
      purchased_color TEXT,
      purchase_date DATETIME,
      eligible_for_benefit INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (purchased_scooter_id) REFERENCES scooters(id)
    )
  `);

  // ─── SCOOTERS ───────────────────────────────────────────────
  db.exec(`
    CREATE TABLE IF NOT EXISTS scooters (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT UNIQUE,
      name TEXT NOT NULL,
      model TEXT NOT NULL,
      variant TEXT,
      description TEXT,
      price REAL,
      ex_showroom_price REAL,
      on_road_price REAL,
      battery_info TEXT,
      range_km TEXT,
      top_speed TEXT,
      charging_time TEXT,
      motor_info TEXT,
      features TEXT,
      warranty TEXT,
      images TEXT,
      brochure_url TEXT,
      stock_quantity INTEGER DEFAULT 0,
      status TEXT DEFAULT 'Available' CHECK(status IN ('Available','Limited Stock','Sold Out','Coming Soon','Temporarily Unavailable','Discontinued')),
      additional_specs TEXT,
      date_added DATETIME DEFAULT CURRENT_TIMESTAMP,
      date_discontinued DATETIME,
      date_status_changed DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // ─── COLORS ─────────────────────────────────────────────────
  db.exec(`
    CREATE TABLE IF NOT EXISTS colors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      scooter_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      hex_code TEXT,
      image_url TEXT,
      stock_qty INTEGER DEFAULT 0,
      status TEXT DEFAULT 'Available' CHECK(status IN ('Available','Limited Stock','Sold Out')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (scooter_id) REFERENCES scooters(id) ON DELETE CASCADE
    )
  `);

  // ─── OFFERS ─────────────────────────────────────────────────
  db.exec(`
    CREATE TABLE IF NOT EXISTS offers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      image_url TEXT,
      start_date DATETIME,
      end_date DATETIME,
      active INTEGER DEFAULT 0,
      terms TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // ─── BENEFIT SETTINGS (₹501 Complimentary) ─────────────────
  db.exec(`
    CREATE TABLE IF NOT EXISTS benefit_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT DEFAULT '₹501 Complimentary Benefit',
      description TEXT,
      amount REAL DEFAULT 501,
      enabled INTEGER DEFAULT 1,
      eligibility_conditions TEXT,
      start_date DATETIME,
      end_date DATETIME,
      max_benefits INTEGER,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // ─── INTRODUCTIONS ─────────────────────────────────────────
  db.exec(`
    CREATE TABLE IF NOT EXISTS introductions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      reference_id TEXT UNIQUE NOT NULL,
      existing_customer_id INTEGER NOT NULL,
      existing_customer_name TEXT,
      existing_customer_mobile TEXT,
      introduced_name TEXT NOT NULL,
      introduced_mobile TEXT NOT NULL,
      introduced_email TEXT,
      note TEXT,
      status TEXT DEFAULT 'Introduction Submitted' CHECK(status IN ('Introduction Submitted','Customer Contacted','Purchase Pending','Purchase Completed','Rejected')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (existing_customer_id) REFERENCES customers(id)
    )
  `);

  // ─── BENEFITS ───────────────────────────────────────────────
  db.exec(`
    CREATE TABLE IF NOT EXISTS benefits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER NOT NULL,
      introduction_id INTEGER,
      amount REAL DEFAULT 501,
      status TEXT DEFAULT 'Not Eligible' CHECK(status IN ('Not Eligible','Eligible','Introduction Submitted','Customer Contacted','Purchase Pending','Purchase Completed','Benefit Pending','Benefit Approved','Benefit Paid','Rejected')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES customers(id),
      FOREIGN KEY (introduction_id) REFERENCES introductions(id)
    )
  `);

  // ─── TEST RIDES ─────────────────────────────────────────────
  db.exec(`
    CREATE TABLE IF NOT EXISTS test_rides (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      mobile TEXT NOT NULL,
      scooter_id INTEGER,
      scooter_name TEXT,
      preferred_date TEXT,
      preferred_time TEXT,
      message TEXT,
      status TEXT DEFAULT 'Pending' CHECK(status IN ('Pending','Confirmed','Completed','Cancelled')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (scooter_id) REFERENCES scooters(id)
    )
  `);

  // ─── ENQUIRIES ──────────────────────────────────────────────
  db.exec(`
    CREATE TABLE IF NOT EXISTS enquiries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      mobile TEXT,
      email TEXT,
      category TEXT CHECK(category IN ('Scooter','Price','Availability','Test Ride','Finance','Exchange','Other')),
      subject TEXT,
      message TEXT,
      scooter_id INTEGER,
      status TEXT DEFAULT 'New' CHECK(status IN ('New','In Progress','Resolved','Closed')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (scooter_id) REFERENCES scooters(id)
    )
  `);

  // ─── SHOWROOM SETTINGS ─────────────────────────────────────
  db.exec(`
    CREATE TABLE IF NOT EXISTS showroom_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      showroom_name TEXT DEFAULT 'OLA Electric Showroom',
      logo_url TEXT DEFAULT '',
      address TEXT DEFAULT '',
      google_maps_link TEXT DEFAULT '',
      latitude TEXT DEFAULT '',
      longitude TEXT DEFAULT '',
      location_enabled INTEGER DEFAULT 1,
      phone TEXT DEFAULT '8003356163',
      whatsapp TEXT DEFAULT '8003356163',
      email TEXT DEFAULT '',
      opening_hours TEXT DEFAULT 'Mon-Sat: 9:00 AM - 8:00 PM',
      about TEXT DEFAULT '',
      instagram_url TEXT DEFAULT '',
      facebook_url TEXT DEFAULT '',
      twitter_url TEXT DEFAULT '',
      youtube_url TEXT DEFAULT '',
      photos TEXT DEFAULT '[]',
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // ─── ACTIVITY LOGS ─────────────────────────────────────────
  db.exec(`
    CREATE TABLE IF NOT EXISTS activity_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      user_name TEXT,
      action TEXT NOT NULL,
      entity_type TEXT,
      entity_id INTEGER,
      details TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // ─── SCOOTER SALES ─────────────────────────────────────────
  db.exec(`
    CREATE TABLE IF NOT EXISTS scooter_sales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER NOT NULL,
      scooter_id INTEGER NOT NULL,
      variant TEXT,
      color TEXT,
      sale_price REAL,
      sale_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      notes TEXT,
      FOREIGN KEY (customer_id) REFERENCES customers(id),
      FOREIGN KEY (scooter_id) REFERENCES scooters(id)
    )
  `);

  // ─── SERVICE CENTERS ─────────────────────────────────────────
  db.exec(`
    CREATE TABLE IF NOT EXISTS service_centers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      address TEXT NOT NULL,
      city TEXT DEFAULT '',
      contact_number TEXT DEFAULT '',
      google_maps_link TEXT DEFAULT '',
      latitude REAL DEFAULT 0,
      longitude REAL DEFAULT 0,
      opening_hours TEXT DEFAULT 'Mon-Sat: 8:30 AM - 7:30 PM',
      capacity_per_day INTEGER DEFAULT 12,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // ─── SERVICE BOOKINGS ───────────────────────────────────────
  db.exec(`
    CREATE TABLE IF NOT EXISTS service_bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      booking_id TEXT UNIQUE NOT NULL,
      customer_name TEXT NOT NULL,
      mobile TEXT NOT NULL,
      email TEXT,
      scooter_model TEXT NOT NULL,
      registration_number TEXT NOT NULL,
      service_type TEXT NOT NULL,
      issue_description TEXT,
      service_center_id INTEGER,
      service_center_name TEXT,
      preferred_date TEXT NOT NULL,
      preferred_time_slot TEXT,
      pickup_required INTEGER DEFAULT 0,
      pickup_address TEXT,
      confirmed_service_time TEXT,
      estimated_completion_time TEXT,
      actual_delivery_time TEXT,
      estimated_cost REAL DEFAULT 0,
      admin_notes TEXT,
      technician_name TEXT,
      status TEXT DEFAULT 'Pending' CHECK(status IN ('Pending','Confirmed','In Service','Ready for Pickup','Completed','Cancelled')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (service_center_id) REFERENCES service_centers(id)
    )
  `);

  console.log('✅ All database tables created successfully');
}

module.exports = { initializeDatabase };
