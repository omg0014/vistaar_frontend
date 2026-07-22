import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { API_BASE } from '../../constants/api';
import useAuthFetch from '../../hooks/useAuthFetch';
import useScrollReveal from '../../hooks/useScrollReveal';
import SearchHeader from '../../components/SearchHeader';
import HeaderMenu from '../../components/HeaderMenu';
import LeadCard from '../../components/LeadCard';
import styles from './BrokerDashboard.module.css';

const SUBTITLE = "'विस्तार' मार्गदर्शेन, भारतं विश्वगौरवम्।\nयुगपुरुषाः युगरूपाश्च, शिक्षया सन्तु दीपिताः॥";
const SUBTITLE_EN = 'Guided by the vast vision of the Vistaar app, may Bharat rise to its destiny as a global leader by the year 2047. Through excellence in education, may our students—both young men and women—be illuminated as the architects and changemakers of this new era.';

export default function BrokerDashboard() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const apiFetch  = useAuthFetch();
  const reveal    = useScrollReveal();

  const restoreId = location.state?.restoreCollection || null;

  const [collections, setCollections] = useState([]);
  // Hydrate the opened collection from cache so back-from-report-card renders instantly.
  const [selected,    setSelected]    = useState(() => {
    if (restoreId) {
      try { const c = sessionStorage.getItem(`bd_col_${restoreId}`); if (c) return JSON.parse(c); } catch {}
    }
    return null;
  });
  const [loading,     setLoading]     = useState(true);

  // Collections-list search
  const [colQuery,   setColQuery]   = useState('');
  const [colApplied, setColApplied] = useState('');

  // In-collection school search (detail view)
  const [schoolQuery,   setSchoolQuery]   = useState('');
  const [schoolApplied, setSchoolApplied] = useState('');
  useEffect(() => { setSchoolQuery(''); setSchoolApplied(''); }, [selected?._id]);

  useEffect(() => {
    apiFetch(`${API_BASE}/api/broker/collections`, { method: 'POST' })
      .then(r => r.json())
      .then(d => {
        const cols = d.collections || [];
        setCollections(cols);
        if (restoreId) {
          const col = cols.find(c => c._id === restoreId);
          if (col) {
            setSelected(col);
            const savedY = sessionStorage.getItem(`bd_scroll_${col._id}`);
            if (savedY) {
              setTimeout(() => {
                window.scrollTo({ top: parseInt(savedY, 10), behavior: 'instant' });
                sessionStorage.removeItem(`bd_scroll_${col._id}`);
              }, 60);
            }
          }
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [apiFetch, restoreId]);

  // Fast scroll restore when the collection is hydrated from cache (no wait for the fetch).
  useEffect(() => {
    if (!restoreId || !selected) return;
    const savedY = sessionStorage.getItem(`bd_scroll_${restoreId}`);
    if (!savedY) return;
    const t = setTimeout(() => {
      window.scrollTo({ top: parseInt(savedY, 10), behavior: 'instant' });
      sessionStorage.removeItem(`bd_scroll_${restoreId}`);
    }, 60);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const footer = (
    <footer className={styles.footer}>
      <span className={styles.footerBrand}>Vistaar</span>
      <span className={styles.footerText}>The process of expanding, growing, or explaining something in greater detail.</span>
    </footer>
  );

  /* ── Collection detail view: schools inside a shared collection ── */
  if (selected) {
    const applied = schoolApplied.trim().toLowerCase();
    const schoolFiltering = applied !== '';
    const detailSchools = schoolFiltering
      ? selected.schools.filter(s => (s.schoolName || '').toLowerCase().includes(applied))
      : selected.schools;

    return (
      <div className={styles.page}>
        <SearchHeader
          title="Vistaar"
          subtitle={SUBTITLE}
          tooltip={SUBTITLE_EN}
          onBack={() => setSelected(null)}
          backLabel="← Back to Collections"
          rightSlot={<HeaderMenu />}
          value={schoolQuery}
          onChange={setSchoolQuery}
          onKeyDown={e => { if (e.key === 'Enter') setSchoolApplied(schoolQuery.trim()); }}
          onSubmit={() => setSchoolApplied(schoolQuery.trim())}
          placeholder="Search schools in this collection…"
          icon="search"
        >
          <div className={styles.stats}>
            <div className={styles.statSeg}>
              <span className={styles.statNum}>{selected.schools.length}</span>
              <span className={styles.statLabel}>Schools</span>
            </div>
            <span className={styles.statDivider} />
            <div className={styles.statSeg}>
              <span className={styles.statName} title={selected.name}>{selected.name}</span>
              <span className={styles.statLabel}>Collection</span>
            </div>
            <span className={styles.statDivider} />
            <div className={styles.statSeg}>
              <span className={styles.statNum}>{detailSchools.length}</span>
              <span className={styles.statLabel}>Showing</span>
            </div>
          </div>
        </SearchHeader>

        <main className={styles.main}>
          <div className={styles.list}>
            {detailSchools.length === 0 && (
              <div className={styles.empty}>
                <div className={styles.emptyIcon}>📋</div>
                <p className={styles.emptyTitle}>{schoolFiltering ? `No schools match “${schoolApplied}”` : 'This collection is empty'}</p>
              </div>
            )}
            {detailSchools.map((school, i) => (
              <LeadCard
                key={school._id}
                ref={reveal}
                className="reveal"
                style={{ animationDelay: `${(i % 12) * 45}ms` }}
                school={school}
                onView={() => {
                  try {
                    sessionStorage.setItem(`bd_scroll_${selected._id}`, String(window.scrollY));
                    sessionStorage.setItem(`bd_col_${selected._id}`, JSON.stringify(selected));
                  } catch {}
                  navigate(`/school/${school._id}`, { state: { fromBroker: true, collectionId: selected._id } });
                }}
              />
            ))}
          </div>
        </main>
        {footer}
      </div>
    );
  }

  /* ── Collections list view ── */
  const applied = colApplied.trim().toLowerCase();
  const colFiltering = applied !== '';
  const visibleCols = colFiltering
    ? collections.filter(c => (c.name || '').toLowerCase().includes(applied))
    : collections;
  const totalSchools = collections.reduce((s, c) => s + (c.schools?.length || 0), 0);

  return (
    <div className={styles.page}>
      <SearchHeader
        title="Vistaar"
        subtitle={SUBTITLE}
        tooltip={SUBTITLE_EN}
        rightSlot={<HeaderMenu />}
        value={colQuery}
        onChange={setColQuery}
        onKeyDown={e => { if (e.key === 'Enter') setColApplied(colQuery.trim()); }}
        onSubmit={() => setColApplied(colQuery.trim())}
        placeholder="Search your collections…"
        icon="search"
      >
        <div className={styles.stats}>
          <div className={styles.statSeg}>
            <span className={styles.statNum}>{collections.length}</span>
            <span className={styles.statLabel}>Collections</span>
          </div>
          <span className={styles.statDivider} />
          <div className={styles.statSeg}>
            <span className={styles.statNum}>{totalSchools}</span>
            <span className={styles.statLabel}>Schools</span>
          </div>
          <span className={styles.statDivider} />
          <div className={styles.statSeg}>
            <span className={styles.statNum}>{visibleCols.length}</span>
            <span className={styles.statLabel}>Showing</span>
          </div>
        </div>
      </SearchHeader>

      <main className={styles.main}>
        <div className={styles.list}>
          {loading && [...Array(3)].map((_, i) => (
            <div key={i} className={styles.card}>
              <div className={styles.cardTop}>
                <div className={styles.skel} style={{ height: 16, width: '45%' }} />
              </div>
              <div className={styles.skel} style={{ height: 13, width: '30%' }} />
            </div>
          ))}

          {!loading && collections.length === 0 && (
            <div className={styles.empty}>
              <div className={styles.emptyIcon}>📋</div>
              <p className={styles.emptyTitle}>No collections shared yet</p>
              <p className={styles.emptyDesc}>The admin will share school collections with you soon.</p>
            </div>
          )}

          {!loading && collections.length > 0 && visibleCols.length === 0 && (
            <div className={styles.empty}>
              <div className={styles.emptyIcon}>🔍</div>
              <p className={styles.emptyTitle}>No collections match “{colApplied}”</p>
            </div>
          )}

          {!loading && visibleCols.map(col => (
            <div key={col._id} className={styles.card} onClick={() => setSelected(col)} style={{ cursor: 'pointer' }}>
              <div className={styles.cardTop}>
                <h2 className={styles.schoolName}>{col.name}</h2>
              </div>
              <p className={styles.location}>{col.schools.length} school{col.schools.length !== 1 ? 's' : ''}</p>
              <div className={styles.cardBottom}>
                <span />
                <button className={styles.viewBtn} onClick={e => { e.stopPropagation(); setSelected(col); }}>
                  Open Collection →
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>

      {footer}
    </div>
  );
}
