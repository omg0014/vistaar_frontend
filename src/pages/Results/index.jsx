import { useEffect, useState, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { API_BASE } from '../../constants/api';
import { TYPE_LABELS } from '../../constants/searchTypes';
import useAuthFetch from '../../hooks/useAuthFetch';
import Filter from './Filter';
import styles from './Results.module.css';
import { calcEfficiency } from '../../utils/efficiency';
import EfficiencyBadge from '../../components/EfficiencyBadge';
import CardActionsMenu from '../../components/CardActionsMenu';
import SearchHeader from '../../components/SearchHeader';
import HeaderMenu from '../../components/HeaderMenu';

const LIMIT = 10;
const SUBTITLE = "'विस्तार' मार्गदर्शेन, भारतं विश्वगौरवम्।\nयुगपुरुषाः युगरूपाश्च, शिक्षया सन्तु दीपिताः॥";
const SUBTITLE_EN = 'Guided by the vast vision of the Vistaar app, may Bharat rise to its destiny as a global leader by the year 2047. Through excellence in education, may our students—both young men and women—be illuminated as the architects and changemakers of this new era.';

function buildBody(type, q, page, filterParams) {
  return { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type, q, page, limit: LIMIT, ...filterParams }) };
}

export default function Results() {
  const [params]   = useSearchParams();
  const navigate   = useNavigate();
  const apiFetch   = useAuthFetch();
  const type       = params.get('type') || 'schoolName';
  const q          = params.get('q') || '';
  const cacheKey   = `rc_${type}_${q}`;
  const scrollKey  = `rs_${type}_${q}`;

  // Init filterParams from cache (Back nav) or URL params (saved search replay)
  const [filterParams, setFilterParams] = useState(() => {
    try {
      const cached = sessionStorage.getItem(`rc_${params.get('type') || 'schoolName'}_${params.get('q') || ''}`);
      if (cached) return JSON.parse(cached).filterParams || {};
    } catch {}
    const urlFilters = {};
    const excluded = new Set(['type', 'q', 'page', 'limit']);
    params.forEach((v, k) => { if (!excluded.has(k)) urlFilters[k] = v; });
    return urlFilters;
  });

  const [results,     setResults]     = useState([]);
  const [total,       setTotal]       = useState(0);
  const [page,        setPage]        = useState(1);
  const [hasMore,     setHasMore]     = useState(false);
  const [loading,     setLoading]     = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error,       setError]       = useState('');
  const [saveOpen,    setSaveOpen]    = useState(false);
  const [scCols,      setScCols]      = useState([]);
  const [scNewCol,    setScNewCol]    = useState('');


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

    apiFetch(`${API_BASE}/api/schools/search`, buildBody(type, q, 1, filterParams))
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
  }, [type, q, filterParams, cacheKey, scrollKey, apiFetch]);

  // Load next page and append
  const loadMore = useCallback(() => {
    if (loadingRef.current || !hasMore) return;
    loadingRef.current = true;
    const nextPage = page + 1;
    setLoadingMore(true);

    apiFetch(`${API_BASE}/api/schools/search`, buildBody(type, q, nextPage, filterParams))
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
  }, [hasMore, page, type, q, filterParams, cacheKey, total, apiFetch]);

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

  function filtersKey(f) {
    return JSON.stringify(Object.fromEntries(Object.entries(f || {}).filter(([, v]) => v !== '').sort()));
  }

  function openSaveSearch() {
    if (scCols.length === 0) {
      apiFetch(`${API_BASE}/api/schools/search-collections/list`, { method: 'POST' }).then(r => r.json()).then(setScCols).catch(() => {});
    }
    setSaveOpen(p => !p);
  }

  async function toggleScCol(col) {
    const existing = (col.searches || []).find(s => s.type === type && s.q === q && filtersKey(s.filters) === filtersKey(filterParams));
    if (existing) {
      await apiFetch(`${API_BASE}/api/schools/search-collections/${col._id}/searches/${existing._id}`, { method: 'DELETE' });
      setScCols(prev => prev.map(c => c._id === col._id ? { ...c, searches: (c.searches || []).filter(s => s._id !== existing._id) } : c));
    } else {
      const res = await apiFetch(`${API_BASE}/api/schools/search-collections/${col._id}/searches`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, q, filters: filterParams }),
      }).then(r => r.json());
      setScCols(prev => prev.map(c => c._id === col._id ? { ...c, searches: [...(c.searches || []), res.search] } : c));
    }
  }

  async function createScCol() {
    if (!scNewCol.trim()) return;
    const col = await apiFetch(`${API_BASE}/api/schools/search-collections`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: scNewCol.trim() }),
    }).then(r => r.json());
    setScNewCol('');
    await apiFetch(`${API_BASE}/api/schools/search-collections/${col._id}/searches`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, q, filters: filterParams }),
    });
    setScCols(prev => [...prev, { ...col, searches: [{ type, q }] }]);
    setSaveOpen(false);
  }

  return (
    <div className={styles.page}>
      <SearchHeader
        title="Vistaar"
        subtitle={SUBTITLE}
        tooltip={SUBTITLE_EN}
        onBack={() => navigate('/')}
        backLabel="← Back to Search"
        rightSlot={<HeaderMenu />}
      >
        <div className={styles.filterCard}>
          <Filter onApply={handleApplyFilter} initialValues={filterParams} type={type} />
        </div>

        <div className={styles.summary}>
          <div className={styles.sumSeg}>
            <span className={styles.sumNum}>{loading ? '…' : total.toLocaleString('en-IN')}</span>
            <span className={styles.sumLabel}>Schools</span>
          </div>
          <span className={styles.sumDivider} />
          <div className={styles.sumSeg}>
            <span className={styles.sumVal} title={q}>{q}</span>
            <span className={styles.sumLabel}>{TYPE_LABELS[type]}</span>
          </div>
          <span className={styles.sumDivider} />
          <div className={styles.saveWrap}>
            <button className={styles.saveBtn} aria-label="Save this search" onClick={openSaveSearch}>
              Save Search
            </button>
            {saveOpen && (
              <>
                <div style={{ position: 'fixed', inset: 0, zIndex: 99 }} onClick={() => setSaveOpen(false)} />
                <div style={{ position: 'absolute', top: '110%', right: 0, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 16, zIndex: 100, minWidth: 240, boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>
                  <p style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: 12, color: '#374151' }}>Save to Search Collection</p>
                  {scCols.length === 0 && <p style={{ fontSize: '0.8rem', color: '#9ca3af', marginBottom: 12 }}>No search collections yet</p>}
                  {scCols.map(col => {
                    const inCol = (col.searches || []).some(s => s.type === type && s.q === q && filtersKey(s.filters) === filtersKey(filterParams));
                    return (
                      <div key={col._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f3f4f6' }}>
                        <span style={{ fontSize: '0.85rem', color: '#374151' }}>{col.name} <span style={{ color: '#9ca3af' }}>({(col.searches || []).length})</span></span>
                        <button onClick={() => toggleScCol(col)} style={{ padding: '4px 10px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: '0.78rem', background: inCol ? '#fee2e2' : '#ede9fe', color: inCol ? '#dc2626' : '#7c3aed', fontWeight: 600 }}>
                          {inCol ? 'Remove' : '+ Add'}
                        </button>
                      </div>
                    );
                  })}
                  <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                    <input style={{ flex: 1, padding: '6px 10px', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: '0.82rem', outline: 'none' }} placeholder="New collection..." value={scNewCol} onChange={e => setScNewCol(e.target.value)} onKeyDown={e => e.key === 'Enter' && createScCol()} />
                    <button onClick={createScCol} style={{ padding: '6px 12px', background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 }}>+</button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </SearchHeader>

      <div className={styles.list}>
        {loading && [...Array(5)].map((_, i) => (
          <div key={i} className={styles.card}>
            <div className={styles.cardTop}>
              <div className={styles.skel} style={{ height: 16, width: '65%' }} />
              <div className={styles.skel} style={{ height: 22, width: 60, borderRadius: 6 }} />
            </div>
            <div className={styles.skel} style={{ height: 13, width: '50%' }} />
            <div className={styles.skel} style={{ height: 13, width: '40%' }} />
            <div className={styles.cardMeta}>
              <div className={styles.skel} style={{ height: 26, width: 110, borderRadius: 6 }} />
              <div className={styles.skel} style={{ height: 26, width: 100, borderRadius: 6 }} />
            </div>
            <div className={styles.cardBottom}>
              <div className={styles.skel} style={{ height: 13, width: 80 }} />
              <div className={styles.skel} style={{ height: 34, width: 140, borderRadius: 8 }} />
            </div>
          </div>
        ))}
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
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {school._source && <span className={styles.region}>{school._source}</span>}
                  <CardActionsMenu school={school} />
                </div>
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
                <EfficiencyBadge value={eff} className={styles.badge} />
              </div>

              <div className={styles.cardBottom}>
                {school.pincode && <span className={styles.pincode}>📍 {school.pincode}</span>}
                <div className={styles.cardActions}>
                  <button
                    className={styles.viewBtn}
                    onClick={async () => {
                      try {
                        sessionStorage.setItem(scrollKey, window.scrollY);
                        sessionStorage.setItem(cacheKey, JSON.stringify({ results, total, page, hasMore, filterParams }));
                      } catch {}
                      await apiFetch(`${API_BASE}/api/schools/${school._id}/lead`, { method: 'PATCH' });
                      const colPart = school._source ? `?col=${encodeURIComponent(school._source)}` : '';
                      navigate(`/school/${school._id}${colPart}`, { state: { fromResults: true } });
                    }}
                  >
                    View Report Card →
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {loadingMore && <p className={styles.msg}>Loading more...</p>}
        {!loading && hasMore && <div ref={sentinelRef} style={{ height: 20, gridColumn: '1 / -1' }} />}
      </div>
    </div>
  );
}
