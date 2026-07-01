import { useState, useEffect } from 'react';
import styles from './Filter.module.css';

function calcEfficiency(school) {
  const capacity = (school.totalClassrooms || 0) * 35;
  if (capacity === 0) return null;
  return Math.round((school.totalStudents || 0) / capacity * 100);
}

export default function Filter({ results, onFilter }) {
  const [min1, setMin1] = useState(''); // teachers min
  const [max1, setMax1] = useState(''); // teachers max
  const [min2, setMin2] = useState(''); // students min
  const [max2, setMax2] = useState(''); // students max
  const [min3, setMin3] = useState(''); // efficiency min
  const [max3, setMax3] = useState(''); // efficiency max

  useEffect(() => {
    let filtered = results;

    if (min1 !== '') filtered = filtered.filter(s => (s.totalTeachers ?? 0) >= Number(min1));
    if (max1 !== '') filtered = filtered.filter(s => (s.totalTeachers ?? 0) <= Number(max1));
    if (min2 !== '') filtered = filtered.filter(s => (s.totalStudents ?? 0) >= Number(min2));
    if (max2 !== '') filtered = filtered.filter(s => (s.totalStudents ?? 0) <= Number(max2));
    if (min3 !== '') filtered = filtered.filter(s => { const e = calcEfficiency(s); return e !== null && e >= Number(min3); });
    if (max3 !== '') filtered = filtered.filter(s => { const e = calcEfficiency(s); return e !== null && e <= Number(max3); });

    onFilter(filtered);
  }, [min1, max1, min2, max2, min3, max3, results, onFilter]);

  function handleClear() {
    setMin1(''); setMax1('');
    setMin2(''); setMax2('');
    setMin3(''); setMax3('');
  }

  const isActive = [min1, max1, min2, max2, min3, max3].some(v => v !== '');

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
      </div>

      {isActive && (
        <button className={styles.clearBtn} onClick={handleClear}>Clear Filters</button>
      )}
    </div>
  );
}
