import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { API_BASE } from '../../constants/api';
import useAuthFetch from '../../hooks/useAuthFetch';
import { useAuth } from '../../context/AuthContext';
import styles from './SchoolDetail.module.css';
import bmIcon from '../../assets/bookmark.png';
import BookmarkMenu from '../../components/BookmarkMenu';
import { calcEfficiency } from '../../utils/efficiency';

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
      ['Lat & Long',      '_mapsLink'],
      ['Google Map Link', 'googleMapLoc'],
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
  { label: 'Total Students', key: 'totalStudents',   icon: null },
  { label: 'Classrooms',     key: 'totalClassrooms', icon: '🏫' },
  { label: 'Est. Year',      key: 'establishedYear', icon: '📅' },
  { label: 'Classes',        key: '_classes',        icon: '📚' },
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
      <div className={styles.scrollWrap}>
        <div style={{ display: 'flex', gap: 0, minWidth: 480 }}>
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
    </div>
  );
}

function formatCount(n) {
  if (n == null) return '—';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
  return String(n);
}

// Instagram follower-count health: red <3K, orange 3K-5.9K, green 6K+.
function followerStatusColor(followers) {
  if (followers == null) return null;
  if (followers < 3000) return '#dc2626';
  if (followers < 6000) return '#f97316';
  return '#16a34a';
}

const INSTAGRAM_FIELDS = [
  ['Handle',    'handle'],
  ['Followers', 'followers'],
  ['Following', 'following'],
  ['Posts',     'postsCount'],
];

