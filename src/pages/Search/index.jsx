import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { SEARCH_TYPES } from '../../constants/searchTypes';
import { API_BASE } from '../../constants/api';
import useAuthFetch from '../../hooks/useAuthFetch';
import useScrollReveal from '../../hooks/useScrollReveal';
import HeaderMenu from '../../components/HeaderMenu';
import styles from './Search.module.css';
import { calcEfficiency, efficiencyColor } from '../../utils/efficiency';

// states carry both the mobile short code and the desktop full name; the full
// name lives per-region because the same code can differ by region (e.g. JK is
// Jammu & Kashmir in the North but Jharkhand in the Central Heartland).
const REGIONS = [
  { name: 'The West Coast', short: 'TWC', centre: 'Gujarat', color: '#d97706', states: [
    { code: 'RJ', name: 'Rajasthan' }, { code: 'GJ', name: 'Gujarat' }, { code: 'MH', name: 'Maharashtra' }, { code: 'GA', name: 'Goa' },
  ] },
  { name: 'Eastern Marwadi Stronghold', short: 'EMS', centre: 'Kolkata', color: '#dc2626', states: [
    { code: 'WB', name: 'West Bengal' }, { code: 'OD', name: 'Odisha' }, { code: 'AS', name: 'Assam' },
  ] },
  { name: 'The South Fifer', short: 'TSF', centre: 'Bangalore', color: '#16a34a', states: [
    { code: 'KA', name: 'Karnataka' }, { code: 'AP', name: 'Andhra Pradesh' }, { code: 'TS', name: 'Telangana' }, { code: 'TN', name: 'Tamil Nadu' }, { code: 'KL', name: 'Kerala' },
  ] },
  { name: 'The Real North', short: 'TRN', centre: 'Chandigarh', color: '#2563eb', states: [
    { code: 'JK', name: 'Jammu & Kashmir' }, { code: 'HR', name: 'Haryana' }, { code: 'PB', name: 'Punjab' }, { code: 'UK', name: 'Uttarakhand' }, { code: 'HP', name: 'Himachal Pradesh' },
  ] },
  { name: 'Central Hindi Heartland', short: 'CHH', centre: 'Varanasi', color: '#7c3aed', states: [
    { code: 'BR', name: 'Bihar' }, { code: 'UP', name: 'Uttar Pradesh' }, { code: 'Delhi-NCR', name: 'Delhi-NCR' }, { code: 'MP', name: 'Madhya Pradesh' }, { code: 'CG', name: 'Chhattisgarh' }, { code: 'JK', name: 'Jharkhand' },
  ] },
];

export default function Search() {
  const navigate   = useNavigate();
  const location   = useLocation();
  const apiFetch   = useAuthFetch();
  const reveal     = useScrollReveal();
  const [type, setType]             = useState('schoolName');
  const [q, setQ]                   = useState('');
  const [tags, setTags]             = useState([]); // City/State: multiple OR'd entities
  const [leads, setLeads]           = useState([]);
  const [leadsLoading, setLeadsLoading] = useState(true);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const isFirstLeadsLoad              = useRef(true);

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

  function addTag() {
    const v = q.trim();
    if (!v) return;
    setTags(prev => prev.some(t => t.toLowerCase() === v.toLowerCase()) ? prev : [...prev, v]);
    setQ('');
  }

  function handleSearch() {
    if (type === 'cityState') {
      const all = [...tags];
      const pending = q.trim();
      if (pending && !all.some(t => t.toLowerCase() === pending.toLowerCase())) all.push(pending);
      if (all.length === 0) return;
      setSuggestions([]);
      setShowSuggestions(false);
      navigate(`/results?type=cityState&q=${encodeURIComponent(all.join(','))}&page=1`);
      return;
    }
    if (!q.trim()) return;
    setSuggestions([]);
    setShowSuggestions(false);
    navigate(`/results?type=${type}&q=${encodeURIComponent(q.trim())}&page=1`);
  }

  function handleKeyDown(e) {
    if (type === 'cityState') {
      if (e.key === 'Enter') {
        e.preventDefault();
        if (q.trim()) addTag();   // add the typed entity as a chip
        else handleSearch();      // Enter on empty field → run the search
      } else if (e.key === ',') {
        e.preventDefault();
        addTag();
      } else if (e.key === 'Backspace' && !q && tags.length) {
        setTags(prev => prev.slice(0, -1));
      }
      return;
    }
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
      <div className={styles.topRight}>
        <HeaderMenu />
      </div>
      <div
        className={styles.hero}
        style={{
          backgroundImage: `linear-gradient(rgba(0,0,0,0.35), rgba(0,0,0,0.45)), url(${process.env.PUBLIC_URL}/image.jpeg)`,
        }}
      >
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
            <select className={styles.select} value={type} onChange={e => { setType(e.target.value); setSuggestions([]); setTags([]); setQ(''); }}>
              {SEARCH_TYPES.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
            <div className={styles.divider} />
            {type === 'cityState' ? (
              <div className={styles.field}>
                {tags.map((t, i) => (
                  <span key={t} className={styles.chip}>
                    {t}
                    <button type="button" className={styles.chipX} aria-label={`Remove ${t}`} onClick={() => setTags(prev => prev.filter((_, j) => j !== i))}>×</button>
                  </span>
                ))}
                <input
                  className={styles.fieldInput}
                  type="text"
                  placeholder={tags.length ? 'Add another…' : 'Type a city or state, Enter to add…'}
                  value={q}
                  onChange={e => setQ(e.target.value)}
                  onKeyDown={handleKeyDown}
                  autoComplete="off"
                />
              </div>
            ) : (
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
            )}
            <button className={styles.iconBtn} onClick={handleSearch} aria-label="Search">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="7" />
                <path d="m21 21-4.3-4.3" />
              </svg>
            </button>
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

      <div className={styles.marquee}>
        <div className={styles.marqueeTrack}>
          {[...REGIONS, ...REGIONS].map((r, i) => (
            <div
              key={`${r.short}-${i}`}
              className={styles.regionCard}
              style={{ '--region-color': r.color }}
              aria-hidden={i >= REGIONS.length}
            >
              <p className={styles.regionName}>{r.name}</p>
              <p className={styles.regionCentre}>⬡ {r.centre}</p>
              <div className={styles.regionStates}>
                {r.states.map(s => (
                  <span key={s.code} className={styles.regionState}>
                    <span className={styles.stAbbr}>{s.code}</span>
                    <span className={styles.stFull}>{s.name}</span>
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
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
              : leads.map((school, i) => {
                  const eff = calcEfficiency(school);
                  const effColor = efficiencyColor(eff);
                  return (
                    <div
                      key={school._id}
                      ref={reveal}
                      className={`${styles.leadCard} reveal`}
                      style={{ animationDelay: `${i * 50}ms` }}
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
