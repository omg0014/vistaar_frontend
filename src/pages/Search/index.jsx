import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { SEARCH_TYPES } from '../../constants/searchTypes';
import { API_BASE } from '../../constants/api';
import useAuthFetch from '../../hooks/useAuthFetch';
import { useAuth } from '../../context/AuthContext';
import styles from './Search.module.css';
import { calcEfficiency, efficiencyColor } from '../../utils/efficiency';

const REGIONS = [
  { name: 'The West Coast',             short: 'TWC', centre: 'Gujarat',    states: ['RJ', 'GJ', 'MH', 'GA'],                    color: '#d97706' },
  { name: 'Eastern Marwadi Stronghold', short: 'EMS', centre: 'Kolkata',    states: ['WB', 'OD', 'AS'],                          color: '#dc2626' },
  { name: 'The South Fifer',            short: 'TSF', centre: 'Bangalore',  states: ['KA', 'AP', 'TS', 'TN', 'KL'],              color: '#16a34a' },
  { name: 'The Real North',             short: 'TRN', centre: 'Chandigarh', states: ['JK', 'HR', 'PB', 'UK', 'HP'],              color: '#2563eb' },
  { name: 'Central Hindi Heartland',    short: 'CHH', centre: 'Varanasi',   states: ['BR', 'UP', 'Delhi-NCR', 'MP', 'CG', 'JK'], color: '#7c3aed' },
];

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

  const isFirstLeadsLoad              = useRef(true);

  // Hamburger menu
  const [hamburgerOpen, setHamburgerOpen] = useState(false);
  const hamburgerRef                      = useRef(null);
  useEffect(() => {
    if (!hamburgerOpen) return;
    function handleOutside(e) {
      if (hamburgerRef.current && !hamburgerRef.current.contains(e.target)) setHamburgerOpen(false);
    }
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [hamburgerOpen]);

  const currentLabel = SEARCH_TYPES.find(t => t.value === type)?.label;

  useEffect(() => {
    // Re-fetch on every navigation (location.key changes on every route visit,
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

  return (
    <div className={styles.page}>
      <div className={styles.topRight} ref={hamburgerRef}>
        {user?.picture && <img src={user.picture} alt={user.name} className={styles.topAvatar} />}
        <button className={styles.hamburgerBtn} onClick={() => setHamburgerOpen(o => !o)} aria-label="Menu">
          <span /><span /><span />
        </button>
        {hamburgerOpen && (
          <div className={styles.hamburgerMenu}>
            <p className={styles.hamburgerName}>{user?.name}</p>
            <button onClick={() => { setHamburgerOpen(false); navigate('/bookmarks'); }} className={styles.hamburgerItem}>Bookmarks</button>
            {user?.role === 'admin' && (
              <button onClick={() => { setHamburgerOpen(false); navigate('/admin'); }} className={styles.hamburgerItem}>Brokers</button>
            )}
            <button onClick={() => { logout(); navigate('/login'); }} className={styles.hamburgerItem}>Logout</button>
          </div>
        )}
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
          <div key={r.short} className={styles.regionCard} style={{ '--region-color': r.color }}>
            <p className={styles.regionName}>{r.name}</p>
            <p className={styles.regionCentre}>⬡ {r.centre}</p>
            <div className={styles.regionStates}>
              {r.states.map(s => (
                <span key={s} className={styles.regionState}>{s}</span>
              ))}
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
                  const effColor = efficiencyColor(eff);
                  return (
                    <div
                      key={school._id}
                      className={styles.leadCard}
                    >
                      <button
                        className={styles.leadClose}
                        aria-label={`Remove ${school.schoolName} from recent leads`}
                        onClick={async (e) => {
                          e.stopPropagation();
                          await apiFetch(`${API_BASE}/api/schools/${school._id}/lead`, { method: 'DELETE' });
                          setLeads(prev => prev.filter(s => s._id !== school._id));
                        }}
                      >✕</button>

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
