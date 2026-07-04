import { useState } from 'react';
import styles from './Filter.module.css';

const SORT_OPTIONS = [
  { value: '',                  label: 'Sort by' },
  { value: 'teachers_asc',     label: '👩‍🏫 Teachers: Low → High' },
  { value: 'teachers_desc',    label: '👩‍🏫 Teachers: High → Low' },
  { value: 'students_asc',     label: '🎓 Students: Low → High' },
  { value: 'students_desc',    label: '🎓 Students: High → Low' },
  { value: 'efficiency_asc',   label: '⚡ Efficiency: Low → High' },
  { value: 'efficiency_desc',  label: '⚡ Efficiency: High → Low' },
];

export default function Filter({ onApply, initialValues = {} }) {
  const [min1, setMin1] = useState(initialValues.min1 || '');
  const [max1, setMax1] = useState(initialValues.max1 || '');
  const [min2, setMin2] = useState(initialValues.min2 || '');
  const [max2, setMax2] = useState(initialValues.max2 || '');
  const [min3, setMin3] = useState(initialValues.min3 || '');
  const [max3, setMax3] = useState(initialValues.max3 || '');
  const initSort = initialValues.sortBy && initialValues.sortOrder ? `${initialValues.sortBy}_${initialValues.sortOrder}` : '';
  const [sortBy, setSortBy] = useState(initSort);

  function handleApply() {
    const params = {};
    if (min1 !== '') params.min1 = min1;
    if (max1 !== '') params.max1 = max1;
    if (min2 !== '') params.min2 = min2;
    if (max2 !== '') params.max2 = max2;
    if (min3 !== '') params.min3 = min3;
    if (max3 !== '') params.max3 = max3;
    if (sortBy !== '') {
      const [field, order] = sortBy.split('_');
      params.sortBy    = field;
      params.sortOrder = order;
    }
    onApply(params);
  }

  function handleClear() {
    setMin1(''); setMax1('');
    setMin2(''); setMax2('');
    setMin3(''); setMax3('');
    setSortBy('');
    onApply({});
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
          <select className={styles.sortSelect} value={sortBy} onChange={e => setSortBy(e.target.value)}>
            {SORT_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className={styles.actions}>
        <button className={styles.applyBtn} onClick={handleApply}>Apply</button>
        {isActive && <button className={styles.clearBtn} onClick={handleClear}>Clear</button>}
      </div>
    </div>
  );
}
