import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import QRCode from 'qrcode';
import { 
  QrCode, User, FileText, CheckCircle, 
  MapPin, LogOut, Clock, ShieldCheck 
} from 'lucide-react';

const StudentDashboard = () => {
  const { user, logout, apiCall } = useAuth();
  const [activeTab, setActiveTab] = useState('card');
  const [qrUrl, setQrUrl] = useState('');
  
  // Records
  const [attendance, setAttendance] = useState([]);
  const [marks, setMarks] = useState([]);
  const [exams, setExams] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [sessions, setSessions] = useState([]);

  const loadData = async () => {
    try {
      // Get attendance records
      const attRes = await apiCall('academic', `/api/attendance/student/${user.identifier}`);
      if (attRes.success) setAttendance(attRes.data);

      // Get subjects list
      const subRes = await apiCall('academic', '/api/subject');
      if (subRes.success) setSubjects(subRes.data);

      // Get all sessions to match names
      const classRes = await apiCall('academic', '/api/class');
      if (classRes.success && classRes.data.length > 0) {
        // Find matching class
        const myClass = classRes.data.find(c => c.program.toLowerCase() === user.program.toLowerCase() && c.year === user.year);
        if (myClass) {
          const sessRes = await apiCall('academic', `/api/session/class/${myClass.id}`);
          if (sessRes.success) setSessions(sessRes.data);

          // Get exams list for this class
          const examRes = await apiCall('academic', `/api/exam/class/${myClass.id}`);
          if (examRes.success) {
            setExams(examRes.data);
            // Fetch exam marks
            const examMarksPromises = examRes.data.map(async (ex) => {
              try {
                const markRes = await apiCall('academic', `/api/exam/${ex.id}/marks`);
                const myMark = markRes.success ? markRes.data.find(m => m.enrollmentNumber === user.identifier) : null;
                return { ...ex, score: myMark?.marks || 'N/A' };
              } catch {
                return { ...ex, score: 'N/A' };
              }
            });
            const compiledExams = await Promise.all(examMarksPromises);
            setExams(compiledExams);
          }

          // Get assignments list for this class
          const taskRes = await apiCall('academic', `/api/assignment/class/${myClass.id}`);
          if (taskRes.success) {
            const marksPromises = taskRes.data.map(async (task) => {
              try {
                const markRes = await apiCall('academic', `/api/assignment/${task.id}/marks`);
                const myMark = markRes.success ? markRes.data.find(m => m.enrollmentNumber === user.identifier) : null;
                return { ...task, score: myMark?.marks || 'Pending' };
              } catch {
                return { ...task, score: 'Pending' };
              }
            });
            const compiledMarks = await Promise.all(marksPromises);
            setMarks(compiledMarks);
          }
        }
      }
    } catch (err) {
      console.error("Error loading student dashboards", err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Generate QR code for the student enrollment number
  useEffect(() => {
    if (user?.identifier) {
      QRCode.toDataURL(user.identifier, {
        width: 180,
        margin: 2,
        color: {
          dark: '#0f172a',
          light: '#ffffff'
        }
      })
      .then(url => setQrUrl(url))
      .catch(err => console.error(err));
    }
  }, [user]);

  return (
    <div style={styles.dashboardContainer} className="animate-fade-in">
      {/* Sidebar Nav */}
      <aside style={styles.sidebar} className="glass-panel">
        <div style={styles.sidebarHeader}>
          <div style={styles.adminAvatar}>S</div>
          <div>
            <h4 style={{ fontWeight: 700 }}>Student Portal</h4>
            <p style={styles.adminMail}>{user?.email}</p>
          </div>
        </div>

        <nav style={styles.sidebarNav}>
          <button 
            onClick={() => setActiveTab('card')} 
            style={{ ...styles.navItem, ...(activeTab === 'card' ? styles.navItemActive : {}) }}
          >
            <QrCode size={18} />
            <span>Digital ID Card</span>
          </button>
          <button 
            onClick={() => setActiveTab('logs')} 
            style={{ ...styles.navItem, ...(activeTab === 'logs' ? styles.navItemActive : {}) }}
          >
            <Clock size={18} />
            <span>Attendance Logs</span>
          </button>
          <button 
            onClick={() => setActiveTab('marks')} 
            style={{ ...styles.navItem, ...(activeTab === 'marks' ? styles.navItemActive : {}) }}
          >
            <FileText size={18} />
            <span>Gradebook Summary</span>
          </button>
        </nav>

        <button onClick={logout} style={styles.logoutBtn} className="btn btn-secondary">
          <LogOut size={16} />
          <span>Logout</span>
        </button>
      </aside>

      {/* Main Content */}
      <main style={styles.mainContent}>
        <header style={styles.mainHeader} className="glass-panel">
          <div>
            <h1 className="gradient-text" style={{ fontSize: '1.75rem', fontWeight: 800 }}>
              Student Portal: {user?.name}
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
              Enrollment: <strong>{user?.identifier}</strong> | {user?.program} (Year {user?.year})
            </p>
          </div>
        </header>

        {/* --- TABS --- */}

        {/* 1. DIGITAL ID CARD */}
        {activeTab === 'card' && (
          <div style={styles.cardContainer} className="animate-fade-in">
            <div style={styles.idCard} className="glass-panel">
              <div style={styles.idCardHeader}>
                <h3 style={{ fontWeight: 800, letterSpacing: '-0.02em', fontSize: '1.25rem' }}>EDUPORTAL ID</h3>
                <span style={styles.idBadge}>STUDENT</span>
              </div>

              <div style={styles.idCardBody}>
                <div style={styles.profileSection}>
                  <div style={styles.profilePic}>
                    <User size={48} color="var(--text-muted)" />
                  </div>
                  <div style={styles.profileText}>
                    <h2 style={{ fontSize: '1.35rem', fontWeight: 700 }}>{user?.name}</h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Program: {user?.program}</p>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Academic Year: {user?.year}</p>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: '4px' }}>DOB: {new Date(user?.dateOfBirth).toLocaleDateString('en-IN')}</p>
                  </div>
                </div>

                <div style={styles.qrSection}>
                  {qrUrl ? (
                    <div style={styles.qrFrame}>
                      <img src={qrUrl} alt="Enrollment QR" style={styles.qrImg} />
                      <span style={styles.qrLabel}>{user?.identifier}</span>
                    </div>
                  ) : (
                    <div style={styles.qrLoading}>Generating QR Code...</div>
                  )}
                </div>
              </div>

              <div style={styles.idCardFooter}>
                <p>Scan this QR code twice: upon Entering and Leaving class sessions.</p>
              </div>
            </div>
          </div>
        )}

        {/* 2. ATTENDANCE LOGS */}
        {activeTab === 'logs' && (
          <div style={styles.contentGrid}>
            <div style={styles.tableCard} className="glass-panel">
              <h3 style={{ fontWeight: 600, marginBottom: '20px' }}>Your Class Attendance Log</h3>

              <div style={styles.tableWrapper}>
                <table style={styles.table}>
                  <thead>
                    <tr style={styles.tableHeaderRow}>
                      <th style={styles.th}>Date</th>
                      <th style={styles.th}>Subject</th>
                      <th style={styles.th}>Check-In (IST)</th>
                      <th style={styles.th}>Check-Out (IST)</th>
                      <th style={styles.th}>Attendance Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendance.length === 0 && (
                      <tr>
                        <td colSpan="5" style={styles.noDataCell}>No attendance scans logged yet.</td>
                      </tr>
                    )}
                    {attendance.map((att) => {
                      const session = sessions.find(s => s.id === att.classSessionId);
                      const subject = session ? subjects.find(sub => sub.id === session.subjectId) : null;
                      return (
                        <tr key={att.id} style={styles.tr}>
                          <td style={styles.td}>
                            {session ? new Date(session.sessionDateTime).toLocaleDateString('en-IN') : 'N/A'}
                          </td>
                          <td style={styles.td}>
                            {subject ? <strong>{subject.name}</strong> : 'Class Session'}
                          </td>
                          <td style={styles.td}>
                            {att.checkInTime ? new Date(att.checkInTime).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' }) : '--'}
                          </td>
                          <td style={styles.td}>
                            {att.checkOutTime ? new Date(att.checkOutTime).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' }) : '--'}
                          </td>
                          <td style={styles.td}>
                            <span className={`badge ${att.status === 'Present' ? 'badge-student' : att.status === 'Partial' ? 'badge-labadmin' : 'badge-danger'}`}>
                              {att.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 3. MARKS TRANSCRIPT */}
        {activeTab === 'marks' && (
          <div style={styles.contentGrid}>
            <div style={styles.twoColumnGrid}>
              
              {/* Assignment Grades */}
              <div style={styles.tableCard} className="glass-panel" style={{ flex: 1 }}>
                <h3 style={{ fontWeight: 600, padding: '24px 24px 12px 24px' }}>Assignment Rubrics</h3>
                <div style={styles.tableWrapper}>
                  <table style={styles.table}>
                    <thead>
                      <tr style={styles.tableHeaderRow}>
                        <th style={styles.th}>Assignment</th>
                        <th style={styles.th}>Score Achieved</th>
                      </tr>
                    </thead>
                    <tbody>
                      {marks.length === 0 && (
                        <tr>
                          <td colSpan="2" style={styles.noDataCell}>No assignments found.</td>
                        </tr>
                      )}
                      {marks.map((m) => (
                        <tr key={m.id} style={styles.tr}>
                          <td style={styles.td}><strong>{m.title}</strong></td>
                          <td style={{ ...styles.td, fontWeight: '700', color: m.score === 'Pending' ? 'var(--text-muted)' : 'var(--secondary)' }}>
                            {m.score} {m.score !== 'Pending' && '/ 100'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Semester Exam Grades */}
              <div style={styles.tableCard} className="glass-panel" style={{ flex: 1 }}>
                <h3 style={{ fontWeight: 600, padding: '24px 24px 12px 24px' }}>Semester Term Exams</h3>
                <div style={styles.tableWrapper}>
                  <table style={styles.table}>
                    <thead>
                      <tr style={styles.tableHeaderRow}>
                        <th style={styles.th}>Exam Subject</th>
                        <th style={styles.th}>Final Grade</th>
                      </tr>
                    </thead>
                    <tbody>
                      {exams.length === 0 && (
                        <tr>
                          <td colSpan="2" style={styles.noDataCell}>No exams graded yet.</td>
                        </tr>
                      )}
                      {exams.map((ex) => (
                        <tr key={ex.id} style={styles.tr}>
                          <td style={styles.td}><strong>{ex.title}</strong></td>
                          <td style={{ ...styles.td, fontWeight: '700', color: ex.score === 'N/A' ? 'var(--text-muted)' : 'var(--accent)' }}>
                            {ex.score} {ex.score !== 'N/A' && `/ ${ex.maxMarks}`}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          </div>
        )}

      </main>
    </div>
  );
};

const styles = {
  dashboardContainer: {
    display: 'flex',
    minHeight: '100vh',
    padding: '24px',
    gap: '24px',
  },
  sidebar: {
    width: '280px',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    height: 'calc(100vh - 48px)',
    position: 'sticky',
    top: '24px',
  },
  sidebarHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    paddingBottom: '20px',
    borderBottom: '1px solid var(--border-glass)',
    marginBottom: '20px',
  },
  adminAvatar: {
    width: '44px',
    height: '44px',
    borderRadius: '12px',
    background: 'linear-gradient(135deg, var(--success), var(--secondary))',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '800',
    color: '#fff',
    fontSize: '1.2rem',
  },
  adminMail: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
    marginTop: '2px',
  },
  sidebarNav: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    flexGrow: 1,
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    borderRadius: '10px',
    border: 'none',
    background: 'none',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    textAlign: 'left',
    fontSize: '0.92rem',
    fontWeight: '500',
    transition: 'var(--transition-smooth)',
    width: '100%',
  },
  navItemActive: {
    background: 'rgba(255, 255, 255, 0.08)',
    color: '#fff',
    borderLeft: '4px solid var(--success)',
    paddingLeft: '12px',
  },
  logoutBtn: {
    marginTop: 'auto',
    width: '100%',
  },
  mainContent: {
    flexGrow: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  mainHeader: {
    padding: '24px',
  },
  cardContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '40px 0',
  },
  idCard: {
    width: '100%',
    maxWidth: '480px',
    overflow: 'hidden',
  },
  idCardHeader: {
    background: 'linear-gradient(135deg, #10b981, #059669)',
    padding: '20px 24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
  },
  idBadge: {
    fontSize: '0.75rem',
    fontWeight: '700',
    background: 'rgba(255, 255, 255, 0.15)',
    color: '#fff',
    padding: '4px 10px',
    borderRadius: '99px',
    letterSpacing: '0.05em',
  },
  idCardBody: {
    padding: '28px 24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '20px',
  },
  profileSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  profilePic: {
    width: '72px',
    height: '72px',
    borderRadius: '50%',
    background: 'rgba(255,255,255,0.05)',
    border: '2px solid var(--border-glass-focus)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileText: {
    display: 'flex',
    flexDirection: 'column',
    gap: '3px',
  },
  qrSection: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrFrame: {
    padding: '12px',
    background: '#fff',
    borderRadius: '12px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '6px',
  },
  qrImg: {
    width: '120px',
    height: '120px',
  },
  qrLabel: {
    color: '#0f172a',
    fontSize: '0.75rem',
    fontWeight: '700',
    letterSpacing: '0.02em',
  },
  qrLoading: {
    fontSize: '0.82rem',
    color: 'var(--text-muted)',
  },
  idCardFooter: {
    borderTop: '1px solid var(--border-glass)',
    padding: '16px 24px',
    fontSize: '0.78rem',
    color: 'var(--text-secondary)',
    textAlign: 'center',
    lineHeight: '1.4',
  },
  contentGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  tableCard: {
    padding: '24px',
  },
  tableWrapper: {
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left',
  },
  tableHeaderRow: {
    borderBottom: '2px solid var(--border-glass)',
  },
  th: {
    padding: '12px 16px',
    fontSize: '0.85rem',
    fontWeight: '600',
    color: 'var(--text-secondary)',
    textTransform: 'uppercase',
  },
  tr: {
    borderBottom: '1px solid var(--border-glass)',
  },
  td: {
    padding: '16px',
    fontSize: '0.9rem',
    color: 'var(--text-primary)',
  },
  noDataCell: {
    textAlign: 'center',
    padding: '40px',
    color: 'var(--text-muted)',
    fontSize: '0.9rem',
  },
  twoColumnGrid: {
    display: 'flex',
    gap: '24px',
    flexWrap: 'wrap',
  },
};

export default StudentDashboard;
