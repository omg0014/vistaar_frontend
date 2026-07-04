import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE } from '../../constants/api';
import styles from './Bookmarks.module.css';

export default function Bookmarks() {
  const navigate = useNavigate();
  const [cols, setCols]       = useState([]);
  const [selected, setSelected] = useState(null);
  const [newName, setNewName] = useState('');

  useEffect(() => {
    fetch(`${API_BASE}/api/schools/bookmarks`)
      .then(r => r.json())
      .then(setCols)
      .catch(() => {});
  }, []);

  async function createCol() {
    if (!newName.trim()) return;
    const col = await fetch(`${API_BASE}/api/schools/bookmarks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName.trim() }),
    }).then(r => r.json());
    setNewName('');
    setCols(prev => [...prev, col]);
  }

  async function deleteCol(id) {
    await fetch(`${API_BASE}/api/schools/bookmarks/${id}`, { method: 'DELETE' });
    setCols(prev => prev.filter(c => c._id !== id));
    if (selected?._id === id) setSelected(null);
  }

  async function removeSchool(colId, schoolId) {
    await fetch(`${API_BASE}/api/schools/bookmarks/${colId}/schools/${schoolId}`, { method: 'DELETE' });
    const updated = (schools) => schools.filter(s => s._id !== schoolId);
    setCols(prev => prev.map(c => c._id === colId ? { ...c, schools: updated(c.schools) } : c));
    setSelected(prev => prev ? { ...prev, schools: updated(prev.schools) } : null);
  }

  if (selected) {
    return (
      <div className={styles.page}>
        <div className={styles.topBar}>
          <button className={styles.backBtn} onClick={() => setSelected(null)}>← Collections</button>
          <span className={styles.title}>{selected.name}</span>
          <span className={styles.count}>{selected.schools.length} schools</span>
        </div>
        <div className={styles.list}>
          {selected.schools.length === 0 && <p className={styles.msg}>No schools in this collection.</p>}
          {selected.schools.map(school => (
            <div key={school._id} className={styles.card}>
              <h2 className={styles.schoolName}>{school.schoolName}</h2>
              <p className={styles.location}>{[school.district, school.state].filter(Boolean).join(', ')}</p>
              <div className={styles.cardMeta}>
                {school.totalStudents != null && <span>🎓 {school.totalStudents} students</span>}
                {school.totalTeachers != null && <span>👩‍🏫 {school.totalTeachers} teachers</span>}
              </div>
              <div className={styles.cardBottom}>
                <button className={styles.removeBtn} onClick={() => removeSchool(selected._id, school._id)}>Remove</button>
                <button className={styles.viewBtn} onClick={() => navigate(`/school/${school._id}`)}>View Report Card →</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <button className={styles.backBtn} onClick={() => navigate('/')}>← Back</button>
        <span className={styles.title}>Bookmarks</span>
      </div>
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
            <button className={styles.deleteBtn} onClick={e => { e.stopPropagation(); deleteCol(col._id); }}>✕</button>
          </div>
        ))}
      </div>
    </div>
  );
}
