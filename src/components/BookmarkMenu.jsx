import { useState } from 'react';
import { API_BASE } from '../constants/api';
import useAuthFetch from '../hooks/useAuthFetch';

export default function BookmarkMenu({ school, trigger, align = 'right' }) {
  const apiFetch = useAuthFetch();
  const [open, setOpen] = useState(false);
  const [cols, setCols] = useState([]);
  const [newName, setNewName] = useState('');

  function toggleOpen(e) {
    e.stopPropagation();
    if (open) { setOpen(false); return; }
    apiFetch(`${API_BASE}/api/schools/bookmarks/list`, { method: 'POST' })
      .then(r => r.json())
      .then(setCols)
      .catch(() => {});
    setOpen(true);
  }

  async function toggle(col) {
    const inCol = col.schools.some(s => s._id === school._id);
    if (inCol) {
      await apiFetch(`${API_BASE}/api/schools/bookmarks/${col._id}/schools/${school._id}`, { method: 'DELETE' });
    } else {
      const s = {
        _id: school._id, schoolName: school.schoolName, district: school.district, state: school.state,
        totalStudents: school.totalStudents, totalTeachers: school.totalTeachers, totalClassrooms: school.totalClassrooms,
      };
      await apiFetch(`${API_BASE}/api/schools/bookmarks/${col._id}/schools`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ school: s }),
      });
    }
    apiFetch(`${API_BASE}/api/schools/bookmarks/list`, { method: 'POST' }).then(r => r.json()).then(setCols).catch(() => {});
  }

  async function createCol() {
    if (!newName.trim()) return;
    const col = await apiFetch(`${API_BASE}/api/schools/bookmarks`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newName.trim() }),
    }).then(r => r.json());
    setNewName('');
    setCols(prev => [...prev, col]);
  }

  return (
    <div style={{ position: 'relative' }}>
      {trigger({ onClick: toggleOpen, open })}
      {open && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 99 }} onClick={() => setOpen(false)} />
          <div
            style={{ position: 'absolute', top: '110%', [align]: 0, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 16, zIndex: 100, minWidth: 240, boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}
            onClick={e => e.stopPropagation()}
          >
            <p style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: 12, color: '#374151' }}>Add to Collection</p>
            {cols.length === 0 && <p style={{ fontSize: '0.8rem', color: '#9ca3af', marginBottom: 12 }}>No collections yet</p>}
            {cols.map(col => {
              const inCol = col.schools.some(s => s._id === school._id);
              return (
                <div key={col._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f3f4f6' }}>
                  <span style={{ fontSize: '0.85rem', color: '#374151' }}>{col.name} <span style={{ color: '#9ca3af' }}>({col.schools.length})</span></span>
                  <button
                    aria-label={inCol ? `Remove from ${col.name}` : `Add to ${col.name}`}
                    onClick={() => toggle(col)}
                    style={{ padding: '4px 10px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: '0.78rem', background: inCol ? '#fee2e2' : '#ede9fe', color: inCol ? '#dc2626' : '#7c3aed', fontWeight: 600 }}
                  >
                    {inCol ? 'Remove' : '+ Add'}
                  </button>
                </div>
              );
            })}
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <input
                aria-label="New collection name"
                style={{ flex: 1, padding: '6px 10px', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: '0.82rem', outline: 'none' }}
                placeholder="New collection..."
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && createCol()}
              />
              <button aria-label="Create collection" onClick={createCol} style={{ padding: '6px 12px', background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 }}>+</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
