import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { API_BASE } from '../../constants/api';
import { TYPE_LABELS } from '../../constants/searchTypes';
import useAuthFetch from '../../hooks/useAuthFetch';
import styles from './Bookmarks.module.css';

const MENU_STYLE = { position: 'absolute', top: '110%', right: 0, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, boxShadow: '0 4px 16px rgba(0,0,0,0.12)', zIndex: 100, minWidth: 180, overflow: 'hidden' };
const MENU_ITEM  = { display: 'block', width: '100%', padding: '10px 16px', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', fontSize: '0.85rem', color: '#dc2626' };

export default function Bookmarks() {
  const navigate    = useNavigate();
  const location    = useLocation();
  const apiFetch    = useAuthFetch();
  const restoreId   = location.state?.restoreCollection;
  const [activeTab, setActiveTab]       = useState('collections');
  const [cols, setCols]                 = useState([]);
  const [selected, setSelected]         = useState(null);
  const [newName, setNewName]           = useState('');
  const [menuOpen, setMenuOpen]         = useState(null);
  const [savedSearches, setSavedSearches] = useState([]);
  const [ssMenuOpen, setSsMenuOpen]     = useState(null);

  useEffect(() => {
    apiFetch(`${API_BASE}/api/schools/bookmarks`)
      .then(r => r.json())
      .then(data => {
        setCols(data);
        if (restoreId) {
          const col = data.find(c => c._id === restoreId);
          if (col) setSelected(col);
        }
      })
      .catch(() => {});
    apiFetch(`${API_BASE}/api/schools/saved-searches`)
      .then(r => r.json())
      .then(setSavedSearches)
      .catch(() => {});
  }, [restoreId, apiFetch]);

  async function createCol() {
    if (!newName.trim()) return;
    const col = await apiFetch(`${API_BASE}/api/schools/bookmarks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName.trim() }),
    }).then(r => r.json());
    setNewName('');
    setCols(prev => [...prev, col]);
  }

  async function deleteCol(id, name) {
    if (!window.confirm(`Do you really want to delete "${name}"?`)) return;
    await apiFetch(`${API_BASE}/api/schools/bookmarks/${id}`, { method: 'DELETE' });
    setCols(prev => prev.filter(c => c._id !== id));
    if (selected?._id === id) setSelected(null);
  }

  async function removeSchool(colId, schoolId, schoolName) {
    if (!window.confirm(`Do you really want to remove "${schoolName}" from this collection?`)) return;
    await apiFetch(`${API_BASE}/api/schools/bookmarks/${colId}/schools/${schoolId}`, { method: 'DELETE' });
    const updated = (schools) => schools.filter(s => s._id !== schoolId);
    setCols(prev => prev.map(c => c._id === colId ? { ...c, schools: updated(c.schools) } : c));
    setSelected(prev => prev ? { ...prev, schools: updated(prev.schools) } : null);
  }

  async function deleteSavedSearch(id) {
    if (!window.confirm('Delete this saved search?')) return;
    await apiFetch(`${API_BASE}/api/schools/saved-searches/${id}`, { method: 'DELETE' });
    setSavedSearches(prev => prev.filter(s => s._id !== id));
    setSsMenuOpen(null);
  }

  function runSavedSearch(s) {
    const qs = new URLSearchParams({ type: s.type, q: s.q, ...s.filters }).toString();
    navigate(`/results?${qs}`);
  }

  function toggleMenu(e, id) {
    e.stopPropagation();
    setMenuOpen(prev => prev === id ? null : id);
  }

  if (selected) {
    return (
      <div className={styles.page}>
        {menuOpen && <div style={{ position: 'fixed', inset: 0, zIndex: 99 }} onClick={() => setMenuOpen(null)} />}
        <div className={styles.topBar}>
          <button className={styles.backBtn} onClick={() => setSelected(null)}>← Collections</button>
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

  return (
    <div className={styles.page}>
      {(menuOpen || ssMenuOpen) && <div style={{ position: 'fixed', inset: 0, zIndex: 99 }} onClick={() => { setMenuOpen(null); setSsMenuOpen(null); }} />}
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
            <input
              className={styles.newInput}
              placeholder="New collection name..."
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && createCol()}
            />
            <button className={styles.createBtn} onClick={createCol}>+ Create</button>
          </div>
          <div className={styles.colGrid}>
            {cols.length === 0 && <p className={styles.msg}>No collections yet. Create one above!</p>}
            {cols.map(col => (
              <div key={col._id} className={styles.colCard} onClick={() => setSelected(col)}>
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
            ))}
          </div>
        </>
      )}

      {activeTab === 'savedSearches' && (
        <div className={styles.savedList}>
          {savedSearches.length === 0 && <p className={styles.msg}>No saved searches yet. Save a search from the Results page.</p>}
          {savedSearches.map(s => {
            const filterCount = Object.values(s.filters || {}).filter(v => v !== '').length;
            return (
              <div key={s._id} className={styles.savedCard}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: '0.95rem', fontWeight: 600, color: '#111827', margin: 0 }}>{s.name}</p>
                  <p className={styles.savedMeta}>
                    {TYPE_LABELS[s.type] || s.type} · "{s.q}"{filterCount > 0 ? ` · ${filterCount} filter${filterCount > 1 ? 's' : ''}` : ''}
                  </p>
                </div>
                <div className={styles.savedActions}>
                  <button className={styles.runBtn} onClick={() => runSavedSearch(s)}>▶ Run</button>
                  <div style={{ position: 'relative' }}>
                    <button onClick={e => { e.stopPropagation(); setSsMenuOpen(prev => prev === s._id ? null : s._id); }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', padding: '0 6px', color: '#6b7280' }}>⋯</button>
                    {ssMenuOpen === s._id && (
                      <div style={MENU_STYLE}>
                        <button style={MENU_ITEM} onClick={() => deleteSavedSearch(s._id)}>Delete</button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
