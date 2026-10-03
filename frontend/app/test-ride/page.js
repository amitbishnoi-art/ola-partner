'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '../lib/api';

export default function TestRidePage() {
  const [scooters, setScooters] = useState([]);
  const [form, setForm] = useState({ name: '', mobile: '', scooter_id: '', scooter_name: '', preferred_date: '', preferred_time: '', message: '' });
  const [done, setDone] = useState(false);

  useEffect(() => { api.get('/public/scooters').then(r => setScooters(r.data.filter(s => s.status === 'Available' || s.status === 'Limited Stock'))).catch(() => {}); }, []);

  const submit = async () => {
    if (!form.name || !form.mobile) { alert('Name and mobile required'); return; }
    try {
      await api.post('/public/test-rides', form);
      setDone(true);
    } catch (e) { alert(e.response?.data?.message || 'Error'); }
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
          <li><Link href="/contact">Contact</Link></li>
        </ul>
        <div className="nav-actions"><Link href="/login" className="btn btn-primary btn-sm">Login</Link></div>
      </div></nav>

      <div className="container" style={{ maxWidth: 600, paddingTop: '2rem', paddingBottom: '4rem' }}>
        <div className="page-header"><h1>Book a Test Ride</h1><p>Experience the thrill of OLA electric before you buy</p></div>

        {done ? (
          <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎉</div>
            <h2>Test Ride Booked!</h2>
            <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Our team will contact you to confirm the date and time.</p>
            <Link href="/" className="btn btn-primary" style={{ marginTop: '1.5rem' }}>Back to Home</Link>
          </div>
        ) : (
          <div className="card">
            <div className="form-group"><label>Your Name *</label><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
            <div className="form-group"><label>Mobile Number *</label><input value={form.mobile} onChange={e => setForm({ ...form, mobile: e.target.value })} type="tel" maxLength={10} /></div>
            <div className="form-group">
              <label>Select Scooter</label>
              <select value={form.scooter_id} onChange={e => { const s = scooters.find(x => String(x.id) === e.target.value); setForm({ ...form, scooter_id: e.target.value, scooter_name: s ? s.name : '' }); }}>
                <option value="">Choose a scooter</option>
                {scooters.map(s => <option key={s.id} value={s.id}>{s.name} ({s.variant})</option>)}
              </select>
            </div>
            <div className="form-row">
              <div className="form-group"><label>Preferred Date</label><input type="date" value={form.preferred_date} onChange={e => setForm({ ...form, preferred_date: e.target.value })} /></div>
              <div className="form-group"><label>Preferred Time</label><input type="time" value={form.preferred_time} onChange={e => setForm({ ...form, preferred_time: e.target.value })} /></div>
            </div>
            <div className="form-group"><label>Message (optional)</label><textarea rows={3} value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} /></div>
            <button className="btn btn-primary btn-block btn-lg" onClick={submit}>Book Test Ride</button>
          </div>
        )}
      </div>
      <a href="https://wa.me/918003356163" target="_blank" rel="noopener" className="whatsapp-float">💬</a>
    </>
  );
}
