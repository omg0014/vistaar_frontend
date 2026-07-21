import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { API_BASE } from '../../constants/api';
import useAuthFetch from '../../hooks/useAuthFetch';
import SearchHeader from '../../components/SearchHeader';
import HeaderMenu from '../../components/HeaderMenu';
import styles from './Admin.module.css';

const SUBTITLE = "'विस्तार' मार्गदर्शेन, भारतं विश्वगौरवम्।\nयुगपुरुषाः युगरूपाश्च, शिक्षया सन्तु दीपिताः॥";
const SUBTITLE_EN = 'Guided by the vast vision of the Vistaar app, may Bharat rise to its destiny as a global leader by the year 2047. Through excellence in education, may our students—both young men and women—be illuminated as the architects and changemakers of this new era.';
const MODE_OPTIONS = [{ value: 'search', label: 'Search' }, { value: 'create', label: 'Create' }];

export default function AdminPanel() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const apiFetch  = useAuthFetch();

  // ── Broker list state ──
  const [brokers,  setBrokers]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [newEmail, setNewEmail] = useState('');
  const [newName,  setNewName]  = useState('');
  const [adding,   setAdding]   = useState(false);
  const [error,    setError]    = useState('');
  const [deleting, setDeleting] = useState(null);

  // ── Header search / create ──
  const [mode,         setMode]         = useState('search');
  const [query,        setQuery]        = useState('');
  const [appliedQuery, setAppliedQuery] = useState('');

  // ── Broker detail state ──
  const [selectedBroker,    setSelectedBroker]    = useState(null);
  const [brokerCols,        setBrokerCols]        = useState([]);
  const [brokerColsLoading, setBrokerColsLoading] = useState(false);
  const [menuOpen,          setMenuOpen]          = useState(null); // collection._id
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

  async function handleUnshare(col) {
    try {
      await apiFetch(`${API_BASE}/api/schools/bookmarks/${col._id}/unshare`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ brokerEmail: selectedBroker.email }),
      });
      setBrokerCols(prev => prev.filter(c => c._id !== col._id));
    } catch {}
    setMenuOpen(null);
  }

  function openBroker(broker) {
    setSelectedBroker(broker);
    setBrokerCols([]);
    setBrokerColsLoading(true);
    apiFetch(`${API_BASE}/api/admin/brokers/${broker._id}/collections`, { method: 'POST' })
      .then(r => r.json())
      .then(d => { setBrokerCols(d.collections || []); setBrokerColsLoading(false); })
      .catch(() => setBrokerColsLoading(false));
  }

  async function addBroker() {
    setError('');
    if (!newName.trim() || !newEmail.trim()) { setError('Both name and email are required.'); return; }
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

  function submitHeader() {
    if (mode === 'create') addBroker();
    else setAppliedQuery(query.trim());
  }
  function headerKeyDown(e) { if (e.key === 'Enter') submitHeader(); }

  async function handleDelete(broker) {
    if (!window.confirm(`Remove broker "${broker.name}" (${broker.email})? This will unshare all their collections.`)) return;
    setDeleting(broker._id);
    try {
      await apiFetch(`${API_BASE}/api/admin/brokers/${broker._id}`, { method: 'DELETE' });
      setBrokers(prev => prev.filter(b => b._id !== broker._id));
      if (selectedBroker?._id === broker._id) setSelectedBroker(null);
    } catch {}
    setDeleting(null);
  }

  /* ── Broker detail view ── */
  if (selectedBroker) {
    return (
      <div className={styles.page}>
        <SearchHeader
          title="Vistaar"
          subtitle={SUBTITLE}
          tooltip={SUBTITLE_EN}
          onBack={() => setSelectedBroker(null)}
          backLabel="← Back to Brokers"
          rightSlot={<HeaderMenu />}
        />
        <main className={styles.main}>
          <div className={styles.detailTopBar}>
            <div className={styles.detailBrokerInfo}>
              <div className={styles.brokerInitialLg}>
                {selectedBroker.name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className={styles.detailBrokerName}>{selectedBroker.name}</p>
                <p className={styles.detailBrokerEmail}>{selectedBroker.email}</p>
              </div>
            </div>
            {!brokerColsLoading && (
              <span className={styles.countBadge}>
                {brokerCols.length} collection{brokerCols.length !== 1 ? 's' : ''} shared
              </span>
            )}
          </div>

          {brokerColsLoading && (
            <div className={styles.cardList}>
              {[...Array(3)].map((_, i) => (
                <div key={i} className={styles.card}>
                  <div className={styles.cardTop}>
                    <div className={styles.skel} style={{ height: 16, width: '60%' }} />
                  </div>
                  <div className={styles.skel} style={{ height: 13, width: '45%' }} />
                </div>
              ))}
            </div>
          )}

          {!brokerColsLoading && brokerCols.length === 0 && (
            <div className={styles.emptyLeads}>
              <p className={styles.emptyLeadsTitle}>No collections shared yet</p>
              <p className={styles.emptyLeadsDesc}>
                Go to the Bookmarks page and share a collection with {selectedBroker.name}.
              </p>
            </div>
          )}

          {!brokerColsLoading && brokerCols.length > 0 && (
            <div className={styles.cardList}>
              {brokerCols.map(col => (
                <div key={col._id} className={styles.card} style={{ position: 'relative' }}>
                  <div
                    ref={el => { menuRefs.current[col._id] = el; }}
                    className={styles.menuWrap}
                  >
                    <button
                      className={styles.menuBtn}
                      onClick={() => setMenuOpen(prev => prev === col._id ? null : col._id)}
                      title="Options"
                      aria-label={`Options for ${col.name}`}
                    >
                      ⋮
                    </button>
                    {menuOpen === col._id && (
                      <div className={styles.menuDropdown}>
                        <button
                          className={styles.menuItem}
                          onClick={() => handleUnshare(col)}
                        >
                          Remove sharing
                        </button>
                      </div>
                    )}
                  </div>
                  <div className={styles.cardTop}>
                    <h2 className={styles.schoolName}>{col.name}</h2>
                  </div>
                  <p className={styles.location}>
                    {col.schools.length} school{col.schools.length !== 1 ? 's' : ''}
                  </p>
                  <div className={styles.cardBottom}>
                    <span />
                    <button
                      className={styles.viewBtn}
                      onClick={() => navigate(`/bookmarks?col=${col._id}`)}
                    >
                      View Collection →
                    </button>
                  </div>
                </div>
              ))}
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
  const q = appliedQuery.trim().toLowerCase();
  const filtering = mode === 'search' && q !== '';
  const visibleBrokers = filtering
    ? brokers.filter(b => (b.name || '').toLowerCase().includes(q) || (b.email || '').toLowerCase().includes(q))
    : brokers;

  return (
    <div className={styles.page}>
      <SearchHeader
        title="Vistaar"
        subtitle={SUBTITLE}
        tooltip={SUBTITLE_EN}
        onBack={() => navigate('/')}
        backLabel="← Back to Search"
        rightSlot={<HeaderMenu />}
        options={MODE_OPTIONS}
        mode={mode}
        onModeChange={v => { setMode(v); setQuery(''); setAppliedQuery(''); setError(''); }}
        value={mode === 'create' ? newName : query}
        onChange={mode === 'create' ? setNewName : setQuery}
        onKeyDown={headerKeyDown}
        onSubmit={submitHeader}
        placeholder={mode === 'search' ? 'Search brokers by name or email…' : 'Full name'}
        icon={mode === 'create' ? 'plus' : 'search'}
        secondValue={newEmail}
        onSecondChange={setNewEmail}
        secondPlaceholder={mode === 'create' ? 'Google account email' : undefined}
      />

      <main className={styles.main}>
        <div className={styles.pageTitle}>
          <h1 className={styles.title}>Broker Management</h1>
          <p className={styles.subtitle}>
            {mode === 'create'
              ? 'Enter a name and Google email above, then + to add a broker.'
              : 'Search brokers by name or email, or switch to Create to add one.'}
          </p>
          {error && <p className={styles.error}>{error}</p>}
          {mode === 'create' && adding && <p className={styles.hint}>Adding…</p>}
        </div>

        <div className={styles.listSection}>
          <h2 className={styles.listTitle}>Brokers ({brokers.length}){filtering ? ` · ${visibleBrokers.length} matching` : ''}</h2>
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
            <p className={styles.emptyText}>No brokers yet. Switch the dropdown to “Create” to add one.</p>
          ) : visibleBrokers.length === 0 ? (
            <p className={styles.emptyText}>No brokers match “{appliedQuery}”.</p>
          ) : (
            <div className={styles.brokerList}>
              {visibleBrokers.map(broker => (
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
