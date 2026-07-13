import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import LabAdminDashboard from './pages/LabAdminDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import StudentDashboard from './pages/StudentDashboard';
import QrScannerSimulator from './components/QrScannerSimulator';
import { Scan } from 'lucide-react';

const AppContent = () => {
  const { user } = useAuth();
  const [showSimulator, setShowSimulator] = useState(false);

  return (
    <div style={{ minHeight: '100vh', position: 'relative' }}>
      {!user ? (
        <Login />
      ) : (
        <>
          {user.role === 'Admin' && <AdminDashboard />}
          {user.role === 'LabAdmin' && <LabAdminDashboard />}
          {user.role === 'Teacher' && <TeacherDashboard />}
          {user.role === 'Student' && <StudentDashboard />}
          
          {/* Floating QR scan simulator triggers */}
          <button 
            onClick={() => setShowSimulator(true)} 
            style={styles.floatingSimBtn} 
            className="btn btn-primary"
            title="Open Attendance QR Code Scanner Simulator"
          >
            <Scan size={20} />
            <span>Attendance QR Simulator</span>
          </button>
        </>
      )}

      {showSimulator && (
        <QrScannerSimulator onClose={() => setShowSimulator(false)} />
      )}
    </div>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

const styles = {
  floatingSimBtn: {
    position: 'fixed',
    bottom: '24px',
    right: '24px',
    zIndex: 999,
    boxShadow: '0 6px 20px rgba(99, 102, 241, 0.4)',
    borderRadius: '30px',
    padding: '12px 24px',
  }
};

export default App;
