'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from './lib/api';

/* ─── Helper: format ₹ price ───────────────────────────────── */
function formatPrice(n) {
  if (!n) return '₹0';
  return '₹' + Number(n).toLocaleString('en-IN');
}

/* ─── Helper: status → badge class ─────────────────────────── */
function badgeClass(status) {
  const map = {
    'Available': 'badge-available',
    'Limited Stock': 'badge-limited',
    'Sold Out': 'badge-sold-out',
    'Coming Soon': 'badge-coming-soon',
    'Temporarily Unavailable': 'badge-discontinued',
    'Discontinued': 'badge-discontinued',
  };
  return map[status] || 'badge-available';
}

export default function HomePage() {
  const [showroom, setShowroom] = useState(null);
  const [scooters, setScooters] = useState([]);
  const [offers, setOffers] = useState([]);
  const [benefit, setBenefit] = useState(null);
  const [mobileNav, setMobileNav] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get('/public/showroom'),
      api.get('/public/scooters'),
      api.get('/public/offers'),
      api.get('/public/benefit-settings'),
    ]).then(([sr, sc, of, bn]) => {
      setShowroom(sr.data);
      setScooters(sc.data);
      setOffers(of.data);
      setBenefit(bn.data);
    }).catch(console.error);
  }, []);

  if (!showroom) return <div className="spinner" style={{ marginTop: '40vh' }} />;

  const wa = showroom.whatsapp || '8003356163';
  const waLink = `https://wa.me/91${wa}`;

  return (
    <>
      {/* ─── NAVBAR ──────────────────────────────────────────── */}
      <nav className="navbar">
        <div className="navbar-inner">
          <Link href="/" className="navbar-brand">
            🛵 <span>{showroom.showroom_name || 'OLA'}</span> Electric
          </Link>
          <button className="mobile-toggle" onClick={() => setMobileNav(!mobileNav)}>☰</button>
          <ul className={`nav-links ${mobileNav ? 'open' : ''}`}>
            <li><Link href="/">Home</Link></li>
            <li><Link href="/scooters">Scooters</Link></li>
            <li><Link href="/service">Service Center</Link></li>
            <li><Link href="/offers">Offers</Link></li>
            <li><Link href="/benefit">Complimentary Benefit</Link></li>
            <li><Link href="/about">About Us</Link></li>
            <li><Link href="/contact">Contact Us</Link></li>
          </ul>
          <div className="nav-actions">
            <Link href="/login" className="btn btn-primary btn-sm">Login</Link>
          </div>
        </div>
      </nav>

      {/* ─── HERO ────────────────────────────────────────────── */}
      <section className="hero">
        <div className="hero-content">
          <div className="hero-text">
            <h1>
              Ride the <span className="highlight">Future</span><br />
              Today
            </h1>
            <p>{showroom.about || 'Premium OLA electric scooters — eco-friendly, stylish, powerful. Visit our showroom to experience the revolution.'}</p>
            <div className="hero-ctas">
              <Link href="/scooters" className="btn btn-primary btn-lg">Explore Scooters</Link>
              <Link href="/service" className="btn btn-secondary btn-lg">🔧 Pre-Book Service</Link>
              <Link href="/test-ride" className="btn btn-ghost btn-lg">Book Test Ride</Link>
            </div>
          </div>
          <div className="hero-visual">
            <div className="scooter-placeholder">🛵</div>
          </div>
        </div>
      </section>

      {/* ─── FEATURED SCOOTERS ───────────────────────────────── */}
      <section className="section" id="scooters">
        <div className="container">
          <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem' }}>Our Scooters</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Explore the complete range of OLA electric scooters</p>
          <div className="grid grid-3">
            {scooters.slice(0, 6).map(s => (
              <Link href={`/scooters/${s.slug}`} key={s.id} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div className="scooter-card">
                  <div className="scooter-img">
                    🛵
                    {(s.status === 'Sold Out' || s.status === 'Discontinued') && (
                      <div className="status-overlay">{s.status === 'Sold Out' ? 'SOLD OUT' : 'DISCONTINUED'}</div>
                    )}
                  </div>
                  <div className="scooter-body">
                    <h3>{s.name}</h3>
                    <div className="variant">{s.model} • {s.variant}</div>
                    <div className="price">{formatPrice(s.price)}</div>
                    <div className="specs-row">
                      {s.range_km && <span className="spec-item">🔋 {s.range_km}</span>}
                      {s.top_speed && <span className="spec-item">⚡ {s.top_speed}</span>}
                    </div>
                    <div className="color-dots">
                      {(s.colors || []).map(c => (
                        <span
                          key={c.id}
                          className={`color-dot ${c.status === 'Sold Out' ? 'sold-out' : ''}`}
                          style={{ backgroundColor: c.hex_code || '#666' }}
                          title={`${c.name} — ${c.status}`}
                        />
                      ))}
                    </div>
                    <span className={`badge ${badgeClass(s.status)}`}>{s.status}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          {scooters.length > 6 && (
            <div className="text-center" style={{ marginTop: '2rem' }}>
              <Link href="/scooters" className="btn btn-secondary">View All Scooters →</Link>
            </div>
          )}
        </div>
      </section>

      {/* ─── OFFERS ──────────────────────────────────────────── */}
      {offers.length > 0 && (
        <section className="section" style={{ background: 'var(--bg-card)' }}>
          <div className="container">
            <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem' }}>Current Offers</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Exclusive deals and promotions</p>
            <div className="grid grid-3">
              {offers.map(o => (
                <div key={o.id} className="offer-card">
                  <h3>🎁 {o.title}</h3>
                  <p>{o.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── COMPLIMENTARY BENEFIT ───────────────────────────── */}
      {benefit && benefit.enabled === 1 && (
        <section className="section">
          <div className="container">
            <div className="card-glass" style={{ maxWidth: 700, margin: '0 auto', textAlign: 'center', padding: '3rem' }}>
              <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '1rem' }}>{benefit.title}</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', marginBottom: '2rem' }}>{benefit.description}</p>
              <Link href="/benefit" className="btn btn-primary btn-lg">Learn More →</Link>
            </div>
          </div>
        </section>
      )}

      {/* ─── LOCATION SECTION ────────────────────────────────── */}
      <section className="section" style={{ background: 'var(--bg-card)' }}>
        <div className="container">
          {/* ─── SCOOTY SERVICE & PRE-BOOKING BANNER ────────────────── */}
          <div className="card" style={{ padding: '2.5rem', marginBottom: '3rem', background: 'linear-gradient(135deg, rgba(0,200,83,0.12), rgba(17,24,39,0.95))', border: '1px solid var(--primary)', borderRadius: 'var(--radius)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
              <div>
                <span className="badge badge-available" style={{ marginBottom: '0.5rem' }}>Authorized Care Network</span>
                <h3 style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '0.35rem' }}>OLA Scooty Pre-Booking & Servicing</h3>
                <p style={{ color: 'var(--text-secondary)', maxWidth: '580px', marginTop: '0.35rem' }}>
                  Pre-book a maintenance slot near your scooty centre. Get guaranteed appointment timing, live status tracking, and precise pickup time estimates!
                </p>
              </div>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <Link href="/service" className="btn btn-primary btn-lg">
                  📅 Pre-Book Service Slot
                </Link>
                <Link href="/service?track=1" className="btn btn-secondary btn-lg">
                  🔍 Track Service Status
                </Link>
              </div>
            </div>
          </div>

          <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '2rem' }}>Visit Our Showroom</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem', alignItems: 'center' }}>
            <div className="location-card">
              <div
                className="map-placeholder"
                title="Click to open live GPS route on Google Maps"
                onClick={() => {
                  const destLat = showroom.latitude || '26.9124';
                  const destLng = showroom.longitude || '75.7873';
                  if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(
                      (pos) => {
                        window.open(`https://www.google.com/maps/dir/?api=1&origin=${pos.coords.latitude},${pos.coords.longitude}&destination=${destLat},${destLng}&travelmode=driving`, '_blank');
                      },
                      () => {
                        if (showroom.google_maps_link) {
                          window.open(showroom.google_maps_link, '_blank');
                        } else {
                          window.open(`https://www.google.com/maps/dir/?api=1&destination=${destLat},${destLng}`, '_blank');
                        }
                      }
                    );
                  } else {
                    window.open(showroom.google_maps_link || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(showroom.address || 'OLA Showroom')}`, '_blank');
                  }
                }}
              >
                🗺️
              </div>
              <div className="location-info">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3>{showroom.showroom_name}</h3>
                  <span className="badge badge-available">Open Today</span>
                </div>
                <p style={{ marginTop: '0.25rem', color: 'var(--text-secondary)' }}>📍 {showroom.address || 'Address configured by admin'}</p>
                <p style={{ marginTop: '0.5rem' }}>📞 {showroom.phone}</p>
                <p>🕐 {showroom.opening_hours}</p>
                <button
                  type="button"
                  className="btn btn-primary btn-sm btn-block"
                  style={{ marginTop: '1rem' }}
                  onClick={() => {
                    const destLat = showroom.latitude || '26.9124';
                    const destLng = showroom.longitude || '75.7873';
                    if (navigator.geolocation) {
                      navigator.geolocation.getCurrentPosition(
                        (pos) => {
                          window.open(`https://www.google.com/maps/dir/?api=1&origin=${pos.coords.latitude},${pos.coords.longitude}&destination=${destLat},${destLng}&travelmode=driving`, '_blank');
                        },
                        () => {
                          window.open(showroom.google_maps_link || `https://www.google.com/maps/dir/?api=1&destination=${destLat},${destLng}`, '_blank');
                        }
                      );
                    } else {
                      window.open(showroom.google_maps_link || `https://www.google.com/maps/dir/?api=1&destination=${destLat},${destLng}`, '_blank');
                    }
                  }}
                >
                  🗺️ Navigate from My Live Location (Google Maps)
                </button>
              </div>
            </div>
            <div>
              <h3 style={{ fontSize: '1.3rem', marginBottom: '1rem' }}>Get in Touch</h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                Have questions? We&apos;re here to help! Visit us, call us, or reach us on WhatsApp.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <a href={waLink} target="_blank" rel="noopener" className="btn btn-primary" style={{ background: '#25d366', boxShadow: 'none' }}>
                  💬 WhatsApp: {wa}
                </a>
                <a href={`tel:${showroom.phone || wa}`} className="btn btn-secondary">📞 Call Us: {showroom.phone || wa}</a>
                <Link href="/service" className="btn btn-ghost">🔧 Book Scooter Service</Link>
                {showroom.email && <a href={`mailto:${showroom.email}`} className="btn btn-ghost">✉️ Email Us</a>}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ──────────────────────────────────────────── */}
      <footer className="footer">
        <div className="footer-grid">
          <div className="footer-col">
            <h4>🛵 {showroom.showroom_name || 'OLA Electric'}</h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Authorized OLA Electric showroom. Explore, test ride, and own your dream electric scooter.
            </p>
          </div>
          <div className="footer-col">
            <h4>Quick Links</h4>
            <ul>
              <li><Link href="/scooters">Scooters</Link></li>
              <li><Link href="/service">Service Center</Link></li>
              <li><Link href="/offers">Offers</Link></li>
              <li><Link href="/benefit">Complimentary Benefit</Link></li>
              <li><Link href="/test-ride">Book Test Ride</Link></li>
              <li><Link href="/contact">Contact Us</Link></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Contact</h4>
            <ul>
              <li>📍 {showroom.address || 'Address coming soon'}</li>
              <li>📞 {showroom.phone}</li>
              <li>✉️ {showroom.email || 'info@olashowroom.com'}</li>
              <li>🕐 {showroom.opening_hours}</li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Connect With Us</h4>
            <div className="social-links">
              <a href={waLink} target="_blank" rel="noopener" title="WhatsApp">💬</a>
              {showroom.instagram_url ? <a href={showroom.instagram_url} target="_blank" rel="noopener" title="Instagram">📸</a> : <a href="#" title="Instagram (coming soon)">📸</a>}
              {showroom.facebook_url ? <a href={showroom.facebook_url} target="_blank" rel="noopener" title="Facebook">📘</a> : <a href="#" title="Facebook (coming soon)">📘</a>}
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} {showroom.showroom_name || 'OLA Electric Showroom'}. All rights reserved.</p>
        </div>
      </footer>

      {/* ─── WHATSAPP FLOATING BUTTON ────────────────────────── */}
      <a href={waLink} target="_blank" rel="noopener" className="whatsapp-float" title={`WhatsApp: ${wa}`}>💬</a>
    </>
  );
}
