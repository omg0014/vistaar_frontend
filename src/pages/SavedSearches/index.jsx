import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE } from '../../constants/api';
import { TYPE_LABELS } from '../../constants/searchTypes';
import useAuthFetch from '../../hooks/useAuthFetch';
import SearchHeader from '../../components/SearchHeader';
import HeaderMenu from '../../components/HeaderMenu';
import styles from '../Bookmarks/Bookmarks.module.css';

const MENU_STYLE = { position: 'absolute', top: '110%', right: 0, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, boxShadow: '0 4px 16px rgba(0,0,0,0.12)', zIndex: 100, minWidth: 180, overflow: 'hidden' };
const MENU_ITEM  = { display: 'block', width: '100%', padding: '10px 16px', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', fontSize: '0.85rem', color: '#dc2626' };

const SUBTITLE = "'विस्तार' मार्गदर्शेन, भारतं विश्वगौरवम्।\nयुगपुरुषाः युगरूपाश्च, शिक्षया सन्तु दीपिताः॥";
const SUBTITLE_EN = 'Guided by the vast vision of the Vistaar app, may Bharat rise to its destiny as a global leader by the year 2047. Through excellence in education, may our students—both young men and women—be illuminated as the architects and changemakers of this new era.';
const MODE_OPTIONS = [{ value: 'search', label: 'Search' }, { value: 'create', label: 'Create' }];

const SORT_LABELS = { teachers: 'Teachers', students: 'Students', efficiency: 'Efficiency' };

function filterTags(filters) {
  const f = filters || {};
  const tags = [];
  if (f.min1 || f.max1) tags.push(`Teachers: ${f.min1 && f.max1 ? `${f.min1}–${f.max1}` : f.min1 ? `≥${f.min1}` : `≤${f.max1}`}`);
  if (f.min2 || f.max2) tags.push(`Students: ${f.min2 && f.max2 ? `${f.min2}–${f.max2}` : f.min2 ? `≥${f.min2}` : `≤${f.max2}`}`);
  if (f.min3 || f.max3) tags.push(`Efficiency: ${f.min3 && f.max3 ? `${f.min3}–${f.max3}%` : f.min3 ? `≥${f.min3}%` : `≤${f.max3}%`}`);
  if (f.sortBy) tags.push(`Sort: ${SORT_LABELS[f.sortBy] || f.sortBy} ${f.sortOrder === 'desc' ? '↓' : '↑'}`);
  if (f.fCity)     tags.push(`City: ${f.fCity}`);
  if (f.fDistrict) tags.push(`District: ${f.fDistrict}`);
  if (f.fState)    tags.push(`State: ${f.fState}`);
  if (f.fPin)      tags.push(`Pincode: ${f.fPin}`);
  if (f.fArea)     tags.push(`Area: ${f.fArea}`);
  if (f.fName)     tags.push(`School: ${f.fName}`);
  return tags;
}

export default function SavedSearches() {
  const navigate = useNavigate();
  const apiFetch = useAuthFetch();

  const [loading,    setLoading]    = useState(true);
  const [scCols,     setScCols]     = useState([]);
  const [scSelected, setScSelected] = useState(null);
  const [scMenuOpen, setScMenuOpen] = useState(null);
  const [scSrchMenu, setScSrchMenu] = useState(null);

  const [mode,         setMode]         = useState('search');
  const [query,        setQuery]        = useState('');
  const [appliedQuery, setAppliedQuery] = useState('');

  useEffect(() => {
    apiFetch(`${API_BASE}/api/schools/search-collections/list`, { method: 'POST' })
      .then(r => r.json())
      .then(d => { setScCols(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [apiFetch]);

  async function createScColNamed(name) {
    const col = await apiFetch(`${API_BASE}/api/schools/search-collections`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    }).then(r => r.json());
    setScCols(prev => [...prev, col]);
  }

  function submitHeader() {
    if (mode === 'create') {
      const name = query.trim();
      if (!name) return;
      createScColNamed(name);
      setQuery('');
    } else {
      setAppliedQuery(query.trim());
    }
  }
  function headerKeyDown(e) { if (e.key === 'Enter') submitHeader(); }

  async function deleteScCol(id, name) {
    if (!window.confirm(`Do you really want to delete "${name}"?`)) return;
    await apiFetch(`${API_BASE}/api/schools/search-collections/${id}`, { method: 'DELETE' });
    setScCols(prev => prev.filter(c => c._id !== id));
    if (scSelected?._id === id) setScSelected(null);
  }

  async function removeSearch(colId, searchId) {
    await apiFetch(`${API_BASE}/api/schools/search-collections/${colId}/searches/${searchId}`, { method: 'DELETE' });
    const updated = (searches) => searches.filter(s => s._id !== searchId);
    setScCols(prev => prev.map(c => c._id === colId ? { ...c, searches: updated(c.searches || []) } : c));
    setScSelected(prev => prev ? { ...prev, searches: updated(prev.searches || []) } : null);
  }

  function runSearch(s) {
    sessionStorage.removeItem(`rc_${s.type}_${s.q}`);
    const qs = new URLSearchParams({ type: s.type, q: s.q, ...s.filters }).toString();
    navigate(`/results?${qs}`);
  }

  function toggleScMenu(e, id) { e.stopPropagation(); setScMenuOpen(prev => prev === id ? null : id); }
  function toggleScSrchMenu(e, id) { e.stopPropagation(); setScSrchMenu(prev => prev === id ? null : id); }

  // ── Saved-search detail view ───────────────────────────────
  if (scSelected) {
    return (
      <div className={styles.page}>
        {scSrchMenu && <div style={{ position: 'fixed', inset: 0, zIndex: 99 }} onClick={() => setScSrchMenu(null)} />}
        <div className={styles.topBar}>
          <button className={styles.backBtn} onClick={() => setScSelected(null)}>← Saved Searches</button>
          <span className={styles.title}>{scSelected.name}</span>
          <span className={styles.count}>{(scSelected.searches || []).length} searches</span>
        </div>
        <div className={styles.list}>
          {(scSelected.searches || []).length === 0 && <p className={styles.msg}>No searches in this collection.</p>}
          {(scSelected.searches || []).map(s => {
            const tags = filterTags(s.filters);
            return (
              <div key={s._id} className={styles.card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h2 className={styles.schoolName}>{TYPE_LABELS[s.type] || s.type}: "{s.q}"</h2>
                    {tags.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
                        {tags.map(tag => (
                          <span key={tag} style={{ fontSize: '0.72rem', background: '#ede9fe', color: '#7c3aed', borderRadius: 20, padding: '3px 10px', fontWeight: 600, whiteSpace: 'nowrap' }}>{tag}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    <button aria-label={`Options for saved search "${s.q}"`} onClick={e => toggleScSrchMenu(e, s._id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', padding: '0 6px', color: '#6b7280' }}>⋯</button>
                    {scSrchMenu === s._id && (
                      <div style={MENU_STYLE}>
                        <button style={MENU_ITEM} onClick={() => { setScSrchMenu(null); removeSearch(scSelected._id, s._id); }}>Delete</button>
                      </div>
                    )}
                  </div>
                </div>
                <div className={styles.cardBottom}>
                  <button className={styles.viewBtn} onClick={() => runSearch(s)}>▶ Run Search</button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  const filtering = mode === 'search' && appliedQuery.trim() !== '';
  const visible   = filtering
    ? scCols.filter(c => c.name.toLowerCase().includes(appliedQuery.trim().toLowerCase()))
    : scCols;

  // ── Saved-search collections list ──────────────────────────
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
        placeholder={mode === 'search' ? 'Search your saved-search collections…' : 'New search collection name, then +'}
        icon={mode === 'create' ? 'plus' : 'search'}
      />

      <div className={styles.page}>
        {scMenuOpen && <div style={{ position: 'fixed', inset: 0, zIndex: 99 }} onClick={() => setScMenuOpen(null)} />}
        <div className={styles.topBar}>
          <span className={styles.title}>Saved Searches</span>
          {filtering && <span className={styles.count}>{visible.length} of {scCols.length}</span>}
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
            : scCols.length === 0
              ? <p className={styles.msg}>No search collections yet. Switch the dropdown to “Create” to add one.</p>
              : visible.length === 0
                ? <p className={styles.msg}>No collections match “{appliedQuery}”.</p>
                : visible.map(col => (
                    <div key={col._id} className={styles.colCard} onClick={() => setScSelected(col)}>
                      <div>
                        <p className={styles.colName}>{col.name}</p>
                        <p className={styles.colCount}>{(col.searches || []).length} searches</p>
                      </div>
                      <div style={{ position: 'relative', flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                        <button aria-label={`Options for ${col.name}`} onClick={e => toggleScMenu(e, col._id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', padding: '0 6px', color: '#6b7280' }}>⋯</button>
                        {scMenuOpen === col._id && (
                          <div style={MENU_STYLE}>
                            {(col.searches || []).length === 0
                              ? <button style={MENU_ITEM} onClick={() => { setScMenuOpen(null); deleteScCol(col._id, col.name); }}>Delete collection</button>
                              : <span style={{ display: 'block', padding: '10px 16px', fontSize: '0.82rem', color: '#9ca3af' }}>Remove all searches first</span>
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
