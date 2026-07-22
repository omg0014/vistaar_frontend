import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import styles from './HeaderMenu.module.css';

// Shared top-right avatar + hamburger menu used on the home and bookmarks pages.
export default function HeaderMenu() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    function handleOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [open]);

  return (
    <div className={styles.wrap} ref={ref}>
      {user?.picture && <img src={user.picture} alt={user.name} className={styles.avatar} />}
      <button className={styles.btn} onClick={() => setOpen(o => !o)} aria-label="Menu">
        <span /><span /><span />
      </button>
      {open && (
        <div className={styles.menu}>
          <p className={styles.name}>{user?.name}</p>
          {user?.role === 'admin' && (
            <>
              <button onClick={() => { setOpen(false); navigate('/bookmarks'); }} className={styles.item}>Bookmarks</button>
              <button onClick={() => { setOpen(false); navigate('/saved-searches'); }} className={styles.item}>Saved Searches</button>
              <button onClick={() => { setOpen(false); navigate('/admin'); }} className={styles.item}>Brokers</button>
            </>
          )}
          <button onClick={() => { if (window.confirm('Log out of Vistaar?')) { logout(); navigate('/login'); } }} className={styles.item}>Logout</button>
        </div>
      )}
    </div>
  );
}