// Instagram stats scraped from the school's website/social link. Renders only
// when school.instagram exists; the handle can be a false match picked up
// from a template/builder link (e.g. "wix") rather than the school's own
// account, so it's shown as-is without being treated as verified.
function InstagramTable({ school }) {
  const ig = school.instagram;
  if (!ig || typeof ig !== 'object') return null;
  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <tbody>
          {INSTAGRAM_FIELDS.map(([label, key]) => (
            <tr key={key} className={styles.row}>
              <td className={styles.tdLabel}>{label}</td>
              <td className={styles.tdVal}>
                {key === 'handle'
                  ? (ig.handle
                      ? <a href={`https://www.instagram.com/${ig.handle}/`} target="_blank" rel="noreferrer" style={{ color: '#2563eb', textDecoration: 'underline' }}>@{ig.handle}</a>
                      : <span className={styles.empty}>—</span>)
                  : (ig[key] == null ? <span className={styles.empty}>—</span> : formatCount(ig[key]))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
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
  const pct = Math.round((val / total) * 100);
  return `${val} (${pct}%)`;
}

function StudentsSection({ school }) {
  const total = school.totalStudents;
  return (
    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden' }}>
      <h2 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#374151', padding: '14px 20px', background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
        Students
      </h2>
      <div className={styles.scrollWrap}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 0, minWidth: 480 }}>
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

// The Google-Maps-location cell is the one editable field. Extracted so the
// edit/save/cancel markup lives in exactly one place instead of being copied
// into each of the three section grids below.
function GoogleMapLocCell({ school, locVal, editLoc, setEditLoc, setLocVal, canEdit, onSave }) {
  if (editLoc) {
    return (
      <span style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <input autoFocus value={locVal} onChange={e => setLocVal(e.target.value)} style={{ flex: 1, padding: '4px 8px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: '0.82rem', outline: 'none' }} />
        <button onClick={onSave} style={{ padding: '4px 10px', background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600 }}>Save</button>
        <button onClick={() => { setLocVal(school.googleMapLoc || ''); setEditLoc(false); }} style={{ padding: '4px 10px', background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: '0.78rem' }}>Cancel</button>
      </span>
    );
  }
  return (
    <span style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      {locVal ? (locVal.startsWith('http') ? <a href={locVal} target="_blank" rel="noreferrer" style={{ color: '#2563eb', textDecoration: 'underline', wordBreak: 'break-all' }}>{locVal}</a> : <span style={{ wordBreak: 'break-all' }}>{locVal}</span>) : <span className={styles.empty}>—</span>}
      {canEdit && <button onClick={() => setEditLoc(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#7c3aed', fontSize: '0.78rem', fontWeight: 600, padding: 0, flexShrink: 0 }}>✏️ Edit</button>}
    </span>
  );
}

// Renders one titled section as a label/value table. googleMapLoc gets the
// editable cell; every other field renders through <Val/>.
function SectionTable({ section, school, locProps }) {
  return (
    <div className={styles.section}>
      <h2 className={styles.sectionTitle}>{section.title}</h2>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <tbody>
            {section.fields.map(([label, key]) => (
              <tr key={key} className={styles.row}>
                <td className={styles.tdLabel}>{label}</td>
                <td className={styles.tdVal}>
                  {key === 'googleMapLoc'
                    ? <GoogleMapLocCell school={school} {...locProps} />
                    : <Val v={school[key]} fieldKey={key} school={school} />}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Prepend a scheme when the stored value is a bare host/path so href works.
function normalizeUrl(u) {
  const s = String(u).trim();
  return /^https?:\/\//i.test(s) ? s : `https://${s}`;
}

const linkStyle = { color: '#2563eb', textDecoration: 'underline', wordBreak: 'break-all' };

// The Mandatory Disclosure link cell — inline view / edit / save, plus (when
// the link is missing but a website exists) a Request button that raises a
// disclosure-link request shown in the Notifications panel. Request status is
// mirrored from the `disclosure_requests` record so the lead and the panel
// always agree.
function DisclosureLinkCell({ id, disclosureUrl, canEdit, apiFetch, setSchool, request, onRequestChange }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(disclosureUrl || '');
  const [saving, setSaving] = useState(false);
  const [requesting, setRequesting] = useState(false);

  async function save() {
    setSaving(true);
    try {
      const r = await apiFetch(`${API_BASE}/api/schools/school/${id}/disclosure-url`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ disclosureUrl: val }),
      }).then(res => res.json());
      const saved = r.disclosureUrl ?? val;
      setSchool(prev => ({ ...prev, _mandatoryDisclosureUrl: saved }));
      setEditing(false);
      // Saving a link resolves any pending request (backend does this too).
      if (saved && request && request.status === 'pending') {
        onRequestChange({ ...request, status: 'resolved' });
      }
    } catch {}
    setSaving(false);
  }

  async function requestLink() {
    setRequesting(true);
    try {
      const r = await apiFetch(`${API_BASE}/api/schools/school/${id}/disclosure-request`, {
        method: 'POST',
      }).then(res => res.json());
      if (r.request) onRequestChange(r.request);
    } catch {}
    setRequesting(false);
  }

  if (editing) {
    return (
      <span style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <input autoFocus value={val} onChange={e => setVal(e.target.value)} placeholder="https://…" style={{ flex: 1, padding: '4px 8px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: '0.82rem', outline: 'none' }} />
        <button onClick={save} disabled={saving} style={{ padding: '4px 10px', background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600, opacity: saving ? 0.6 : 1 }}>{saving ? '…' : 'Save'}</button>
        <button onClick={() => { setVal(disclosureUrl || ''); setEditing(false); }} style={{ padding: '4px 10px', background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: '0.78rem' }}>Cancel</button>
      </span>
    );
  }

  const pending = request && request.status === 'pending';
  return (
    <span style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
      {disclosureUrl
        ? <a href={normalizeUrl(disclosureUrl)} target="_blank" rel="noreferrer" style={linkStyle}>{disclosureUrl}</a>
        : <span className={styles.empty}>—</span>}
      {canEdit && (
        <button onClick={() => setEditing(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#7c3aed', fontSize: '0.78rem', fontWeight: 600, padding: 0, flexShrink: 0 }}>✏️ Edit</button>
      )}
      {canEdit && !disclosureUrl && (
        pending
          ? <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#dc2626', border: '1px solid #fecaca', background: '#fef2f2', borderRadius: 6, padding: '2px 8px' }}>Requested</span>
          : <button onClick={requestLink} disabled={requesting} style={{ background: '#eff6ff', border: '1px solid #bfdbfe', cursor: 'pointer', color: '#2563eb', fontSize: '0.72rem', fontWeight: 600, borderRadius: 6, padding: '2px 8px', opacity: requesting ? 0.6 : 1 }}>{requesting ? '…' : 'Request'}</button>
      )}
    </span>
  );
}

// Social media and mandatory-disclosure documents — all read straight from
// the school document, so anything updated in MongoDB shows here on the next
// load. Admins additionally get Edit/Save on the disclosure link and, when a
// website exists but the link is missing, a Request button.
function DisclosureSections({ school, id, canEdit, apiFetch, setSchool }) {
  const socialEntries = Object.entries(school._socialLinks || {})
    .filter(([, v]) => typeof v === 'string' && v.trim() !== '');

  const disclosureUrl = typeof school._mandatoryDisclosureUrl === 'string' && school._mandatoryDisclosureUrl.trim() !== ''
    ? school._mandatoryDisclosureUrl.trim()
    : null;

  const hasWebsite = typeof school.website === 'string' && school.website.trim() !== '';

  const docs = Array.isArray(school._mandatoryDisclosureDocs)
    ? school._mandatoryDisclosureDocs.filter(d => d && typeof d.url === 'string' && d.url.trim() !== '')
    : [];

  // Current disclosure-request record for this school (for the pending/resolved
  // badge and Request button). Only admins can see/manage requests.
  const [request, setRequest] = useState(null);
  useEffect(() => {
    if (!canEdit) return;
    let cancelled = false;
    apiFetch(`${API_BASE}/api/schools/disclosure-requests/list`, { method: 'POST' })
      .then(r => r.json())
      .then(d => {
        if (cancelled) return;
        const mine = (d.requests || []).find(req => req.schoolId === id) || null;
        setRequest(mine);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [id, canEdit, apiFetch]);

  // The disclosure block shows whenever there's disclosure data, or when an
  // admin could act on it (website present so a link can be added/requested).
  const showDisclosure = disclosureUrl || docs.length > 0 || (canEdit && hasWebsite);

  if (socialEntries.length === 0 && !showDisclosure) return null;

  return (
    <div className={styles.sectionsGrid}>
      {socialEntries.length > 0 && (
        <div className={styles.section}>
          <h2 className={styles.sectionTitle} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            Social Media
            {(() => {
              const color = followerStatusColor(school.instagram?.followers);
              return color && (
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, display: 'inline-block' }} />
              );
            })()}
          </h2>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <tbody>
                {socialEntries.map(([platform, url]) => (
                  <tr key={platform} className={styles.row}>
                    <td className={styles.tdLabel} style={{ textTransform: 'capitalize' }}>{platform}</td>
                    <td className={styles.tdVal}>
                      <a href={normalizeUrl(url)} target="_blank" rel="noreferrer" style={linkStyle}>{url}</a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <InstagramTable school={school} />
        </div>
      )}

      {showDisclosure && (
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Mandatory Disclosure Documents</h2>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <tbody>
                <tr className={styles.row}>
                  <td className={styles.tdLabel}>Disclosure Page</td>
                  <td className={styles.tdVal}>
                    {canEdit
                      ? <DisclosureLinkCell id={id} disclosureUrl={disclosureUrl} canEdit={canEdit} apiFetch={apiFetch} setSchool={setSchool} request={request} onRequestChange={setRequest} />
                      : (disclosureUrl
                          ? <a href={normalizeUrl(disclosureUrl)} target="_blank" rel="noreferrer" style={linkStyle}>{disclosureUrl}</a>
                          : <span className={styles.empty}>—</span>)}
                  </td>
                </tr>
                {docs.map((d, i) => (
                  <tr key={`${d.url}-${i}`} className={styles.row}>
                    <td className={styles.tdLabel}>{`Document ${i + 1}`}</td>
                    <td className={styles.tdVal}>
                      <a href={normalizeUrl(d.url)} target="_blank" rel="noreferrer" style={linkStyle}>{d.url}</a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SchoolDetail({ publicMode = false }) {
  const params_                 = useParams();
  const id                      = params_.id || params_.slug; // public mode uses :slug param
  const [params]                = useSearchParams();
  const navigate                = useNavigate();
  const location                = useLocation();
  const apiFetch                = useAuthFetch();
  const { user }                = useAuth();
  const fromResults             = location.state?.fromResults || false;
  const fromBookmarks           = location.state?.fromBookmarks || false;
  const fromAdmin               = location.state?.fromAdmin || false;
  const adminBroker             = location.state?.adminBroker || null;
  const fromBroker              = location.state?.fromBroker || false;
  const collectionId            = location.state?.collectionId || null;
  const col                     = params.get('col') || '';
  const [school, setSchool]     = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [editLoc, setEditLoc]       = useState(false);
  const [locVal, setLocVal]         = useState('');
  const canEdit                     = !publicMode && user?.role === 'admin';

  async function saveLoc() {
    await apiFetch(`${API_BASE}/api/schools/school/${id}/googlemaploc`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ googleMapLoc: locVal }),
    });
    setSchool(prev => ({ ...prev, googleMapLoc: locVal }));
    setEditLoc(false);
  }
  const locProps = { locVal, editLoc, setEditLoc, setLocVal, canEdit, onSave: saveLoc };

  // Native share (admin only) — public read-only link via Web Share API
  const [copied, setCopied] = useState(false);
  async function handleNativeShare() {
    if (!school) return;
    const slug = school.schoolName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const url  = `${window.location.origin}/public/school/${slug}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: school.schoolName, url });
      } else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {}
  }

  useEffect(() => {
    setLoading(true);
    const request = publicMode
      ? fetch(`${API_BASE}/api/public/school/${id}`)
      : apiFetch(`${API_BASE}/api/schools/school/${id}`, { method: 'POST' });
    request
      .then(r => r.json())
      .then(d => {
        if (d.error) setError(d.error);
        else {
          setSchool(d);
          setLocVal(d.googleMapLoc || '');
          document.title = `${d.schoolName} — Vistaar`;
          const slug = d.schoolName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
          const colParam = col ? `?col=${encodeURIComponent(col)}` : '';
          if (publicMode) {
            window.history.replaceState(null, '', `/public/school/${slug}`);
          } else {
            window.history.replaceState(null, '', `/school/${id}/${slug}${colParam}`);
          }
        }
        setLoading(false);
      })
      .catch(() => { setError('Failed to load school details.'); setLoading(false); });
    return () => { document.title = 'Vistaar — School Data Explorer'; };
  }, [id, col, apiFetch, publicMode]);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        {!publicMode && (
          <button className={styles.backBtn} onClick={() => {
            if (fromBookmarks) navigate('/bookmarks', { state: { restoreCollection: collectionId } });
            else if (fromBroker) navigate('/broker', { state: { restoreCollection: collectionId } });
            else if (fromAdmin) navigate('/admin', { state: { adminBroker } });
            else if (fromResults) navigate(-1);
            else navigate('/');
          }}>
            {fromBookmarks ? '← Back to Bookmarks' : fromBroker ? '← Back to Collections' : fromAdmin ? '← Back to Broker' : fromResults ? '← Back to Results' : '← Back to Search'}
          </button>
        )}
        {school && <span className={styles.headerTitle}>{school.schoolName}</span>}
        {school && !publicMode && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto', flexShrink: 0 }}>

            {/* Share button — admin only, shares the public read-only link */}
            {user?.role === 'admin' && (
              <button
                className={styles.backBtn}
                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                onClick={handleNativeShare}
              >
                🔗 {copied ? 'Link copied!' : 'Share'}
              </button>
            )}

            {/* Bookmark button — admin only */}
            {user?.role !== 'broker' && (
              <BookmarkMenu
                school={school}
                trigger={({ onClick }) => (
                  <button className={styles.backBtn} onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <img src={bmIcon} alt="" style={{ width: 16, height: 16 }} /> Bookmark
                  </button>
                )}
              />
            )}

          </div>
        )}
      </div>

      {loading && (
        <div className={styles.content}>
          <div className={`${styles.skel} ${styles.skelHero}`} />
          <div className={styles.statsRow}>
            {[1,2,3,4].map(i => (
              <div key={i} className={styles.statCard}>
                <div className={styles.skel} style={{ height: 28, width: 32, marginBottom: 8 }} />
                <div className={styles.skel} style={{ height: 20, width: 60, marginBottom: 6 }} />
                <div className={styles.skel} style={{ height: 12, width: 70 }} />
              </div>
            ))}
          </div>
          <div className={styles.skel} style={{ height: 180, borderRadius: 12 }} />
          <div className={styles.sectionsGrid}>
            {[1,2].map(i => (
              <div key={i} className={styles.section}>
                <div className={styles.skel} style={{ height: 44, borderRadius: 0 }} />
                <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {[1,2,3,4].map(j => (
                    <div key={j} style={{ display: 'flex', gap: 16 }}>
                      <div className={styles.skel} style={{ height: 13, width: '45%' }} />
                      <div className={styles.skel} style={{ height: 13, flex: 1 }} />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
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
            {TOP_STATS.map(s => {
              let icon = s.icon;
              let val;
              if (s.key === 'totalStudents') {
                icon = schoolTypeDisplay(school.schoolType).emoji;
                val  = school.totalStudents ?? '—';
              } else if (s.key === 'totalClassrooms') {
                const eff = calcEfficiency(school);
                val = <>{school.totalClassrooms ?? '—'}{eff !== null && <span style={{ fontSize: '0.85em' }}> ({eff}%)</span>}</>;
              } else if (s.key === '_classes') {
                const lo = school.lowestClass;
                const hi = school.highestClass;
                val = (lo != null && hi != null) ? `${lo}–${hi}` : '—';
              } else {
                val = school[s.key] ?? '—';
              }
              return (
                <div key={s.key} className={styles.statCard}>
                  <span className={styles.statIcon}>{icon}</span>
                  <span className={styles.statVal}>{val}</span>
                  <span className={styles.statLabel}>{s.label}</span>
                </div>
              );
            })}
          </div>

          <div className={styles.sectionsGrid}>
            {SECTIONS.slice(0, 2).map(sec => (
              <SectionTable key={sec.title} section={sec} school={school} locProps={locProps} />
            ))}
          </div>

          <StudentsSection school={school} />

          <TeachersSection school={school} />

          <div className={styles.sectionsGrid}>
            {SECTIONS.slice(2, 4).map(sec => (
              <SectionTable key={sec.title} section={sec} school={school} locProps={locProps} />
            ))}
          </div>

          <div className={styles.sectionsGrid}>
            {SECTIONS.slice(4).map(sec => (
              <SectionTable key={sec.title} section={sec} school={school} locProps={locProps} />
            ))}
          </div>

          {!publicMode && <DisclosureSections school={school} id={id} canEdit={canEdit} apiFetch={apiFetch} setSchool={setSchool} />}
        </div>
      )}
    </div>
  );
}
