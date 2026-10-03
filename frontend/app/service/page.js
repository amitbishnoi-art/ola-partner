'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '../lib/api';

/* ─── Distance helper between two GPS coordinates (in km) ─── */
function calculateDistance(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return (R * c).toFixed(1);
}

/* ─── Status badge styling ─── */
function getStatusBadge(status) {
  switch (status) {
    case 'Pending': return 'badge-limited';
    case 'Confirmed': return 'badge-available';
    case 'In Service': return 'badge-limited';
    case 'Ready for Pickup': return 'badge-available';
    case 'Completed': return 'badge-available';
    case 'Cancelled': return 'badge-discontinued';
    default: return 'badge-available';
  }
}

export default function ServicePage() {
  const [activeTab, setActiveTab] = useState('book'); // 'book' | 'track' | 'centers'
  const [centers, setCenters] = useState([]);
  const [showroom, setShowroom] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState('');
  const [mobileNav, setMobileNav] = useState(false);

  // Booking Form State
  const [form, setForm] = useState({
    customer_name: '',
    mobile: '',
    email: '',
    scooter_model: 'OLA S1 Pro Gen 2',
    registration_number: '',
    service_type: 'Periodic Maintenance (General Service)',
    issue_description: '',
    service_center_id: '',
    preferred_date: '',
    preferred_time_slot: 'Morning (9:30 AM - 1:00 PM)',
    pickup_required: false,
    pickup_address: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [bookedResult, setBookedResult] = useState(null);
  const [submitError, setSubmitError] = useState('');

  // Tracking State
  const [trackQuery, setTrackQuery] = useState('');
  const [trackingResults, setTrackingResults] = useState(null);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackingError, setTrackingError] = useState('');

  useEffect(() => {
    // Fetch service centers and showroom info
    Promise.all([
      api.get('/public/service-centers'),
      api.get('/public/showroom')
    ]).then(([centRes, showRes]) => {
      setCenters(centRes.data || []);
      setShowroom(showRes.data || null);
      if (centRes.data && centRes.data.length > 0) {
        setForm(f => ({ ...f, service_center_id: centRes.data[0].id }));
      }
    }).catch(err => {
      console.error('Failed to fetch service info:', err);
    });

    // Check if query params has track id or mobile
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const trackParam = urlParams.get('track');
      if (trackParam) {
        setTrackQuery(trackParam);
        setActiveTab('track');
        fetchTracking(trackParam);
      }
    }
  }, []);

  // Request user's live location to sort/calculate nearest center
  const requestLiveLocation = () => {
    if (!navigator.geolocation) {
      setLocError('Geolocation is not supported by your browser.');
      return;
    }
    setLocating(true);
    setLocError('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude
        });
        setLocating(false);
      },
      (err) => {
        setLocError('Could not fetch your location. Please check location permissions.');
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Open Google Maps Directions from live user coordinates or destination
  const openLiveDirections = (center) => {
    const destLat = center.latitude || (showroom && showroom.latitude);
    const destLng = center.longitude || (showroom && showroom.longitude);
    const destName = encodeURIComponent(center.name || (showroom && showroom.showroom_name) || 'OLA Service Centre');

    if (userLocation && destLat && destLng) {
      // Direct routing with origin and destination coordinates
      window.open(
        `https://www.google.com/maps/dir/?api=1&origin=${userLocation.lat},${userLocation.lng}&destination=${destLat},${destLng}&travelmode=driving`,
        '_blank'
      );
    } else if (center.google_maps_link) {
      window.open(center.google_maps_link, '_blank');
    } else if (destLat && destLng) {
      window.open(`https://www.google.com/maps/search/?api=1&query=${destLat},${destLng}`, '_blank');
    } else {
      window.open(`https://www.google.com/maps/search/?api=1&query=${destName}`, '_blank');
    }
  };

  // Handle Booking Submit
  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    if (!form.customer_name || !form.mobile || !form.scooter_model || !form.registration_number || !form.preferred_date) {
      setSubmitError('Please fill in all required fields.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.post('/public/service-bookings', form);
      setBookedResult({
        booking_id: res.data.booking_id,
        message: res.data.message
      });
      setSubmitting(false);
    } catch (err) {
      setSubmitError(err.response?.data?.message || 'Could not submit booking. Please try again.');
      setSubmitting(false);
    }
  };

  // Handle Tracking Search
  const fetchTracking = async (queryToSearch) => {
    const q = queryToSearch || trackQuery;
    if (!q) {
      setTrackingError('Please enter your Booking ID or Mobile Number');
      return;
    }
    setTrackingLoading(true);
    setTrackingError('');
    try {
      const res = await api.get(`/public/service-bookings/track/${encodeURIComponent(q.trim())}`);
      setTrackingResults(res.data);
      setTrackingLoading(false);
    } catch (err) {
      setTrackingResults(null);
      setTrackingError(err.response?.data?.message || 'No service booking found. Please verify your ID or mobile.');
      setTrackingLoading(false);
    }
  };

  const handleTrackSubmit = (e) => {
    e.preventDefault();
    fetchTracking();
  };

  const phone = showroom?.phone || '8003356163';
  const wa = showroom?.whatsapp || '8003356163';

  return (
    <>
      {/* ─── NAVBAR ──────────────────────────────────────────── */}
      <nav className="navbar">
        <div className="navbar-inner">
          <Link href="/" className="navbar-brand">
            🛵 <span>{showroom?.showroom_name || 'OLA'}</span> Electric
          </Link>
          <button className="mobile-toggle" onClick={() => setMobileNav(!mobileNav)}>☰</button>
          <ul className={`nav-links ${mobileNav ? 'open' : ''}`}>
            <li><Link href="/">Home</Link></li>
            <li><Link href="/scooters">Scooters</Link></li>
            <li><Link href="/service" style={{ color: 'var(--primary-light)', fontWeight: 700 }}>Service Center</Link></li>
            <li><Link href="/offers">Offers</Link></li>
            <li><Link href="/benefit">Complimentary Benefit</Link></li>
            <li><Link href="/about">About Us</Link></li>
            <li><Link href="/contact">Contact</Link></li>
          </ul>
          <div className="nav-actions">
            <Link href="/login" className="btn btn-primary btn-sm">Login</Link>
          </div>
        </div>
      </nav>

      <main style={{ minHeight: '80vh', padding: '2.5rem 0' }}>
        <div className="container">

          {/* ─── HERO HEADER ────────────────────────────────────── */}
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <span className="badge badge-available" style={{ marginBottom: '0.75rem' }}>Authorized OLA Service Network</span>
            <h1 style={{ fontSize: '2.6rem', fontWeight: 900, marginBottom: '0.75rem', letterSpacing: '-0.02em' }}>
              OLA Scooty <span className="highlight">Pre-Booking & Service Hub</span>
            </h1>
            <p style={{ color: 'var(--text-secondary)', maxWidth: '680px', margin: '0 auto', fontSize: '1.05rem' }}>
              Pre-book your scooter service slot at your nearest OLA service center. Get scheduled appointment time, real-time service tracking, and exact scooty delivery time updates.
            </p>

            {/* TAB SELECTOR */}
            <div style={{ display: 'inline-flex', background: 'var(--surface)', padding: '0.35rem', borderRadius: 'var(--radius)', marginTop: '2rem', border: '1px solid var(--border)', gap: '0.5rem' }}>
              <button
                className={`btn btn-sm ${activeTab === 'book' ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setActiveTab('book')}
              >
                📅 Pre-Book Service
              </button>
              <button
                className={`btn btn-sm ${activeTab === 'track' ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setActiveTab('track')}
              >
                🔍 Track Scooty Status
              </button>
              <button
                className={`btn btn-sm ${activeTab === 'centers' ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setActiveTab('centers')}
              >
                📍 Near Scooty Centres ({centers.length})
              </button>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════
             TAB 1: PRE-BOOK SERVICE FORM
             ═══════════════════════════════════════════════════════ */}
          {activeTab === 'book' && (
            <div style={{ maxWidth: '860px', margin: '0 auto' }}>
              {bookedResult ? (
                /* Success Confirmation Card */
                <div className="card text-center" style={{ padding: '3rem 2rem', border: '2px solid var(--primary)', background: 'linear-gradient(180deg, rgba(0,200,83,0.1), var(--bg-card))' }}>
                  <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎉</div>
                  <h2 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text)', marginBottom: '0.5rem' }}>Service Pre-Booking Received!</h2>
                  <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '1.1rem' }}>
                    Your service slot has been logged in our system. The showroom manager will assign your confirmed time slot and technician.
                  </p>
                  <div style={{ display: 'inline-block', background: 'var(--surface)', border: '1px dashed var(--primary)', borderRadius: 'var(--radius)', padding: '1.25rem 2rem', marginBottom: '2rem' }}>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Your Booking Reference ID</div>
                    <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--primary-light)', letterSpacing: '0.05em' }}>{bookedResult.booking_id}</div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                    <button
                      className="btn btn-primary btn-lg"
                      onClick={() => {
                        setTrackQuery(bookedResult.booking_id);
                        setActiveTab('track');
                        fetchTracking(bookedResult.booking_id);
                      }}
                    >
                      🔍 Track Status & Delivery Time
                    </button>
                    <button
                      className="btn btn-secondary btn-lg"
                      onClick={() => {
                        setBookedResult(null);
                        setForm({
                          customer_name: '',
                          mobile: '',
                          email: '',
                          scooter_model: 'OLA S1 Pro Gen 2',
                          registration_number: '',
                          service_type: 'Periodic Maintenance (General Service)',
                          issue_description: '',
                          service_center_id: centers[0]?.id || '',
                          preferred_date: '',
                          preferred_time_slot: 'Morning (9:30 AM - 1:00 PM)',
                          pickup_required: false,
                          pickup_address: ''
                        });
                      }}
                    >
                      Book Another Service
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleBookingSubmit} className="card" style={{ padding: '2.5rem', border: '1px solid var(--border)' }}>
                  <h3 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    🛵 Scooter & Owner Details
                  </h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', marginBottom: '2rem' }}>
                    Book your maintenance or repair slot in under 60 seconds.
                  </p>

                  {submitError && (
                    <div style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid var(--danger)', color: '#fca5a5', padding: '0.85rem 1.25rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.5rem' }}>
                      ⚠️ {submitError}
                    </div>
                  )}

                  {/* Personal Info */}
                  <div className="grid grid-2" style={{ marginBottom: '1.5rem' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.88rem', fontWeight: 600 }}>
                        Your Full Name <span style={{ color: 'var(--danger)' }}>*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Rahul Sharma"
                        value={form.customer_name}
                        onChange={e => setForm({ ...form, customer_name: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.88rem', fontWeight: 600 }}>
                        Mobile Number <span style={{ color: 'var(--danger)' }}>*</span>
                      </label>
                      <input
                        type="tel"
                        placeholder="10-digit mobile number"
                        value={form.mobile}
                        onChange={e => setForm({ ...form, mobile: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  {/* Scooter Info */}
                  <div className="grid grid-2" style={{ marginBottom: '1.5rem' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.88rem', fontWeight: 600 }}>
                        OLA Scooter Model <span style={{ color: 'var(--danger)' }}>*</span>
                      </label>
                      <select
                        value={form.scooter_model}
                        onChange={e => setForm({ ...form, scooter_model: e.target.value })}
                        required
                      >
                        <option value="OLA S1 Pro Gen 2">OLA S1 Pro Gen 2</option>
                        <option value="OLA S1 Pro">OLA S1 Pro (Gen 1)</option>
                        <option value="OLA S1 Air">OLA S1 Air</option>
                        <option value="OLA S1 X+">OLA S1 X+</option>
                        <option value="OLA S1 X (3kWh)">OLA S1 X (3 kWh)</option>
                        <option value="OLA S1 X (2kWh)">OLA S1 X (2 kWh)</option>
                        <option value="OLA Roadster">OLA Roadster (Motorcycle)</option>
                        <option value="Other OLA Model">Other OLA Model</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.88rem', fontWeight: 600 }}>
                        Vehicle Registration Number <span style={{ color: 'var(--danger)' }}>*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. RJ14 AB 1234 or DL01 AB 9999"
                        value={form.registration_number}
                        onChange={e => setForm({ ...form, registration_number: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  {/* Select Service Center */}
                  <div style={{ marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <label style={{ fontSize: '0.88rem', fontWeight: 600 }}>
                        Select Scooty Service Centre <span style={{ color: 'var(--danger)' }}>*</span>
                      </label>
                      <button
                        type="button"
                        onClick={requestLiveLocation}
                        className="btn btn-ghost btn-sm"
                        style={{ fontSize: '0.8rem', padding: '0.3rem 0.75rem', borderColor: 'var(--border)' }}
                      >
                        {locating ? '📍 Locating...' : '📍 Use My Live Location to Find Nearest'}
                      </button>
                    </div>

                    {locError && (
                      <p style={{ color: 'var(--warning)', fontSize: '0.82rem', marginBottom: '0.5rem' }}>{locError}</p>
                    )}

                    <div className="grid grid-3" style={{ gap: '0.75rem' }}>
                      {centers.map(center => {
                        const dist = userLocation ? calculateDistance(userLocation.lat, userLocation.lng, center.latitude, center.longitude) : null;
                        const isSelected = String(form.service_center_id) === String(center.id);
                        return (
                          <div
                            key={center.id}
                            onClick={() => setForm({ ...form, service_center_id: center.id })}
                            style={{
                              border: isSelected ? '2px solid var(--primary)' : '1px solid var(--border)',
                              background: isSelected ? 'rgba(0,200,83,0.08)' : 'var(--surface)',
                              borderRadius: 'var(--radius-sm)',
                              padding: '1rem',
                              cursor: 'pointer',
                              position: 'relative',
                              transition: 'var(--transition)'
                            }}
                          >
                            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: isSelected ? 'var(--primary-light)' : 'var(--text)' }}>
                              {center.name}
                            </div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.35rem', lineHeight: '1.4' }}>
                              📍 {center.address}
                            </div>
                            {dist && (
                              <div style={{ marginTop: '0.5rem', display: 'inline-block', background: 'rgba(59,130,246,0.15)', color: 'var(--info)', fontSize: '0.75rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: '4px' }}>
                                🚗 {dist} km from you
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Service Type */}
                  <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.88rem', fontWeight: 600 }}>
                      Service Required <span style={{ color: 'var(--danger)' }}>*</span>
                    </label>
                    <select
                      value={form.service_type}
                      onChange={e => setForm({ ...form, service_type: e.target.value })}
                      required
                    >
                      <option value="Periodic Maintenance (General Service)">🛠️ Periodic Maintenance (Routine General Service)</option>
                      <option value="Battery & Electrical Diagnostics">⚡ Battery & Charging / Electrical Health Check</option>
                      <option value="Brakes, Suspension & Tyres">🛑 Brake Pads, Suspension & Tyre Service</option>
                      <option value="Software Update / MoveOS Upgrade">💻 Software / Display / MoveOS Firmware Update</option>
                      <option value="Bodywork & Accidental Repair">🔧 Bodywork, Mirror / Plastic Part Replacement</option>
                      <option value="Quick 15-Point Safety Inspection">🔍 Quick 15-Point Safety & Performance Inspection</option>
                      <option value="Other Custom Issue">⚠️ Other / Custom Technical Issue</option>
                    </select>
                  </div>

                  {/* Date & Time Slot */}
                  <div className="grid grid-2" style={{ marginBottom: '1.5rem' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.88rem', fontWeight: 600 }}>
                        Preferred Date <span style={{ color: 'var(--danger)' }}>*</span>
                      </label>
                      <input
                        type="date"
                        min={new Date().toISOString().split('T')[0]}
                        value={form.preferred_date}
                        onChange={e => setForm({ ...form, preferred_date: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.88rem', fontWeight: 600 }}>
                        Preferred Time Slot
                      </label>
                      <select
                        value={form.preferred_time_slot}
                        onChange={e => setForm({ ...form, preferred_time_slot: e.target.value })}
                      >
                        <option value="Morning (9:30 AM - 1:00 PM)">Morning (9:30 AM - 1:00 PM)</option>
                        <option value="Afternoon (1:00 PM - 4:00 PM)">Afternoon (1:00 PM - 4:00 PM)</option>
                        <option value="Evening (4:00 PM - 7:30 PM)">Evening (4:00 PM - 7:30 PM)</option>
                      </select>
                    </div>
                  </div>

                  {/* Pickup & Drop Toggle */}
                  <div style={{ marginBottom: '1.5rem', background: 'var(--surface)', padding: '1rem 1.25rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', fontWeight: 600, fontSize: '0.95rem' }}>
                      <input
                        type="checkbox"
                        checked={form.pickup_required}
                        onChange={e => setForm({ ...form, pickup_required: e.target.checked })}
                        style={{ width: '18px', height: '18px', accentColor: 'var(--primary)' }}
                      />
                      <span>Doorstep Pickup & Drop Required (Within city limits)</span>
                    </label>
                    {form.pickup_required && (
                      <div style={{ marginTop: '0.75rem' }}>
                        <input
                          type="text"
                          placeholder="Enter your complete pickup address with landmark"
                          value={form.pickup_address}
                          onChange={e => setForm({ ...form, pickup_address: e.target.value })}
                          required={form.pickup_required}
                        />
                      </div>
                    )}
                  </div>

                  {/* Issue Notes */}
                  <div style={{ marginBottom: '2rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.88rem', fontWeight: 600 }}>
                      Describe any specific problems or requests (Optional)
                    </label>
                    <textarea
                      rows={3}
                      placeholder="e.g. Squeaking noise in front brake, battery discharging faster than usual, display reboot issue..."
                      value={form.issue_description}
                      onChange={e => setForm({ ...form, issue_description: e.target.value })}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn btn-primary btn-lg"
                    style={{ width: '100%', fontSize: '1.1rem' }}
                  >
                    {submitting ? 'Submitting Pre-Booking...' : '✅ Confirm Pre-Booking Slot'}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════
             TAB 2: TRACK SERVICE STATUS & ESTIMATED DELIVERY TIME
             ═══════════════════════════════════════════════════════ */}
          {activeTab === 'track' && (
            <div style={{ maxWidth: '860px', margin: '0 auto' }}>
              <div className="card" style={{ padding: '2rem', marginBottom: '2rem' }}>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                  🔍 Track Your Scooty Service Status
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', marginBottom: '1.5rem' }}>
                  Enter your Booking Reference ID (e.g. <code style={{ color: 'var(--primary-light)' }}>SRV-2026-0811</code>) or your 10-digit registered mobile number.
                </p>

                <form onSubmit={handleTrackSubmit} style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <input
                    type="text"
                    placeholder="Enter Booking ID (SRV-...) or 10-digit Mobile Number"
                    value={trackQuery}
                    onChange={e => setTrackQuery(e.target.value)}
                    style={{ flex: 1, minWidth: '240px' }}
                    required
                  />
                  <button type="submit" disabled={trackingLoading} className="btn btn-primary">
                    {trackingLoading ? 'Searching...' : 'Track Scooty'}
                  </button>
                </form>

                {trackingError && (
                  <div style={{ marginTop: '1.25rem', background: 'rgba(239,68,68,0.15)', border: '1px solid var(--danger)', color: '#fca5a5', padding: '0.85rem 1.25rem', borderRadius: 'var(--radius-sm)' }}>
                    ❌ {trackingError}
                  </div>
                )}
              </div>

              {/* TRACKING RESULTS */}
              {trackingResults && trackingResults.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                  {trackingResults.map(booking => {
                    // Determine active step index
                    const steps = ['Pending', 'Confirmed', 'In Service', 'Ready for Pickup', 'Completed'];
                    let stepIdx = steps.indexOf(booking.status);
                    if (stepIdx === -1) stepIdx = 0;

                    return (
                      <div key={booking.id} className="card" style={{ padding: '2.5rem', border: '1px solid var(--border)' }}>

                        {/* Header bar */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '1.25rem' }}>
                          <div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>BOOKING REFERENCE</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary-light)' }}>{booking.booking_id}</div>
                            <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text)', marginTop: '0.25rem' }}>
                              🛵 {booking.scooter_model} • <span style={{ color: 'var(--text-secondary)' }}>{booking.registration_number}</span>
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <span className={`badge ${getStatusBadge(booking.status)}`} style={{ fontSize: '0.95rem', padding: '0.4rem 1rem' }}>
                              {booking.status}
                            </span>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                              Booked on {new Date(booking.created_at).toLocaleDateString()}
                            </div>
                          </div>
                        </div>

                        {/* 🌟 USER REQUEST HIGHLIGHT: WHEN WILL THEY GET THE SCOOTY BACK? 🌟 */}
                        <div className="ready-time-card">
                          <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            ⏱️ Estimated Scooty Ready / Pickup Time (Admin Confirmed)
                          </div>
                          <div className="highlight-time">
                            {booking.estimated_completion_time || 'Will be scheduled upon vehicle check-in'}
                          </div>
                          <div style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                            Confirmed Service Slot: <strong style={{ color: 'var(--text)' }}>{booking.confirmed_service_time || booking.preferred_time_slot}</strong>
                          </div>
                        </div>

                        {/* Interactive Visual Stepper */}
                        <div className="tracking-stepper">
                          <div
                            className="tracking-stepper-progress"
                            style={{ width: `${(stepIdx / (steps.length - 1)) * 90}%` }}
                          />
                          {steps.map((st, i) => {
                            const isCompleted = i < stepIdx;
                            const isActive = i === stepIdx;
                            return (
                              <div key={st} className={`tracking-step ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}>
                                <div className="step-circle">
                                  {isCompleted ? '✓' : i + 1}
                                </div>
                                <div className="step-title">{st}</div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Service Center & Action Details */}
                        <div className="grid grid-2" style={{ marginTop: '2rem', gap: '1.5rem' }}>
                          <div style={{ background: 'var(--surface)', padding: '1.25rem', borderRadius: 'var(--radius-sm)' }}>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Service Centre</div>
                            <div style={{ fontWeight: 700, fontSize: '1rem', marginTop: '0.25rem' }}>
                              📍 {booking.service_center_name || 'Showroom Central Hub'}
                            </div>
                            {booking.center?.address && (
                              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.35rem' }}>
                                {booking.center.address}
                              </p>
                            )}
                            <div style={{ marginTop: '1rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                              <button
                                type="button"
                                className="btn btn-primary btn-sm"
                                onClick={() => openLiveDirections(booking.center || { name: booking.service_center_name })}
                              >
                                🗺️ Live Navigation (Maps)
                              </button>
                              <a href={`tel:${booking.center?.contact_number || phone}`} className="btn btn-ghost btn-sm">
                                📞 Call Centre
                              </a>
                            </div>
                          </div>

                          <div style={{ background: 'var(--surface)', padding: '1.25rem', borderRadius: 'var(--radius-sm)' }}>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Service Summary & Charges</div>
                            <div style={{ marginTop: '0.5rem', fontSize: '0.92rem' }}>
                              <div><strong>Service Type:</strong> {booking.service_type}</div>
                              {booking.technician_name && (
                                <div style={{ marginTop: '0.25rem' }}><strong>Assigned Technician:</strong> 👨‍🔧 {booking.technician_name}</div>
                              )}
                              <div style={{ marginTop: '0.25rem' }}>
                                <strong>Estimated Amount:</strong> <span style={{ color: 'var(--primary-light)', fontWeight: 700 }}>₹{booking.estimated_cost || 0}</span>
                              </div>
                              {booking.admin_notes && (
                                <div style={{ marginTop: '0.5rem', background: 'rgba(255,255,255,0.04)', padding: '0.5rem 0.75rem', borderRadius: '4px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                  💬 <strong>Technician Note:</strong> {booking.admin_notes}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════
             TAB 3: NEARBY SERVICE CENTRES & LIVE LOCATION
             ═══════════════════════════════════════════════════════ */}
          {activeTab === 'centers' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.5rem', fontWeight: 800 }}>OLA Authorized Service Network</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                    Find the nearest service bay equipped with factory-certified technicians and diagnostic tools.
                  </p>
                </div>
                <button
                  onClick={requestLiveLocation}
                  className="btn btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  📍 {locating ? 'Detecting Location...' : userLocation ? 'Update Live Location' : 'Detect My Live Location'}
                </button>
              </div>

              {userLocation && (
                <div style={{ background: 'rgba(0,200,83,0.1)', border: '1px solid var(--primary)', padding: '0.75rem 1.25rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>✅ Live location detected! Distances to service centres calculated.</span>
                  <span style={{ fontSize: '0.85rem', color: 'var(--primary-light)', fontWeight: 600 }}>
                    {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
                  </span>
                </div>
              )}

              <div className="grid grid-3">
                {centers.map(center => {
                  const dist = userLocation ? calculateDistance(userLocation.lat, userLocation.lng, center.latitude, center.longitude) : null;
                  return (
                    <div key={center.id} className="location-card" style={{ display: 'flex', flexDirection: 'column' }}>
                      <div className="map-placeholder" onClick={() => openLiveDirections(center)} title="Click to navigate on Google Maps">
                        🗺️
                      </div>
                      <div className="location-info" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                            <h3 style={{ fontWeight: 800, fontSize: '1.15rem' }}>{center.name}</h3>
                            {dist && (
                              <span className="badge badge-available" style={{ fontSize: '0.75rem', fontWeight: 700 }}>
                                {dist} km
                              </span>
                            )}
                          </div>
                          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '0.75rem', lineHeight: '1.5' }}>
                            📍 {center.address}
                          </p>
                          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                            🕒 {center.opening_hours || 'Mon-Sat: 8:30 AM - 7:30 PM'}
                          </div>
                          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                            ⚡ Capacity: Up to {center.capacity_per_day || 12} scooters/day
                          </div>
                        </div>

                        <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.5rem' }}>
                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            style={{ flex: 1 }}
                            onClick={() => openLiveDirections(center)}
                          >
                            🗺️ Navigate (GPS)
                          </button>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => {
                              setForm(f => ({ ...f, service_center_id: center.id }));
                              setActiveTab('book');
                            }}
                          >
                            📅 Book
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      </main>

      {/* ─── FOOTER ──────────────────────────────────────────── */}
      <footer className="footer">
        <div className="container footer-content">
          <div>
            <h3>{showroom?.showroom_name || 'OLA'} Electric</h3>
            <p>Authorized Showroom & Service Network. Quality electric mobility for everyone.</p>
          </div>
          <div>
            <h4>Quick Links</h4>
            <ul className="footer-links">
              <li><Link href="/scooters">Scooters</Link></li>
              <li><Link href="/service">Service Center</Link></li>
              <li><Link href="/test-ride">Book Test Ride</Link></li>
              <li><Link href="/benefit">Complimentary Benefit</Link></li>
              <li><Link href="/offers">Offers</Link></li>
              <li><Link href="/contact">Showroom Location</Link></li>
            </ul>
          </div>
          <div>
            <h4>Contact Support</h4>
            <ul className="footer-links">
              <li>📞 Phone: {phone}</li>
              <li>💬 WhatsApp: +91 {wa}</li>
              <li>📍 {showroom?.address || 'Showroom Address'}</li>
            </ul>
          </div>
        </div>
        <div className="container footer-bottom">
          <p>© {new Date().getFullYear()} {showroom?.showroom_name || 'OLA Electric'}. All rights reserved.</p>
        </div>
      </footer>
    </>
  );
}
