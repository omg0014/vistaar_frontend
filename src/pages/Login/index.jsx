import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { API_BASE } from '../../constants/api';
import styles from './Login.module.css';

const REGIONS = [
  { name: 'The Western Corridor',       desc: 'Maharashtra · Gujarat · Rajasthan', color: '#f59e0b' },
  { name: 'Central Hindi Heartland',    desc: 'Madhya Pradesh · Uttar Pradesh',     color: '#a78bfa' },
  { name: 'The South Fifer',            desc: 'Tamil Nadu · Kerala · Karnataka',    color: '#34d399' },
  { name: 'The Real North',             desc: 'Haryana · Punjab · Chandigarh',      color: '#60a5fa' },
  { name: 'Eastern Marwadi Stronghold', desc: 'West Bengal · Odisha · Assam',       color: '#f87171' },
];

export default function Login() {
  const { login }  = useAuth();
  const navigate   = useNavigate();
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
  const bcRef = useRef(null);

  useEffect(() => {
    return () => { if (bcRef.current) bcRef.current.close(); };
  }, []);

  async function handleSuccess(credential) {
    setLoading(true);
    setError('');
    try {
      const res  = await fetch(`${API_BASE}/api/auth/google`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ credential }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Login failed.'); setLoading(false); return; }
      login(data.token, data.user);
      navigate(data.user.role === 'broker' ? '/broker' : '/');
    } catch {
      setError('Could not connect to server. Please try again.');
      setLoading(false);
    }
  }

  function handleGoogleLogin() {
    setError('');
    const nonce = btoa(Math.random().toString()).slice(0, 16);
    const params = new URLSearchParams({
      client_id:     process.env.REACT_APP_GOOGLE_CLIENT_ID,
      redirect_uri:  `${window.location.origin}/auth/callback`,
      response_type: 'id_token',
      scope:         'openid email profile',
      nonce,
    });
    window.open(
      `https://accounts.google.com/o/oauth2/v2/auth?${params}`,
      'google-signin',
      'width=500,height=600,left=200,top=100'
    );
    if (bcRef.current) bcRef.current.close();
    bcRef.current = new BroadcastChannel('vistaar_auth');
    bcRef.current.onmessage = async (e) => {
      bcRef.current.close();
      bcRef.current = null;
      if (e.data.credential) await handleSuccess(e.data.credential);
      else setError('Sign-in was cancelled or failed. Please try again.');
    };
  }

  return (
    <div
      className={styles.page}
      style={{
        backgroundImage: `url(${process.env.PUBLIC_URL}/image.jpeg)`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }}
    >
      <main className={styles.main}>
        <h1 className={styles.title}>Vistaar</h1>

        <p className={styles.subtitle}>
          'विस्तार' मार्गदर्शेन, भारतं विश्वगौरवम्।<br />
          युगपुरुषाः युगरूपाश्च, शिक्षया सन्तु दीपिताः॥
        </p>

        <p className={styles.tagline}>India's school data, explored intelligently.</p>

        <div className={styles.signBox}>
          <p className={styles.signTitle}>Welcome to Vistaar</p>
          <p className={styles.signHint}>Sign in with your Google account to continue</p>
          {loading ? (
            <div className={styles.loadingRow}>
              <div className={styles.spinner} />
              <span className={styles.loadingText}>Signing you in…</span>
            </div>
          ) : (
            <button className={styles.googleBtn} onClick={handleGoogleLogin}>
              <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
                <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z"/>
                <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 0 1-7.18-2.54H1.83v2.07A8 8 0 0 0 8.98 17z"/>
                <path fill="#FBBC05" d="M4.5 10.52a4.8 4.8 0 0 1 0-3.04V5.41H1.83a8 8 0 0 0 0 7.18z"/>
                <path fill="#EA4335" d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 0 0 1.83 5.4L4.5 7.49a4.77 4.77 0 0 1 4.48-3.31z"/>
              </svg>
              Sign in with Google
            </button>
          )}
          {error && <p className={styles.error}>{error}</p>}
          <p className={styles.accessNote}>Access restricted to authorised users only</p>
        </div>

        <div className={styles.statsCard}>
          <div className={styles.statItem}>
            <span className={styles.statEmoji}>🏫</span>
            <span className={styles.statNum}>94,268</span>
            <span className={styles.statLabel}>Schools</span>
          </div>
          <div className={styles.statLine} />
          <div className={styles.statItem}>
            <span className={styles.statEmoji}>📍</span>
            <span className={styles.statNum}>5</span>
            <span className={styles.statLabel}>Regions</span>
          </div>
          <div className={styles.statLine} />
          <div className={styles.statItem}>
            <span className={styles.statEmoji}>🗄️</span>
            <span className={styles.statNum}>107</span>
            <span className={styles.statLabel}>Data Fields</span>
          </div>
        </div>
      </main>

      <section className={styles.regionsSection}>
        <div className={styles.regionsDivider} />
        <h2 className={styles.regionsTitle}>Explore Regions</h2>
        <p className={styles.regionsSubtitle}>Five distinct education corridors across Bharat</p>
        <div className={styles.regionsRow}>
          {REGIONS.map(r => (
            <div key={r.name} className={styles.regionCard}>
              <span className={styles.regionDot} style={{ background: r.color, boxShadow: `0 0 10px ${r.color}` }} />
              <div>
                <p className={styles.regionName}>{r.name}</p>
                <p className={styles.regionDesc}>{r.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <footer className={styles.footer}>
        <span className={styles.footerBrand}>Vistaar</span>
        <span className={styles.footerSep}>·</span>
        <span className={styles.footerText}>The process of expanding, growing, or explaining something in greater detail.</span>
      </footer>
    </div>
  );
}
