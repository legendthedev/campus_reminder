import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { isLoggedIn, getUser } from './services/auth';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import TimetableManagement from './pages/TimetableManagement';
import StudentManagement from './pages/StudentManagement';
import CourseManagement from './pages/CourseManagement';
import GeofenceConfig from './pages/GeofenceConfig';
import SurveyResults from './pages/SurveyResults';
import AnalyticsView from './pages/AnalyticsView';
import NotificationsPanel from './pages/NotificationsPanel';

function ProtectedLayout({ children }) {
  if (!isLoggedIn()) return <Navigate to="/login" replace />;
  return (
    <div style={{ fontFamily: "'Inter', 'Segoe UI', sans-serif", minHeight: '100vh', background: '#f8f9fa' }}>
      <Navbar />
      <div style={{ display: 'flex' }}>
        <Sidebar />
        <main style={{ flex: 1, minHeight: 'calc(100vh - 56px)', overflowY: 'auto' }}>
          {children}
        </main>
      </div>
    </div>
  );
}

function AdminOnly({ children }) {
  const user = getUser();
  if (user?.role !== 'admin') return <Navigate to="/dashboard" replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<ProtectedLayout><AdminDashboard /></ProtectedLayout>} />
        <Route path="/timetable" element={<ProtectedLayout><TimetableManagement /></ProtectedLayout>} />
        <Route path="/students" element={<ProtectedLayout><StudentManagement /></ProtectedLayout>} />
        <Route path="/courses" element={<ProtectedLayout><CourseManagement /></ProtectedLayout>} />
        <Route path="/geofence" element={<ProtectedLayout><AdminOnly><GeofenceConfig /></AdminOnly></ProtectedLayout>} />
        <Route path="/survey" element={<ProtectedLayout><SurveyResults /></ProtectedLayout>} />
        <Route path="/analytics" element={<ProtectedLayout><AnalyticsView /></ProtectedLayout>} />
        <Route path="/notifications" element={<ProtectedLayout><NotificationsPanel /></ProtectedLayout>} />
        <Route path="*" element={<Navigate to={isLoggedIn() ? '/dashboard' : '/login'} replace />} />
      </Routes>
    </BrowserRouter>
  );
}
