'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '../lib/api';

function formatPrice(n) { return n ? '₹' + Number(n).toLocaleString('en-IN') : '₹0'; }
function badgeClass(s) { return { 'Available':'badge-available','Limited Stock':'badge-limited','Sold Out':'badge-sold-out','Coming Soon':'badge-coming-soon','Temporarily Unavailable':'badge-discontinued','Discontinued':'badge-discontinued' }[s] || 'badge-available'; }

export default function ScootersPage() {
  const [scooters, setScooters] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/public/scooters', { params: { search: search || undefined, status: statusFilter || undefined } })
      .then(r => { setScooters(r.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [search, statusFilter]);

  return (
    <>
      <nav className="navbar"><div className="navbar-inner">
        <Link href="/" className="navbar-brand">🛵 <span>OLA</span> Electric</Link>
        <ul className="nav-links">
          <li><Link href="/">Home</Link></li>
          <li><Link href="/scooters" className="active">Scooters</Link></li>
          <li><Link href="/service">Service Center</Link></li>
          <li><Link href="/offers">Offers</Link></li>
          <li><Link href="/benefit">Complimentary Benefit</Link></li>
          <li><Link href="/contact">Contact</Link></li>
        </ul>
        <div className="nav-actions"><Link href="/login" className="btn btn-primary btn-sm">Login</Link></div>
      </div></nav>

      <div className="container">
        <div className="page-header">
          <h1>Scooter Catalogue</h1>
          <p>Browse our complete range of OLA electric scooters</p>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
          <input placeholder="Search scooters..." value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth: 300 }} />
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ maxWidth: 200 }}>
            <option value="">All Statuses</option>
            <option value="Available">Available</option>
            <option value="Limited Stock">Limited Stock</option>
            <option value="Sold Out">Sold Out</option>
            <option value="Coming Soon">Coming Soon</option>
            <option value="Discontinued">Discontinued</option>
          </select>
        </div>

        {loading ? <div className="spinner" /> : (
          <div className="grid grid-3">
            {scooters.map(s => (
              <Link href={`/scooters/${s.slug}`} key={s.id} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div className="scooter-card">
                  <div className="scooter-img">
                    🛵
                    {(s.status === 'Sold Out' || s.status === 'Discontinued') && <div className="status-overlay">{s.status === 'Sold Out' ? 'SOLD OUT' : 'DISCONTINUED'}</div>}
                  </div>
                  <div className="scooter-body">
                    <h3>{s.name}</h3>
                    <div className="variant">{s.model} • {s.variant}</div>
                    <div className="price">{formatPrice(s.price)}</div>
                    <div className="specs-row">
                      {s.range_km && <span className="spec-item">🔋 {s.range_km}</span>}
                      {s.top_speed && <span className="spec-item">⚡ {s.top_speed}</span>}
                      {s.charging_time && <span className="spec-item">🔌 {s.charging_time}</span>}
                    </div>
                    <div className="color-dots">
                      {(s.colors || []).map(c => (
                        <span key={c.id} className={`color-dot ${c.status === 'Sold Out' ? 'sold-out' : ''}`}
                          style={{ backgroundColor: c.hex_code || '#666' }} title={`${c.name} — ${c.status}`} />
                      ))}
                    </div>
                    <span className={`badge ${badgeClass(s.status)}`}>{s.status}</span>
                  </div>
                </div>
              </Link>
            ))}
            {scooters.length === 0 && <p style={{ color: 'var(--text-muted)', gridColumn: '1/-1' }}>No scooters found.</p>}
          </div>
        )}
      </div>
      <a href="https://wa.me/918003356163" target="_blank" rel="noopener" className="whatsapp-float" title="WhatsApp: 8003356163">💬</a>
    </>
  );
}
