import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

const Search         = lazy(() => import('./pages/Search'));
const Results        = lazy(() => import('./pages/Results'));
const SchoolDetail    = lazy(() => import('./pages/SchoolDetail'));
const Bookmarks       = lazy(() => import('./pages/Bookmarks'));
const Login           = lazy(() => import('./pages/Login'));
const AuthCallback    = lazy(() => import('./pages/AuthCallback'));
const AdminPanel      = lazy(() => import('./pages/Admin'));
const BrokerDashboard = lazy(() => import('./pages/BrokerDashboard'));

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? children : <Navigate to="/login" replace />;
}

function AdminRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  // No role = old token issued before broker feature; force re-login to get new JWT
  if (!user.role) return <Navigate to="/login" replace />;
  if (user.role !== 'admin') return <Navigate to="/broker" replace />;
  return children;
}

function BrokerRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (!user.role) return <Navigate to="/login" replace />;
  if (user.role !== 'broker') return <Navigate to="/" replace />;
  return children;
}

function RouteFallback() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <div style={{
        width: 32, height: 32, borderRadius: '50%',
        border: '3px solid #ede9fe', borderTopColor: '#7c3aed',
        animation: 'spin 0.8s linear infinite',
      }} />
      <style>{'@keyframes spin { to { transform: rotate(360deg); } }'}</style>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/login"        element={<Login />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/public/school/:slug" element={<SchoolDetail publicMode />} />
          <Route path="/"             element={<AdminRoute><Search /></AdminRoute>} />
          <Route path="/results"      element={<AdminRoute><Results /></AdminRoute>} />
          <Route path="/school/:id"       element={<PrivateRoute><SchoolDetail /></PrivateRoute>} />
          <Route path="/school/:id/:slug" element={<PrivateRoute><SchoolDetail /></PrivateRoute>} />
          <Route path="/bookmarks"    element={<AdminRoute><Bookmarks /></AdminRoute>} />
          <Route path="/admin"        element={<AdminRoute><AdminPanel /></AdminRoute>} />
          <Route path="/broker"       element={<BrokerRoute><BrokerDashboard /></BrokerRoute>} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
