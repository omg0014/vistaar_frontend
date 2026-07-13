import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Search from './pages/Search';
import Results from './pages/Results';
import SchoolDetail from './pages/SchoolDetail';
import Bookmarks from './pages/Bookmarks';
import Login from './pages/Login';
import AuthCallback from './pages/AuthCallback';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? children : <Navigate to="/login" replace />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/"            element={<PrivateRoute><Search /></PrivateRoute>} />
        <Route path="/results"     element={<PrivateRoute><Results /></PrivateRoute>} />
        <Route path="/school/:id"       element={<PrivateRoute><SchoolDetail /></PrivateRoute>} />
        <Route path="/school/:id/:slug" element={<PrivateRoute><SchoolDetail /></PrivateRoute>} />
        <Route path="/bookmarks"   element={<PrivateRoute><Bookmarks /></PrivateRoute>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
