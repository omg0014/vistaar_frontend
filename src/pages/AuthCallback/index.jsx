import { useEffect } from 'react';

export default function AuthCallback() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.slice(1));
    const idToken = params.get('id_token');
    const bc = new BroadcastChannel('vistaar_auth');
    bc.postMessage({ credential: idToken || null });
    setTimeout(() => { bc.close(); window.close(); }, 100);
  }, []);

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: '100vh', background: '#0d0b2a', color: 'rgba(255,255,255,0.7)',
      fontSize: '1rem', fontFamily: 'inherit',
    }}>
      Completing sign in…
    </div>
  );
}
