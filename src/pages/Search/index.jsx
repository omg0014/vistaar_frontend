import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SEARCH_TYPES } from '../../constants/searchTypes';
import { API_BASE } from '../../constants/api';
import styles from './Search.module.css';

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
  const navigate = useNavigate();
  const [type, setType]             = useState('schoolName');
  const [q, setQ]                   = useState('');
  const [leads, setLeads]           = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const currentLabel = SEARCH_TYPES.find(t => t.value === type)?.label;

  useEffect(() => {
    fetch(`${API_BASE}/api/schools/leads`)
      .then(r => r.json())
      .then(d => setLeads(d.leads || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (type !== 'schoolName' || q.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    const timer = setTimeout(() => {
      fetch(`${API_BASE}/api/schools/suggestions?q=${encodeURIComponent(q.trim())}`)
        .then(r => r.json())
        .then(d => setSuggestions(d))
        .catch(() => {});
    }, 300);
    return () => clearTimeout(timer);
  }, [q, type]);

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
      <div className={styles.hero}>
        <h1 className={styles.title}>Vistaar</h1>
        <p className={styles.subtitle}>Search & explore school data across East, West and North India</p>

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
          <div key={r.short} className={styles.regionCard}>
            <span className={styles.regionDot} style={{ background: r.color }} />
            <div>
              <p className={styles.regionName}>{r.name}</p>
              <p className={styles.regionDesc}>{r.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {leads.length > 0 && (
        <div className={styles.leadsSection}>
          <h2 className={styles.leadsTitle}>Recent Leads</h2>
          <div className={styles.leadsGrid}>
            {leads.map(school => {
              const eff = calcEfficiency(school);
              const effColor = eff === null ? null : eff >= 75 ? '#16a34a' : eff >= 40 ? '#d97706' : '#dc2626';
              return (
                <div key={school._id} className={styles.leadCard}>
                  <button
                    className={styles.leadClose}
                    onClick={async (e) => {
                      e.stopPropagation();
                      await fetch(`${API_BASE}/api/schools/${school._id}/lead`, { method: 'DELETE' });
                      setLeads(prev => prev.filter(s => s._id !== school._id));
                    }}
                  >✕</button>
                  <div onClick={() => navigate(`/school/${school._id}?col=${encodeURIComponent(school._source || '')}`)}>
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
            })}
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
