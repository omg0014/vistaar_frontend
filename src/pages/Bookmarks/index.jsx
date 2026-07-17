import { useEffect, useState } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { API_BASE } from '../../constants/api';
import { TYPE_LABELS } from '../../constants/searchTypes';
import useAuthFetch from '../../hooks/useAuthFetch';
import styles from './Bookmarks.module.css';

const MENU_STYLE = { position: 'absolute', top: '110%', right: 0, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, boxShadow: '0 4px 16px rgba(0,0,0,0.12)', zIndex: 100, minWidth: 180, overflow: 'hidden' };
const MENU_ITEM  = { display: 'block', width: '100%', padding: '10px 16px', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', fontSize: '0.85rem', color: '#dc2626' };

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

export default function Bookmarks() {
  const navigate      = useNavigate();
  const location      = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const apiFetch      = useAuthFetch();
  // restoreId from either URL param (refresh-safe) or navigation state (back from SchoolDetail)
  const restoreId     = searchParams.get('col') || location.state?.restoreCollection;

  const [loading,      setLoading]      = useState(true);
  const [activeTab,    setActiveTab]    = useState('collections');

  // School bookmark collections
  const [cols,         setCols]         = useState([]);
  const [selected,     setSelected]     = useState(null);
  const [newName,      setNewName]      = useState('');
  const [menuOpen,     setMenuOpen]     = useState(null);

  // Search collections
  const [scCols,       setScCols]       = useState([]);
  const [scSelected,   setScSelected]   = useState(null);
  const [scNewName,    setScNewName]    = useState('');
  const [scMenuOpen,   setScMenuOpen]   = useState(null);
  const [scSrchMenu,   setScSrchMenu]   = useState(null);

  useEffect(() => {
    let done = 0;
    function checkDone() { if (++done === 2) setLoading(false); }

    apiFetch(`${API_BASE}/api/schools/bookmarks/list`, { method: 'POST' })
      .then(r => r.json())
      .then(data => {
        setCols(data);
        if (restoreId) {
          const col = data.find(c => c._id === restoreId);
          if (col) setSelected(col);
        }
        checkDone();
      })
      .catch(() => checkDone());

    apiFetch(`${API_BASE}/api/schools/search-collections/list`, { method: 'POST' })
      .then(r => r.json())
      .then(d => { setScCols(d); checkDone(); })
      .catch(() => checkDone());
  }, [restoreId, apiFetch]);

  // ── School collection actions ──────────────────────────────
  async function createCol() {
    if (!newName.trim()) return;
    const col = await apiFetch(`${API_BASE}/api/schools/bookmarks`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName.trim() }),
    }).then(r => r.json());
    setNewName('');
    setCols(prev => [...prev, col]);
  }

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

  // ── Search collection actions ──────────────────────────────
  async function createScCol() {
    if (!scNewName.trim()) return;
    const col = await apiFetch(`${API_BASE}/api/schools/search-collections`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: scNewName.trim() }),
    }).then(r => r.json());
    setScNewName('');
    setScCols(prev => [...prev, col]);
  }

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

  function toggleMenu(e, id) { e.stopPropagation(); setMenuOpen(prev => prev === id ? null : id); }
  function toggleScMenu(e, id) { e.stopPropagation(); setScMenuOpen(prev => prev === id ? null : id); }
  function toggleScSrchMenu(e, id) { e.stopPropagation(); setScSrchMenu(prev => prev === id ? null : id); }

  const anyMenu = menuOpen || scMenuOpen || scSrchMenu;

  // ── School collection detail view ──────────────────────────
  if (selected) {
    return (
      <div className={styles.page}>
        {menuOpen && <div style={{ position: 'fixed', inset: 0, zIndex: 99 }} onClick={() => setMenuOpen(null)} />}
        <div className={styles.topBar}>
          <button className={styles.backBtn} onClick={() => { setSelected(null); setSearchParams({}); }}>← Collections</button>
          <span className={styles.title}>{selected.name}</span>
          <span className={styles.count}>{selected.schools.length} schools</span>
        </div>
        <div className={styles.list}>
          {selected.schools.length === 0 && <p className={styles.msg}>No schools in this collection.</p>}
          {selected.schools.map(school => (
            <div key={school._id} className={styles.card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <h2 className={styles.schoolName}>{school.schoolName}</h2>
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <button onClick={e => toggleMenu(e, school._id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', padding: '0 6px', color: '#6b7280' }}>⋯</button>
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

  // ── Search collection detail view ──────────────────────────
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
                    <button onClick={e => toggleScSrchMenu(e, s._id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', padding: '0 6px', color: '#6b7280' }}>⋯</button>
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

  // ── Collections list view ──────────────────────────────────
  return (
    <div className={styles.page}>
      {anyMenu && <div style={{ position: 'fixed', inset: 0, zIndex: 99 }} onClick={() => { setMenuOpen(null); setScMenuOpen(null); setScSrchMenu(null); }} />}
      <div className={styles.topBar}>
        <button className={styles.backBtn} onClick={() => navigate('/')}>← Back</button>
        <span className={styles.title}>Bookmarks</span>
      </div>

      <div className={styles.tabs}>
        <button className={`${styles.tab} ${activeTab === 'collections' ? styles.tabActive : ''}`} onClick={() => setActiveTab('collections')}>Collections</button>
        <button className={`${styles.tab} ${activeTab === 'savedSearches' ? styles.tabActive : ''}`} onClick={() => setActiveTab('savedSearches')}>Saved Searches</button>
      </div>

      {activeTab === 'collections' && (
        <>
          <div className={styles.newCol}>
            <input className={styles.newInput} placeholder="New collection name..." value={newName} onChange={e => setNewName(e.target.value)} onKeyDown={e => e.key === 'Enter' && createCol()} />
            <button className={styles.createBtn} onClick={createCol}>+ Create</button>
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
                ? <p className={styles.msg}>No collections yet. Create one above!</p>
                : cols.map(col => (
                    <div key={col._id} className={styles.colCard} onClick={() => { setSelected(col); setSearchParams({ col: col._id }); }}>
                      <div>
                        <p className={styles.colName}>{col.name}</p>
                        <p className={styles.colCount}>{col.schools.length} schools</p>
                      </div>
                      <div style={{ position: 'relative', flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                        <button onClick={e => toggleMenu(e, col._id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', padding: '0 6px', color: '#6b7280' }}>⋯</button>
                        {menuOpen === col._id && (
                          <div style={MENU_STYLE}>
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
        </>
      )}

      {activeTab === 'savedSearches' && (
        <>
          <div className={styles.newCol}>
            <input className={styles.newInput} placeholder="New search collection name..." value={scNewName} onChange={e => setScNewName(e.target.value)} onKeyDown={e => e.key === 'Enter' && createScCol()} />
            <button className={styles.createBtn} onClick={createScCol}>+ Create</button>
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
                ? <p className={styles.msg}>No search collections yet. Create one above!</p>
                : scCols.map(col => (
                    <div key={col._id} className={styles.colCard} onClick={() => setScSelected(col)}>
                      <div>
                        <p className={styles.colName}>{col.name}</p>
                        <p className={styles.colCount}>{(col.searches || []).length} searches</p>
                      </div>
                      <div style={{ position: 'relative', flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                        <button onClick={e => toggleScMenu(e, col._id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', padding: '0 6px', color: '#6b7280' }}>⋯</button>
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
        </>
      )}
    </div>
  );
}
