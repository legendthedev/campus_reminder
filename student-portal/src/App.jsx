import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { isLoggedIn } from './services/auth';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Home from './pages/Home';
import Timetable from './pages/Timetable';
import MapView from './pages/MapView';
import Notifications from './pages/Notifications';
import Survey from './pages/Survey';
import Settings from './pages/Settings';

function AppLayout({ children }) {
  if (!isLoggedIn()) return <Navigate to="/login" replace />;
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#111111' }}>
      <Sidebar />
      <div style={{
        flex: 1,
        marginLeft: 260,
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
      }}>
        <Topbar />
        <main style={{ flex: 1, overflowY: 'auto', padding: '28px 32px' }}>
          {children}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/" element={<AppLayout><Home /></AppLayout>} />
        <Route path="/timetable" element={<AppLayout><Timetable /></AppLayout>} />
        <Route path="/map" element={<AppLayout><MapView /></AppLayout>} />
        <Route path="/notifications" element={<AppLayout><Notifications /></AppLayout>} />
        <Route path="/survey" element={<AppLayout><Survey /></AppLayout>} />
        <Route path="/settings" element={<AppLayout><Settings /></AppLayout>} />
        <Route path="*" element={<Navigate to={isLoggedIn() ? '/' : '/login'} replace />} />
      </Routes>
    </BrowserRouter>
  );
}
