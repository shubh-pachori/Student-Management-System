import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Scan, CheckCircle, RefreshCw, X } from 'lucide-react';

const QrScannerSimulator = ({ onClose }) => {
  const { apiCall } = useAuth();
  const [students, setStudents] = useState([]);
  const [sessions, setSessions] = useState([]);
  
  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedSession, setSelectedSession] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadInitialData = async () => {
    try {
      // Load students from IdentityService
      const studentsData = await apiCall('auth', '/api/admin/students');
      if (studentsData.success) {
        setStudents(studentsData.data);
        if (studentsData.data.length > 0) {
          setSelectedStudent(studentsData.data[0].enrollmentNumber);
        }
      }

      // Load classes and sessions from AcademicService
      const classesData = await apiCall('academic', '/api/class');
      if (classesData.success && classesData.data.length > 0) {
        // Just load all sessions for the first class for simulator ease
        const firstClassId = classesData.data[0].id;
        const sessionsData = await apiCall('academic', `/api/session/class/${firstClassId}`);
        if (sessionsData.success) {
          setSessions(sessionsData.data);
          if (sessionsData.data.length > 0) {
            setSelectedSession(sessionsData.data[0].id);
          }
        }
      }
    } catch (err) {
      console.error("Failed to load simulator lists", err);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const handleSimulateScan = async (type) => {
    if (!selectedStudent || !selectedSession) {
      setError("Please select both a student and a session.");
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const data = await apiCall('academic', '/api/attendance/scan-qr', 'POST', {
        classSessionId: selectedSession,
        enrollmentNumber: selectedStudent
      });

      if (data.success) {
        setMessage(`Success: ${data.message} - Status is now ${data.data.status}`);
      }
    } catch (err) {
      setError(err.message || "Scanning simulation failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.backdrop}>
      <div style={styles.modal} className="glass-panel">
        <div style={styles.titleRow}>
          <div style={styles.titleGroup}>
            <Scan size={20} color="var(--primary)" />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>QR Attendance Scanner Simulator</h3>
          </div>
          {onClose && (
            <button onClick={onClose} style={styles.closeBtn}>
              <X size={18} />
            </button>
          )}
        </div>

        <p style={styles.hint}>
          Students scan their Enrollment QR Code card twice (upon entry and exit) to register attendance in IST. Use this panel to simulate check-in and check-out.
        </p>

        {error && <div style={styles.error}>{error}</div>}
        {message && <div style={styles.success}>{message}</div>}

        <div style={styles.formGroup}>
          <label style={styles.label}>Select Student (Enrollment Number)</label>
          <select
            value={selectedStudent}
            onChange={(e) => setSelectedStudent(e.target.value)}
            className="glass-input"
            style={styles.select}
          >
            {students.length === 0 && <option value="">No students available (Add some in Admin panel)</option>}
            {students.map((st) => (
              <option key={st.id} value={st.enrollmentNumber}>
                {st.name} ({st.enrollmentNumber})
              </option>
            ))}
          </select>
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Select Scheduled Class Session</label>
          <select
            value={selectedSession}
            onChange={(e) => setSelectedSession(e.target.value)}
            className="glass-input"
            style={styles.select}
          >
            {sessions.length === 0 && <option value="">No sessions available (Schedule in Coordinator panel)</option>}
            {sessions.map((se) => (
              <option key={se.id} value={se.id}>
                Session {se.status} - {new Date(se.sessionDateTime).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
              </option>
            ))}
          </select>
        </div>

        <div style={styles.btnRow}>
          <button
            onClick={() => handleSimulateScan('in')}
            className="btn btn-primary"
            style={{ flex: 1 }}
            disabled={loading || students.length === 0 || sessions.length === 0}
          >
            Simulate Scan (Entry/Exit)
          </button>
          <button
            onClick={loadInitialData}
            className="btn btn-secondary"
            style={{ width: '48px', padding: 0 }}
            title="Refresh Lists"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

const styles = {
  backdrop: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  modal: {
    width: '100%',
    maxWidth: '460px',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  titleRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid var(--border-glass)',
    paddingBottom: '12px',
  },
  titleGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
  },
  hint: {
    fontSize: '0.82rem',
    color: 'var(--text-secondary)',
    lineHeight: '1.4',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '0.8rem',
    color: 'var(--text-secondary)',
    fontWeight: '500',
  },
  select: {
    cursor: 'pointer',
    appearance: 'none',
    background: 'rgba(15, 23, 42, 0.8) url("data:image/svg+xml;utf8,<svg fill=\'%2394a3b8\' height=\'24\' viewBox=\'0 0 24 24\' width=\'24\' xmlns=\'http://www.w3.org/2000/svg\'><path d=\'M7 10l5 5 5-5z\'/><path d=\'M0 0h24v24H0z\' fill=\'none\'/></svg>") no-repeat right 12px center',
  },
  btnRow: {
    display: 'flex',
    gap: '8px',
    marginTop: '8px',
  },
  error: {
    padding: '10px',
    background: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.2)',
    borderRadius: '8px',
    color: '#fda4af',
    fontSize: '0.8rem',
  },
  success: {
    padding: '10px',
    background: 'rgba(16, 185, 129, 0.1)',
    border: '1px solid rgba(16, 185, 129, 0.2)',
    borderRadius: '8px',
    color: '#a7f3d0',
    fontSize: '0.8rem',
  },
};

export default QrScannerSimulator;
