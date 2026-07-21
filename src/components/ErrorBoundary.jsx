import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('Unhandled render error:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          height: '100vh', gap: 16, fontFamily: 'inherit', textAlign: 'center', padding: 24,
        }}>
          <p style={{ fontSize: '1.1rem', fontWeight: 700, color: '#111827' }}>Something went wrong.</p>
          <p style={{ color: '#6b7280', maxWidth: 360 }}>Try reloading the page. If the problem continues, contact the admin team.</p>
          <button
            onClick={() => window.location.reload()}
            style={{ padding: '10px 20px', background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}
          >
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
