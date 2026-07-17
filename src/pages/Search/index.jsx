import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { SEARCH_TYPES } from '../../constants/searchTypes';
import { API_BASE } from '../../constants/api';
import useAuthFetch from '../../hooks/useAuthFetch';
import { useAuth } from '../../context/AuthContext';
import styles from './Search.module.css';
import bmIcon from '../../assets/bookmark.png';

const REGIONS = [
  { name: 'The Western Corridor',       short: 'TWC', desc: 'Maharashtra · Gujarat · Rajasthan', color: '#d97706' },
  { name: 'Central Hindi Heartland',    short: 'CHH', desc: 'Madhya Pradesh · Uttar Pradesh',    color: '#7c3aed' },
  { name: 'The South Fifer',            short: 'TSF', desc: 'Tamil Nadu · Kerala · Karnataka',   color: '#16a34a' },
  { name: 'The Real North',             short: 'TRN', desc: 'Haryana · Punjab · Chandigarh',     color: '#2563eb' },
  { name: 'Eastern Marwadi Stronghold', short: 'EMS', desc: 'West Bengal · Odisha · Assam',      color: '#dc2626' },
];

function calcEfficiency(school) {
  const capacity = (school.totalClassrooms || 0) * 35;
  if (capacity === 0) return null;
  return Math.round((school.totalStudents || 0) / capacity * 100);
}

