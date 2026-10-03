'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '../lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState('input'); // 'input' | 'otp' | 'admin'
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [devOtp, setDevOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPass, setAdminPass] = useState('');

  const sendOtp = async () => {
    if (!name.trim() || !mobile.trim()) { setError('Name and mobile number are required'); return; }
    setLoading(true); setError('');
    try {
      const res = await api.post('/auth/customer/send-otp', { name, mobile });
      setDevOtp(res.data.otp_dev || '');
      setStep('otp');
    } catch (e) { setError(e.response?.data?.message || 'Failed to send OTP'); }
    setLoading(false);
  };

  const verifyOtp = async () => {
    if (!otp.trim()) { setError('Please enter OTP'); return; }
    setLoading(true); setError('');
    try {
      const res = await api.post('/auth/customer/verify-otp', { mobile, otp });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.customer));
      localStorage.setItem('role', 'customer');
      router.push('/dashboard');
    } catch (e) { setError(e.response?.data?.message || 'Invalid OTP'); }
    setLoading(false);
  };

  const adminLogin = async () => {
    if (!adminEmail.trim() || !adminPass.trim()) { setError('Email and password required'); return; }
    setLoading(true); setError('');
    try {
      const res = await api.post('/auth/admin/login', { email: adminEmail, password: adminPass });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      localStorage.setItem('role', 'admin');
      router.push('/admin');
    } catch (e) { setError(e.response?.data?.message || 'Invalid credentials'); }
    setLoading(false);
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div style={{ textAlign: 'center', fontSize: '3rem', marginBottom: '1rem' }}>🛵</div>
        <h1>{isAdmin ? 'Admin Login' : 'Welcome'}</h1>
        <p className="subtitle">{isAdmin ? 'Sign in to the admin panel' : 'Login with your name & mobile number'}</p>

        {error && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid var(--danger)', borderRadius: 'var(--radius-sm)', padding: '0.75rem', marginBottom: '1rem', color: 'var(--danger)', fontSize: '0.9rem' }}>{error}</div>}

        {!isAdmin && step === 'input' && (
          <>
            <div className="form-group">
              <label>Your Name</label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Enter your full name" />
            </div>
            <div className="form-group">
              <label>Mobile Number</label>
              <input value={mobile} onChange={e => setMobile(e.target.value)} placeholder="Enter 10-digit mobile" type="tel" maxLength={10} />
            </div>
            <button className="btn btn-primary btn-block btn-lg" onClick={sendOtp} disabled={loading}>
              {loading ? 'Sending...' : 'Send OTP'}
            </button>
          </>
        )}

        {!isAdmin && step === 'otp' && (
          <>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem', textAlign: 'center' }}>
              OTP sent to {mobile}
            </p>
            {devOtp && <p style={{ color: 'var(--primary)', textAlign: 'center', marginBottom: '1rem', fontWeight: 700 }}>Dev OTP: {devOtp}</p>}
            <div className="form-group">
              <label>Enter OTP</label>
              <input className="otp-input" value={otp} onChange={e => setOtp(e.target.value)} placeholder="• • • •" maxLength={4} />
            </div>
            <button className="btn btn-primary btn-block btn-lg" onClick={verifyOtp} disabled={loading}>
              {loading ? 'Verifying...' : 'Verify & Login'}
            </button>
            <button className="btn btn-ghost btn-block" style={{ marginTop: '0.75rem' }} onClick={() => setStep('input')}>← Change Number</button>
          </>
        )}

        {isAdmin && (
          <>
            <div className="form-group">
              <label>Admin Email</label>
              <input value={adminEmail} onChange={e => setAdminEmail(e.target.value)} placeholder="admin@olashowroom.com" type="email" />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input value={adminPass} onChange={e => setAdminPass(e.target.value)} placeholder="Enter password" type="password" />
            </div>
            <button className="btn btn-primary btn-block btn-lg" onClick={adminLogin} disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </>
        )}

        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <button className="btn btn-ghost btn-sm" onClick={() => { setIsAdmin(!isAdmin); setError(''); setStep('input'); }}>
            {isAdmin ? '← Customer Login' : 'Admin Login →'}
          </button>
        </div>
        <div style={{ textAlign: 'center', marginTop: '1rem' }}>
          <Link href="/" style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>← Back to Home</Link>
        </div>
      </div>
    </div>
  );
}
