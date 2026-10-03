'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import api from '../../lib/api';

function formatPrice(n) { return n ? '₹' + Number(n).toLocaleString('en-IN') : '₹0'; }

export default function ScooterDetailPage() {
  const params = useParams();
  const [scooter, setScooter] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.slug) {
      api.get(`/public/scooters/${params.slug}`)
        .then(r => { setScooter(r.data); setLoading(false); })
        .catch(() => setLoading(false));
    }
  }, [params.slug]);

  if (loading) return <div className="spinner" style={{ marginTop: '40vh' }} />;
  if (!scooter) return <div className="container" style={{ paddingTop: '4rem', textAlign: 'center' }}><h2>Scooter not found</h2><Link href="/scooters" className="btn btn-primary" style={{ marginTop: '1rem' }}>← Back to Catalogue</Link></div>;

  const wa = '8003356163';
  const waMsg = encodeURIComponent(`Hi! I am interested in the ${scooter.name} (${scooter.variant}). Please share more details. My name is: `);
  const waLink = `https://wa.me/91${wa}?text=${waMsg}`;

  const features = typeof scooter.features === 'string' ? JSON.parse(scooter.features) : (scooter.features || []);

  return (
    <>
      <nav className="navbar"><div className="navbar-inner">
        <Link href="/" className="navbar-brand">🛵 <span>OLA</span> Electric</Link>
        <ul className="nav-links">
          <li><Link href="/">Home</Link></li>
          <li><Link href="/scooters" className="active">Scooters</Link></li>
          <li><Link href="/offers">Offers</Link></li>
          <li><Link href="/contact">Contact</Link></li>
        </ul>
        <div className="nav-actions"><Link href="/login" className="btn btn-primary btn-sm">Login</Link></div>
      </div></nav>

      <div className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
        <Link href="/scooters" style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem', display: 'inline-block' }}>← Back to Catalogue</Link>

        <div className="detail-grid" style={{ marginTop: '1rem' }}>
          {/* Gallery */}
          <div className="detail-gallery" style={{ position: 'relative' }}>
            🛵
            {(scooter.status === 'Sold Out' || scooter.status === 'Discontinued') && (
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 900, color: 'var(--danger)', borderRadius: 'var(--radius-lg)', letterSpacing: '0.15em' }}>
                {scooter.status === 'Sold Out' ? 'SOLD OUT' : 'DISCONTINUED'}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="detail-info">
            <span className={`badge ${({'Available':'badge-available','Limited Stock':'badge-limited','Sold Out':'badge-sold-out','Coming Soon':'badge-coming-soon','Discontinued':'badge-discontinued'})[scooter.status] || 'badge-available'}`} style={{ marginBottom: '1rem' }}>
              {scooter.status}
            </span>
            <h1>{scooter.name}</h1>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>{scooter.model} • {scooter.variant}</p>

            <div className="detail-price">{formatPrice(scooter.price)}</div>
            {scooter.ex_showroom_price > 0 && <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '-1rem', marginBottom: '0.5rem' }}>Ex-showroom: {formatPrice(scooter.ex_showroom_price)}</p>}
            {scooter.on_road_price > 0 && <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>On-road: {formatPrice(scooter.on_road_price)}</p>}

            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', lineHeight: 1.7 }}>{scooter.description}</p>

            {/* Specs grid */}
            <div className="detail-specs">
              {scooter.battery_info && <div className="spec-box"><div className="spec-label">Battery</div><div className="spec-value">🔋 {scooter.battery_info}</div></div>}
              {scooter.range_km && <div className="spec-box"><div className="spec-label">Range</div><div className="spec-value">📏 {scooter.range_km}</div></div>}
              {scooter.top_speed && <div className="spec-box"><div className="spec-label">Top Speed</div><div className="spec-value">⚡ {scooter.top_speed}</div></div>}
              {scooter.charging_time && <div className="spec-box"><div className="spec-label">Charging</div><div className="spec-value">🔌 {scooter.charging_time}</div></div>}
              {scooter.motor_info && <div className="spec-box"><div className="spec-label">Motor</div><div className="spec-value">⚙️ {scooter.motor_info}</div></div>}
              {scooter.warranty && <div className="spec-box"><div className="spec-label">Warranty</div><div className="spec-value">🛡️ {scooter.warranty}</div></div>}
            </div>

            {/* Features */}
            {features.length > 0 && (
              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '0.75rem' }}>Features</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {features.map((f, i) => <span key={i} style={{ background: 'var(--surface)', padding: '0.4rem 0.8rem', borderRadius: '20px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>✓ {f}</span>)}
                </div>
              </div>
            )}

            {/* Colors */}
            <div className="detail-colors">
              <h3>Available Colors</h3>
              <div className="detail-color-list">
                {(scooter.colors || []).map(c => (
                  <div key={c.id} className={`detail-color-item ${c.status === 'Sold Out' ? 'sold-out' : ''}`}>
                    <span className="detail-color-swatch" style={{ backgroundColor: c.hex_code || '#666' }} />
                    {c.name} — <span className={`badge badge-sm ${({'Available':'badge-available','Limited Stock':'badge-limited','Sold Out':'badge-sold-out'})[c.status]}`}>{c.status}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* CTAs */}
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <a href={waLink} target="_blank" rel="noopener" className="btn btn-primary btn-lg" style={{ background: '#25d366', boxShadow: 'none' }}>
                💬 Request on WhatsApp
              </a>
              <Link href="/test-ride" className="btn btn-secondary btn-lg">Book Test Ride</Link>
              <Link href="/contact" className="btn btn-ghost btn-lg">Enquire Now</Link>
            </div>
          </div>
        </div>
      </div>

      <a href={`https://wa.me/91${wa}`} target="_blank" rel="noopener" className="whatsapp-float" title={`WhatsApp: ${wa}`}>💬</a>
    </>
  );
}
