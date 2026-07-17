import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Search from './pages/Search';
import Results from './pages/Results';
import SchoolDetail from './pages/SchoolDetail';
import Bookmarks from './pages/Bookmarks';
import Login from './pages/Login';
import AuthCallback from './pages/AuthCallback';
import AdminPanel from './pages/Admin';
import BrokerDashboard from './pages/BrokerDashboard';

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

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login"        element={<Login />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/"             element={<AdminRoute><Search /></AdminRoute>} />
        <Route path="/results"      element={<AdminRoute><Results /></AdminRoute>} />
        <Route path="/school/:id"       element={<PrivateRoute><SchoolDetail /></PrivateRoute>} />
        <Route path="/school/:id/:slug" element={<PrivateRoute><SchoolDetail /></PrivateRoute>} />
        <Route path="/bookmarks"    element={<AdminRoute><Bookmarks /></AdminRoute>} />
        <Route path="/admin"        element={<AdminRoute><AdminPanel /></AdminRoute>} />
        <Route path="/broker"       element={<BrokerRoute><BrokerDashboard /></BrokerRoute>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
