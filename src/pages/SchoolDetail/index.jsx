import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { API_BASE } from '../../constants/api';
import styles from './SchoolDetail.module.css';

const SECTIONS = [
  {
    title: 'Basic Information',
    fields: [
      ['UDISE Code',      'udiseCode'],
      ['School ID',       'schoolId'],
      ['School Status',   'schoolStatus'],
      ['School Category', '_schoolCategory'],
      ['Management Type', 'managementType'],
      ['Academic Year',   'academicYear'],
    ],
  },
  {
    title: 'Location',
    fields: [
      ['Address',       '_address'],
      ['Rural / Urban', 'ruralUrban'],
      ['Google Maps',   '_mapsLink'],
    ],
  },
  {
    title: 'Infrastructure',
    fields: [
      ['Building Status',         'buildingStatus'],
      ['Total Blocks',            'totalBlocks'],
      ['Boundary Wall Type',              'boundaryWallType'],
      ['Good / Total Classrooms',         '_classroomsRatio'],
      ['Minor Repair Classrooms',         'minorRepairClassrooms'],
      ['Major Repair Classrooms',         'majorRepairClassrooms'],
      ['Headmaster Room',         'headmasterRoom'],
      ['ICT Lab',                 'ictLab'],
      ['Integrated Lab',          'integratedLab'],
      ['Library',                 'library'],
      ['Playground',              'playground'],
    ],
  },
  {
    title: 'Facilities',
    fields: [
      ['Drinking Water',                        'drinkingWater'],
      ['Electricity',                           'electricity'],
      ['Toilets Available',                     'toiletsAvailable'],
      ['Boys Toilets / Functional',             '_boysToiletsRatio'],
      ['Girls Toilets / Functional',            '_girlsToiletsRatio'],
      ['Medical Checkup',            'medicalCheckup'],
      ['Internet Available',         'internetAvailable'],
      ['Laptops + Desktops',         '_laptopsDesktops'],
      ['Tablets / Printers',         '_tabletsRatio'],
    ],
  },
  {
    title: 'Grants & Schemes',
    fields: [
      ['CWSN School',            'cwsnSchool'],
      ['Shift School',           'shiftSchool'],
      ['Residential School',     'residentialSchool'],
      ['SMC Exists',             'smcExists'],
      ['SMDC Exists',            'smdcExists'],
    ],
  },
  {
    title: 'Board & Medium',
    fields: [
      ['Board (Secondary)',        'boardSecondary'],
      ['Board (Higher Secondary)', 'boardHigherSecondary'],
      ['Medium of Instruction',    'mediumOfInstruction'],
    ],
  },
  {
    title: 'Contact',
    fields: [
      ['Email',   'email'],
      ['Phone',   'phone'],
      ['Website', 'website'],
    ],
  },
  {
    title: 'Meta',
    fields: [
      ['Year ID',           'yearId'],
      ['Data Fetched At',   'dataFetchedAt'],
      ['Last Updated At',   'lastUpdatedAt'],
      ['Data Completeness', 'dataCompleteness'],
    ],
  },
];

const TOP_STATS = [
  { label: 'Total Students', key: 'totalStudents',   icon: '🎓' },
  { label: 'Classrooms',     key: 'totalClassrooms', icon: '🏫' },
  { label: 'Est. Year',      key: 'establishedYear', icon: '📅' },
  { label: 'School Type',    key: 'schoolType',      icon: null },
];

const TEACHER_STATS = [
  { label: 'Total Teachers',    key: 'totalTeachers',    icon: '👩‍🏫' },
  { label: 'Male Teachers',     key: 'maleTeachers',     icon: '👨‍🏫' },
  { label: 'Female Teachers',   key: 'femaleTeachers',   icon: '👩‍🏫' },
  { label: 'Regular Teachers',  key: 'regularTeachers',  icon: '📋' },
  { label: 'Contract Teachers', key: 'contractTeachers', icon: '📝' },
];

