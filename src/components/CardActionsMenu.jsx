import { useState } from 'react';
import useBookmarkCollections from '../hooks/useBookmarkCollections';

const rootItem = {
  display: 'flex', alignItems: 'center', gap: 8, width: '100%', textAlign: 'left',
  padding: '9px 12px', background: 'none', border: 'none', cursor: 'pointer',
  fontSize: '0.85rem', color: '#374151', borderRadius: 8, fontWeight: 500,
};

// Kebab (⋯) menu shown on a result card. Root view offers Share + Bookmark;
// choosing Bookmark switches the same popover to the collection picker.
export default function CardActionsMenu({ school }) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState('root'); // 'root' | 'bookmark'
  const { cols, newName, setNewName, refresh, toggle, createCol } = useBookmarkCollections(school);

  function close() { setOpen(false); setView('root'); }

  function toggleOpen(e) {
    e.stopPropagation();
    if (open) { close(); return; }
    setView('root');
    setOpen(true);
  }

  async function handleShare() {
    const slug = school.schoolName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const url = `${window.location.origin}/public/school/${slug}`;
    try {
      if (navigator.share) await navigator.share({ title: school.schoolName, url });
      else await navigator.clipboard.writeText(url);
    } catch {}
    close();
  }

  function openBookmark() {
    refresh();
    setView('bookmark');
  }

  return (
    <div style={{ position: 'relative' }}>
      <button
        aria-label="School options"
        title="Options"
        onClick={toggleOpen}
        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.35rem', lineHeight: 1, padding: '0 6px', color: '#6b7280', opacity: open ? 1 : 0.7 }}
      >
        ⋯
      </button>
      {open && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 99 }} onClick={close} />
          <div
            style={{ position: 'absolute', top: '110%', right: 0, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: view === 'root' ? 6 : 16, zIndex: 100, minWidth: view === 'root' ? 170 : 240, boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}
            onClick={e => e.stopPropagation()}
          >
            {view === 'root' ? (
              <>
                <button onClick={handleShare} style={rootItem}>↗ Share</button>
                <button onClick={openBookmark} style={rootItem}>🔖 Bookmark</button>
              </>
            ) : (
              <>
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
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
