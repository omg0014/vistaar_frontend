import { useState, useEffect } from 'react';
import styles from './Filter.module.css';

function calcEfficiency(school) {
  const capacity = (school.totalClassrooms || 0) * 35;
  if (capacity === 0) return null;
  return Math.round((school.totalStudents || 0) / capacity * 100);
}

const SORT_OPTIONS = [
  { value: '', label: 'Sort by' },
  { value: 'teachers_asc',    label: '👩‍🏫 Teachers: Low → High' },
  { value: 'teachers_desc',   label: '👩‍🏫 Teachers: High → Low' },
  { value: 'students_asc',    label: '🎓 Students: Low → High' },
  { value: 'students_desc',   label: '🎓 Students: High → Low' },
  { value: 'efficiency_asc',  label: '⚡ Efficiency: Low → High' },
  { value: 'efficiency_desc', label: '⚡ Efficiency: High → Low' },
];

function applySorting(arr, sortBy) {
  if (!sortBy) return arr;
  const sorted = [...arr];
  switch (sortBy) {
    case 'teachers_asc':    return sorted.sort((a, b) => (a.totalTeachers ?? 0) - (b.totalTeachers ?? 0));
    case 'teachers_desc':   return sorted.sort((a, b) => (b.totalTeachers ?? 0) - (a.totalTeachers ?? 0));
    case 'students_asc':    return sorted.sort((a, b) => (a.totalStudents ?? 0) - (b.totalStudents ?? 0));
    case 'students_desc':   return sorted.sort((a, b) => (b.totalStudents ?? 0) - (a.totalStudents ?? 0));
    case 'efficiency_asc':  return sorted.sort((a, b) => (calcEfficiency(a) ?? 0) - (calcEfficiency(b) ?? 0));
    case 'efficiency_desc': return sorted.sort((a, b) => (calcEfficiency(b) ?? 0) - (calcEfficiency(a) ?? 0));
    default: return sorted;
  }
}

export default function Filter({ results, onFilter }) {
  const [min1, setMin1] = useState('');
  const [max1, setMax1] = useState('');
  const [min2, setMin2] = useState('');
  const [max2, setMax2] = useState('');
  const [min3, setMin3] = useState('');
  const [max3, setMax3] = useState('');
  const [sortBy, setSortBy] = useState('');

  useEffect(() => {
    let filtered = results;

    if (min1 !== '') filtered = filtered.filter(s => (s.totalTeachers ?? 0) >= Number(min1));
    if (max1 !== '') filtered = filtered.filter(s => (s.totalTeachers ?? 0) <= Number(max1));
    if (min2 !== '') filtered = filtered.filter(s => (s.totalStudents ?? 0) >= Number(min2));
    if (max2 !== '') filtered = filtered.filter(s => (s.totalStudents ?? 0) <= Number(max2));
    if (min3 !== '') filtered = filtered.filter(s => { const e = calcEfficiency(s); return e !== null && e >= Number(min3); });
    if (max3 !== '') filtered = filtered.filter(s => { const e = calcEfficiency(s); return e !== null && e <= Number(max3); });

    onFilter(applySorting(filtered, sortBy));
  }, [min1, max1, min2, max2, min3, max3, sortBy, results, onFilter]);

  function handleClear() {
    setMin1(''); setMax1('');
    setMin2(''); setMax2('');
    setMin3(''); setMax3('');
    setSortBy('');
  }

  const isActive = [min1, max1, min2, max2, min3, max3].some(v => v !== '') || sortBy !== '';

  return (
    <div className={styles.wrap}>
      <div className={styles.groups}>
        <div className={styles.group}>
          <span className={styles.groupLabel}>👩‍🏫 Teachers</span>
          <div className={styles.inputs}>
            <input className={styles.input} type="number" placeholder="Min" value={min1} onChange={e => setMin1(e.target.value)} />
            <span className={styles.dash}>—</span>
            <input className={styles.input} type="number" placeholder="Max" value={max1} onChange={e => setMax1(e.target.value)} />
          </div>
        </div>

        <div className={styles.group}>
          <span className={styles.groupLabel}>🎓 Students</span>
          <div className={styles.inputs}>
            <input className={styles.input} type="number" placeholder="Min" value={min2} onChange={e => setMin2(e.target.value)} />
            <span className={styles.dash}>—</span>
            <input className={styles.input} type="number" placeholder="Max" value={max2} onChange={e => setMax2(e.target.value)} />
          </div>
        </div>

        <div className={styles.group}>
          <span className={styles.groupLabel}>⚡ Efficiency %</span>
          <div className={styles.inputs}>
            <input className={styles.input} type="number" placeholder="Min" value={min3} onChange={e => setMin3(e.target.value)} />
            <span className={styles.dash}>—</span>
            <input className={styles.input} type="number" placeholder="Max" value={max3} onChange={e => setMax3(e.target.value)} />
          </div>
        </div>

        <div className={styles.group}>
          <select
            className={styles.sortSelect}
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
          >
            {SORT_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      {isActive && (
        <button className={styles.clearBtn} onClick={handleClear}>Clear All</button>
      )}
    </div>
  );
}