function TeachersSection({ school }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden' }}>
      <h2 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#374151', padding: '14px 20px', background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
        Teachers
      </h2>
      <div style={{ display: 'flex', gap: 0 }}>
        {TEACHER_STATS.map((t, i) => (
          <div key={t.key} style={{
            flex: 1, padding: '20px 16px', textAlign: 'center',
            borderRight: i < TEACHER_STATS.length - 1 ? '1px solid #f3f4f6' : 'none',
          }}>
            <div style={{ fontSize: '1.6rem', marginBottom: 8 }}>{t.icon}</div>
            <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#111827', marginBottom: 4 }}>
              {school[t.key] ?? '—'}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{t.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function schoolTypeDisplay(val) {
  if (!val) return { emoji: '—', label: '' };
  const v = String(val).toLowerCase();
  if (v.includes('co') || v.startsWith('3')) return { emoji: '👦👧', label: 'Co-educational' };
  if (v.includes('girl') || v.startsWith('2')) return { emoji: '👧', label: 'Girls' };
  if (v.includes('boy') || v.startsWith('1')) return { emoji: '👦', label: 'Boys' };
  return { emoji: '🏫', label: val };
}

const STUDENT_GROUPS = [
  { label: 'Gender',    boys: 'totalBoys',     girls: 'totalGirls',     total: 'totalStudents',    isGender: true },
  { label: 'General',   boys: 'generalBoys',   girls: 'generalGirls',   total: 'generalTotal' },
  { label: 'SC',        boys: 'scBoys',        girls: 'scGirls',        total: 'scTotal' },
  { label: 'ST',        boys: 'stBoys',        girls: 'stGirls',        total: 'stTotal' },
  { label: 'OBC',       boys: 'obcBoys',       girls: 'obcGirls',       total: 'obcTotal' },
  { label: 'EWS',       boys: 'ewsBoys',       girls: 'ewsGirls',       total: 'ewsTotal' },
  { label: 'RTE',       boys: 'rteBoys',       girls: 'rteGirls',       total: 'rteTotal' },
  { label: 'CWSN',      boys: 'cwsnBoys',      girls: 'cwsnGirls',      total: 'cwsnTotal' },
  { label: 'Repeaters', boys: 'repeatersBoys', girls: 'repeatersGirls', total: 'repeatersTotal' },
];

function withPct(val, total) {
  if (val == null || val === '') return '—';
  if (!total) return String(val);
  const pct = ((val / total) * 100).toFixed(2);
  return `${val} (${pct}%)`;
}

function StudentsSection({ school }) {
  const total = school.totalStudents;
  return (
    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden' }}>
      <h2 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#374151', padding: '14px 20px', background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
        Students
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 0 }}>
        {STUDENT_GROUPS.map((g, i) => (
          <div key={g.label} style={{
            padding: '14px 16px',
            borderRight: (i + 1) % 3 !== 0 ? '1px solid #f3f4f6' : 'none',
            borderBottom: i < 6 ? '1px solid #f3f4f6' : 'none',
            background: i % 2 === 0 ? '#fff' : '#fafafa',
          }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#5b21b6', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {g.label}
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
              <tbody>
                <tr>
                  <td style={{ color: '#6b7280', paddingBottom: 4 }}>Boys</td>
                  <td style={{ color: '#111827', fontWeight: 500, textAlign: 'right' }}>
                    {withPct(school[g.boys], total)}
                  </td>
                </tr>
                <tr>
                  <td style={{ color: '#6b7280', paddingBottom: 4 }}>Girls</td>
                  <td style={{ color: '#111827', fontWeight: 500, textAlign: 'right' }}>
                    {withPct(school[g.girls], total)}
                  </td>
                </tr>
                <tr>
                  <td style={{ color: '#6b7280' }}>Total</td>
                  <td style={{ color: '#111827', fontWeight: 700, textAlign: 'right' }}>
                    {withPct(school[g.total], total)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </div>
  );
}

function Val({ v, fieldKey, school }) {
  // School Status — green dot for Operational, red for Closed
  if (fieldKey === 'schoolStatus') {
    const isOp = String(v).toLowerCase().includes('operational');
    const color = isOp ? '#16a34a' : '#dc2626';
    return (
      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, display: 'inline-block' }} />
        {String(v)}
      </span>
    );
  }

  // Ratio fields
  if (fieldKey === '_classroomsRatio') {
    const good  = school.goodClassrooms ?? '—';
    const total = school.totalClassrooms ?? '—';
    return `${good} / ${total}`;
  }
  if (fieldKey === '_boysToiletsRatio') {
    const total = school.boysToilets ?? '—';
    const func  = school.boysToiletsFunctional ?? '—';
    return `${total} / ${func}`;
  }
  if (fieldKey === '_girlsToiletsRatio') {
    const total = school.girlsToilets ?? '—';
    const func  = school.girlsToiletsFunctional ?? '—';
    return `${total} / ${func}`;
  }

  if (fieldKey === '_laptopsDesktops') {
    const l = school.laptopsTotal ?? '—';
    const d = school.desktopsFunctional ?? '—';
    return `${l} + ${d}`;
  }
  if (fieldKey === '_tabletsRatio') {
    const t = school.tabletsTotal ?? '—';
    const p = school.printersTotal ?? '—';
    return `${t} / ${p}`;
  }

  // School Category — schoolCategory (lowestClass-highestClass)
  if (fieldKey === '_schoolCategory') {
    const cat = school.schoolCategory || '';
    const lo  = school.lowestClass;
    const hi  = school.highestClass;
    const range = (lo != null && hi != null) ? ` (${lo}-${hi})` : '';
    if (!cat) return <span className={styles.empty}>—</span>;
    return `${cat}${range}`;
  }

  // Google Maps link — computed from latitude + longitude
  if (fieldKey === '_mapsLink') {
    const lat = school.latitude;
    const lng = school.longitude;
    if (!lat || !lng) return <span className={styles.empty}>—</span>;
    const url = `https://www.google.com/maps?q=${lat},${lng}`;
    return (
      <a href={url} target="_blank" rel="noreferrer" style={{ color: '#2563eb', textDecoration: 'underline' }}>
        {lat}, {lng}
      </a>
    );
  }

  // Address — computed from cluster + village + ward + city + pincode
  if (fieldKey === '_address') {
    const parts = [school.cluster, school.village, school.ward, school.city, school.pincode]
      .filter(p => p !== null && p !== undefined && p !== '');
    if (parts.length === 0) return <span className={styles.empty}>—</span>;
    return String(parts.join(', '));
  }

  if (v === null || v === undefined || v === '') {
    return <span className={styles.empty}>—</span>;
  }
  if (fieldKey === 'website') {
    const url = String(v).startsWith('http') ? String(v) : `https://${String(v)}`;
    return (
      <a href={url} target="_blank" rel="noreferrer" style={{ color: '#2563eb', textDecoration: 'underline' }}>
        {String(v)}
      </a>
    );
  }
  return String(v);
}

export default function SchoolDetail() {
  const { id }                  = useParams();
  const [params]                = useSearchParams();
  const navigate                = useNavigate();
  const col                     = params.get('col') || '';
  const [school, setSchool]     = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');

  useEffect(() => {
    setLoading(true);
    fetch(`${API_BASE}/api/schools/school/${id}?col=${encodeURIComponent(col)}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) setError(d.error);
        else setSchool(d);
        setLoading(false);
      })
      .catch(() => { setError('Failed to load school details.'); setLoading(false); });
  }, [id, col]);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate(-1)}>← Back to Results</button>
        {school && <span className={styles.headerTitle}>{school.schoolName}</span>}
      </div>

      {loading && <p className={styles.msg}>Loading...</p>}
      {error   && <p className={styles.msg}>⚠️ {error}</p>}

      {school && !loading && (
        <div className={styles.content}>
          <div className={styles.heroCard}>
            <div className={styles.heroIcon}>🏫</div>
            <div>
              <h1 className={styles.schoolName}>{school.schoolName}</h1>
              <p className={styles.schoolSub}>
                {[...new Set([school.block, school.district, school.state].filter(Boolean))].join(' · ')}
              </p>
              {school.schoolStatus && (
                <span className={styles.statusBadge}>
                  <span style={{
                    width: 8, height: 8, borderRadius: '50%', display: 'inline-block', marginRight: 6,
                    background: school.schoolStatus.toLowerCase().includes('operational') ? '#4ade80' : '#f87171'
                  }} />
                  {school.schoolStatus}
                </span>
              )}
            </div>
          </div>

          <div className={styles.statsRow}>
            {TOP_STATS.map(s => (
              <div key={s.key} className={styles.statCard}>
                <span className={styles.statIcon}>
                  {s.key === 'schoolType' ? schoolTypeDisplay(school[s.key]).emoji : s.icon}
                </span>
                <span className={styles.statVal}>
                  {s.key === 'schoolType' ? schoolTypeDisplay(school[s.key]).label : (school[s.key] ?? '—')}
                </span>
                <span className={styles.statLabel}>{s.label}</span>
              </div>
            ))}
          </div>

          <div className={styles.sectionsGrid}>
          {SECTIONS.slice(0, 2).map(sec => (
            <div key={sec.title} className={styles.section}>
              <h2 className={styles.sectionTitle}>{sec.title}</h2>
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <tbody>
                    {sec.fields.map(([label, key]) => (
                      <tr key={key} className={styles.row}>
                        <td className={styles.tdLabel}>{label}</td>
                        <td className={styles.tdVal}><Val v={school[key]} fieldKey={key} school={school} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
          </div>

          <StudentsSection school={school} />

          <TeachersSection school={school} />

          <div className={styles.sectionsGrid}>
          {SECTIONS.slice(2, 4).map(sec => (
            <div key={sec.title} className={styles.section}>
              <h2 className={styles.sectionTitle}>{sec.title}</h2>
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <tbody>
                    {sec.fields.map(([label, key]) => (
                      <tr key={key} className={styles.row}>
                        <td className={styles.tdLabel}>{label}</td>
                        <td className={styles.tdVal}><Val v={school[key]} fieldKey={key} school={school} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
          </div>

          <div className={styles.sectionsGrid}>
          {SECTIONS.slice(4).map(sec => (
            <div key={sec.title} className={styles.section}>
              <h2 className={styles.sectionTitle}>{sec.title}</h2>
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <tbody>
                    {sec.fields.map(([label, key]) => (
                      <tr key={key} className={styles.row}>
                        <td className={styles.tdLabel}>{label}</td>
                        <td className={styles.tdVal}><Val v={school[key]} fieldKey={key} school={school} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
          </div>
        </div>
      )}
    </div>
  );
}
