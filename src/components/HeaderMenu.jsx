import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import useAuthFetch from '../hooks/useAuthFetch';
import { API_BASE } from '../constants/api';
import styles from './HeaderMenu.module.css';

// Shared top-right avatar + hamburger menu used on the home and bookmarks pages.
// For admins it also surfaces a Notifications panel listing mandatory-disclosure
// link requests; pending ones are red, and "Done" resolves a request to green.
export default function HeaderMenu() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const apiFetch = useAuthFetch();
  const isAdmin = user?.role === 'admin';

  const [open, setOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [requests, setRequests] = useState([]);
  const [resolving, setResolving] = useState(null);
  const ref = useRef(null);

  const pendingCount = requests.filter(r => r.status === 'pending').length;

  const loadRequests = useCallback(() => {
    if (!isAdmin) return;
    apiFetch(`${API_BASE}/api/schools/disclosure-requests/list`, { method: 'POST' })
      .then(r => r.json())
      .then(d => setRequests(Array.isArray(d.requests) ? d.requests : []))
      .catch(() => {});
  }, [isAdmin, apiFetch]);

  // Fetch once for the badge; refetch whenever the panel opens so status stays
  // in sync with edits made on the school report card.
  useEffect(() => { loadRequests(); }, [loadRequests]);
  useEffect(() => { if (notifOpen) loadRequests(); }, [notifOpen, loadRequests]);

  useEffect(() => {
    if (!open && !notifOpen) return;
    function handleOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) { setOpen(false); setNotifOpen(false); }
    }
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [open, notifOpen]);

  async function markDone(id) {
    setResolving(id);
    try {
      await apiFetch(`${API_BASE}/api/schools/disclosure-requests/${id}/done`, { method: 'PATCH' });
      setRequests(prev => prev.map(r => r._id === id ? { ...r, status: 'resolved' } : r));
    } catch {}
    setResolving(null);
  }

  return (
    <div className={styles.wrap} ref={ref}>
      {user?.picture && <img src={user.picture} alt={user.name} className={styles.avatar} />}
      <button className={styles.btn} onClick={() => { setOpen(o => !o); setNotifOpen(false); }} aria-label="Menu">
        <span /><span /><span />
      </button>

      {open && (
        <div className={styles.menu}>
          <p className={styles.name}>{user?.name}</p>
          {isAdmin && (
            <>
              <button onClick={() => { setOpen(false); navigate('/bookmarks'); }} className={styles.item}>Bookmarks</button>
              <button onClick={() => { setOpen(false); navigate('/saved-searches'); }} className={styles.item}>Saved Searches</button>
              <button onClick={() => { setOpen(false); navigate('/admin'); }} className={styles.item}>Brokers</button>
              <button onClick={() => { setOpen(false); setNotifOpen(true); }} className={styles.item}>
                <span>Notifications</span>
                {pendingCount > 0 && <span className={styles.badge}>{pendingCount}</span>}
              </button>
            </>
          )}
          <button onClick={() => { if (window.confirm('Log out of Vistaar?')) { logout(); navigate('/login'); } }} className={styles.item}>Logout</button>
        </div>
      )}

      {notifOpen && (
        <div className={styles.notifPanel}>
          <div className={styles.notifHeader}>Mandatory Disclosure Requests</div>
          <div className={styles.notifList}>
            {requests.length === 0 && <p className={styles.notifEmpty}>No requests yet.</p>}
            {requests.map(req => {
              const pending = req.status === 'pending';
              return (
                <div key={req._id} className={`${styles.notifRow} ${pending ? styles.pending : styles.resolved}`}>
                  <p className={styles.notifSchool}>{req.schoolName || 'Unknown school'}</p>
                  <p className={styles.notifMeta}>
                    {[req.district, req.state].filter(Boolean).join(', ')}
                    {req.website && (req.district || req.state) ? ' · ' : ''}
                    {req.website && <a href={/^https?:\/\//i.test(req.website) ? req.website : `https://${req.website}`} target="_blank" rel="noreferrer" style={{ color: '#2563eb' }}>website</a>}
                  </p>
                  <div className={styles.notifFoot}>
                    <button
                      onClick={() => { setNotifOpen(false); navigate(`/school/${req.schoolId}`); }}
                      style={{ background: 'none', border: 'none', padding: 0, color: '#7c3aed', fontSize: '0.76rem', fontWeight: 600, cursor: 'pointer' }}
                    >
                      View lead →
                    </button>
                    {pending
                      ? <button className={styles.doneBtn} disabled={resolving === req._id} onClick={() => markDone(req._id)}>{resolving === req._id ? '…' : 'Done'}</button>
                      : <span className={`${styles.notifStatus} ${styles.resolved}`}>Resolved</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
