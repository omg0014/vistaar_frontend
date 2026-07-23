import { useState } from 'react';
import useBookmarkCollections from '../hooks/useBookmarkCollections';

export default function BookmarkMenu({ school, trigger, align = 'right' }) {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState('');
  const { cols, newName, setNewName, refresh, toggle, createCol } = useBookmarkCollections(school);

  function toggleOpen(e) {
    e.stopPropagation();
    if (open) { setOpen(false); return; }
    setFilter('');
    refresh();
    setOpen(true);
  }

  const shown = filter.trim()
    ? cols.filter(c => c.name.toLowerCase().includes(filter.trim().toLowerCase()))
    : cols;

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
            {cols.length > 6 && (
              <input
                aria-label="Search collections"
                style={{ width: '100%', padding: '7px 10px', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: '0.82rem', outline: 'none', marginBottom: 8 }}
                placeholder="Search collections…"
                value={filter}
                onChange={e => setFilter(e.target.value)}
              />
            )}
            {cols.length === 0 && <p style={{ fontSize: '0.8rem', color: '#9ca3af', marginBottom: 12 }}>No collections yet</p>}
            <div style={{ maxHeight: 240, overflowY: 'auto', margin: '0 -4px', padding: '0 4px' }}>
              {shown.map(col => {
                const inCol = col.schools.some(s => s._id === school._id);
                return (
                  <div key={col._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f3f4f6' }}>
                    <span style={{ fontSize: '0.85rem', color: '#374151' }}>{col.name} <span style={{ color: '#9ca3af' }}>({col.schools.length})</span></span>
                    <button
                      aria-label={inCol ? `Remove from ${col.name}` : `Add to ${col.name}`}
                      onClick={() => toggle(col)}
                      style={{ padding: '4px 10px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: '0.78rem', background: inCol ? '#fee2e2' : '#ede9fe', color: inCol ? '#dc2626' : '#7c3aed', fontWeight: 600, flexShrink: 0 }}
                    >
                      {inCol ? 'Remove' : '+ Add'}
                    </button>
                  </div>
                );
              })}
              {cols.length > 0 && shown.length === 0 && <p style={{ fontSize: '0.8rem', color: '#9ca3af', padding: '8px 0' }}>No matches.</p>}
            </div>
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
