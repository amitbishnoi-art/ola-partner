'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '../lib/api';

export default function CustomerDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [introductions, setIntroductions] = useState([]);
  const [benefits, setBenefits] = useState(null);
  const [tab, setTab] = useState('profile');

  useEffect(() => {
    const role = typeof window !== 'undefined' ? localStorage.getItem('role') : null;
    if (role !== 'customer') { router.push('/login'); return; }
    const u = JSON.parse(localStorage.getItem('user') || '{}');
    setUser(u);
    api.get('/customer/profile').then(r => setProfile(r.data)).catch(() => router.push('/login'));
    api.get('/customer/introductions').then(r => setIntroductions(r.data)).catch(() => {});
    api.get('/customer/benefits').then(r => setBenefits(r.data)).catch(() => {});
  }, [router]);

  const logout = () => { localStorage.clear(); router.push('/'); };

  if (!profile) return <div className="spinner" style={{ marginTop: '40vh' }} />;

  return (
    <>
      <nav className="navbar"><div className="navbar-inner">
        <Link href="/" className="navbar-brand">🛵 <span>OLA</span> Electric</Link>
        <div className="nav-actions">
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Hi, {profile.name}</span>
          <button className="btn btn-ghost btn-sm" onClick={logout}>Logout</button>
        </div>
      </div></nav>

      <div className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '2rem' }}>My Dashboard</h1>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
          {['profile', 'introductions', 'benefits', 'offers'].map(t => (
            <button key={t} className={`btn ${tab === t ? 'btn-primary' : 'btn-ghost'} btn-sm`} onClick={() => setTab(t)}>
              {t === 'profile' ? '👤 My Profile' : t === 'introductions' ? '🤝 My Introductions' : t === 'benefits' ? '🎁 My Benefits' : '🎁 Offers'}
            </button>
          ))}
        </div>

        {/* Profile */}
        {tab === 'profile' && (
          <div className="card" style={{ maxWidth: 600 }}>
            <h3 style={{ marginBottom: '1rem' }}>My Profile</h3>
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              <p><strong>Customer ID:</strong> {profile.customer_id}</p>
              <p><strong>Name:</strong> {profile.name}</p>
              <p><strong>Mobile:</strong> {profile.mobile}</p>
              {profile.email && <p><strong>Email:</strong> {profile.email}</p>}
              {profile.address && <p><strong>Address:</strong> {profile.address}</p>}
              <p><strong>Member Since:</strong> {new Date(profile.created_at).toLocaleDateString('en-IN')}</p>
              {profile.has_purchased ? (
                <div className="card-glass" style={{ marginTop: '1rem' }}>
                  <h4 style={{ color: 'var(--primary)', marginBottom: '0.5rem' }}>✅ Verified Purchaser</h4>
                  {profile.purchased_scooter_name && <p>Scooter: <strong>{profile.purchased_scooter_name}</strong></p>}
                  {profile.purchased_variant && <p>Variant: {profile.purchased_variant}</p>}
                  {profile.purchased_color && <p>Color: {profile.purchased_color}</p>}
                  {profile.purchase_date && <p>Purchased: {new Date(profile.purchase_date).toLocaleDateString('en-IN')}</p>}
                </div>
              ) : (
                <p style={{ color: 'var(--text-muted)' }}>No scooter purchase recorded yet.</p>
              )}
            </div>
          </div>
        )}

        {/* Introductions */}
        {tab === 'introductions' && (
          <div>
            <div className="flex-between" style={{ marginBottom: '1rem' }}>
              <h3>My Introductions</h3>
              <Link href="/benefit" className="btn btn-primary btn-sm">+ Introduce Someone</Link>
            </div>
            {introductions.length === 0 ? <p style={{ color: 'var(--text-muted)' }}>No introductions yet.</p> : (
              <div className="table-container">
                <table>
                  <thead><tr><th>Ref ID</th><th>Introduced Person</th><th>Mobile</th><th>Status</th><th>Date</th></tr></thead>
                  <tbody>
                    {introductions.map(i => (
                      <tr key={i.id}>
                        <td style={{ fontWeight: 600 }}>{i.reference_id}</td>
                        <td>{i.introduced_name}</td>
                        <td>{i.introduced_mobile}</td>
                        <td><span className="badge badge-coming-soon">{i.status}</span></td>
                        <td>{new Date(i.created_at).toLocaleDateString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Benefits */}
        {tab === 'benefits' && benefits && (
          <div>
            <h3 style={{ marginBottom: '1.5rem' }}>My Complimentary Benefits</h3>
            <div className="stat-cards" style={{ maxWidth: 800 }}>
              <div className="stat-card"><div className="stat-value" style={{ color: 'var(--warning)' }}>₹{benefits.pending}</div><div className="stat-label">Pending</div></div>
              <div className="stat-card"><div className="stat-value" style={{ color: 'var(--info)' }}>₹{benefits.approved}</div><div className="stat-label">Approved</div></div>
              <div className="stat-card"><div className="stat-value">₹{benefits.paid}</div><div className="stat-label">Paid</div></div>
              <div className="stat-card"><div className="stat-value">₹{benefits.total_earned}</div><div className="stat-label">Total Earned</div></div>
            </div>
            {benefits.items?.length > 0 && (
              <div className="table-container">
                <table>
                  <thead><tr><th>Amount</th><th>Status</th><th>Date</th></tr></thead>
                  <tbody>
                    {benefits.items.map(b => (
                      <tr key={b.id}>
                        <td style={{ fontWeight: 700, color: 'var(--primary)' }}>₹{b.amount}</td>
                        <td><span className="badge badge-coming-soon">{b.status}</span></td>
                        <td>{new Date(b.created_at).toLocaleDateString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Offers */}
        {tab === 'offers' && <OffersTab />}
      </div>
      <a href="https://wa.me/918003356163" target="_blank" rel="noopener" className="whatsapp-float">💬</a>
    </>
  );
}

function OffersTab() {
  const [offers, setOffers] = useState([]);
  useEffect(() => { api.get('/customer/offers').then(r => setOffers(r.data)).catch(() => {}); }, []);
  return (
    <div className="grid grid-2">
      {offers.map(o => <div key={o.id} className="offer-card"><h3>🎁 {o.title}</h3><p>{o.description}</p></div>)}
      {offers.length === 0 && <p style={{ color: 'var(--text-muted)' }}>No active offers right now.</p>}
    </div>
  );
}
