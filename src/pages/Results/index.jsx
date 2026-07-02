import { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { API_BASE } from '../../constants/api';
import { TYPE_LABELS } from '../../constants/searchTypes';
import Filter from './Filter';
import styles from './Results.module.css';

// Efficiency = (totalStudents) / (totalClassrooms * 35) * 100
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

export default function Results() {
  const [params]              = useSearchParams();
  const navigate              = useNavigate();
  const type                  = params.get('type') || 'schoolName';
  const q                     = params.get('q') || '';

  const [results, setResults]   = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [total, setTotal]       = useState(0);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const scrollRestoredRef       = useRef(false);

  const cacheKey  = `results_${type}_${q}`;
  const scrollKey = `scroll_${type}_${q}`;

  useEffect(() => {
    scrollRestoredRef.current = false;
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      try {
        const { results: r, total: t } = JSON.parse(cached);
        setResults(r);
        setFiltered(r);
        setTotal(t);
        setLoading(false);
        return;
      } catch {
        sessionStorage.removeItem(cacheKey);
      }
    }
    setLoading(true);
    setError('');
    fetch(`${API_BASE}/api/schools/search?type=${type}&q=${encodeURIComponent(q)}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) { setError(data.error); }
        else {
          const r = data.results || [];
          const t = data.total || 0;
          try { sessionStorage.setItem(cacheKey, JSON.stringify({ results: r, total: t })); } catch {}
          setResults(r);
          setFiltered(r);
          setTotal(t);
        }
        setLoading(false);
      })
      .catch(() => { setError('Failed to fetch results.'); setLoading(false); });
  }, [type, q, cacheKey]);

  useEffect(() => {
    if (!loading && results.length > 0 && !scrollRestoredRef.current) {
      scrollRestoredRef.current = true;
      const saved = sessionStorage.getItem(scrollKey);
      if (saved) {
        setTimeout(() => {
          window.scrollTo({ top: parseInt(saved), behavior: 'instant' });
          sessionStorage.removeItem(scrollKey);
        }, 50);
      }
    }
  }, [loading, results.length, scrollKey]);

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <button className={styles.backBtn} onClick={() => navigate('/')}>
          ← Back
        </button>
        <span className={styles.breadcrumb}>
          <span className={styles.typeLabel}>{TYPE_LABELS[type]}</span>
          <span className={styles.queryLabel}>{q}</span>
        </span>
        {!loading && (
          <span className={styles.count}>
            {filtered.length !== results.length
              ? `${filtered.length} of ${total} schools`
              : `${total} schools found`}
          </span>
        )}
      </div>

      {!loading && results.length > 0 && (
        <Filter results={results} onFilter={setFiltered} />
      )}

      <div className={styles.list}>
        {loading && <p className={styles.msg}>Loading...</p>}
        {error  && <p className={styles.msg}>{error}</p>}
        {!loading && !error && results.length === 0 && (
          <p className={styles.msg}>No schools found.</p>
        )}

        {filtered.map(school => {
          const eff = calcEfficiency(school);
          return (
            <div key={school._id} className={styles.card}>
              <div className={styles.cardTop}>
                <h2 className={styles.schoolName}>{school.schoolName}</h2>
                {school._source && <span className={styles.region}>{school._source}</span>}
              </div>

              <p className={styles.address}>{school.address}</p>
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
                  onClick={async () => {
                    try { sessionStorage.setItem(scrollKey, window.scrollY); } catch {}
                    await fetch(`${API_BASE}/api/schools/${school._id}/lead`, { method: 'PATCH' });
                    navigate(`/school/${school._id}?col=${encodeURIComponent(school._source || '')}`);
                  }}
                >
                  View Report Card →
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
