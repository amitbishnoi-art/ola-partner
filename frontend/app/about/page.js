'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '../lib/api';

export default function AboutPage() {
  const [showroom, setShowroom] = useState(null);
  useEffect(() => { api.get('/public/showroom').then(r => setShowroom(r.data)).catch(() => {}); }, []);

  const wa = showroom?.whatsapp || '8003356163';

  return (
    <>
      <nav className="navbar"><div className="navbar-inner">
        <Link href="/" className="navbar-brand">🛵 <span>OLA</span> Electric</Link>
        <ul className="nav-links">
          <li><Link href="/">Home</Link></li>
          <li><Link href="/scooters">Scooters</Link></li>
          <li><Link href="/service">Service Center</Link></li>
          <li><Link href="/offers">Offers</Link></li>
          <li><Link href="/benefit">Complimentary Benefit</Link></li>
          <li><Link href="/about" className="active">About</Link></li>
          <li><Link href="/contact">Contact</Link></li>
        </ul>
        <div className="nav-actions"><Link href="/login" className="btn btn-primary btn-sm">Login</Link></div>
      </div></nav>

      <div className="container" style={{ paddingBottom: '4rem' }}>
        <div className="page-header"><h1>About Us</h1><p>Your trusted OLA Electric partner</p></div>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <div className="card-glass" style={{ padding: '2.5rem', marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.6rem', marginBottom: '1rem' }}>{showroom?.showroom_name || 'OLA Electric Showroom'}</h2>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: '1.05rem' }}>
              {showroom?.about || 'Welcome to our authorized OLA Electric Showroom. We offer the latest range of OLA electric scooters with the best service, genuine parts, and comprehensive after-sales support. Our mission is to make electric mobility accessible and enjoyable for everyone.'}
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div className="card" style={{ textAlign: 'center' }}><div style={{ fontSize: '2.5rem' }}>🛵</div><h4 style={{ marginTop: '0.5rem' }}>Latest Models</h4><p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Full range of OLA scooters</p></div>
            <div className="card" style={{ textAlign: 'center' }}><div style={{ fontSize: '2.5rem' }}>🔧</div><h4 style={{ marginTop: '0.5rem' }}>Expert Service</h4><p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Authorized service center</p></div>
            <div className="card" style={{ textAlign: 'center' }}><div style={{ fontSize: '2.5rem' }}>💰</div><h4 style={{ marginTop: '0.5rem' }}>Best Deals</h4><p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Exclusive offers & financing</p></div>
            <div className="card" style={{ textAlign: 'center' }}><div style={{ fontSize: '2.5rem' }}>🤝</div><h4 style={{ marginTop: '0.5rem' }}>Customer Care</h4><p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Dedicated support team</p></div>
          </div>
          {showroom && (
            <div className="card" style={{ marginTop: '2rem' }}>
              <h3 style={{ marginBottom: '1rem' }}>Showroom Details</h3>
              <p style={{ color: 'var(--text-secondary)' }}>📍 {showroom.address || 'Address coming soon'}</p>
              <p style={{ color: 'var(--text-secondary)' }}>📞 {showroom.phone}</p>
              <p style={{ color: 'var(--text-secondary)' }}>🕐 {showroom.opening_hours}</p>
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem', flexWrap: 'wrap' }}>
                <a href={`https://wa.me/91${wa}`} target="_blank" rel="noopener" className="btn btn-primary btn-sm" style={{ background: '#25d366', boxShadow: 'none' }}>💬 WhatsApp</a>
                <a href={showroom.google_maps_link || `https://www.google.com/maps/search/${encodeURIComponent(showroom.address || 'OLA Electric Showroom')}`} target="_blank" rel="noopener" className="btn btn-secondary btn-sm">📍 Get Directions</a>
              </div>
            </div>
          )}
        </div>
      </div>
      <a href={`https://wa.me/91${wa}`} target="_blank" rel="noopener" className="whatsapp-float">💬</a>
    </>
  );
}
