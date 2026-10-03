'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '../lib/api';

export default function OffersPage() {
  const [offers, setOffers] = useState([]);
  useEffect(() => { api.get('/public/offers').then(r => setOffers(r.data)).catch(() => {}); }, []);

  return (
    <>
      <nav className="navbar"><div className="navbar-inner">
        <Link href="/" className="navbar-brand">🛵 <span>OLA</span> Electric</Link>
        <ul className="nav-links">
          <li><Link href="/">Home</Link></li>
          <li><Link href="/scooters">Scooters</Link></li>
          <li><Link href="/service">Service Center</Link></li>
          <li><Link href="/offers" className="active">Offers</Link></li>
          <li><Link href="/benefit">Complimentary Benefit</Link></li>
          <li><Link href="/contact">Contact</Link></li>
        </ul>
        <div className="nav-actions"><Link href="/login" className="btn btn-primary btn-sm">Login</Link></div>
      </div></nav>

      <div className="container">
        <div className="page-header"><h1>Current Offers & Promotions</h1><p>Exclusive deals on OLA electric scooters</p></div>
        {offers.length === 0 ? <p style={{ color: 'var(--text-muted)' }}>No active offers right now. Check back soon!</p> : (
          <div className="grid grid-2">
            {offers.map(o => (
              <div key={o.id} className="offer-card">
                <h3>🎁 {o.title}</h3>
                <p>{o.description}</p>
                {o.terms && <p style={{ marginTop: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)', position: 'relative' }}>T&C: {o.terms}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
      <a href="https://wa.me/918003356163" target="_blank" rel="noopener" className="whatsapp-float">💬</a>
    </>
  );
}
