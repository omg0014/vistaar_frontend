import { useState } from 'react';
import styles from './Filter.module.css';

const TEXT_FILTERS = {
  schoolName: [
    { key: 'fCity',     label: 'City',     placeholder: 'e.g. Mumbai' },
    { key: 'fDistrict', label: 'District', placeholder: 'e.g. Pune' },
    { key: 'fState',    label: 'State',    placeholder: 'e.g. Maharashtra' },
    { key: 'fPin',      label: 'Pincode',  placeholder: 'e.g. 400001' },
  ],
  address: [
    { key: 'fCity',  label: 'City',    placeholder: 'e.g. Mumbai' },
    { key: 'fState', label: 'State',   placeholder: 'e.g. Maharashtra' },
    { key: 'fPin',   label: 'Pincode', placeholder: 'e.g. 400001' },
  ],
  cityState: [
    { key: 'fPin',  label: 'Pincode',     placeholder: 'e.g. 400001' },
    { key: 'fArea', label: 'Area',        placeholder: 'e.g. Andheri' },
    { key: 'fName', label: 'School Name', placeholder: 'e.g. DAV' },
  ],
  pincode: [
    { key: 'fName',     label: 'School Name', placeholder: 'e.g. DAV' },
    { key: 'fCity',     label: 'City',        placeholder: 'e.g. Mumbai' },
    { key: 'fDistrict', label: 'District',    placeholder: 'e.g. Pune' },
  ],
};

const SORT_OPTIONS = [
  { value: '',                  label: 'Sort by' },
  { value: 'teachers_asc',     label: '👩‍🏫 Teachers: Low → High' },
  { value: 'teachers_desc',    label: '👩‍🏫 Teachers: High → Low' },
  { value: 'students_asc',     label: '🎓 Students: Low → High' },
  { value: 'students_desc',    label: '🎓 Students: High → Low' },
  { value: 'efficiency_asc',   label: '⚡ Efficiency: Low → High' },
  { value: 'efficiency_desc',  label: '⚡ Efficiency: High → Low' },
];

// Highest-class threshold: e.g. "K-7" keeps schools whose highest class is ≥ 7.
const CLASS_OPTIONS = [
  { value: '',   label: '📚 Classes' },
  { value: '5',  label: 'K-5' },
  { value: '7',  label: 'K-7' },
  { value: '10', label: 'K-10' },
  { value: '12', label: 'K-12' },
];

export default function Filter({ onApply, initialValues = {}, type = 'schoolName' }) {
  const [min1, setMin1] = useState(initialValues.min1 || '');
  const [max1, setMax1] = useState(initialValues.max1 || '');
  const [min2, setMin2] = useState(initialValues.min2 || '');
  const [max2, setMax2] = useState(initialValues.max2 || '');
  const [min3, setMin3] = useState(initialValues.min3 || '');
  const [max3, setMax3] = useState(initialValues.max3 || '');
  const initSort = initialValues.sortBy && initialValues.sortOrder ? `${initialValues.sortBy}_${initialValues.sortOrder}` : '';
  const [sortBy, setSortBy] = useState(initSort);
  const [minClass, setMinClass] = useState(initialValues.minClass || '');
  const [textFilters, setTextFilters] = useState({
    fCity: initialValues.fCity || '', fDistrict: initialValues.fDistrict || '',
    fState: initialValues.fState || '', fPin: initialValues.fPin || '',
    fArea: initialValues.fArea || '', fName: initialValues.fName || '',
  });
  const initAdvanced = !!initSort || !!(initialValues.minClass) || Object.values({ fCity: initialValues.fCity || '', fDistrict: initialValues.fDistrict || '', fState: initialValues.fState || '', fPin: initialValues.fPin || '', fArea: initialValues.fArea || '', fName: initialValues.fName || '' }).some(v => v !== '');
  const [showAdvanced, setShowAdvanced] = useState(initAdvanced);

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
    if (minClass !== '') params.minClass = minClass;
    Object.entries(textFilters).forEach(([k, v]) => { if (v.trim()) params[k] = v.trim(); });
    onApply(params);
  }

  const adv = TEXT_FILTERS[type] || [];

  return (
    <div className={styles.wrap}>
      <div className={styles.topRow}>
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

      <div className={styles.actions}>
        <button
          className={styles.advBtn}
          onClick={() => setShowAdvanced(p => !p)}
          aria-label={showAdvanced ? 'Hide advanced filters' : 'Show advanced filters'}
          title="Advanced filters"
        >
          {showAdvanced ? '▲' : '▼'}
        </button>
        <button className={styles.applyBtn} onClick={handleApply}>Apply</button>
      </div>
      </div>

      {showAdvanced && (
        <div className={styles.advRow}>
          <div className={styles.group}>
            <span className={styles.groupLabel}>Sort by</span>
            <select className={styles.sortSelect} value={sortBy} onChange={e => setSortBy(e.target.value)}>
              {SORT_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div className={styles.group}>
            <span className={styles.groupLabel}>Classes</span>
            <select className={styles.sortSelect} value={minClass} onChange={e => setMinClass(e.target.value)} title="Schools whose highest class is at least this grade">
              {CLASS_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          {adv.map(f => (
            <div key={f.key} className={styles.group}>
              <span className={styles.groupLabel}>{f.label}</span>
              <input
                className={styles.textInput}
                type="text"
                placeholder={f.placeholder}
                value={textFilters[f.key]}
                onChange={e => setTextFilters(prev => ({ ...prev, [f.key]: e.target.value }))}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
