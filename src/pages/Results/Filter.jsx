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

export default function Filter({ onApply, initialValues = {}, type = 'schoolName' }) {
  const [min1, setMin1] = useState(initialValues.min1 || '');
  const [max1, setMax1] = useState(initialValues.max1 || '');
  const [min2, setMin2] = useState(initialValues.min2 || '');
  const [max2, setMax2] = useState(initialValues.max2 || '');
  const [min3, setMin3] = useState(initialValues.min3 || '');
  const [max3, setMax3] = useState(initialValues.max3 || '');
  const initSort = initialValues.sortBy && initialValues.sortOrder ? `${initialValues.sortBy}_${initialValues.sortOrder}` : '';
  const [sortBy, setSortBy] = useState(initSort);
  const [textFilters, setTextFilters] = useState({
    fCity: initialValues.fCity || '', fDistrict: initialValues.fDistrict || '',
    fState: initialValues.fState || '', fPin: initialValues.fPin || '',
    fArea: initialValues.fArea || '', fName: initialValues.fName || '',
  });
  const initAdvanced = !!initSort || Object.values({ fCity: initialValues.fCity || '', fDistrict: initialValues.fDistrict || '', fState: initialValues.fState || '', fPin: initialValues.fPin || '', fArea: initialValues.fArea || '', fName: initialValues.fName || '' }).some(v => v !== '');
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
    Object.entries(textFilters).forEach(([k, v]) => { if (v.trim()) params[k] = v.trim(); });
    onApply(params);
  }

  function handleClear() {
    setMin1(''); setMax1('');
    setMin2(''); setMax2('');
    setMin3(''); setMax3('');
    setSortBy('');
    setTextFilters({ fCity: '', fDistrict: '', fState: '', fPin: '', fArea: '', fName: '' });
    onApply({});
  }

  const isActive = [min1, max1, min2, max2, min3, max3].some(v => v !== '') || sortBy !== '' || Object.values(textFilters).some(v => v !== '');

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
        {isActive && <button className={styles.clearBtn} onClick={handleClear}>Clear</button>}
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
