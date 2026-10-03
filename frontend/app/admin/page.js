'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api, { API_BASE } from '../lib/api';

/* ─── Helper: format ₹ price ─── */
function formatPrice(n) {
  if (!n) return '₹0';
  return '₹' + Number(n).toLocaleString('en-IN');
}

/* ─── Status badge styling ─── */
function getStatusBadge(status) {
  switch (status) {
    case 'Available': return 'badge-available';
    case 'Limited Stock': return 'badge-limited';
    case 'Sold Out': return 'badge-sold-out';
    case 'Coming Soon': return 'badge-coming-soon';
    case 'Discontinued': return 'badge-discontinued';
    case 'Pending': return 'badge-limited';
    case 'Confirmed': return 'badge-available';
    case 'In Service': return 'badge-limited';
    case 'Ready for Pickup': return 'badge-available';
    case 'Completed': return 'badge-available';
    case 'Cancelled': return 'badge-discontinued';
    default: return 'badge-available';
  }
}

export default function AdminPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');

  // Current admin user info
  const [user, setUser] = useState(null);

  // Data states
  const [dashboard, setDashboard] = useState(null);
  const [scooters, setScooters] = useState([]);
  const [serviceBookings, setServiceBookings] = useState([]);
  const [serviceCenters, setServiceCenters] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [introductions, setIntroductions] = useState([]);
  const [benefits, setBenefits] = useState([]);
  const [benefitSettings, setBenefitSettings] = useState(null);
  const [testRides, setTestRides] = useState([]);
  const [enquiries, setEnquiries] = useState([]);
  const [offers, setOffers] = useState([]);
  const [showroom, setShowroom] = useState({});
  const [activityLogs, setActivityLogs] = useState([]);

  // Modals state
  const [scooterModal, setScooterModal] = useState({ open: false, isEdit: false, data: {} });
  const [serviceModal, setServiceModal] = useState({ open: false, data: {} });
  const [centerModal, setCenterModal] = useState({ open: false, isEdit: false, data: {} });
  const [offerModal, setOfferModal] = useState({ open: false, isEdit: false, data: {} });
  const [colorsModal, setColorsModal] = useState({ open: false, scooter: null, colors: [], newColor: { name: '', hex_code: '#000000', stock_qty: 10, status: 'Available' } });
  const [saleModal, setSaleModal] = useState({ open: false, customer: null, data: { scooter_id: '', variant: '', color: '', sale_price: '' } });

  // Filter states
  const [scooterFilter, setScooterFilter] = useState('');
  const [serviceFilter, setServiceFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const showToastMsg = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  // Check Admin Authentication
  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    const storedUser = localStorage.getItem('user');

    if (!token || role !== 'admin') {
      router.push('/login');
      return;
    }
    if (storedUser) {
      try { setUser(JSON.parse(storedUser)); } catch (e) {}
    }
    loadAllData();
  }, [router]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [dashRes, scRes, srvRes, centRes, custRes, introRes, benRes, benSetRes, trRes, enqRes, offRes, srRes, logsRes] = await Promise.all([
        api.get('/admin/dashboard'),
        api.get('/admin/scooters'),
        api.get('/admin/service-bookings'),
        api.get('/admin/service-centers'),
        api.get('/admin/customers'),
        api.get('/admin/introductions'),
        api.get('/admin/reports/benefits'),
        api.get('/public/benefit-settings'),
        api.get('/admin/test-rides'),
        api.get('/admin/enquiries'),
        api.get('/admin/offers'),
        api.get('/public/showroom'),
        api.get('/admin/activity-logs'),
      ]);

      setDashboard(dashRes.data);
      setScooters(scRes.data);
      setServiceBookings(srvRes.data);
      setServiceCenters(centRes.data);
      setCustomers(custRes.data);
      setIntroductions(introRes.data);
      setBenefits(benRes.data);
      setBenefitSettings(benSetRes.data);
      setTestRides(trRes.data);
      setEnquiries(enqRes.data);
      setOffers(offRes.data);
      setShowroom(srRes.data || {});
      setActivityLogs(logsRes.data || []);
      setLoading(false);
    } catch (err) {
      console.error('Error loading admin data:', err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        localStorage.clear();
        router.push('/login');
      }
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    router.push('/login');
  };

  // ═══════════════════════════════════════════════════════════════
  // SCOOTER ACTIONS
  // ═══════════════════════════════════════════════════════════════
  const saveScooter = async (e) => {
    e.preventDefault();
    const data = scooterModal.data;
    try {
      if (scooterModal.isEdit) {
        await api.put(`/admin/scooters/${data.id}`, data);
        showToastMsg('✅ Scooter updated successfully');
      } else {
        await api.post('/admin/scooters', data);
        showToastMsg('✅ Scooter created successfully');
      }
      setScooterModal({ open: false, isEdit: false, data: {} });
      const res = await api.get('/admin/scooters');
      setScooters(res.data);
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving scooter');
    }
  };

  const deleteScooter = async (id, name) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;
    try {
      await api.delete(`/admin/scooters/${id}`);
      showToastMsg('Scooter deleted');
      setScooters(scooters.filter(s => s.id !== id));
    } catch (err) {
      alert(err.response?.data?.message || 'Error deleting');
    }
  };

  const openColors = async (scooter) => {
    try {
      const res = await api.get(`/admin/scooters/${scooter.id}`);
      setColorsModal({
        open: true,
        scooter,
        colors: res.data.colors || [],
        newColor: { name: '', hex_code: '#000000', stock_qty: 10, status: 'Available' }
      });
    } catch (err) {
      alert('Error fetching colors');
    }
  };

  const addColor = async () => {
    const { scooter, newColor } = colorsModal;
    if (!newColor.name) return alert('Color name required');
    try {
      await api.post(`/admin/scooters/${scooter.id}/colors`, newColor);
      const res = await api.get(`/admin/scooters/${scooter.id}`);
      setColorsModal(c => ({
        ...c,
        colors: res.data.colors || [],
        newColor: { name: '', hex_code: '#000000', stock_qty: 10, status: 'Available' }
      }));
      showToastMsg('Color added');
    } catch (err) {
      alert(err.response?.data?.message || 'Error adding color');
    }
  };

  const deleteColor = async (colorId) => {
    try {
      await api.delete(`/admin/colors/${colorId}`);
      setColorsModal(c => ({ ...c, colors: c.colors.filter(x => x.id !== colorId) }));
      showToastMsg('Color deleted');
    } catch (err) {
      alert('Error deleting color');
    }
  };

  // ═══════════════════════════════════════════════════════════════
  // SERVICE BOOKING ACTIONS
  // ═══════════════════════════════════════════════════════════════
  const openEditService = (b) => {
    setServiceModal({ open: true, data: { ...b } });
  };

  const saveServiceBooking = async (e) => {
    e.preventDefault();
    const d = serviceModal.data;
    try {
      await api.put(`/admin/service-bookings/${d.id}`, d);
      showToastMsg('✅ Service booking & completion time updated!');
      setServiceModal({ open: false, data: {} });
      const res = await api.get('/admin/service-bookings');
      setServiceBookings(res.data);
    } catch (err) {
      alert(err.response?.data?.message || 'Error updating service');
    }
  };

  const deleteServiceBooking = async (id, ref) => {
    if (!confirm(`Delete service booking ${ref}?`)) return;
    try {
      await api.delete(`/admin/service-bookings/${id}`);
      showToastMsg('Service booking deleted');
      setServiceBookings(serviceBookings.filter(b => b.id !== id));
    } catch (err) {
      alert('Error deleting');
    }
  };

  // ═══════════════════════════════════════════════════════════════
  // SERVICE CENTER ACTIONS
  // ═══════════════════════════════════════════════════════════════
  const saveServiceCenter = async (e) => {
    e.preventDefault();
    const d = centerModal.data;
    try {
      if (centerModal.isEdit) {
        await api.put(`/admin/service-centers/${d.id}`, d);
        showToastMsg('Service center updated');
      } else {
        await api.post('/admin/service-centers', d);
        showToastMsg('Service center created');
      }
      setCenterModal({ open: false, isEdit: false, data: {} });
      const res = await api.get('/admin/service-centers');
      setServiceCenters(res.data);
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving center');
    }
  };

  const deleteServiceCenter = async (id, name) => {
    if (!confirm(`Delete service center "${name}"?`)) return;
    try {
      await api.delete(`/admin/service-centers/${id}`);
      showToastMsg('Service center deleted');
      setServiceCenters(serviceCenters.filter(c => c.id !== id));
    } catch (err) {
      alert('Error deleting');
    }
  };

  // ═══════════════════════════════════════════════════════════════
  // INTRODUCTIONS & BENEFITS ACTIONS
  // ═══════════════════════════════════════════════════════════════
  const updateIntroStatus = async (id, status) => {
    try {
      await api.put(`/admin/introductions/${id}/status`, { status });
      showToastMsg(`Status updated to ${status}`);
      const res = await api.get('/admin/introductions');
      setIntroductions(res.data);
      const bRes = await api.get('/admin/reports/benefits');
      setBenefits(bRes.data);
    } catch (err) {
      alert('Error updating status');
    }
  };

  const updateBenefitStatus = async (id, status) => {
    try {
      await api.put(`/admin/benefits/${id}/status`, { status });
      showToastMsg(`Benefit marked as: ${status}`);
      const bRes = await api.get('/admin/reports/benefits');
      setBenefits(bRes.data);
    } catch (err) {
      alert('Error updating benefit');
    }
  };

  const saveBenefitSettings = async (e) => {
    e.preventDefault();
    try {
      await api.put('/admin/benefit-settings', benefitSettings);
      showToastMsg('✅ Benefit settings updated');
    } catch (err) {
      alert('Error saving settings');
    }
  };

  // ═══════════════════════════════════════════════════════════════
  // SHOWROOM & LIVE MAP LOCATION SETTINGS
  // ═══════════════════════════════════════════════════════════════
  const saveShowroomSettings = async (e) => {
    e.preventDefault();
    try {
      await api.put('/admin/showroom', showroom);
      showToastMsg('✅ Showroom and Map Location saved successfully!');
    } catch (err) {
      alert('Error saving showroom');
    }
  };

  const detectAdminCoordinates = () => {
    if (!navigator.geolocation) {
      alert('Geolocation not supported by your browser.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude.toFixed(6);
        const lng = pos.coords.longitude.toFixed(6);
        setShowroom(s => ({
          ...s,
          latitude: lat,
          longitude: lng,
          google_maps_link: `https://maps.google.com/?q=${lat},${lng}`
        }));
        showToastMsg(`📍 Detected GPS Coordinates: ${lat}, ${lng}`);
      },
      () => alert('Could not get GPS coordinates. Check browser permissions.')
    );
  };

  // ═══════════════════════════════════════════════════════════════
  // OFFERS ACTIONS
  // ═══════════════════════════════════════════════════════════════
  const saveOffer = async (e) => {
    e.preventDefault();
    const d = offerModal.data;
    try {
      if (offerModal.isEdit) {
        await api.put(`/admin/offers/${d.id}`, d);
        showToastMsg('Offer updated');
      } else {
        await api.post('/admin/offers', d);
        showToastMsg('Offer created');
      }
      setOfferModal({ open: false, isEdit: false, data: {} });
      const res = await api.get('/admin/offers');
      setOffers(res.data);
    } catch (err) {
      alert('Error saving offer');
    }
  };

  const toggleOfferActive = async (id, currentActive) => {
    try {
      await api.put(`/admin/offers/${id}/toggle`, { active: currentActive ? 0 : 1 });
      setOffers(offers.map(o => o.id === id ? { ...o, active: currentActive ? 0 : 1 } : o));
      showToastMsg('Offer status toggled');
    } catch (err) {
      alert('Error updating offer');
    }
  };

  const deleteOffer = async (id) => {
    if (!confirm('Delete this offer?')) return;
    try {
      await api.delete(`/admin/offers/${id}`);
      setOffers(offers.filter(o => o.id !== id));
      showToastMsg('Offer deleted');
    } catch (err) {
      alert('Error deleting');
    }
  };

  // ═══════════════════════════════════════════════════════════════
  // CSV EXPORT HELPER
  // ═══════════════════════════════════════════════════════════════
  const downloadCSV = (type) => {
    const token = localStorage.getItem('token');
    const url = `${API_BASE}/admin/reports/export/${type}`;
    // Fetch with auth header and trigger browser download
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.blob())
      .then(blob => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `${type}_export_${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        showToastMsg(`📥 Downloaded ${type}.csv`);
      })
      .catch(() => alert('Export failed'));
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div className="spinner" />
        <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>Loading Admin Portal...</p>
      </div>
    );
  }

  // Filtered lists
  const filteredScooters = scooters.filter(s => {
    if (scooterFilter && s.status !== scooterFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return s.name.toLowerCase().includes(q) || s.model.toLowerCase().includes(q);
    }
    return true;
  });

  const filteredServices = serviceBookings.filter(b => {
    if (serviceFilter && b.status !== serviceFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return b.booking_id.toLowerCase().includes(q) || b.customer_name.toLowerCase().includes(q) || b.mobile.includes(q) || b.registration_number.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="admin-layout">
      {toast && <div className="toast">{toast}</div>}

      {/* ─── SIDEBAR ─────────────────────────────────────────── */}
      <aside className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="admin-sidebar-header">
          <span style={{ fontSize: '1.8rem' }}>⚡</span>
          <div>
            <h2>OLA Admin Hub</h2>
            <div style={{ fontSize: '0.75rem', color: 'var(--primary-light)' }}>Dynamic Showroom Control</div>
          </div>
        </div>

        <ul className="admin-nav-menu">
          <li>
            <button className={activeTab === 'dashboard' ? 'active' : ''} onClick={() => { setActiveTab('dashboard'); setSidebarOpen(false); }}>
              📊 <span>Dashboard Overview</span>
            </button>
          </li>
          <li>
            <button className={activeTab === 'scooters' ? 'active' : ''} onClick={() => { setActiveTab('scooters'); setSidebarOpen(false); }}>
              🛵 <span>Scooter Inventory ({scooters.length})</span>
            </button>
          </li>
          <li>
            <button className={activeTab === 'services' ? 'active' : ''} onClick={() => { setActiveTab('services'); setSidebarOpen(false); }}>
              🔧 <span>Service Pre-Bookings ({serviceBookings.filter(s => s.status === 'Pending').length} pending)</span>
            </button>
          </li>
          <li>
            <button className={activeTab === 'centers' ? 'active' : ''} onClick={() => { setActiveTab('centers'); setSidebarOpen(false); }}>
              📍 <span>Service Centres ({serviceCenters.length})</span>
            </button>
          </li>
          <li>
            <button className={activeTab === 'customers' ? 'active' : ''} onClick={() => { setActiveTab('customers'); setSidebarOpen(false); }}>
              👥 <span>Customers & Sales</span>
            </button>
          </li>
          <li>
            <button className={activeTab === 'benefits' ? 'active' : ''} onClick={() => { setActiveTab('benefits'); setSidebarOpen(false); }}>
              🎁 <span>₹501 Benefits & Referrals</span>
            </button>
          </li>
          <li>
            <button className={activeTab === 'testrides' ? 'active' : ''} onClick={() => { setActiveTab('testrides'); setSidebarOpen(false); }}>
              🚀 <span>Test Ride Bookings</span>
            </button>
          </li>
          <li>
            <button className={activeTab === 'enquiries' ? 'active' : ''} onClick={() => { setActiveTab('enquiries'); setSidebarOpen(false); }}>
              💬 <span>Customer Enquiries</span>
            </button>
          </li>
          <li>
            <button className={activeTab === 'offers' ? 'active' : ''} onClick={() => { setActiveTab('offers'); setSidebarOpen(false); }}>
              🏷️ <span>Promotions & Offers</span>
            </button>
          </li>
          <li>
            <button className={activeTab === 'showroom' ? 'active' : ''} onClick={() => { setActiveTab('showroom'); setSidebarOpen(false); }}>
              🏢 <span>Showroom & Map Location</span>
            </button>
          </li>
          <li>
            <button className={activeTab === 'reports' ? 'active' : ''} onClick={() => { setActiveTab('reports'); setSidebarOpen(false); }}>
              📈 <span>Reports & CSV Export</span>
            </button>
          </li>
          <li>
            <button className={activeTab === 'logs' ? 'active' : ''} onClick={() => { setActiveTab('logs'); setSidebarOpen(false); }}>
              📜 <span>Activity Audit Logs</span>
            </button>
          </li>
        </ul>

        <div className="admin-sidebar-footer">
          <div style={{ fontSize: '0.85rem' }}>
            <div style={{ fontWeight: 700 }}>{user?.name || 'Showroom Admin'}</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{user?.email || 'admin@olashowroom.com'}</div>
          </div>
          <button onClick={handleLogout} className="btn btn-ghost btn-sm" title="Logout">
            🚪
          </button>
        </div>
      </aside>

      {/* ─── MAIN CONTENT ────────────────────────────────────── */}
      <main className="admin-main-content">

        {/* TOPBAR */}
        <div className="admin-topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button className="mobile-toggle" style={{ display: 'inline-block' }} onClick={() => setSidebarOpen(!sidebarOpen)}>
              ☰
            </button>
            <div>
              <h1 style={{ fontSize: '1.6rem', fontWeight: 800 }}>
                {activeTab === 'dashboard' && 'Showroom Analytics & Dashboard'}
                {activeTab === 'scooters' && 'Scooter Catalog & Stock Control'}
                {activeTab === 'services' && 'Scooty Service Pre-Bookings & Completion Delivery Time'}
                {activeTab === 'centers' && 'Service Centres & Quick Repair Hubs'}
                {activeTab === 'customers' && 'Customer Database & Scooter Sales'}
                {activeTab === 'benefits' && '₹501 Complimentary Benefit & Introduction Tracker'}
                {activeTab === 'testrides' && 'Test Ride Appointments'}
                {activeTab === 'enquiries' && 'Customer Enquiries & Leads'}
                {activeTab === 'offers' && 'Showroom Promotional Offers'}
                {activeTab === 'showroom' && 'Showroom Settings & Live Map Location'}
                {activeTab === 'reports' && 'Data Reports & CSV Exports'}
                {activeTab === 'logs' && 'Audit Trail & Activity Logs'}
              </h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
                All changes made here dynamically update the customer-facing showroom site in real-time.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Link href="/" target="_blank" className="btn btn-secondary btn-sm">
              🌐 View Live Showroom Site
            </Link>
            <button onClick={loadAllData} className="btn btn-ghost btn-sm" title="Refresh Data">
              🔄 Refresh
            </button>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════
           TAB: DASHBOARD
           ═══════════════════════════════════════════════════════ */}
        {activeTab === 'dashboard' && dashboard && (
          <div>
            <div className="admin-stat-grid">
              <div className="admin-stat-card">
                <div className="stat-title">Total Scooters</div>
                <div className="stat-val" style={{ color: 'var(--primary-light)' }}>{dashboard.totalScooters}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                  {dashboard.availableScooters} Available • {dashboard.soldOutScooters} Sold Out
                </div>
              </div>

              <div className="admin-stat-card" style={{ borderColor: dashboard.pendingServices > 0 ? 'var(--warning)' : 'var(--border)' }}>
                <div className="stat-title">🔧 Service Pre-Bookings</div>
                <div className="stat-val" style={{ color: 'var(--warning)' }}>{dashboard.pendingServices}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                  Pending Confirmation ({dashboard.inProgressServices || 0} in progress)
                </div>
              </div>

              <div className="admin-stat-card">
                <div className="stat-title">Ready for Pickup</div>
                <div className="stat-val" style={{ color: 'var(--success)' }}>{dashboard.readyServices || 0}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                  Scooters serviced & ready for delivery
                </div>
              </div>

              <div className="admin-stat-card">
                <div className="stat-title">Test Rides</div>
                <div className="stat-val">{dashboard.pendingTestRides}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                  Pending booking confirmations
                </div>
              </div>

              <div className="admin-stat-card">
                <div className="stat-title">₹501 Referral Benefits</div>
                <div className="stat-val" style={{ color: 'var(--primary-light)' }}>{dashboard.pendingBenefits}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                  Pending approval / payout
                </div>
              </div>

              <div className="admin-stat-card">
                <div className="stat-title">Customer Enquiries</div>
                <div className="stat-val">{dashboard.pendingEnquiries}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                  New messages received
                </div>
              </div>
            </div>

            {/* Quick Action Shortcuts */}
            <div className="card" style={{ padding: '1.75rem', marginBottom: '2rem' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1rem' }}>⚡ Quick Showroom Actions</h3>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    setScooterModal({ open: true, isEdit: false, data: { status: 'Available', stock_quantity: 10 } });
                  }}
                >
                  ➕ Add New Scooter
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => setActiveTab('services')}
                >
                  🔧 Manage Service Bookings ({serviceBookings.length})
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => setActiveTab('showroom')}
                >
                  📍 Update Showroom GPS Location
                </button>
                <button
                  className="btn btn-ghost"
                  onClick={() => setActiveTab('benefits')}
                >
                  🎁 Review ₹501 Benefits
                </button>
                <button
                  className="btn btn-ghost"
                  onClick={() => downloadCSV('services')}
                >
                  📥 Export Services CSV
                </button>
              </div>
            </div>

            {/* Recent Service Pre-Bookings Overview */}
            <div className="card" style={{ padding: '1.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Recent Service Pre-Bookings</h3>
                <button onClick={() => setActiveTab('services')} className="btn btn-ghost btn-sm">View All →</button>
              </div>
              <div className="admin-table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Booking Ref</th>
                      <th>Customer</th>
                      <th>Scooter & Reg</th>
                      <th>Service Type</th>
                      <th>Status</th>
                      <th>Estimated Ready Time</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {serviceBookings.slice(0, 5).map(b => (
                      <tr key={b.id}>
                        <td><strong style={{ color: 'var(--primary-light)' }}>{b.booking_id}</strong></td>
                        <td>{b.customer_name}<br /><small style={{ color: 'var(--text-muted)' }}>{b.mobile}</small></td>
                        <td>{b.scooter_model}<br /><small style={{ color: 'var(--text-secondary)' }}>{b.registration_number}</small></td>
                        <td>{b.service_type}</td>
                        <td><span className={`badge ${getStatusBadge(b.status)}`}>{b.status}</span></td>
                        <td><strong style={{ color: 'var(--text)' }}>{b.estimated_completion_time || 'Not Assigned'}</strong></td>
                        <td>
                          <button onClick={() => openEditService(b)} className="btn btn-primary btn-sm">
                            Edit / Time
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════
           TAB: SCOOTER INVENTORY MANAGEMENT
           ═══════════════════════════════════════════════════════ */}
        {activeTab === 'scooters' && (
          <div>
            {/* Filter & Add bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ display: 'flex', gap: '0.75rem', flex: 1, maxWidth: '600px' }}>
                <input
                  type="text"
                  placeholder="Search by scooter name or model..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{ flex: 1 }}
                />
                <select
                  value={scooterFilter}
                  onChange={e => setScooterFilter(e.target.value)}
                  style={{ width: '180px' }}
                >
                  <option value="">All Statuses</option>
                  <option value="Available">Available</option>
                  <option value="Limited Stock">Limited Stock</option>
                  <option value="Sold Out">Sold Out</option>
                  <option value="Coming Soon">Coming Soon</option>
                  <option value="Discontinued">Discontinued</option>
                </select>
              </div>

              <button
                className="btn btn-primary"
                onClick={() => setScooterModal({ open: true, isEdit: false, data: { status: 'Available', stock_quantity: 10 } })}
              >
                ➕ Add New Scooter
              </button>
            </div>

            {/* Scooters Table */}
            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Scooter</th>
                    <th>Model / Variant</th>
                    <th>Price</th>
                    <th>Range & Battery</th>
                    <th>Stock</th>
                    <th>Status</th>
                    <th>Colors</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredScooters.map(s => (
                    <tr key={s.id}>
                      <td>
                        <strong>{s.name}</strong>
                      </td>
                      <td>
                        {s.model} {s.variant && `• ${s.variant}`}
                      </td>
                      <td>
                        <strong style={{ color: 'var(--primary-light)' }}>{formatPrice(s.price)}</strong>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>On-road: {formatPrice(s.on_road_price || s.price)}</div>
                      </td>
                      <td>
                        <div>⚡ {s.battery_info || 'Lithium-ion'}</div>
                        <small style={{ color: 'var(--text-secondary)' }}>🏁 {s.range_km || '150 km'}</small>
                      </td>
                      <td>
                        <strong style={{ color: s.stock_quantity <= 3 ? 'var(--danger)' : 'var(--text)' }}>
                          {s.stock_quantity}
                        </strong>
                      </td>
                      <td>
                        <select
                          value={s.status}
                          onChange={async (e) => {
                            const newStatus = e.target.value;
                            await api.put(`/admin/scooters/${s.id}`, { ...s, status: newStatus });
                            showToastMsg(`Status changed to ${newStatus}`);
                            setScooters(scooters.map(sc => sc.id === s.id ? { ...sc, status: newStatus } : sc));
                          }}
                          style={{
                            padding: '0.3rem 0.6rem',
                            fontSize: '0.8rem',
                            borderRadius: '4px',
                            background: s.status === 'Sold Out' ? 'rgba(239,68,68,0.2)' : s.status === 'Available' ? 'rgba(34,197,94,0.2)' : 'var(--surface)',
                            color: s.status === 'Sold Out' ? 'var(--danger)' : s.status === 'Available' ? 'var(--primary-light)' : 'var(--text)',
                            border: '1px solid var(--border)'
                          }}
                        >
                          <option value="Available">Available</option>
                          <option value="Limited Stock">Limited Stock</option>
                          <option value="Sold Out">Sold Out</option>
                          <option value="Coming Soon">Coming Soon</option>
                          <option value="Discontinued">Discontinued</option>
                        </select>
                      </td>
                      <td>
                        <button
                          onClick={() => openColors(s)}
                          className="btn btn-ghost btn-sm"
                          style={{ fontSize: '0.8rem', padding: '0.3rem 0.6rem' }}
                        >
                          🎨 Colors ({s.colors?.length || 0})
                        </button>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                          <button
                            onClick={() => setScooterModal({ open: true, isEdit: true, data: { ...s } })}
                            className="btn btn-secondary btn-sm"
                            title="Edit"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => deleteScooter(s.id, s.name)}
                            className="btn btn-ghost btn-sm"
                            style={{ color: 'var(--danger)' }}
                            title="Delete"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════
           TAB: SERVICE PRE-BOOKINGS MANAGEMENT (CORE USER REQUEST)
           ═══════════════════════════════════════════════════════ */}
        {activeTab === 'services' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ display: 'flex', gap: '0.75rem', flex: 1, maxWidth: '650px' }}>
                <input
                  type="text"
                  placeholder="Search by customer, booking ref (SRV-...), mobile, or scooty reg no..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{ flex: 1 }}
                />
                <select
                  value={serviceFilter}
                  onChange={e => setServiceFilter(e.target.value)}
                  style={{ width: '190px' }}
                >
                  <option value="">All Statuses</option>
                  <option value="Pending">Pending</option>
                  <option value="Confirmed">Confirmed</option>
                  <option value="In Service">In Service</option>
                  <option value="Ready for Pickup">Ready for Pickup</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button onClick={() => downloadCSV('services')} className="btn btn-secondary btn-sm">
                  📥 Download CSV
                </button>
              </div>
            </div>

            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Ref ID</th>
                    <th>Customer Info</th>
                    <th>Scooter & Reg Number</th>
                    <th>Service Package</th>
                    <th>Centre</th>
                    <th>Status</th>
                    {/* KEY FEATURE: ADMIN ASSIGNED READY / DELIVERY TIME */}
                    <th style={{ color: 'var(--primary-light)' }}>⏱️ Estimated Scooty Ready Time</th>
                    <th>Cost</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredServices.map(b => (
                    <tr key={b.id}>
                      <td>
                        <strong style={{ color: 'var(--primary-light)', letterSpacing: '0.05em' }}>{b.booking_id}</strong>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(b.created_at).toLocaleDateString()}</div>
                      </td>
                      <td>
                        <strong>{b.customer_name}</strong>
                        <div><a href={`tel:${b.mobile}`} style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>📞 {b.mobile}</a></div>
                        {b.email && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{b.email}</div>}
                      </td>
                      <td>
                        <div>🛵 <strong>{b.scooter_model}</strong></div>
                        <span className="badge badge-limited" style={{ fontSize: '0.75rem', marginTop: '0.2rem' }}>
                          {b.registration_number}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontSize: '0.88rem' }}>{b.service_type}</div>
                        {b.pickup_required ? <span style={{ color: 'var(--info)', fontSize: '0.75rem' }}>🚚 Doorstep Pickup</span> : null}
                      </td>
                      <td>
                        <small>{b.service_center_name || 'Central Hub'}</small>
                      </td>
                      <td>
                        <span className={`badge ${getStatusBadge(b.status)}`}>{b.status}</span>
                      </td>
                      <td>
                        <div style={{ background: 'rgba(0,200,83,0.1)', padding: '0.4rem 0.75rem', borderRadius: '4px', border: '1px solid var(--primary)', display: 'inline-block' }}>
                          <strong style={{ color: 'var(--primary-light)', fontSize: '0.9rem' }}>
                            {b.estimated_completion_time || '⚠️ Not assigned yet'}
                          </strong>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                          Slot: {b.confirmed_service_time || b.preferred_time_slot}
                        </div>
                      </td>
                      <td>
                        <strong style={{ color: 'var(--text)' }}>₹{b.estimated_cost || 0}</strong>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.35rem' }}>
                          <button
                            onClick={() => openEditService(b)}
                            className="btn btn-primary btn-sm"
                            title="Assign Appointment Time & Ready Delivery Time"
                          >
                            ⏱️ Assign Time
                          </button>
                          <button
                            onClick={() => deleteServiceBooking(b.id, b.booking_id)}
                            className="btn btn-ghost btn-sm"
                            style={{ color: 'var(--danger)' }}
                            title="Delete"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredServices.length === 0 && (
                    <tr>
                      <td colSpan={9} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                        No service pre-bookings found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════
           TAB: SERVICE CENTRES MANAGEMENT
           ═══════════════════════════════════════════════════════ */}
        {activeTab === 'centers' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <p style={{ color: 'var(--text-secondary)' }}>
                Configure official and regional service center points where customers can pre-book their scooty servicing.
              </p>
              <button
                className="btn btn-primary"
                onClick={() => setCenterModal({ open: true, isEdit: false, data: { is_active: 1, capacity_per_day: 12 } })}
              >
                ➕ Add New Service Centre
              </button>
            </div>

            <div className="grid grid-3">
              {serviceCenters.map(c => (
                <div key={c.id} className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                      <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>{c.name}</h3>
                      <span className={`badge ${c.is_active ? 'badge-available' : 'badge-discontinued'}`}>
                        {c.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                      📍 {c.address}
                    </p>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                      📞 {c.contact_number || '8003356163'}
                    </div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                      🕒 {c.opening_hours}
                    </div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      ⚡ Daily Slot Capacity: {c.capacity_per_day} scooters
                    </div>
                    {c.latitude && c.longitude ? (
                      <div style={{ fontSize: '0.78rem', color: 'var(--primary-light)', marginTop: '0.4rem' }}>
                        🌐 GPS: {c.latitude}, {c.longitude}
                      </div>
                    ) : null}
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                    <button
                      onClick={() => setCenterModal({ open: true, isEdit: true, data: { ...c } })}
                      className="btn btn-secondary btn-sm"
                      style={{ flex: 1 }}
                    >
                      ✏️ Edit
                    </button>
                    {c.google_maps_link && (
                      <a href={c.google_maps_link} target="_blank" rel="noopener" className="btn btn-ghost btn-sm">
                        🗺️ Maps
                      </a>
                    )}
                    <button
                      onClick={() => deleteServiceCenter(c.id, c.name)}
                      className="btn btn-ghost btn-sm"
                      style={{ color: 'var(--danger)' }}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════
           TAB: CUSTOMERS & SALES
           ═══════════════════════════════════════════════════════ */}
        {activeTab === 'customers' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <input
                type="text"
                placeholder="Search customers by name, mobile, email..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ maxWidth: '400px' }}
              />
              <button onClick={() => downloadCSV('customers')} className="btn btn-secondary btn-sm">
                📥 Export Customers CSV
              </button>
            </div>

            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Customer ID</th>
                    <th>Customer Name</th>
                    <th>Mobile</th>
                    <th>Purchase Status</th>
                    <th>Purchased Scooter</th>
                    <th>₹501 Benefit Eligible</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.filter(c => !searchQuery || c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.mobile.includes(searchQuery)).map(c => (
                    <tr key={c.id}>
                      <td><strong style={{ color: 'var(--primary-light)' }}>{c.customer_id}</strong></td>
                      <td><strong>{c.name}</strong><br /><small style={{ color: 'var(--text-muted)' }}>{c.email || 'No email'}</small></td>
                      <td>{c.mobile}</td>
                      <td>
                        <span className={`badge ${c.has_purchased ? 'badge-available' : 'badge-limited'}`}>
                          {c.has_purchased ? 'Verified Purchaser' : 'Enquiry / Lead'}
                        </span>
                      </td>
                      <td>
                        {c.has_purchased ? (
                          <div>
                            🛵 {c.purchased_variant ? `Variant: ${c.purchased_variant}` : 'OLA Scooter'}
                            {c.purchased_color && <small style={{ display: 'block', color: 'var(--text-secondary)' }}>Color: {c.purchased_color}</small>}
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>Not yet purchased</span>
                        )}
                      </td>
                      <td>
                        <span className={`badge ${c.eligible_for_benefit ? 'badge-available' : 'badge-discontinued'}`}>
                          {c.eligible_for_benefit ? 'Eligible' : 'Not Eligible'}
                        </span>
                      </td>
                      <td>
                        <button
                          onClick={() => setSaleModal({ open: true, customer: c, data: { scooter_id: scooters[0]?.id || '', variant: 'Pro', color: 'Black', sale_price: 139999 } })}
                          className="btn btn-secondary btn-sm"
                        >
                          📝 Record Sale
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════
           TAB: ₹501 COMPLIMENTARY BENEFIT & INTRODUCTIONS
           ═══════════════════════════════════════════════════════ */}
        {activeTab === 'benefits' && (
          <div>
            {/* Benefit Settings Box */}
            {benefitSettings && (
              <form onSubmit={saveBenefitSettings} className="card" style={{ padding: '1.75rem', marginBottom: '2rem', border: '1px solid var(--primary)', background: 'rgba(0,200,83,0.04)' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '0.75rem' }}>🎁 Complimentary Benefit Program Settings</h3>
                <div className="grid grid-3" style={{ marginBottom: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.3rem', fontSize: '0.85rem', fontWeight: 600 }}>Benefit Title</label>
                    <input
                      value={benefitSettings.title}
                      onChange={e => setBenefitSettings({ ...benefitSettings, title: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.3rem', fontSize: '0.85rem', fontWeight: 600 }}>Amount (₹)</label>
                    <input
                      type="number"
                      value={benefitSettings.amount}
                      onChange={e => setBenefitSettings({ ...benefitSettings, amount: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.3rem', fontSize: '0.85rem', fontWeight: 600 }}>Program Status</label>
                    <select
                      value={benefitSettings.enabled ? '1' : '0'}
                      onChange={e => setBenefitSettings({ ...benefitSettings, enabled: e.target.value === '1' ? 1 : 0 })}
                    >
                      <option value="1">Active / Enabled</option>
                      <option value="0">Disabled</option>
                    </select>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button type="submit" className="btn btn-primary btn-sm">💾 Update Program Settings</button>
                </div>
              </form>
            )}

            {/* Referrals & Introductions Table */}
            <div className="card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Introductions Submitted by Purchasers</h3>
                <button onClick={() => downloadCSV('benefits')} className="btn btn-secondary btn-sm">📥 Export Benefits CSV</button>
              </div>

              <div className="admin-table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Ref ID</th>
                      <th>Existing Customer (Introducer)</th>
                      <th>Introduced Person</th>
                      <th>Submitted Date</th>
                      <th>Lead Status</th>
                      <th>Change Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {introductions.map(intro => (
                      <tr key={intro.id}>
                        <td><strong style={{ color: 'var(--primary-light)' }}>{intro.reference_id}</strong></td>
                        <td>
                          <strong>{intro.existing_customer_name}</strong>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>📞 {intro.existing_customer_mobile}</div>
                        </td>
                        <td>
                          <strong>{intro.introduced_name}</strong>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>📞 {intro.introduced_mobile}</div>
                        </td>
                        <td>{new Date(intro.created_at).toLocaleDateString()}</td>
                        <td>
                          <span className={`badge ${intro.status === 'Purchase Completed' ? 'badge-available' : 'badge-limited'}`}>
                            {intro.status}
                          </span>
                        </td>
                        <td>
                          <select
                            value={intro.status}
                            onChange={e => updateIntroStatus(intro.id, e.target.value)}
                            style={{ padding: '0.3rem 0.5rem', fontSize: '0.8rem', width: 'auto' }}
                          >
                            <option value="Introduction Submitted">Introduction Submitted</option>
                            <option value="Customer Contacted">Customer Contacted</option>
                            <option value="Purchase Pending">Purchase Pending</option>
                            <option value="Purchase Completed">Purchase Completed (Eligible)</option>
                            <option value="Rejected">Rejected</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                    {introductions.length === 0 && (
                      <tr>
                        <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                          No customer introductions submitted yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Benefit Payouts Table */}
            <div className="card" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '1rem' }}>₹501 Benefit Payout Ledger</h3>
              <div className="admin-table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Beneficiary Customer</th>
                      <th>Mobile</th>
                      <th>Benefit Amount</th>
                      <th>Payout Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {benefits.map(b => (
                      <tr key={b.id}>
                        <td><strong>{b.customer_name}</strong></td>
                        <td>{b.customer_mobile}</td>
                        <td><strong style={{ color: 'var(--primary-light)' }}>₹{b.amount}</strong></td>
                        <td><span className={`badge ${getStatusBadge(b.status)}`}>{b.status}</span></td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            {b.status !== 'Benefit Approved' && b.status !== 'Benefit Paid' && (
                              <button
                                onClick={() => updateBenefitStatus(b.id, 'Benefit Approved')}
                                className="btn btn-primary btn-sm"
                              >
                                Approve ₹501
                              </button>
                            )}
                            {b.status !== 'Benefit Paid' && (
                              <button
                                onClick={() => updateBenefitStatus(b.id, 'Benefit Paid')}
                                className="btn btn-secondary btn-sm"
                              >
                                Mark as Paid
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════
           TAB: TEST RIDES & ENQUIRIES
           ═══════════════════════════════════════════════════════ */}
        {activeTab === 'testrides' && (
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Customer Name</th>
                  <th>Mobile</th>
                  <th>Scooter</th>
                  <th>Preferred Date & Slot</th>
                  <th>Status</th>
                  <th>Change Status</th>
                </tr>
              </thead>
              <tbody>
                {testRides.map(t => (
                  <tr key={t.id}>
                    <td><strong>{t.name}</strong></td>
                    <td><a href={`tel:${t.mobile}`}>📞 {t.mobile}</a></td>
                    <td>{t.scooter_name || 'Any Scooter'}</td>
                    <td>{t.preferred_date} • {t.preferred_time}</td>
                    <td><span className={`badge ${getStatusBadge(t.status)}`}>{t.status}</span></td>
                    <td>
                      <select
                        value={t.status}
                        onChange={async (e) => {
                          await api.put(`/admin/test-rides/${t.id}/status`, { status: e.target.value });
                          showToastMsg(`Test ride status updated to ${e.target.value}`);
                          setTestRides(testRides.map(tr => tr.id === t.id ? { ...tr, status: e.target.value } : tr));
                        }}
                        style={{ padding: '0.3rem 0.5rem', fontSize: '0.8rem', width: 'auto' }}
                      >
                        <option value="Pending">Pending</option>
                        <option value="Confirmed">Confirmed</option>
                        <option value="Completed">Completed</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'enquiries' && (
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Sender</th>
                  <th>Contact</th>
                  <th>Category</th>
                  <th>Subject & Message</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {enquiries.map(enq => (
                  <tr key={enq.id}>
                    <td><strong>{enq.name}</strong></td>
                    <td>
                      <div>📞 {enq.mobile || 'N/A'}</div>
                      <small style={{ color: 'var(--text-muted)' }}>{enq.email || ''}</small>
                    </td>
                    <td><span className="badge badge-limited">{enq.category}</span></td>
                    <td>
                      <strong>{enq.subject || 'Enquiry'}</strong>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.2rem' }}>{enq.message}</div>
                    </td>
                    <td><span className={`badge ${enq.status === 'Resolved' ? 'badge-available' : 'badge-limited'}`}>{enq.status}</span></td>
                    <td>
                      <select
                        value={enq.status}
                        onChange={async (e) => {
                          await api.put(`/admin/enquiries/${enq.id}/status`, { status: e.target.value });
                          showToastMsg('Enquiry status updated');
                          setEnquiries(enquiries.map(eq => eq.id === enq.id ? { ...eq, status: e.target.value } : eq));
                        }}
                        style={{ padding: '0.3rem 0.5rem', fontSize: '0.8rem', width: 'auto' }}
                      >
                        <option value="New">New</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Resolved">Resolved</option>
                        <option value="Closed">Closed</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════
           TAB: OFFERS & PROMOTIONS
           ═══════════════════════════════════════════════════════ */}
        {activeTab === 'offers' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <p style={{ color: 'var(--text-secondary)' }}>Manage festive offers, finance schemes, and exchange bonus banners.</p>
              <button
                className="btn btn-primary"
                onClick={() => setOfferModal({ open: true, isEdit: false, data: { active: 1 } })}
              >
                ➕ Add New Offer
              </button>
            </div>

            <div className="grid grid-3">
              {offers.map(o => (
                <div key={o.id} className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                      <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>{o.title}</h3>
                      <span className={`badge ${o.active ? 'badge-available' : 'badge-discontinued'}`}>
                        {o.active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.5' }}>{o.description}</p>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                    <button
                      onClick={() => toggleOfferActive(o.id, o.active)}
                      className="btn btn-ghost btn-sm"
                    >
                      {o.active ? '⏸️ Deactivate' : '▶️ Activate'}
                    </button>
                    <button
                      onClick={() => setOfferModal({ open: true, isEdit: true, data: { ...o } })}
                      className="btn btn-secondary btn-sm"
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => deleteOffer(o.id)}
                      className="btn btn-ghost btn-sm"
                      style={{ color: 'var(--danger)' }}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════
           TAB: SHOWROOM & LIVE MAP LOCATION (CORE USER REQUEST)
           ═══════════════════════════════════════════════════════ */}
        {activeTab === 'showroom' && (
          <form onSubmit={saveShowroomSettings} className="card" style={{ padding: '2.5rem', maxWidth: '850px' }}>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.5rem' }}>
              🏢 Showroom & Live Map Location Settings
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', marginBottom: '2rem' }}>
              Configure showroom address, phone numbers, and live GPS map destination. When customers tap directions on the app, they are routed from their current live location directly to these coordinates.
            </p>

            <div className="grid grid-2" style={{ marginBottom: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.88rem', fontWeight: 600 }}>Showroom Name</label>
                <input
                  value={showroom.showroom_name || ''}
                  onChange={e => setShowroom({ ...showroom, showroom_name: e.target.value })}
                  placeholder="e.g. OLA Electric Showroom"
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.88rem', fontWeight: 600 }}>Phone Number</label>
                <input
                  value={showroom.phone || ''}
                  onChange={e => setShowroom({ ...showroom, phone: e.target.value })}
                  placeholder="e.g. 8003356163"
                />
              </div>
            </div>

            <div className="grid grid-2" style={{ marginBottom: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.88rem', fontWeight: 600 }}>WhatsApp Number</label>
                <input
                  value={showroom.whatsapp || ''}
                  onChange={e => setShowroom({ ...showroom, whatsapp: e.target.value })}
                  placeholder="e.g. 8003356163"
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.88rem', fontWeight: 600 }}>Email Address</label>
                <input
                  value={showroom.email || ''}
                  onChange={e => setShowroom({ ...showroom, email: e.target.value })}
                  placeholder="e.g. info@olashowroom.com"
                />
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.88rem', fontWeight: 600 }}>Full Showroom Address</label>
              <textarea
                rows={2}
                value={showroom.address || ''}
                onChange={e => setShowroom({ ...showroom, address: e.target.value })}
                placeholder="Complete street address, landmark, city, pincode"
              />
            </div>

            {/* LIVE GPS COORDINATES CONFIGURATION */}
            <div style={{ background: 'var(--surface)', padding: '1.5rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                  <h4 style={{ fontSize: '1rem', fontWeight: 700 }}>🗺️ GPS Coordinates & Google Maps Link</h4>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
                    Used by the app to connect customer live location to this destination on Google Maps.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={detectAdminCoordinates}
                  className="btn btn-primary btn-sm"
                >
                  📍 Detect My Current Coordinates
                </button>
              </div>

              <div className="grid grid-2" style={{ marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.3rem', fontSize: '0.82rem', color: 'var(--text-muted)' }}>Latitude</label>
                  <input
                    value={showroom.latitude || ''}
                    onChange={e => setShowroom({ ...showroom, latitude: e.target.value })}
                    placeholder="e.g. 26.9124"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.3rem', fontSize: '0.82rem', color: 'var(--text-muted)' }}>Longitude</label>
                  <input
                    value={showroom.longitude || ''}
                    onChange={e => setShowroom({ ...showroom, longitude: e.target.value })}
                    placeholder="e.g. 75.7873"
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.3rem', fontSize: '0.82rem', color: 'var(--text-muted)' }}>Direct Google Maps Destination Link</label>
                <input
                  value={showroom.google_maps_link || ''}
                  onChange={e => setShowroom({ ...showroom, google_maps_link: e.target.value })}
                  placeholder="https://maps.google.com/?q=..."
                />
              </div>
            </div>

            <div className="grid grid-2" style={{ marginBottom: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.88rem', fontWeight: 600 }}>Opening Hours</label>
                <input
                  value={showroom.opening_hours || ''}
                  onChange={e => setShowroom({ ...showroom, opening_hours: e.target.value })}
                  placeholder="Mon-Sat: 9:00 AM - 8:00 PM"
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.88rem', fontWeight: 600 }}>Instagram Profile URL</label>
                <input
                  value={showroom.instagram_url || ''}
                  onChange={e => setShowroom({ ...showroom, instagram_url: e.target.value })}
                  placeholder="https://instagram.com/..."
                />
              </div>
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.88rem', fontWeight: 600 }}>About Showroom Description</label>
              <textarea
                rows={3}
                value={showroom.about || ''}
                onChange={e => setShowroom({ ...showroom, about: e.target.value })}
                placeholder="Showroom introduction and customer value proposition"
              />
            </div>

            <button type="submit" className="btn btn-primary btn-lg">
              💾 Save All Showroom & Location Settings
            </button>
          </form>
        )}

        {/* ═══════════════════════════════════════════════════════
           TAB: REPORTS & EXPORT
           ═══════════════════════════════════════════════════════ */}
        {activeTab === 'reports' && (
          <div className="card" style={{ padding: '2.5rem', maxWidth: '800px' }}>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '0.5rem' }}>📈 Showroom Data Export</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
              Download complete CSV spreadsheet exports for inventory, bookings, customers, and sales records.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface)', padding: '1.25rem', borderRadius: 'var(--radius-sm)' }}>
                <div>
                  <strong>🔧 Scooty Service Pre-Bookings CSV</strong>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>All pre-bookings, customer contact, confirmed timing & ready delivery dates</div>
                </div>
                <button onClick={() => downloadCSV('services')} className="btn btn-primary btn-sm">
                  📥 Download CSV
                </button>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface)', padding: '1.25rem', borderRadius: 'var(--radius-sm)' }}>
                <div>
                  <strong>🛵 Scooter Inventory & Stock CSV</strong>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Scooter models, prices, stock levels, variants, and availability statuses</div>
                </div>
                <button onClick={() => downloadCSV('scooters')} className="btn btn-secondary btn-sm">
                  📥 Download CSV
                </button>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface)', padding: '1.25rem', borderRadius: 'var(--radius-sm)' }}>
                <div>
                  <strong>👥 Customer Database CSV</strong>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Registered customers, purchase history, and benefit eligibility status</div>
                </div>
                <button onClick={() => downloadCSV('customers')} className="btn btn-secondary btn-sm">
                  📥 Download CSV
                </button>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface)', padding: '1.25rem', borderRadius: 'var(--radius-sm)' }}>
                <div>
                  <strong>🎁 ₹501 Benefits & Introductions CSV</strong>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Customer referral introductions, approval log, and payment records</div>
                </div>
                <button onClick={() => downloadCSV('benefits')} className="btn btn-secondary btn-sm">
                  📥 Download CSV
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════
           TAB: ACTIVITY AUDIT LOGS
           ═══════════════════════════════════════════════════════ */}
        {activeTab === 'logs' && (
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Admin User</th>
                  <th>Action</th>
                  <th>Entity</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {activityLogs.map(log => (
                  <tr key={log.id}>
                    <td><small>{new Date(log.created_at).toLocaleString()}</small></td>
                    <td><strong>{log.user_name || 'Admin'}</strong></td>
                    <td><span className="badge badge-available">{log.action}</span></td>
                    <td>{log.entity_type} #{log.entity_id}</td>
                    <td><small style={{ color: 'var(--text-secondary)' }}>{log.details || '—'}</small></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </main>

      {/* ═══════════════════════════════════════════════════════
         MODAL: EDIT SERVICE BOOKING (ASSIGN READY TIME)
         ═══════════════════════════════════════════════════════ */}
      {serviceModal.open && (
        <div className="modal-overlay">
          <div className="modal-box">
            <div className="modal-header">
              <h3>⏱️ Update Service & Delivery Time ({serviceModal.data.booking_id})</h3>
              <button onClick={() => setServiceModal({ open: false, data: {} })} className="btn btn-ghost btn-sm">✕</button>
            </div>
            <form onSubmit={saveServiceBooking}>
              <div className="modal-body">
                <div style={{ marginBottom: '1rem', background: 'var(--surface)', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
                  <div><strong>Customer:</strong> {serviceModal.data.customer_name} ({serviceModal.data.mobile})</div>
                  <div><strong>Scooter:</strong> {serviceModal.data.scooter_model} • <strong>{serviceModal.data.registration_number}</strong></div>
                  <div><strong>Service:</strong> {serviceModal.data.service_type}</div>
                  <div><strong>Preferred Date:</strong> {serviceModal.data.preferred_date} ({serviceModal.data.preferred_time_slot})</div>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.35rem', fontWeight: 600 }}>Service Status</label>
                  <select
                    value={serviceModal.data.status || 'Pending'}
                    onChange={e => setServiceModal(s => ({ ...s, data: { ...s.data, status: e.target.value } }))}
                  >
                    <option value="Pending">Pending Confirmation</option>
                    <option value="Confirmed">Confirmed / Slot Scheduled</option>
                    <option value="In Service">In Service (Scooter in Bay)</option>
                    <option value="Ready for Pickup">Ready for Pickup (Service Done)</option>
                    <option value="Completed">Completed / Delivered to Customer</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>

                {/* 🌟 KEY FEATURE: CONFIRMED TIME & ESTIMATED READY PICKUP TIME 🌟 */}
                <div className="grid grid-2" style={{ marginBottom: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.35rem', fontWeight: 600 }}>Confirmed Appointment Slot</label>
                    <input
                      type="text"
                      placeholder="e.g. 10:30 AM, 05 Oct 2026"
                      value={serviceModal.data.confirmed_service_time || ''}
                      onChange={e => setServiceModal(s => ({ ...s, data: { ...s.data, confirmed_service_time: e.target.value } }))}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.35rem', fontWeight: 600, color: 'var(--primary-light)' }}>
                      ⏱️ When Scooty Will Be Ready
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 04:30 PM, 05 Oct 2026"
                      value={serviceModal.data.estimated_completion_time || ''}
                      onChange={e => setServiceModal(s => ({ ...s, data: { ...s.data, estimated_completion_time: e.target.value } }))}
                    />
                  </div>
                </div>

                <div className="grid grid-2" style={{ marginBottom: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.35rem', fontWeight: 600 }}>Estimated / Final Cost (₹)</label>
                    <input
                      type="number"
                      placeholder="0"
                      value={serviceModal.data.estimated_cost ?? ''}
                      onChange={e => setServiceModal(s => ({ ...s, data: { ...s.data, estimated_cost: e.target.value } }))}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.35rem', fontWeight: 600 }}>Assigned Technician</label>
                    <input
                      type="text"
                      placeholder="e.g. Vikram Singh (Bay 2)"
                      value={serviceModal.data.technician_name || ''}
                      onChange={e => setServiceModal(s => ({ ...s, data: { ...s.data, technician_name: e.target.value } }))}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.35rem', fontWeight: 600 }}>Technician & Admin Remarks</label>
                  <textarea
                    rows={2}
                    placeholder="Inspection remarks, replaced parts, battery state, etc."
                    value={serviceModal.data.admin_notes || ''}
                    onChange={e => setServiceModal(s => ({ ...s, data: { ...s.data, admin_notes: e.target.value } }))}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setServiceModal({ open: false, data: {} })} className="btn btn-ghost">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Changes & Update Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
         MODAL: ADD / EDIT SCOOTER
         ═══════════════════════════════════════════════════════ */}
      {scooterModal.open && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ maxWidth: '780px' }}>
            <div className="modal-header">
              <h3>{scooterModal.isEdit ? 'Edit Scooter' : 'Add New Scooter'}</h3>
              <button onClick={() => setScooterModal({ open: false, isEdit: false, data: {} })} className="btn btn-ghost btn-sm">✕</button>
            </div>
            <form onSubmit={saveScooter}>
              <div className="modal-body">
                <div className="grid grid-2" style={{ marginBottom: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.35rem', fontWeight: 600 }}>Scooter Name *</label>
                    <input
                      required
                      placeholder="e.g. OLA S1 Pro"
                      value={scooterModal.data.name || ''}
                      onChange={e => setScooterModal(s => ({ ...s, data: { ...s.data, name: e.target.value } }))}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.35rem', fontWeight: 600 }}>Model *</label>
                    <input
                      required
                      placeholder="e.g. S1"
                      value={scooterModal.data.model || ''}
                      onChange={e => setScooterModal(s => ({ ...s, data: { ...s.data, model: e.target.value } }))}
                    />
                  </div>
                </div>

                <div className="grid grid-3" style={{ marginBottom: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.35rem', fontWeight: 600 }}>Variant</label>
                    <input
                      placeholder="e.g. Pro, Air, X (3kWh)"
                      value={scooterModal.data.variant || ''}
                      onChange={e => setScooterModal(s => ({ ...s, data: { ...s.data, variant: e.target.value } }))}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.35rem', fontWeight: 600 }}>Price (₹) *</label>
                    <input
                      type="number"
                      required
                      placeholder="139999"
                      value={scooterModal.data.price || ''}
                      onChange={e => setScooterModal(s => ({ ...s, data: { ...s.data, price: Number(e.target.value) } }))}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.35rem', fontWeight: 600 }}>On-Road Price (₹)</label>
                    <input
                      type="number"
                      placeholder="145000"
                      value={scooterModal.data.on_road_price || ''}
                      onChange={e => setScooterModal(s => ({ ...s, data: { ...s.data, on_road_price: Number(e.target.value) } }))}
                    />
                  </div>
                </div>

                <div className="grid grid-3" style={{ marginBottom: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.35rem', fontWeight: 600 }}>Range (km)</label>
                    <input
                      placeholder="e.g. 170 km (Eco)"
                      value={scooterModal.data.range_km || ''}
                      onChange={e => setScooterModal(s => ({ ...s, data: { ...s.data, range_km: e.target.value } }))}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.35rem', fontWeight: 600 }}>Top Speed</label>
                    <input
                      placeholder="e.g. 120 km/h"
                      value={scooterModal.data.top_speed || ''}
                      onChange={e => setScooterModal(s => ({ ...s, data: { ...s.data, top_speed: e.target.value } }))}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.35rem', fontWeight: 600 }}>Charging Time</label>
                    <input
                      placeholder="e.g. 6.5 hours"
                      value={scooterModal.data.charging_time || ''}
                      onChange={e => setScooterModal(s => ({ ...s, data: { ...s.data, charging_time: e.target.value } }))}
                    />
                  </div>
                </div>

                <div className="grid grid-3" style={{ marginBottom: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.35rem', fontWeight: 600 }}>Battery Details</label>
                    <input
                      placeholder="e.g. 4.0 kWh Li-ion"
                      value={scooterModal.data.battery_info || ''}
                      onChange={e => setScooterModal(s => ({ ...s, data: { ...s.data, battery_info: e.target.value } }))}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.35rem', fontWeight: 600 }}>Stock Quantity</label>
                    <input
                      type="number"
                      placeholder="10"
                      value={scooterModal.data.stock_quantity ?? 10}
                      onChange={e => setScooterModal(s => ({ ...s, data: { ...s.data, stock_quantity: Number(e.target.value) } }))}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.35rem', fontWeight: 600 }}>Status</label>
                    <select
                      value={scooterModal.data.status || 'Available'}
                      onChange={e => setScooterModal(s => ({ ...s, data: { ...s.data, status: e.target.value } }))}
                    >
                      <option value="Available">Available</option>
                      <option value="Limited Stock">Limited Stock</option>
                      <option value="Sold Out">Sold Out</option>
                      <option value="Coming Soon">Coming Soon</option>
                      <option value="Discontinued">Discontinued</option>
                    </select>
                  </div>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.35rem', fontWeight: 600 }}>Description</label>
                  <textarea
                    rows={2}
                    placeholder="Scooter overview and key selling points"
                    value={scooterModal.data.description || ''}
                    onChange={e => setScooterModal(s => ({ ...s, data: { ...s.data, description: e.target.value } }))}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setScooterModal({ open: false, isEdit: false, data: {} })} className="btn btn-ghost">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {scooterModal.isEdit ? 'Save Scooter' : 'Add Scooter to Inventory'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
         MODAL: COLORS MANAGEMENT
         ═══════════════════════════════════════════════════════ */}
      {colorsModal.open && (
        <div className="modal-overlay">
          <div className="modal-box">
            <div className="modal-header">
              <h3>🎨 Color Options for {colorsModal.scooter?.name}</h3>
              <button onClick={() => setColorsModal({ open: false, scooter: null, colors: [], newColor: {} })} className="btn btn-ghost btn-sm">✕</button>
            </div>
            <div className="modal-body">
              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.75rem' }}>Existing Colors:</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {colorsModal.colors.map(c => (
                    <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface)', padding: '0.5rem 1rem', borderRadius: '4px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: c.hex_code, border: '1px solid #fff' }} />
                        <strong>{c.name}</strong>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Stock: {c.stock_qty}</span>
                        <span className={`badge ${getStatusBadge(c.status)}`} style={{ fontSize: '0.75rem' }}>{c.status}</span>
                      </div>
                      <button onClick={() => deleteColor(c.id)} className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }}>✕</button>
                    </div>
                  ))}
                  {colorsModal.colors.length === 0 && <p style={{ color: 'var(--text-muted)' }}>No colors defined yet.</p>}
                </div>
              </div>

              <div style={{ background: 'var(--surface)', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.75rem' }}>Add New Color</h4>
                <div className="grid grid-2" style={{ marginBottom: '0.75rem' }}>
                  <input
                    placeholder="Color Name (e.g. Jet Black)"
                    value={colorsModal.newColor.name || ''}
                    onChange={e => setColorsModal(cm => ({ ...cm, newColor: { ...cm.newColor, name: e.target.value } }))}
                  />
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <input
                      type="color"
                      value={colorsModal.newColor.hex_code || '#000000'}
                      onChange={e => setColorsModal(cm => ({ ...cm, newColor: { ...cm.newColor, hex_code: e.target.value } }))}
                      style={{ width: '50px', padding: '0.2rem', height: '40px' }}
                    />
                    <input
                      placeholder="#000000"
                      value={colorsModal.newColor.hex_code || ''}
                      onChange={e => setColorsModal(cm => ({ ...cm, newColor: { ...cm.newColor, hex_code: e.target.value } }))}
                      style={{ flex: 1 }}
                    />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <input
                    type="number"
                    placeholder="Stock Qty"
                    value={colorsModal.newColor.stock_qty ?? 10}
                    onChange={e => setColorsModal(cm => ({ ...cm, newColor: { ...cm.newColor, stock_qty: Number(e.target.value) } }))}
                    style={{ width: '120px' }}
                  />
                  <select
                    value={colorsModal.newColor.status || 'Available'}
                    onChange={e => setColorsModal(cm => ({ ...cm, newColor: { ...cm.newColor, status: e.target.value } }))}
                    style={{ flex: 1 }}
                  >
                    <option value="Available">Available</option>
                    <option value="Limited Stock">Limited Stock</option>
                    <option value="Sold Out">Sold Out</option>
                  </select>
                  <button type="button" onClick={addColor} className="btn btn-primary btn-sm">Add Color</button>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setColorsModal({ open: false, scooter: null, colors: [], newColor: {} })} className="btn btn-secondary">
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
         MODAL: ADD / EDIT SERVICE CENTRE
         ═══════════════════════════════════════════════════════ */}
      {centerModal.open && (
        <div className="modal-overlay">
          <div className="modal-box">
            <div className="modal-header">
              <h3>{centerModal.isEdit ? 'Edit Service Centre' : 'Add New Service Centre'}</h3>
              <button onClick={() => setCenterModal({ open: false, isEdit: false, data: {} })} className="btn btn-ghost btn-sm">✕</button>
            </div>
            <form onSubmit={saveServiceCenter}>
              <div className="modal-body">
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.35rem', fontWeight: 600 }}>Centre Name *</label>
                  <input
                    required
                    placeholder="e.g. OLA Express Care Point - City Center"
                    value={centerModal.data.name || ''}
                    onChange={e => setCenterModal(c => ({ ...c, data: { ...c.data, name: e.target.value } }))}
                  />
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.35rem', fontWeight: 600 }}>Full Address *</label>
                  <textarea
                    required
                    rows={2}
                    placeholder="Street address, complex, landmark"
                    value={centerModal.data.address || ''}
                    onChange={e => setCenterModal(c => ({ ...c, data: { ...c.data, address: e.target.value } }))}
                  />
                </div>

                <div className="grid grid-2" style={{ marginBottom: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.35rem', fontWeight: 600 }}>Contact Phone</label>
                    <input
                      placeholder="e.g. 8003356163"
                      value={centerModal.data.contact_number || ''}
                      onChange={e => setCenterModal(c => ({ ...c, data: { ...c.data, contact_number: e.target.value } }))}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.35rem', fontWeight: 600 }}>Daily Slot Capacity</label>
                    <input
                      type="number"
                      placeholder="12"
                      value={centerModal.data.capacity_per_day ?? 12}
                      onChange={e => setCenterModal(c => ({ ...c, data: { ...c.data, capacity_per_day: Number(e.target.value) } }))}
                    />
                  </div>
                </div>

                <div className="grid grid-2" style={{ marginBottom: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.35rem', fontWeight: 600 }}>Latitude (GPS)</label>
                    <input
                      placeholder="26.9124"
                      value={centerModal.data.latitude ?? ''}
                      onChange={e => setCenterModal(c => ({ ...c, data: { ...c.data, latitude: e.target.value } }))}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.35rem', fontWeight: 600 }}>Longitude (GPS)</label>
                    <input
                      placeholder="75.7873"
                      value={centerModal.data.longitude ?? ''}
                      onChange={e => setCenterModal(c => ({ ...c, data: { ...c.data, longitude: e.target.value } }))}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.35rem', fontWeight: 600 }}>Google Maps Link</label>
                  <input
                    placeholder="https://maps.google.com/?q=..."
                    value={centerModal.data.google_maps_link || ''}
                    onChange={e => setCenterModal(c => ({ ...c, data: { ...c.data, google_maps_link: e.target.value } }))}
                  />
                </div>

                <div className="grid grid-2" style={{ marginBottom: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.35rem', fontWeight: 600 }}>Opening Hours</label>
                    <input
                      placeholder="Mon-Sat: 8:30 AM - 7:30 PM"
                      value={centerModal.data.opening_hours || ''}
                      onChange={e => setCenterModal(c => ({ ...c, data: { ...c.data, opening_hours: e.target.value } }))}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.35rem', fontWeight: 600 }}>Active Status</label>
                    <select
                      value={centerModal.data.is_active ? '1' : '0'}
                      onChange={e => setCenterModal(c => ({ ...c, data: { ...c.data, is_active: e.target.value === '1' ? 1 : 0 } }))}
                    >
                      <option value="1">Active</option>
                      <option value="0">Inactive</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setCenterModal({ open: false, isEdit: false, data: {} })} className="btn btn-ghost">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {centerModal.isEdit ? 'Save Centre' : 'Add Centre'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
         MODAL: ADD / EDIT OFFER
         ═══════════════════════════════════════════════════════ */}
      {offerModal.open && (
        <div className="modal-overlay">
          <div className="modal-box">
            <div className="modal-header">
              <h3>{offerModal.isEdit ? 'Edit Promotional Offer' : 'Add New Offer'}</h3>
              <button onClick={() => setOfferModal({ open: false, isEdit: false, data: {} })} className="btn btn-ghost btn-sm">✕</button>
            </div>
            <form onSubmit={saveOffer}>
              <div className="modal-body">
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.35rem', fontWeight: 600 }}>Offer Title *</label>
                  <input
                    required
                    placeholder="e.g. Festive Cash Discount ₹10,000"
                    value={offerModal.data.title || ''}
                    onChange={e => setOfferModal(o => ({ ...o, data: { ...o.data, title: e.target.value } }))}
                  />
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.35rem', fontWeight: 600 }}>Description</label>
                  <textarea
                    rows={3}
                    placeholder="Offer terms, discount details, eligibility"
                    value={offerModal.data.description || ''}
                    onChange={e => setOfferModal(o => ({ ...o, data: { ...o.data, description: e.target.value } }))}
                  />
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={!!offerModal.data.active}
                      onChange={e => setOfferModal(o => ({ ...o, data: { ...o.data, active: e.target.checked ? 1 : 0 } }))}
                      style={{ width: '18px', height: '18px' }}
                    />
                    <span>Active on Showroom Website</span>
                  </label>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setOfferModal({ open: false, isEdit: false, data: {} })} className="btn btn-ghost">Cancel</button>
                <button type="submit" className="btn btn-primary">{offerModal.isEdit ? 'Save Offer' : 'Create Offer'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
         MODAL: RECORD SCOOTER SALE FOR CUSTOMER
         ═══════════════════════════════════════════════════════ */}
      {saleModal.open && (
        <div className="modal-overlay">
          <div className="modal-box">
            <div className="modal-header">
              <h3>📝 Record Scooter Sale ({saleModal.customer?.name})</h3>
              <button onClick={() => setSaleModal({ open: false, customer: null, data: {} })} className="btn btn-ghost btn-sm">✕</button>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault();
              try {
                await api.post(`/admin/customers/${saleModal.customer.id}/purchase`, saleModal.data);
                showToastMsg('✅ Purchase recorded! Customer marked eligible for ₹501 referral benefits.');
                setSaleModal({ open: false, customer: null, data: {} });
                const res = await api.get('/admin/customers');
                setCustomers(res.data);
              } catch (err) {
                alert(err.response?.data?.message || 'Error recording sale');
              }
            }}>
              <div className="modal-body">
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.35rem', fontWeight: 600 }}>Select Scooter Model</label>
                  <select
                    value={saleModal.data.scooter_id || ''}
                    onChange={e => setSaleModal(sm => ({ ...sm, data: { ...sm.data, scooter_id: e.target.value } }))}
                  >
                    {scooters.map(sc => (
                      <option key={sc.id} value={sc.id}>{sc.name} ({sc.model}) - {formatPrice(sc.price)}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-2" style={{ marginBottom: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.35rem', fontWeight: 600 }}>Variant</label>
                    <input
                      placeholder="e.g. Pro, Air, X"
                      value={saleModal.data.variant || ''}
                      onChange={e => setSaleModal(sm => ({ ...sm, data: { ...sm.data, variant: e.target.value } }))}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.35rem', fontWeight: 600 }}>Color</label>
                    <input
                      placeholder="e.g. Jet Black"
                      value={saleModal.data.color || ''}
                      onChange={e => setSaleModal(sm => ({ ...sm, data: { ...sm.data, color: e.target.value } }))}
                    />
                  </div>
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.35rem', fontWeight: 600 }}>Sale Price (₹)</label>
                  <input
                    type="number"
                    placeholder="139999"
                    value={saleModal.data.sale_price || ''}
                    onChange={e => setSaleModal(sm => ({ ...sm, data: { ...sm.data, sale_price: e.target.value } }))}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setSaleModal({ open: false, customer: null, data: {} })} className="btn btn-ghost">Cancel</button>
                <button type="submit" className="btn btn-primary">Confirm Sale & Unlock Referral Rights</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
