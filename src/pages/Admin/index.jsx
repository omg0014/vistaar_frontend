import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { API_BASE } from '../../constants/api';
import useAuthFetch from '../../hooks/useAuthFetch';
import { useAuth } from '../../context/AuthContext';
import styles from './Admin.module.css';

function calcEfficiency(school) {
  const capacity = (school.totalClassrooms || 0) * 35;
  if (capacity === 0) return null;
  return Math.round((school.totalStudents || 0) / capacity * 100);
}

function EfficiencyBadge({ value }) {
  if (value === null) return null;
  const color = value >= 75 ? '#16a34a' : value >= 40 ? '#d97706' : '#dc2626';
  return (
    <span className={styles.badge} style={{ background: color + '20', color }}>
      {value}% efficiency
    </span>
  );
}

export default function AdminPanel() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const apiFetch  = useAuthFetch();
  const { user, logout } = useAuth();

  // ── Broker list state ──
  const [brokers,  setBrokers]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [newEmail, setNewEmail] = useState('');
  const [newName,  setNewName]  = useState('');
  const [adding,   setAdding]   = useState(false);
  const [error,    setError]    = useState('');
  const [deleting, setDeleting] = useState(null);

  // ── Broker detail state ──
  const [selectedBroker,     setSelectedBroker]     = useState(null);
  const [brokerLeads,        setBrokerLeads]        = useState([]);
  const [brokerLeadsLoading, setBrokerLeadsLoading] = useState(false);
  const [menuOpen,           setMenuOpen]           = useState(null); // school._id
  const menuRefs                                    = useRef({});

  // Close 3-dot menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    function handleOutside(e) {
      const ref = menuRefs.current[menuOpen];
      if (ref && !ref.contains(e.target)) setMenuOpen(null);
    }
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [menuOpen]);

  // Restore broker detail view when coming back from SchoolDetail
  useEffect(() => {
    if (location.state?.adminBroker) {
      openBroker(location.state.adminBroker);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    apiFetch(`${API_BASE}/api/admin/brokers/list`, { method: 'POST' })
      .then(r => r.json())
      .then(d => { setBrokers(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [apiFetch]);

  async function handleUnshare(school) {
    try {
      await apiFetch(`${API_BASE}/api/schools/${school._id}/unshare`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ brokerEmail: selectedBroker.email }),
      });
      setBrokerLeads(prev => prev.filter(l => l._id !== school._id));
    } catch {}
    setMenuOpen(null);
  }

  function openBroker(broker) {
    setSelectedBroker(broker);
    setBrokerLeads([]);
    setBrokerLeadsLoading(true);
    apiFetch(`${API_BASE}/api/admin/brokers/${broker._id}/leads`, { method: 'POST' })
      .then(r => r.json())
      .then(d => { setBrokerLeads(d.leads || []); setBrokerLeadsLoading(false); })
      .catch(() => setBrokerLeadsLoading(false));
  }

  async function handleAdd(e) {
    e.preventDefault();
    setError('');
    if (!newEmail.trim() || !newName.trim()) return;
    setAdding(true);
    try {
      const res  = await apiFetch(`${API_BASE}/api/admin/brokers`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email: newEmail.trim(), name: newName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed to add broker'); setAdding(false); return; }
      setBrokers(prev => [data, ...prev]);
      setNewEmail('');
      setNewName('');
    } catch {
      setError('Could not connect to server.');
    }
    setAdding(false);
  }

  async function handleDelete(broker) {
    if (!window.confirm(`Remove broker "${broker.name}" (${broker.email})? This will unshare all their leads.`)) return;
    setDeleting(broker._id);
    try {
      await apiFetch(`${API_BASE}/api/admin/brokers/${broker._id}`, { method: 'DELETE' });
      setBrokers(prev => prev.filter(b => b._id !== broker._id));
      if (selectedBroker?._id === broker._id) setSelectedBroker(null);
    } catch {}
    setDeleting(null);
  }

  const header = (
    <header className={styles.header}>
      <div className={styles.headerBrand}>
        <span className={styles.brandName}>Vistaar</span>
        <span className={styles.brandTag}>Admin</span>
      </div>
      <nav className={styles.nav}>
        <button className={styles.navBtn} onClick={() => navigate('/')}>Search</button>
        <button className={styles.navBtn} onClick={() => navigate('/bookmarks')}>Bookmarks</button>
        <button className={styles.navBtnActive}>Brokers</button>
      </nav>
      <div className={styles.headerRight}>
        {user?.picture && <img src={user.picture} alt={user.name} className={styles.avatar} />}
        <span className={styles.userName}>{user?.name}</span>
        <button className={styles.logoutBtn} onClick={() => { logout(); navigate('/login'); }}>Logout</button>
      </div>
    </header>
  );

  /* ── Broker detail view ── */
  if (selectedBroker) {
    return (
      <div className={styles.page}>
        {header}
        <main className={styles.main}>
          <div className={styles.detailTopBar}>
            <button className={styles.backBtn} onClick={() => setSelectedBroker(null)}>
              ← Back to Brokers
            </button>
            <div className={styles.detailBrokerInfo}>
              <div className={styles.brokerInitialLg}>
                {selectedBroker.name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className={styles.detailBrokerName}>{selectedBroker.name}</p>
                <p className={styles.detailBrokerEmail}>{selectedBroker.email}</p>
              </div>
            </div>
            {!brokerLeadsLoading && (
              <span className={styles.countBadge}>
                {brokerLeads.length} lead{brokerLeads.length !== 1 ? 's' : ''} shared
              </span>
            )}
          </div>

          {brokerLeadsLoading && (
            <div className={styles.cardList}>
              {[...Array(3)].map((_, i) => (
                <div key={i} className={styles.card}>
                  <div className={styles.cardTop}>
                    <div className={styles.skel} style={{ height: 16, width: '60%' }} />
                  </div>
                  <div className={styles.skel} style={{ height: 13, width: '45%' }} />
                  <div className={styles.cardMeta}>
                    <div className={styles.skel} style={{ height: 26, width: 110, borderRadius: 6 }} />
                    <div className={styles.skel} style={{ height: 26, width: 90,  borderRadius: 6 }} />
                  </div>
                  <div className={styles.cardBottom}>
                    <div className={styles.skel} style={{ height: 13, width: 70 }} />
                    <div className={styles.skel} style={{ height: 34, width: 150, borderRadius: 8 }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!brokerLeadsLoading && brokerLeads.length === 0 && (
            <div className={styles.emptyLeads}>
              <p className={styles.emptyLeadsTitle}>No leads shared yet</p>
              <p className={styles.emptyLeadsDesc}>
                Go to the Search page and share lead cards with {selectedBroker.name}.
              </p>
            </div>
          )}

          {!brokerLeadsLoading && brokerLeads.length > 0 && (
            <div className={styles.cardList}>
              {brokerLeads.map(school => {
                const eff = calcEfficiency(school);
                return (
                  <div key={school._id} className={styles.card} style={{ position: 'relative' }}>
                    <div
                      ref={el => { menuRefs.current[school._id] = el; }}
                      className={styles.menuWrap}
                    >
                      <button
                        className={styles.menuBtn}
                        onClick={() => setMenuOpen(prev => prev === school._id ? null : school._id)}
                        title="Options"
                      >
                        ⋮
                      </button>
                      {menuOpen === school._id && (
                        <div className={styles.menuDropdown}>
                          <button
                            className={styles.menuItem}
                            onClick={() => handleUnshare(school)}
                          >
                            Remove sharing
                          </button>
                        </div>
                      )}
                    </div>
                    <div className={styles.cardTop}>
                      <h2 className={styles.schoolName}>{school.schoolName}</h2>
                      {school._source && <span className={styles.region}>{school._source}</span>}
                    </div>
                    {school.address && <p className={styles.address}>{school.address}</p>}
                    <p className={styles.location}>
                      {[school.district, school.state].filter(Boolean).join(', ')}
                    </p>
                    <div className={styles.cardMeta}>
                      {school.totalStudents != null && (
                        <span className={styles.metaItem}>🎓 {school.totalStudents} students</span>
                      )}
                      {school.totalTeachers != null && (
                        <span className={styles.metaItem}>👩‍🏫 {school.totalTeachers} teachers</span>
                      )}
                      <EfficiencyBadge value={eff} />
                    </div>
                    <div className={styles.cardBottom}>
                      {school.pincode && <span className={styles.pincode}>📍 {school.pincode}</span>}
                      <button
                        className={styles.viewBtn}
                        onClick={() => navigate(`/school/${school._id}`, { state: { fromAdmin: true, adminBroker: selectedBroker } })}
                      >
                        View Report Card →
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>

        <footer className={styles.footer}>
          <span className={styles.footerBrand}>Vistaar</span>
          <span className={styles.footerText}>The process of expanding, growing, or explaining something in greater detail.</span>
        </footer>
      </div>
    );
  }

  /* ── Broker list view ── */
  return (
    <div className={styles.page}>
      {header}

      <main className={styles.main}>
        <div className={styles.pageTitle}>
          <h1 className={styles.title}>Broker Management</h1>
          <p className={styles.subtitle}>Add broker accounts and share school leads with them</p>
        </div>

        <div className={styles.addCard}>
          <h2 className={styles.addTitle}>Add New Broker</h2>
          <form className={styles.addForm} onSubmit={handleAdd}>
            <input
              className={styles.input}
              type="text"
              placeholder="Full name"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              required
            />
            <input
              className={styles.input}
              type="email"
              placeholder="Google account email"
              value={newEmail}
              onChange={e => setNewEmail(e.target.value)}
              required
            />
            <button className={styles.addBtn} type="submit" disabled={adding}>
              {adding ? 'Adding…' : '+ Add Broker'}
            </button>
          </form>
          {error && <p className={styles.error}>{error}</p>}
          <p className={styles.hint}>The broker logs in with this Google account and sees only leads you share with them.</p>
        </div>

        <div className={styles.listSection}>
          <h2 className={styles.listTitle}>Brokers ({brokers.length})</h2>
          {loading ? (
            <div className={styles.brokerList}>
              {[...Array(3)].map((_, i) => (
                <div key={i} className={styles.brokerRow}>
                  <div className={styles.skel} style={{ width: 36, height: 36, borderRadius: '50%', flexShrink: 0 }} />
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div className={styles.skel} style={{ height: 13, width: '30%' }} />
                    <div className={styles.skel} style={{ height: 11, width: '50%' }} />
                  </div>
                </div>
              ))}
            </div>
          ) : brokers.length === 0 ? (
            <p className={styles.emptyText}>No brokers yet. Add one above.</p>
          ) : (
            <div className={styles.brokerList}>
              {brokers.map(broker => (
                <div
                  key={broker._id}
                  className={styles.brokerRow}
                  onClick={() => openBroker(broker)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className={styles.brokerInitial}>
                    {broker.name?.charAt(0).toUpperCase()}
                  </div>
                  <div className={styles.brokerInfo}>
                    <p className={styles.brokerName}>{broker.name}</p>
                    <p className={styles.brokerEmail}>{broker.email}</p>
                  </div>
                  <div className={styles.brokerMeta}>
                    <span className={styles.brokerDate}>
                      Added {new Date(broker.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                  <span className={styles.brokerArrow}>→</span>
                  <button
                    className={styles.deleteBtn}
                    onClick={e => { e.stopPropagation(); handleDelete(broker); }}
                    disabled={deleting === broker._id}
                  >
                    {deleting === broker._id ? '…' : 'Remove'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <footer className={styles.footer}>
        <span className={styles.footerBrand}>Vistaar</span>
        <span className={styles.footerText}>The process of expanding, growing, or explaining something in greater detail.</span>
      </footer>
    </div>
  );
}
