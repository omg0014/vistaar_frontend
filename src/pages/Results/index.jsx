import { useEffect, useState, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { API_BASE } from '../../constants/api';
import { TYPE_LABELS } from '../../constants/searchTypes';
import Filter from './Filter';
import styles from './Results.module.css';

const LIMIT = 10;

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

function buildUrl(base, type, q, page, filterParams) {
  let url = `${base}/api/schools/search?type=${type}&q=${encodeURIComponent(q)}&page=${page}&limit=${LIMIT}`;
  Object.entries(filterParams).forEach(([k, v]) => { url += `&${k}=${v}`; });
  return url;
}

export default function Results() {
  const [params]   = useSearchParams();
  const navigate   = useNavigate();
  const type       = params.get('type') || 'schoolName';
  const q          = params.get('q') || '';
  const cacheKey   = `rc_${type}_${q}`;
  const scrollKey  = `rs_${type}_${q}`;

  // Init filterParams from cache so filter inputs restore on Back
  const [filterParams, setFilterParams] = useState(() => {
    try {
      const cached = sessionStorage.getItem(`rc_${params.get('type') || 'schoolName'}_${params.get('q') || ''}`);
      if (cached) return JSON.parse(cached).filterParams || {};
    } catch {}
    return {};
  });

  const [results,     setResults]     = useState([]);
  const [total,       setTotal]       = useState(0);
  const [page,        setPage]        = useState(1);
  const [hasMore,     setHasMore]     = useState(false);
  const [loading,     setLoading]     = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error,       setError]       = useState('');

  const sentinelRef    = useRef(null);
  const loadingRef     = useRef(false);
  const restoredRef    = useRef(false);

  // Initial fetch / re-fetch when search or filter changes
  useEffect(() => {
    // On first mount, try to restore from cache (user pressed Back)
    if (!restoredRef.current) {
      restoredRef.current = true;
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        try {
          const { results: r, total: t, page: p, hasMore: h } = JSON.parse(cached);
          setResults(r);
          setTotal(t);
          setPage(p);
          setHasMore(h);
          setLoading(false);
          const saved = sessionStorage.getItem(scrollKey);
          if (saved) {
            setTimeout(() => {
              window.scrollTo({ top: parseInt(saved), behavior: 'instant' });
              sessionStorage.removeItem(scrollKey);
            }, 50);
          }
          return;
        } catch {
          sessionStorage.removeItem(cacheKey);
        }
      }
    }

    setLoading(true);
    setError('');
    setResults([]);
    setPage(1);
    setHasMore(false);

    fetch(buildUrl(API_BASE, type, q, 1, filterParams))
      .then(r => r.json())
      .then(data => {
        if (data.error) { setError(data.error); }
        else {
          setResults(data.results || []);
          setTotal(data.total || 0);
          setHasMore(data.hasMore || false);
          setPage(1);
        }
        setLoading(false);
      })
      .catch(() => { setError('Failed to fetch results.'); setLoading(false); });
  }, [type, q, filterParams, cacheKey, scrollKey]);

  // Load next page and append
  const loadMore = useCallback(() => {
    if (loadingRef.current || !hasMore) return;
    loadingRef.current = true;
    const nextPage = page + 1;
    setLoadingMore(true);

    fetch(buildUrl(API_BASE, type, q, nextPage, filterParams))
      .then(r => r.json())
      .then(data => {
        if (!data.error) {
          setResults(prev => {
            const updated = [...prev, ...(data.results || [])];
            try { sessionStorage.setItem(cacheKey, JSON.stringify({ results: updated, total, page: nextPage, hasMore: data.hasMore || false })); } catch {}
            return updated;
          });
          setPage(nextPage);
          setHasMore(data.hasMore || false);
        }
        setLoadingMore(false);
        loadingRef.current = false;
      })
      .catch(() => { setLoadingMore(false); loadingRef.current = false; });
  }, [hasMore, page, type, q, filterParams, cacheKey, total]);

  // IntersectionObserver — triggers loadMore when sentinel div is visible
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => { if (entries[0].isIntersecting) loadMore(); },
      { threshold: 0.1 }
    );
    const el = sentinelRef.current;
    if (el) observer.observe(el);
    return () => observer.disconnect();
  }, [loadMore]);

  function handleApplyFilter(fp) {
    setFilterParams(fp);
  }

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <button className={styles.backBtn} onClick={() => navigate('/')}>← Back</button>
        <span className={styles.breadcrumb}>
          <span className={styles.typeLabel}>{TYPE_LABELS[type]}</span>
          <span className={styles.queryLabel}>{q}</span>
        </span>
        {!loading && (
          <span className={styles.count}>
            {results.length < total
              ? `Showing ${results.length} of ${total} schools`
              : `${total} schools found`}
          </span>
        )}
      </div>

      <Filter onApply={handleApplyFilter} initialValues={filterParams} />

      <div className={styles.list}>
        {loading  && <p className={styles.msg}>Loading...</p>}
        {error    && <p className={styles.msg}>{error}</p>}
        {!loading && !error && results.length === 0 && (
          <p className={styles.msg}>No schools found.</p>
        )}

        {results.map(school => {
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
                    try {
                      sessionStorage.setItem(scrollKey, window.scrollY);
                      sessionStorage.setItem(cacheKey, JSON.stringify({ results, total, page, hasMore, filterParams }));
                    } catch {}
                    await fetch(`${API_BASE}/api/schools/${school._id}/lead`, { method: 'PATCH' });
                    const colPart = school._source ? `?col=${encodeURIComponent(school._source)}` : '';
                    navigate(`/school/${school._id}${colPart}`);
                  }}
                >
                  View Report Card →
                </button>
              </div>
            </div>
          );
        })}

        {loadingMore && <p className={styles.msg}>Loading more...</p>}
        {!loading && hasMore && <div ref={sentinelRef} style={{ height: 20 }} />}
      </div>
    </div>
  );
}
