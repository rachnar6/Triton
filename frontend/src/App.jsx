import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import Navbar from './components/Navbar.jsx';
import Landing from './pages/Landing.jsx';
import AuthPortal from './pages/AuthPortal.jsx';
import SeniorPortal from './pages/SeniorPortal.jsx';
import VolunteerPortal from './pages/VolunteerPortal.jsx';
import AdminPortal from './pages/AdminPortal.jsx';
import ProfilePortal from './pages/ProfilePortal.jsx';
import TaskHistory from './pages/TaskHistory.jsx';
import Settings from './pages/Settings.jsx';

function Protected({ role, children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="spinner-text">Loading...</div>;
  if (!user) return <Navigate to="/login-register" replace />;
  if (role && user.role !== role) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <div className="page">
      <Navbar />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login-register" element={<AuthPortal />} />
        <Route
          path="/senior"
          element={
            <Protected role="SENIOR">
              <SeniorPortal />
            </Protected>
          }
        />
        <Route
          path="/volunteer"
          element={
            <Protected role="VOLUNTEER">
              <VolunteerPortal />
            </Protected>
          }
        />
        <Route
          path="/admin"
          element={
            <Protected role="ADMIN">
              <AdminPortal />
            </Protected>
          }
        />
        <Route
          path="/profile"
          element={
            <Protected>
              <ProfilePortal />
            </Protected>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
        <Route path="/history" element={<TaskHistory />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
      <footer className="footer">NeighborCare — Community Senior Assistance</footer>
    </div>
  );
}