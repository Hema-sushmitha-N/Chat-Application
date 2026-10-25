import { Routes, Route, Navigate } from 'react-router-dom';
import Register from './pages/Register.jsx';
import { useAuth } from './context/AuthContext.jsx';

// Temporary landing page so a successful registration has somewhere to go.
// Replaced by the protected chat page in later steps.
function Home() {
  const { user, logout } = useAuth();
  if (!user) return <Navigate to="/register" replace />;
  return (
    <div className="center-screen">
      <div className="auth-card">
        <h1>Welcome, {user.username}</h1>
        <p className="muted">Registration worked. The chat arrives in later steps.</p>
        <button onClick={logout}>Log out</button>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/register" element={<Register />} />
      <Route path="/" element={<Home />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
