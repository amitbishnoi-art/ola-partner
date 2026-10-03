require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./config/db');

async function start() {
  // ── Initialise database ────────────────────────────────────
  await db.initDB();

  // ── Create tables ──────────────────────────────────────────
  const { initializeDatabase } = require('./models');
  initializeDatabase();

  // ── Express app ────────────────────────────────────────────
  const app = express();
  app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Serve uploaded files
  app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

  // ── Routes ─────────────────────────────────────────────────
  app.use('/api/auth', require('./routes/auth'));
  app.use('/api/public', require('./routes/public'));
  app.use('/api/admin', require('./routes/admin'));
  app.use('/api/customer', require('./routes/customer'));

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // ── Start ──────────────────────────────────────────────────
  const PORT = process.env.PORT || 4000;
  app.listen(PORT, () => {
    console.log(`\n🛵  OLA Showroom Backend running on http://localhost:${PORT}`);
    console.log(`    API Health: http://localhost:${PORT}/api/health`);
    console.log(`    Database:   backend/data/showroom.db\n`);
  });
}

start().catch(err => {
  console.error('❌ Failed to start server:', err);
  process.exit(1);
});
