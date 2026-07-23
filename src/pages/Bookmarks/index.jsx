import { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { API_BASE } from '../../constants/api';
import useAuthFetch from '../../hooks/useAuthFetch';
import useScrollReveal from '../../hooks/useScrollReveal';
import SearchHeader from '../../components/SearchHeader';
import HeaderMenu from '../../components/HeaderMenu';
import LeadCard from '../../components/LeadCard';
import styles from './Bookmarks.module.css';

const MENU_STYLE = { position: 'absolute', top: '110%', right: 0, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, boxShadow: '0 4px 16px rgba(0,0,0,0.12)', zIndex: 100, minWidth: 180, overflow: 'hidden' };
const SHARE_MENU_STYLE = { ...MENU_STYLE, minWidth: 260 };
const MENU_ITEM  = { display: 'block', width: '100%', padding: '10px 16px', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', fontSize: '0.85rem', color: '#dc2626' };

const SUBTITLE = "'विस्तार' मार्गदर्शेन, भारतं विश्वगौरवम्।\nयुगपुरुषाः युगरूपाश्च, शिक्षया सन्तु दीपिताः॥";
const SUBTITLE_EN = 'Guided by the vast vision of the Vistaar app, may Bharat rise to its destiny as a global leader by the year 2047. Through excellence in education, may our students—both young men and women—be illuminated as the architects and changemakers of this new era.';
const MODE_OPTIONS = [{ value: 'search', label: 'Search' }, { value: 'create', label: 'Create' }];

export default function Bookmarks() {
  const navigate      = useNavigate();
  const location      = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const apiFetch      = useAuthFetch();
  const reveal        = useScrollReveal();
  // restoreId from either URL param (refresh-safe) or navigation state (back from SchoolDetail)
  const restoreId     = searchParams.get('col') || location.state?.restoreCollection;

  const [loading,      setLoading]      = useState(true);

  // School bookmark collections
  const [cols,         setCols]         = useState([]);
  // Hydrate the opened collection from cache so back-nav renders instantly (no blank flash);
  // the background fetch below refreshes it with live data.
  const [selected,     setSelected]     = useState(() => {
    if (restoreId) {
      try { const c = sessionStorage.getItem(`bm_col_${restoreId}`); if (c) return JSON.parse(c); } catch {}
    }
    return null;
  });
  const [menuOpen,     setMenuOpen]     = useState(null);
  const firstSyncRef                    = useRef(true);
  const dragIndexRef                    = useRef(null);
  const [dragId,       setDragId]       = useState(null);
  const schoolDragIndexRef              = useRef(null);
  const [schoolDragId, setSchoolDragId] = useState(null);

  // Header search bar: Search (filter by name) / Create (make a collection)
  const [mode,         setMode]         = useState('search');
  const [query,        setQuery]        = useState('');
  const [appliedQuery, setAppliedQuery] = useState('');

  // In-collection school search (detail view)
  const [schoolQuery,   setSchoolQuery]   = useState('');
  const [schoolApplied, setSchoolApplied] = useState('');
  useEffect(() => { setSchoolQuery(''); setSchoolApplied(''); }, [selected?._id]);

  // Backfill class range (and other newer fields) for schools bookmarked before
  // this data was captured in the stored snapshot — fetch the live record for
  // any school in the open collection that's missing it.
  useEffect(() => {
    if (!selected) return;
    const missing = selected.schools.filter(s => s.lowestClass === undefined && s.highestClass === undefined);
    if (missing.length === 0) return;
    let cancelled = false;
    Promise.all(missing.map(s =>
      apiFetch(`${API_BASE}/api/schools/school/${s._id}`, { method: 'POST' })
        .then(r => r.ok ? r.json() : null)
        .catch(() => null)
    )).then(fetched => {
      if (cancelled) return;
      const byId = new Map();
      fetched.forEach((doc, i) => { if (doc) byId.set(missing[i]._id, doc); });
      if (byId.size === 0) return;
      const patch = (schools) => schools.map(s => {
        const doc = byId.get(s._id);
        return doc ? { ...s, lowestClass: doc.lowestClass ?? null, highestClass: doc.highestClass ?? null } : s;
      });
      setSelected(prev => prev ? { ...prev, schools: patch(prev.schools) } : prev);
      setCols(prev => prev.map(c => c._id === selected._id ? { ...c, schools: patch(c.schools) } : c));
    });
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected?._id]);

  // Broker sharing (collections are shared with brokers as a whole)
  const [brokers,      setBrokers]      = useState([]);
  const [sharing,      setSharing]      = useState(null); // broker email being toggled
  const [brokerFilter, setBrokerFilter] = useState('');

  useEffect(() => {
    apiFetch(`${API_BASE}/api/admin/brokers/list`, { method: 'POST' })
      .then(r => r.json())
      .then(d => setBrokers(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, [apiFetch]);

  // Sync with URL: when browser back removes ?col, go back to collections list.
  // Skip the first run so a cache-hydrated restore isn't cleared before the fetch sets ?col.
  useEffect(() => {
    if (firstSyncRef.current) { firstSyncRef.current = false; return; }
    if (!searchParams.get('col')) setSelected(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Fast scroll restore when the collection is hydrated from cache (no wait for the fetch).
  useEffect(() => {
    if (!restoreId || !selected) return;
    const savedY = sessionStorage.getItem(`bm_scroll_${restoreId}`);
    if (!savedY) return;
    const t = setTimeout(() => {
      window.scrollTo({ top: parseInt(savedY, 10), behavior: 'instant' });
      sessionStorage.removeItem(`bm_scroll_${restoreId}`);
    }, 60);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function toggleShareCol(col, broker) {
    const alreadyShared = (col.sharedWith || []).includes(broker.email);
    setSharing(broker.email);
    const endpoint = alreadyShared ? 'unshare' : 'share';
    try {
      await apiFetch(`${API_BASE}/api/schools/bookmarks/${col._id}/${endpoint}`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ brokerEmail: broker.email }),
      });
      setCols(prev => prev.map(c => {
        if (c._id !== col._id) return c;
        const sharedWith = alreadyShared
          ? (c.sharedWith || []).filter(e => e !== broker.email)
          : [...(c.sharedWith || []), broker.email];
        return { ...c, sharedWith };
      }));
    } catch {}
    setSharing(null);
  }

  useEffect(() => {
    apiFetch(`${API_BASE}/api/schools/bookmarks/list`, { method: 'POST' })
      .then(r => r.json())
      .then(data => {
        setCols(Array.isArray(data) ? data : []);
        if (restoreId) {
          const col = (data || []).find(c => c._id === restoreId);
          if (col) {
            setSelected(col);
            if (!searchParams.get('col')) setSearchParams({ col: col._id });
            // Restore scroll to the card the user opened before viewing the report
            const savedY = sessionStorage.getItem(`bm_scroll_${col._id}`);
            if (savedY) {
              setTimeout(() => {
                window.scrollTo({ top: parseInt(savedY, 10), behavior: 'instant' });
                sessionStorage.removeItem(`bm_scroll_${col._id}`);
              }, 60);
            }
          }
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restoreId, apiFetch]);

  // ── Header actions (Search / Create) ───────────────────────
  async function createColNamed(name) {
    const col = await apiFetch(`${API_BASE}/api/schools/bookmarks`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    }).then(r => r.json());
    setCols(prev => [...prev, col]);
  }

  function submitHeader() {
    if (mode === 'create') {
      const name = query.trim();
      if (!name) return;
      createColNamed(name);
      setQuery('');
    } else {
      setAppliedQuery(query.trim()); // filter on submit
    }
  }
  function headerKeyDown(e) { if (e.key === 'Enter') submitHeader(); }

  // ── School collection actions ──────────────────────────────
  async function deleteCol(id, name) {
    if (!window.confirm(`Do you really want to delete "${name}"?`)) return;
    await apiFetch(`${API_BASE}/api/schools/bookmarks/${id}`, { method: 'DELETE' });
    setCols(prev => prev.filter(c => c._id !== id));
    if (selected?._id === id) { setSelected(null); setSearchParams({}); }
  }

  async function removeSchool(colId, schoolId, schoolName) {
    if (!window.confirm(`Do you really want to remove "${schoolName}" from this collection?`)) return;
    await apiFetch(`${API_BASE}/api/schools/bookmarks/${colId}/schools/${schoolId}`, { method: 'DELETE' });
    const updated = (schools) => schools.filter(s => s._id !== schoolId);
    setCols(prev => prev.map(c => c._id === colId ? { ...c, schools: updated(c.schools) } : c));
    setSelected(prev => prev ? { ...prev, schools: updated(prev.schools) } : null);
  }

  // ── Drag-to-reorder collections ────────────────────────────
  function handleColDrop(toIndex) {
    const from = dragIndexRef.current;
    dragIndexRef.current = null;
    setDragId(null);
    if (from === null || from === toIndex) return;
    const next = [...cols];
    const [moved] = next.splice(from, 1);
    next.splice(toIndex, 0, moved);
    setCols(next);
    apiFetch(`${API_BASE}/api/schools/bookmarks/reorder`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: next.map(c => c._id) }),
    }).catch(() => {});
  }

  // Reorder the schools (leads) inside the currently-open collection.
  function handleSchoolDrop(toIndex) {
    const from = schoolDragIndexRef.current;
    schoolDragIndexRef.current = null;
    setSchoolDragId(null);
    if (from === null || from === toIndex || !selected) return;
    const next = [...selected.schools];
    const [moved] = next.splice(from, 1);
    next.splice(toIndex, 0, moved);
    setSelected(prev => ({ ...prev, schools: next }));
    setCols(prev => prev.map(c => c._id === selected._id ? { ...c, schools: next } : c));
    apiFetch(`${API_BASE}/api/schools/bookmarks/${selected._id}/schools/reorder`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ schoolIds: next.map(s => s._id) }),
    }).catch(() => {});
  }

  function toggleMenu(e, id) { e.stopPropagation(); setBrokerFilter(''); setMenuOpen(prev => prev === id ? null : id); }

  // ── School collection detail view ("All Leads" in a collection) ─────
  if (selected) {
    const applied = schoolApplied.trim().toLowerCase();
    const schoolFiltering = applied !== '';
    const detailSchools = schoolFiltering
      ? selected.schools.filter(s => (s.schoolName || '').toLowerCase().includes(applied))
      : selected.schools;

    return (
      <div className={styles.pageWrap}>
        <SearchHeader
          title="Vistaar"
          subtitle={SUBTITLE}
          tooltip={SUBTITLE_EN}
          onBack={() => { setSelected(null); setSearchParams({}); }}
          backLabel="← Collections"
          rightSlot={<HeaderMenu />}
          value={schoolQuery}
          onChange={setSchoolQuery}
          onKeyDown={e => { if (e.key === 'Enter') setSchoolApplied(schoolQuery.trim()); }}
          onSubmit={() => setSchoolApplied(schoolQuery.trim())}
          placeholder="Search schools in this collection…"
          icon="search"
        >
          <div className={styles.stats}>
            <div className={styles.statSeg}>
              <span className={styles.statNum}>{selected.schools.length}</span>
              <span className={styles.statLabel}>Schools</span>
            </div>
            <span className={styles.statDivider} />
            <div className={styles.statSeg}>
              <span className={styles.statName} title={selected.name}>{selected.name}</span>
              <span className={styles.statLabel}>Collection</span>
            </div>
            <span className={styles.statDivider} />
            <div className={styles.statSeg}>
              <span className={styles.statNum}>{detailSchools.length}</span>
              <span className={styles.statLabel}>FILTERED</span>
            </div>
          </div>
        </SearchHeader>

        {menuOpen && <div style={{ position: 'fixed', inset: 0, zIndex: 99 }} onClick={() => setMenuOpen(null)} />}
        <div className={styles.leadsList}>
            {detailSchools.length === 0 && (
              <p className={styles.msg}>{schoolFiltering ? `No schools match “${schoolApplied}”.` : 'No schools in this collection.'}</p>
            )}
            {detailSchools.map((school, index) => (
              <LeadCard
                key={school._id}
                ref={reveal}
                className="reveal"
                school={school}
                draggable={!schoolFiltering}
                onDragStart={() => { schoolDragIndexRef.current = index; setSchoolDragId(school._id); }}
                onDragOver={e => e.preventDefault()}
                onDrop={() => handleSchoolDrop(index)}
                onDragEnd={() => { schoolDragIndexRef.current = null; setSchoolDragId(null); }}
                style={{ cursor: schoolFiltering ? 'default' : 'grab', opacity: schoolDragId === school._id ? 0.4 : 1, animationDelay: `${(index % 12) * 45}ms` }}
                title={schoolFiltering ? undefined : 'Drag to reorder'}
                onView={() => {
                  try {
                    sessionStorage.setItem(`bm_scroll_${selected._id}`, String(window.scrollY));
                    sessionStorage.setItem(`bm_col_${selected._id}`, JSON.stringify(selected));
                  } catch {}
                  navigate(`/school/${school._id}`, { state: { fromBookmarks: true, collectionId: selected._id } });
                }}
                menu={
                  <div draggable={false} style={{ position: 'relative' }}>
                    <button aria-label={`Options for ${school.schoolName}`} onClick={e => toggleMenu(e, school._id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', padding: '0 6px', color: '#6b7280' }}>⋯</button>
                    {menuOpen === school._id && (
                      <div style={MENU_STYLE}>
                        <button style={MENU_ITEM} onClick={() => { setMenuOpen(null); removeSchool(selected._id, school._id, school.schoolName); }}>Remove from collection</button>
                      </div>
                    )}
                  </div>
                }
              />
            ))}
        </div>
      </div>
    );
  }

  // While loading and a collection is expected (refresh case), show nothing to avoid flicker
  if (loading && restoreId) return null;

  const filtering   = mode === 'search' && appliedQuery.trim() !== '';
  const visibleCols = filtering
    ? cols.filter(c => c.name.toLowerCase().includes(appliedQuery.trim().toLowerCase()))
    : cols;

  // Stats reflect the current (filtered) list — visibleCols === cols when no filter is applied.
  const totalSchools = visibleCols.reduce((s, c) => s + (c.schools?.length || 0), 0);
  const topCol       = visibleCols.reduce((m, c) => Math.max(m, c.schools?.length || 0), 0);

  // ── Collections list view ──────────────────────────────────
  return (
    <div className={styles.pageWrap}>
      <SearchHeader
        title="Vistaar"
        subtitle={SUBTITLE}
        tooltip={SUBTITLE_EN}
        onBack={() => navigate('/')}
        backLabel="← Back to Search"
        rightSlot={<HeaderMenu />}
        options={MODE_OPTIONS}
        mode={mode}
        onModeChange={v => { setMode(v); setQuery(''); setAppliedQuery(''); }}
        value={query}
        onChange={setQuery}
        onKeyDown={headerKeyDown}
        onSubmit={submitHeader}
        placeholder={mode === 'search' ? 'Search your collections by name…' : 'New collection name, then +'}
        icon={mode === 'create' ? 'plus' : 'search'}
      >
        <div className={styles.stats}>
          <div className={styles.statSeg}>
            <span className={styles.statNum}>{visibleCols.length}</span>
            <span className={styles.statLabel}>Collections</span>
          </div>
          <span className={styles.statDivider} />
          <div className={styles.statSeg}>
            <span className={styles.statNum}>{totalSchools}</span>
            <span className={styles.statLabel}>Bookmarked</span>
          </div>
          <span className={styles.statDivider} />
          <div className={styles.statSeg}>
            <span className={styles.statNum}>{topCol}</span>
            <span className={styles.statLabel}>Top Collection</span>
          </div>
        </div>
      </SearchHeader>

      <div className={styles.page}>
        {menuOpen && <div style={{ position: 'fixed', inset: 0, zIndex: 99 }} onClick={() => setMenuOpen(null)} />}
        <div className={styles.topBar}>
          <span className={styles.title}>Bookmarks</span>
          {filtering && <span className={styles.count}>{visibleCols.length} of {cols.length}</span>}
        </div>

        <div className={styles.colGrid}>
          {loading
            ? [...Array(3)].map((_, i) => (
                <div key={i} className={styles.colCard} style={{ cursor: 'default' }}>
                  <div>
                    <div className={styles.skel} style={{ height: 14, width: '55%', marginBottom: 8 }} />
                    <div className={styles.skel} style={{ height: 11, width: '30%' }} />
                  </div>
                </div>
              ))
            : cols.length === 0
              ? <p className={styles.msg}>No collections yet. Switch the dropdown to “Create” to add one.</p>
              : visibleCols.length === 0
                ? <p className={styles.msg}>No collections match “{appliedQuery}”.</p>
                : visibleCols.map((col, index) => (
                    <div
                      key={col._id}
                      className={styles.colCard}
                      draggable={!filtering}
                      onDragStart={() => { dragIndexRef.current = index; setDragId(col._id); }}
                      onDragOver={e => e.preventDefault()}
                      onDrop={() => handleColDrop(index)}
                      onDragEnd={() => { dragIndexRef.current = null; setDragId(null); }}
                      onClick={() => { setSelected(col); setSearchParams({ col: col._id }); }}
                      style={{ cursor: filtering ? 'pointer' : 'grab', opacity: dragId === col._id ? 0.4 : 1, zIndex: menuOpen === col._id ? 200 : undefined }}
                      title={filtering ? undefined : 'Drag to reorder'}
                    >
                      <div>
                        <p className={styles.colName}>{col.name}</p>
                        <p className={styles.colCount}>{col.schools.length} schools</p>
                      </div>
                      <div draggable={false} style={{ position: 'relative', flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                        <button aria-label={`Options for ${col.name}`} onClick={e => toggleMenu(e, col._id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', padding: '0 6px', color: '#6b7280' }}>⋯</button>
                        {menuOpen === col._id && (
                          <div style={SHARE_MENU_STYLE}>
                            <p style={{ padding: '12px 16px 8px', fontSize: '0.75rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Share with broker</p>
                            {brokers.length === 0 ? (
                              <span style={{ display: 'block', padding: '0 16px 10px', fontSize: '0.82rem', color: '#9ca3af' }}>No brokers yet</span>
                            ) : (() => {
                              const f = brokerFilter.trim().toLowerCase();
                              const shownBrokers = f
                                ? brokers.filter(b => (b.name || '').toLowerCase().includes(f) || (b.email || '').toLowerCase().includes(f))
                                : brokers;
                              return (
                                <>
                                  {brokers.length > 6 && (
                                    <div style={{ padding: '0 12px 8px' }}>
                                      <input
                                        aria-label="Search brokers"
                                        value={brokerFilter}
                                        onChange={e => setBrokerFilter(e.target.value)}
                                        placeholder="Search brokers…"
                                        style={{ width: '100%', padding: '7px 10px', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: '0.8rem', outline: 'none' }}
                                      />
                                    </div>
                                  )}
                                  <div style={{ maxHeight: 220, overflowY: 'auto' }}>
                                    {shownBrokers.map(broker => {
                                      const shared = (col.sharedWith || []).includes(broker.email);
                                      return (
                                        <button
                                          key={broker._id}
                                          disabled={sharing === broker.email}
                                          onClick={() => toggleShareCol(col, broker)}
                                          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '8px 16px', background: shared ? '#f5f3ff' : 'none', border: 'none', cursor: 'pointer', gap: 8, opacity: sharing === broker.email ? 0.6 : 1 }}
                                        >
                                          <span style={{ fontSize: '0.85rem', color: '#374151', textAlign: 'left', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{broker.name}</span>
                                          <span style={{ fontSize: '0.72rem', fontWeight: 600, color: shared ? '#7c3aed' : '#94a3b8', flexShrink: 0 }}>
                                            {sharing === broker.email ? '…' : shared ? '✓ Shared' : '+ Share'}
                                          </span>
                                        </button>
                                      );
                                    })}
                                    {shownBrokers.length === 0 && <span style={{ display: 'block', padding: '6px 16px', fontSize: '0.8rem', color: '#9ca3af' }}>No matches.</span>}
                                  </div>
                                </>
                              );
                            })()}
                            <div style={{ borderTop: '1px solid #f3f4f6', marginTop: 4 }}>
                              {col.schools.length === 0
                                ? <button style={{ ...MENU_ITEM, width: '100%' }} onClick={() => { setMenuOpen(null); deleteCol(col._id, col.name); }}>Delete collection</button>
                                : <span style={{ display: 'block', padding: '10px 16px', fontSize: '0.82rem', color: '#9ca3af' }}>Remove all schools first</span>
                              }
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
          }
        </div>
      </div>
    </div>
  );
}
