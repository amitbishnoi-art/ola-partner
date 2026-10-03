'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '../lib/api';

export default function BenefitPage() {
  const [benefit, setBenefit] = useState(null);
  const [form, setForm] = useState({ existing_customer_mobile: '', introduced_name: '', introduced_mobile: '', introduced_email: '', note: '' });
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => { api.get('/public/benefit-settings').then(r => setBenefit(r.data)).catch(() => {}); }, []);

  const submit = async () => {
    setError(''); setResult(null);
    if (!form.existing_customer_mobile || !form.introduced_name || !form.introduced_mobile) { setError('All required fields must be filled'); return; }
    try {
      const res = await api.post('/public/introductions', form);
      setResult(res.data);
    } catch (e) { setError(e.response?.data?.message || 'Error submitting'); }
  };

  return (
    <>
      <nav className="navbar"><div className="navbar-inner">
        <Link href="/" className="navbar-brand">🛵 <span>OLA</span> Electric</Link>
        <ul className="nav-links">
          <li><Link href="/">Home</Link></li>
          <li><Link href="/scooters">Scooters</Link></li>
          <li><Link href="/service">Service Center</Link></li>
          <li><Link href="/offers">Offers</Link></li>
          <li><Link href="/benefit" className="active">Benefit</Link></li>
          <li><Link href="/contact">Contact</Link></li>
        </ul>
        <div className="nav-actions"><Link href="/login" className="btn btn-primary btn-sm">Login</Link></div>
      </div></nav>

      <div className="container" style={{ paddingBottom: '4rem' }}>
        <div className="page-header">
          <h1>{benefit?.title || '₹501 Complimentary Benefit'}</h1>
          <p>Earn rewards when you introduce someone to our showroom</p>
        </div>

        {/* Explanation */}
        <div className="card-glass" style={{ maxWidth: 700, margin: '0 auto 3rem', padding: '2.5rem', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎁</div>
          <h2 style={{ fontSize: '1.6rem', marginBottom: '1rem', color: 'var(--primary)' }}>
            {benefit?.title || '₹501 Complimentary Benefit'}
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', lineHeight: 1.7 }}>
            {benefit?.description || 'Purchase your scooter from us and introduce someone who purchases an eligible scooter from our showroom. You will receive a complimentary benefit.'}
          </p>
          {benefit && <p style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary)', marginTop: '1.5rem' }}>₹{benefit.amount}</p>}
        </div>

        {/* How it works */}
        <div style={{ maxWidth: 700, margin: '0 auto 3rem' }}>
          <h3 style={{ fontSize: '1.3rem', marginBottom: '1.5rem', textAlign: 'center' }}>How It Works</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            {['1. Purchase a scooter from our showroom', '2. Introduce someone to us', '3. They purchase an eligible scooter', '4. You receive your complimentary benefit!'].map((step, i) => (
              <div key={i} className="card" style={{ textAlign: 'center', padding: '1.5rem' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{['🛵', '🤝', '✅', '🎉'][i]}</div>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{step}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Introduction Form */}
        <div className="card" style={{ maxWidth: 600, margin: '0 auto' }}>
          <h3 style={{ marginBottom: '1.25rem' }}>Introduce Someone</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Already purchased a scooter from us? Fill in the form below to introduce someone.</p>

          {error && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid var(--danger)', borderRadius: 'var(--radius-sm)', padding: '0.75rem', marginBottom: '1rem', color: 'var(--danger)', fontSize: '0.9rem' }}>{error}</div>}

          {result ? (
            <div style={{ textAlign: 'center', padding: '2rem 0' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
              <h3>Introduction Submitted!</h3>
              <p style={{ color: 'var(--text-secondary)', margin: '0.5rem 0' }}>Reference ID: <strong>{result.reference_id}</strong></p>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>You can track the status from your dashboard.</p>
              <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={() => { setResult(null); setForm({ existing_customer_mobile: '', introduced_name: '', introduced_mobile: '', introduced_email: '', note: '' }); }}>Submit Another</button>
            </div>
          ) : (
            <>
              <div className="form-group"><label>Your Mobile Number (registered) *</label><input value={form.existing_customer_mobile} onChange={e => setForm({ ...form, existing_customer_mobile: e.target.value })} placeholder="Your registered mobile" /></div>
              <div className="form-row">
                <div className="form-group"><label>Introduced Person&apos;s Name *</label><input value={form.introduced_name} onChange={e => setForm({ ...form, introduced_name: e.target.value })} /></div>
                <div className="form-group"><label>Their Mobile Number *</label><input value={form.introduced_mobile} onChange={e => setForm({ ...form, introduced_mobile: e.target.value })} /></div>
              </div>
              <div className="form-group"><label>Their Email (optional)</label><input type="email" value={form.introduced_email} onChange={e => setForm({ ...form, introduced_email: e.target.value })} /></div>
              <div className="form-group"><label>Note (optional)</label><textarea rows={3} value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} /></div>
              <button className="btn btn-primary btn-block btn-lg" onClick={submit}>Submit Introduction</button>
            </>
          )}
        </div>
      </div>
      <a href="https://wa.me/918003356163" target="_blank" rel="noopener" className="whatsapp-float">💬</a>
    </>
  );
}
