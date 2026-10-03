'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '../lib/api';

export default function ContactPage() {
  const [showroom, setShowroom] = useState(null);
  const [form, setForm] = useState({ name: '', mobile: '', email: '', category: 'Other', subject: '', message: '' });
  const [sent, setSent] = useState(false);
  const [locating, setLocating] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);

  useEffect(() => {
    api.get('/public/showroom').then(r => setShowroom(r.data)).catch(() => {});
  }, []);

  const submit = async () => {
    if (!form.name) return;
    try {
      await api.post('/public/enquiries', form);
      setSent(true);
    } catch (e) {
      alert(e.response?.data?.message || 'Error submitting enquiry');
    }
  };

  // Live Location Navigation to Showroom
  const navigateToLocation = () => {
    const destLat = showroom?.latitude || '26.9124';
    const destLng = showroom?.longitude || '75.7873';
    const address = encodeURIComponent(showroom?.address || 'OLA Electric Showroom');

    if (navigator.geolocation) {
      setLocating(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocating(false);
          const originLat = pos.coords.latitude;
          const originLng = pos.coords.longitude;
          window.open(
            `https://www.google.com/maps/dir/?api=1&origin=${originLat},${originLng}&destination=${destLat},${destLng}&travelmode=driving`,
            '_blank'
          );
        },
        () => {
          setLocating(false);
          if (showroom?.google_maps_link) {
            window.open(showroom.google_maps_link, '_blank');
          } else {
            window.open(`https://www.google.com/maps/dir/?api=1&destination=${destLat},${destLng}`, '_blank');
          }
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    } else {
      if (showroom?.google_maps_link) {
        window.open(showroom.google_maps_link, '_blank');
      } else {
        window.open(`https://www.google.com/maps/search/?api=1&query=${address}`, '_blank');
      }
    }
  };

  const wa = showroom?.whatsapp || '8003356163';
  const phone = showroom?.phone || '8003356163';

  return (
    <>
      <nav className="navbar">
        <div className="navbar-inner">
          <Link href="/" className="navbar-brand">
            🛵 <span>{showroom?.showroom_name || 'OLA'}</span> Electric
          </Link>
          <button className="mobile-toggle" onClick={() => setMobileNav(!mobileNav)}>☰</button>
          <ul className={`nav-links ${mobileNav ? 'open' : ''}`}>
            <li><Link href="/">Home</Link></li>
            <li><Link href="/scooters">Scooters</Link></li>
            <li><Link href="/service">Service Center</Link></li>
            <li><Link href="/offers">Offers</Link></li>
            <li><Link href="/benefit">Complimentary Benefit</Link></li>
            <li><Link href="/about">About Us</Link></li>
            <li><Link href="/contact" style={{ color: 'var(--primary-light)', fontWeight: 700 }}>Contact</Link></li>
          </ul>
          <div className="nav-actions">
            <Link href="/login" className="btn btn-primary btn-sm">Login</Link>
          </div>
        </div>
      </nav>

      <div className="container" style={{ padding: '3rem 1.5rem', minHeight: '80vh' }}>
        <div className="page-header" style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <span className="badge badge-available" style={{ marginBottom: '0.5rem' }}>We&apos;re Here To Assist</span>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800 }}>Contact Our Showroom</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Get live directions, call our sales advisors, or send an enquiry.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '2.5rem' }}>
          {/* Contact & Location Card */}
          <div>
            {showroom && (
              <div className="card" style={{ padding: '2rem', border: '1px solid var(--border)' }}>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '1rem' }}>{showroom.showroom_name}</h3>
                
                <div style={{ background: 'var(--surface)', padding: '1.25rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', marginBottom: '1.5rem' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Showroom Address</div>
                  <p style={{ color: 'var(--text)', fontWeight: 600, fontSize: '1rem', lineHeight: '1.5' }}>
                    📍 {showroom.address || 'Address configured by showroom admin'}
                  </p>
                  
                  {/* LIVE LOCATION NAVIGATION BUTTON */}
                  <div style={{ marginTop: '1.25rem' }}>
                    <button
                      type="button"
                      onClick={navigateToLocation}
                      className="btn btn-primary btn-block"
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                    >
                      🗺️ {locating ? 'Finding Live Route...' : 'Navigate from My Live Location (Google Maps)'}
                    </button>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.5rem', textAlign: 'center' }}>
                      Automatically calculates driving route from your current GPS location
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontSize: '1.2rem' }}>📞</span>
                    <div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Phone Number</div>
                      <a href={`tel:${phone}`} style={{ color: 'var(--text)', fontWeight: 600 }}>{phone}</a>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontSize: '1.2rem' }}>💬</span>
                    <div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>WhatsApp Helpline</div>
                      <a href={`https://wa.me/91${wa}`} target="_blank" rel="noopener" style={{ color: '#25d366', fontWeight: 600 }}>+91 {wa}</a>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontSize: '1.2rem' }}>✉️</span>
                    <div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Official Email</div>
                      <a href={`mailto:${showroom.email || 'info@olashowroom.com'}`} style={{ color: 'var(--text)' }}>
                        {showroom.email || 'info@olashowroom.com'}
                      </a>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontSize: '1.2rem' }}>🕐</span>
                    <div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Opening Hours</div>
                      <span style={{ color: 'var(--text)' }}>{showroom.opening_hours}</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <a href={`https://wa.me/91${wa}`} target="_blank" rel="noopener" className="btn btn-primary btn-sm" style={{ background: '#25d366', boxShadow: 'none' }}>
                    💬 WhatsApp Chat
                  </a>
                  <a href={`tel:${phone}`} className="btn btn-secondary btn-sm">
                    📞 Call Now
                  </a>
                  <Link href="/service" className="btn btn-ghost btn-sm">
                    🔧 Pre-Book Service
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Enquiry Form */}
          <div className="card" style={{ padding: '2rem', border: '1px solid var(--border)' }}>
            {sent ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>✅</div>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Enquiry Submitted!</h3>
                <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', marginBottom: '1.5rem' }}>
                  Thank you! Our showroom representative will contact you shortly.
                </p>
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    setSent(false);
                    setForm({ name: '', mobile: '', email: '', category: 'Other', subject: '', message: '' });
                  }}
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '0.5rem' }}>Send an Enquiry</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: '1.5rem' }}>
                  Ask about booking, financing options, exchange bonus, or test rides.
                </p>
                <div className="grid grid-2" style={{ marginBottom: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.85rem', fontWeight: 600 }}>Name *</label>
                    <input
                      placeholder="Your full name"
                      value={form.name}
                      onChange={e => setForm({ ...form, name: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.85rem', fontWeight: 600 }}>Mobile Number</label>
                    <input
                      placeholder="10-digit mobile"
                      value={form.mobile}
                      onChange={e => setForm({ ...form, mobile: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-2" style={{ marginBottom: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.85rem', fontWeight: 600 }}>Email Address</label>
                    <input
                      type="email"
                      placeholder="name@example.com"
                      value={form.email}
                      onChange={e => setForm({ ...form, email: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.85rem', fontWeight: 600 }}>Category</label>
                    <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                      <option value="Scooter">Scooter Purchase</option>
                      <option value="Price">Pricing & On-road Cost</option>
                      <option value="Availability">Stock Availability</option>
                      <option value="Test Ride">Test Ride</option>
                      <option value="Finance">Finance / EMI</option>
                      <option value="Exchange">Petrol Scooter Exchange</option>
                      <option value="Other">Other Enquiry</option>
                    </select>
                  </div>
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.85rem', fontWeight: 600 }}>Subject</label>
                  <input
                    placeholder="Brief subject of your query"
                    value={form.subject}
                    onChange={e => setForm({ ...form, subject: e.target.value })}
                  />
                </div>
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.85rem', fontWeight: 600 }}>Message</label>
                  <textarea
                    rows={4}
                    placeholder="How can we help you?"
                    value={form.message}
                    onChange={e => setForm({ ...form, message: e.target.value })}
                  />
                </div>
                <button
                  type="button"
                  className="btn btn-primary btn-block"
                  onClick={submit}
                >
                  ✉️ Submit Enquiry
                </button>
              </>
            )}
          </div>
        </div>
      </div>
      <a href={`https://wa.me/91${wa}`} target="_blank" rel="noopener" className="whatsapp-float">💬</a>
    </>
  );
}