export default function Search() {
  const navigate   = useNavigate();
  const location   = useLocation();
  const apiFetch   = useAuthFetch();
  const { user, logout } = useAuth();
  const [type, setType]             = useState('schoolName');
  const [q, setQ]                   = useState('');
  const [leads, setLeads]           = useState([]);
  const [leadsLoading, setLeadsLoading] = useState(true);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Share UI state
  const [brokers, setBrokers]         = useState([]);
  const [shareOpen, setShareOpen]     = useState(null); // school._id
  const [sharing, setSharing]         = useState(null); // broker email being toggled
  const shareRefs                     = useRef({});
  const isFirstLeadsLoad              = useRef(true);

  const currentLabel = SEARCH_TYPES.find(t => t.value === type)?.label;

  useEffect(() => {
    // Option A: instant patch from SchoolDetail navigation state — no skeleton
    const updated = location.state?.updatedSchool;
    if (updated) {
      setLeads(prev => prev.map(l => l._id === updated._id ? { ...l, sharedWith: updated.sharedWith } : l));
    }

    // Option B: re-fetch on every navigation (location.key changes on every route visit,
    // including browser back). Show skeleton only on the very first load.
    const silent = !isFirstLeadsLoad.current;
    isFirstLeadsLoad.current = false;
    if (!silent) setLeadsLoading(true);

    apiFetch(`${API_BASE}/api/schools/leads`, { method: 'POST' })
      .then(r => r.json())
      .then(d => { setLeads(d.leads || []); if (!silent) setLeadsLoading(false); })
      .catch(() => { if (!silent) setLeadsLoading(false); });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.key, apiFetch]);

  // Fetch broker list for share dropdown (admin only)
  useEffect(() => {
    if (user?.role !== 'admin') return;
    apiFetch(`${API_BASE}/api/admin/brokers/list`, { method: 'POST' })
      .then(r => r.json())
      .then(d => setBrokers(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, [apiFetch, user]);

  // Close share dropdown when clicking outside
  useEffect(() => {
    if (!shareOpen) return;
    function handleClick(e) {
      const ref = shareRefs.current[shareOpen];
      if (ref && !ref.contains(e.target)) setShareOpen(null);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [shareOpen]);

  useEffect(() => {
    if (type !== 'schoolName' || q.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    const timer = setTimeout(() => {
      apiFetch(`${API_BASE}/api/schools/suggestions`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ q: q.trim() }) })
        .then(r => r.json())
        .then(d => setSuggestions(d))
        .catch(() => {});
    }, 300);
    return () => clearTimeout(timer);
  }, [q, type, apiFetch]);

  function handleSearch() {
    if (!q.trim()) return;
    setSuggestions([]);
    setShowSuggestions(false);
    navigate(`/results?type=${type}&q=${encodeURIComponent(q.trim())}&page=1`);
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') handleSearch();
    if (e.key === 'Escape') setShowSuggestions(false);
  }

  function handleSuggestionClick(name) {
    setQ(name);
    setSuggestions([]);
    setShowSuggestions(false);
    navigate(`/results?type=schoolName&q=${encodeURIComponent(name)}&page=1`);
  }

  async function toggleShare(school, broker) {
    const alreadyShared = school.sharedWith?.includes(broker.email);
    setSharing(broker.email);
    const endpoint = alreadyShared ? 'unshare' : 'share';
    try {
      await apiFetch(`${API_BASE}/api/schools/${school._id}/${endpoint}`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ brokerEmail: broker.email }),
      });
      setLeads(prev => prev.map(s => {
        if (s._id !== school._id) return s;
        const sharedWith = alreadyShared
          ? (s.sharedWith || []).filter(e => e !== broker.email)
          : [...(s.sharedWith || []), broker.email];
        return { ...s, sharedWith };
      }));
    } catch {}
    setSharing(null);
  }

  return (
    <div className={styles.page}>
      <div style={{ position: 'absolute', top: 16, right: 16, display: 'flex', alignItems: 'center', gap: 10, zIndex: 10 }}>
        {user?.picture && <img src={user.picture} alt={user.name} style={{ width: 32, height: 32, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.5)' }} />}
        <span style={{ color: '#ede9fe', fontSize: '0.82rem' }}>{user?.name}</span>
        {user?.role === 'admin' && (
          <button onClick={() => navigate('/admin')} style={{ padding: '5px 12px', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 8, color: '#fff', fontSize: '0.8rem', cursor: 'pointer' }}>
            Brokers
          </button>
        )}
        <button onClick={() => { logout(); navigate('/login'); }} style={{ padding: '5px 12px', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 8, color: '#fff', fontSize: '0.8rem', cursor: 'pointer' }}>
          Logout
        </button>
      </div>
      <div className={styles.hero}>
        <h1 className={styles.title}>Vistaar</h1>
        <div className={styles.subtitleWrap}>
          <p className={styles.subtitle}>
            'विस्तार' मार्गदर्शेन, भारतं विश्वगौरवम्।<br />
            युगपुरुषाः युगरूपाश्च, शिक्षया सन्तु दीपिताः॥
          </p>
          <div className={styles.subtitleTooltip}>
            Guided by the vast vision of the Vistaar app, may Bharat rise to its destiny as a global leader by the year 2047. Through excellence in education, may our students—both young men and women—be illuminated as the architects and changemakers of this new era.
          </div>
        </div>

        <div className={styles.form}>
          <div className={styles.formInner}>
            <select className={styles.select} value={type} onChange={e => { setType(e.target.value); setSuggestions([]); }}>
              {SEARCH_TYPES.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
            <div className={styles.divider} />
            <input
              className={styles.input}
              type="text"
              placeholder={`Search by ${currentLabel}...`}
              value={q}
              onChange={e => { setQ(e.target.value); setShowSuggestions(true); }}
              onKeyDown={handleKeyDown}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
              onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
              autoComplete="off"
            />
            <button className={styles.btn} onClick={handleSearch}>Search</button>
            <button className={styles.btn} style={{ background: '#ede9fe', color: '#7c3aed', display: 'flex', alignItems: 'center', gap: 6 }} onClick={() => navigate('/bookmarks')}><img src={bmIcon} alt="bookmark" style={{ width: 16, height: 16 }} /> Bookmarks</button>
          </div>
          {showSuggestions && suggestions.length > 0 && (
            <div className={styles.suggestions}>
              {suggestions.map(s => (
                <div key={s._id} className={styles.suggestionItem} onMouseDown={() => handleSuggestionClick(s.schoolName)}>
                  {s.schoolName}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={styles.statsCard}>
          <div className={styles.statItem}>
            <span className={styles.statNum}>94,268</span>
            <span className={styles.statLabel}>Schools</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statDivider} />
            <span className={styles.statNum}>5</span>
            <span className={styles.statLabel}>Regions</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statDivider} />
            <span className={styles.statNum}>107</span>
            <span className={styles.statLabel}>Data Fields</span>
          </div>
        </div>
      </div>

      <div className={styles.regions}>
        {REGIONS.map(r => (
          <div key={r.short} className={styles.regionCard}>
            <span className={styles.regionDot} style={{ background: r.color }} />
            <div>
              <p className={styles.regionName}>{r.name}</p>
              <p className={styles.regionDesc}>{r.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {(leadsLoading || leads.length > 0) && (
        <div className={styles.leadsSection}>
          <h2 className={styles.leadsTitle}>Recent Leads</h2>
          <div className={styles.leadsGrid}>
            {leadsLoading
              ? [...Array(5)].map((_, i) => (
                  <div key={i} className={styles.leadCard}>
                    <div className={styles.skel} style={{ height: 12, width: '80%', marginBottom: 8 }} />
                    <div className={styles.skel} style={{ height: 10, width: '60%', marginBottom: 12 }} />
                    <div className={styles.skel} style={{ height: 10, width: '40%' }} />
                  </div>
                ))
              : leads.map(school => {
                  const eff = calcEfficiency(school);
                  const effColor = eff === null ? null : eff >= 75 ? '#16a34a' : eff >= 40 ? '#d97706' : '#dc2626';
                  const sharedCount = school.sharedWith?.length || 0;
                  return (
                    <div
                      key={school._id}
                      className={styles.leadCard}
                      ref={el => { shareRefs.current[school._id] = el; }}
                    >
                      <button
                        className={styles.leadClose}
                        onClick={async (e) => {
                          e.stopPropagation();
                          await apiFetch(`${API_BASE}/api/schools/${school._id}/lead`, { method: 'DELETE' });
                          setLeads(prev => prev.filter(s => s._id !== school._id));
                        }}
                      >✕</button>

                      {user?.role === 'admin' && (
                        <div className={styles.shareWrap}>
                          <button
                            className={`${styles.shareBtn} ${sharedCount > 0 ? styles.shareBtnActive : ''}`}
                            onClick={e => { e.stopPropagation(); setShareOpen(shareOpen === school._id ? null : school._id); }}
                            title="Share with broker"
                          >
                            {sharedCount > 0 ? `Shared (${sharedCount})` : 'Share'}
                          </button>
                          {shareOpen === school._id && (
                            <div className={styles.shareDropdown} onClick={e => e.stopPropagation()}>
                              {brokers.length === 0 ? (
                                <p className={styles.shareEmpty}>No brokers. Add them in Admin.</p>
                              ) : (
                                brokers.map(broker => {
                                  const shared = school.sharedWith?.includes(broker.email);
                                  return (
                                    <button
                                      key={broker._id}
                                      className={`${styles.brokerOption} ${shared ? styles.brokerOptionShared : ''}`}
                                      onClick={() => toggleShare(school, broker)}
                                      disabled={sharing === broker.email}
                                    >
                                      <span className={styles.brokerOptionName}>{broker.name}</span>
                                      <span className={styles.brokerOptionToggle}>
                                        {sharing === broker.email ? '…' : shared ? '✓ Shared' : '+ Share'}
                                      </span>
                                    </button>
                                  );
                                })
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      <div onClick={() => { apiFetch(`${API_BASE}/api/schools/${school._id}/lead`, { method: 'PATCH' }); navigate(`/school/${school._id}?col=${encodeURIComponent(school._source || '')}`); }}>
                        <p className={styles.leadName}>{school.schoolName}</p>
                        <p className={styles.leadLocation}>
                          {[school.district, school.state].filter(Boolean).join(', ')}
                        </p>
                        <div className={styles.leadMeta}>
                          {school.totalStudents != null && <span>🎓 {school.totalStudents}</span>}
                          {eff !== null && (
                            <span style={{ color: effColor, fontWeight: 600 }}>{eff}%</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
            }
          </div>
        </div>
      )}

      <footer className={styles.footer}>
        <span className={styles.footerBrand}>Vistaar</span>
        <span className={styles.footerMeaning}>The process of expanding, growing, or explaining something in greater detail.</span>
      </footer>
    </div>
  );
}
