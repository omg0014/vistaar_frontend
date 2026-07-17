import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE } from '../../constants/api';
import useAuthFetch from '../../hooks/useAuthFetch';
import { useAuth } from '../../context/AuthContext';
import styles from './BrokerDashboard.module.css';

function calcEfficiency(school) {
  const capacity = (school.totalClassrooms || 0) * 35;
  if (capacity === 0) return null;
  return Math.round((school.totalStudents || 0) / capacity * 100);
}

function EfficiencyBadge({ value }) {
  if (value === null) return null;
  const color = value >= 75 ? '#16a34a' : value >= 40 ? '#d97706' : '#dc2626';
  return (
    <span className={styles.badge} style={{ background: color + '20', color }}>
      {value}% efficiency
    </span>
  );
}

export default function BrokerDashboard() {
  const navigate  = useNavigate();
  const apiFetch  = useAuthFetch();
  const { user, logout } = useAuth();
  const [leads,   setLeads]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch(`${API_BASE}/api/broker/leads`, { method: 'POST' })
      .then(r => r.json())
      .then(d => { setLeads(d.leads || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [apiFetch]);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerBrand}>
          <span className={styles.brandName}>Vistaar</span>
          <span className={styles.brandTag}>Broker Portal</span>
        </div>
        <div className={styles.headerRight}>
          {user?.picture && <img src={user.picture} alt={user.name} className={styles.avatar} />}
          <span className={styles.userName}>{user?.name}</span>
          <button className={styles.logoutBtn} onClick={() => { logout(); navigate('/login'); }}>Logout</button>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.pageTitle}>
          <h1 className={styles.title}>Your Shared Leads</h1>
          <p className={styles.subtitle}>Schools shared with you by the admin team</p>
          {!loading && <span className={styles.countBadge}>{leads.length} school{leads.length !== 1 ? 's' : ''}</span>}
        </div>

        <div className={styles.list}>
          {loading && [...Array(4)].map((_, i) => (
            <div key={i} className={styles.card}>
              <div className={styles.cardTop}>
                <div className={styles.skel} style={{ height: 16, width: '65%' }} />
                <div className={styles.skel} style={{ height: 22, width: 60, borderRadius: 6 }} />
              </div>
              <div className={styles.skel} style={{ height: 13, width: '50%' }} />
              <div className={styles.skel} style={{ height: 13, width: '40%' }} />
              <div className={styles.cardMeta}>
                <div className={styles.skel} style={{ height: 26, width: 110, borderRadius: 6 }} />
                <div className={styles.skel} style={{ height: 26, width: 100, borderRadius: 6 }} />
              </div>
              <div className={styles.cardBottom}>
                <div className={styles.skel} style={{ height: 13, width: 80 }} />
                <div className={styles.skel} style={{ height: 34, width: 160, borderRadius: 8 }} />
              </div>
            </div>
          ))}

          {!loading && leads.length === 0 && (
            <div className={styles.empty}>
              <div className={styles.emptyIcon}>📋</div>
              <p className={styles.emptyTitle}>No leads shared yet</p>
              <p className={styles.emptyDesc}>The admin will share school leads with you soon.</p>
            </div>
          )}

          {!loading && leads.map(school => {
            const eff = calcEfficiency(school);
            return (
              <div key={school._id} className={styles.card}>
                <div className={styles.cardTop}>
                  <h2 className={styles.schoolName}>{school.schoolName}</h2>
                  {school._source && <span className={styles.region}>{school._source}</span>}
                </div>

                {school.address && <p className={styles.address}>{school.address}</p>}
                <p className={styles.location}>
                  {[school.district, school.state].filter(Boolean).join(', ')}
                </p>

                <div className={styles.cardMeta}>
                  {school.totalStudents != null && (
                    <span className={styles.metaItem}>🎓 {school.totalStudents} students</span>
                  )}
                  {school.totalTeachers != null && (
                    <span className={styles.metaItem}>👩‍🏫 {school.totalTeachers} teachers</span>
                  )}
                  <EfficiencyBadge value={eff} />
                </div>

                <div className={styles.cardBottom}>
                  {school.pincode && <span className={styles.pincode}>📍 {school.pincode}</span>}
                  <button
                    className={styles.viewBtn}
                    onClick={() => navigate(`/school/${school._id}`)}
                  >
                    View Report Card →
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      <footer className={styles.footer}>
        <span className={styles.footerBrand}>Vistaar</span>
        <span className={styles.footerText}>The process of expanding, growing, or explaining something in greater detail.</span>
      </footer>
    </div>
  );
}
