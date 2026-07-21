import { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { API_BASE } from '../../constants/api';
import useAuthFetch from '../../hooks/useAuthFetch';
import SearchHeader from '../../components/SearchHeader';
import HeaderMenu from '../../components/HeaderMenu';
import styles from './Bookmarks.module.css';

const MENU_STYLE = { position: 'absolute', top: '110%', right: 0, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, boxShadow: '0 4px 16px rgba(0,0,0,0.12)', zIndex: 100, minWidth: 180, overflow: 'hidden' };
const MENU_ITEM  = { display: 'block', width: '100%', padding: '10px 16px', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', fontSize: '0.85rem', color: '#dc2626' };

const SUBTITLE = "'विस्तार' मार्गदर्शेन, भारतं विश्वगौरवम्।\nयुगपुरुषाः युगरूपाश्च, शिक्षया सन्तु दीपिताः॥";
const SUBTITLE_EN = 'Guided by the vast vision of the Vistaar app, may Bharat rise to its destiny as a global leader by the year 2047. Through excellence in education, may our students—both young men and women—be illuminated as the architects and changemakers of this new era.';
const MODE_OPTIONS = [{ value: 'search', label: 'Search' }, { value: 'create', label: 'Create' }];

export default function Bookmarks() {
  const navigate      = useNavigate();
  const location      = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const apiFetch      = useAuthFetch();
  // restoreId from either URL param (refresh-safe) or navigation state (back from SchoolDetail)
  const restoreId     = searchParams.get('col') || location.state?.restoreCollection;

  const [loading,      setLoading]      = useState(true);

  // School bookmark collections
  const [cols,         setCols]         = useState([]);
  const [selected,     setSelected]     = useState(null);
  const [menuOpen,     setMenuOpen]     = useState(null);
  const dragIndexRef                    = useRef(null);
  const [dragId,       setDragId]       = useState(null);
  const schoolDragIndexRef              = useRef(null);
  const [schoolDragId, setSchoolDragId] = useState(null);

  // Header search bar: Search (filter by name) / Create (make a collection)
  const [mode,         setMode]         = useState('search');
  const [query,        setQuery]        = useState('');
  const [appliedQuery, setAppliedQuery] = useState('');

  // Broker sharing (collections are shared with brokers as a whole)
  const [brokers,      setBrokers]      = useState([]);
  const [sharing,      setSharing]      = useState(null); // broker email being toggled

  useEffect(() => {
    apiFetch(`${API_BASE}/api/admin/brokers/list`, { method: 'POST' })
      .then(r => r.json())
      .then(d => setBrokers(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, [apiFetch]);

  // Sync with URL: when browser back removes ?col, go back to collections list
  useEffect(() => {
    if (!searchParams.get('col')) setSelected(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

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

  function toggleMenu(e, id) { e.stopPropagation(); setMenuOpen(prev => prev === id ? null : id); }

  // ── School collection detail view ──────────────────────────
  if (selected) {
    return (
      <div className={styles.page}>
        {menuOpen && <div style={{ position: 'fixed', inset: 0, zIndex: 99 }} onClick={() => setMenuOpen(null)} />}
        <div className={styles.topBar}>
          {selected.schools.length === 0
            ? <button className={styles.backBtn} onClick={() => navigate('/')}>← Back to Search</button>
            : <button className={styles.backBtn} onClick={() => { setSelected(null); setSearchParams({}); }}>← Collections</button>
          }
          <span className={styles.title}>{selected.name}</span>
          <span className={styles.count}>{selected.schools.length} schools</span>
        </div>
        <div className={styles.list}>
          {selected.schools.length === 0 && <p className={styles.msg}>No schools in this collection.</p>}
          {selected.schools.map((school, index) => (
            <div
              key={school._id}
              className={styles.card}
              draggable
              onDragStart={() => { schoolDragIndexRef.current = index; setSchoolDragId(school._id); }}
              onDragOver={e => e.preventDefault()}
              onDrop={() => handleSchoolDrop(index)}
              onDragEnd={() => { schoolDragIndexRef.current = null; setSchoolDragId(null); }}
              style={{ cursor: 'grab', opacity: schoolDragId === school._id ? 0.4 : 1 }}
              title="Drag to reorder"
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <h2 className={styles.schoolName}>{school.schoolName}</h2>
                <div draggable={false} style={{ position: 'relative', flexShrink: 0 }}>
                  <button aria-label={`Options for ${school.schoolName}`} onClick={e => toggleMenu(e, school._id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', padding: '0 6px', color: '#6b7280' }}>⋯</button>
                  {menuOpen === school._id && (
                    <div style={MENU_STYLE}>
                      <button style={MENU_ITEM} onClick={() => { setMenuOpen(null); removeSchool(selected._id, school._id, school.schoolName); }}>Remove from collection</button>
                    </div>
                  )}
                </div>
              </div>
              <p className={styles.location}>{[school.district, school.state].filter(Boolean).join(', ')}</p>
              <div className={styles.cardMeta}>
                {school.totalStudents != null && <span>🎓 {school.totalStudents} students</span>}
                {school.totalTeachers != null && <span>👩‍🏫 {school.totalTeachers} teachers</span>}
              </div>
              <div className={styles.cardBottom}>
                <button className={styles.viewBtn} onClick={() => navigate(`/school/${school._id}`, { state: { fromBookmarks: true, collectionId: selected._id } })}>View Report Card →</button>
              </div>
            </div>
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
      />

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
                      style={{ cursor: filtering ? 'pointer' : 'grab', opacity: dragId === col._id ? 0.4 : 1 }}
                      title={filtering ? undefined : 'Drag to reorder'}
                    >
                      <div>
                        <p className={styles.colName}>{col.name}</p>
                        <p className={styles.colCount}>{col.schools.length} schools</p>
                      </div>
                      <div draggable={false} style={{ position: 'relative', flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                        <button aria-label={`Options for ${col.name}`} onClick={e => toggleMenu(e, col._id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', padding: '0 6px', color: '#6b7280' }}>⋯</button>
                        {menuOpen === col._id && (
                          <div style={MENU_STYLE}>
                            <p style={{ padding: '10px 16px 6px', fontSize: '0.75rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Share with broker</p>
                            {brokers.length === 0
                              ? <span style={{ display: 'block', padding: '0 16px 10px', fontSize: '0.82rem', color: '#9ca3af' }}>No brokers yet</span>
                              : brokers.map(broker => {
                                  const shared = (col.sharedWith || []).includes(broker.email);
                                  return (
                                    <button
                                      key={broker._id}
                                      disabled={sharing === broker.email}
                                      onClick={() => toggleShareCol(col, broker)}
                                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '8px 16px', background: shared ? '#f5f3ff' : 'none', border: 'none', cursor: 'pointer', gap: 8, opacity: sharing === broker.email ? 0.6 : 1 }}
                                    >
                                      <span style={{ fontSize: '0.85rem', color: '#374151', textAlign: 'left', flex: 1 }}>{broker.name}</span>
                                      <span style={{ fontSize: '0.72rem', fontWeight: 600, color: shared ? '#7c3aed' : '#94a3b8', flexShrink: 0 }}>
                                        {sharing === broker.email ? '…' : shared ? '✓ Shared' : '+ Share'}
                                      </span>
                                    </button>
                                  );
                                })
                            }
                            <div style={{ borderTop: '1px solid #f3f4f6', marginTop: 4 }} />
                            {col.schools.length === 0
                              ? <button style={MENU_ITEM} onClick={() => { setMenuOpen(null); deleteCol(col._id, col.name); }}>Delete collection</button>
                              : <span style={{ display: 'block', padding: '10px 16px', fontSize: '0.82rem', color: '#9ca3af' }}>Remove all schools first</span>
                            }
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
