import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Calendar, BookOpen, ClipboardList, Plus, 
  Lock, Edit, LogOut, Check, X, ShieldAlert 
} from 'lucide-react';

const TeacherDashboard = () => {
  const { user, logout, apiCall } = useAuth();
  const [activeTab, setActiveTab] = useState('sessions');

  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [sessions, setSessions] = useState([]);
  
  // Topic Covered state
  const [activeSession, setActiveSession] = useState(null);
  const [topicCovered, setTopicCovered] = useState('');
  const [rosterAttendance, setRosterAttendance] = useState([]);

  // Assignments state
  const [assignments, setAssignments] = useState([]);
  const [showAddAssignment, setShowAddAssignment] = useState(false);
  const [newAssignment, setNewAssignment] = useState({ classId: '', subjectId: '', title: '', description: '', dueDate: '' });
  
  // Grading state
  const [activeAssignmentForGrades, setActiveAssignmentForGrades] = useState(null);
  const [studentGrades, setStudentGrades] = useState([]);
  const [students, setStudents] = useState([]);

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadData = async () => {
    try {
      // Get classes
      const classRes = await apiCall('academic', '/api/class');
      if (classRes.success) setClasses(classRes.data);

      // Get subjects
      const subRes = await apiCall('academic', '/api/subject');
      if (subRes.success) setSubjects(subRes.data);

      // Get synced students
      const studRes = await apiCall('auth', '/api/admin/students');
      if (studRes.success) setStudents(studRes.data);

      // Get scheduled sessions for this teacher
      const sessRes = await apiCall('academic', `/api/session/teacher/${user.id}`);
      if (sessRes.success) setSessions(sessRes.data);

      // Get assignments created by this teacher
      const assignRes = await apiCall('academic', `/api/assignment/teacher/${user.id}`);
      if (assignRes.success) setAssignments(assignRes.data);

    } catch (err) {
      console.error(err);
      setError('Failed to fetch teacher roster lists.');
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const showNotification = (msg, isError = false) => {
    if (isError) {
      setError(msg);
      setMessage('');
    } else {
      setMessage(msg);
      setError('');
    }
    setTimeout(() => {
      setMessage('');
      setError('');
    }, 4000);
  };

  // --- ACTIONS ---

  // Complete session & save topic covered & manual attendance roster
  const handleCompleteSession = async (e) => {
    e.preventDefault();
    try {
      // 1. Log topic covered
      await apiCall('academic', `/api/session/update-topic/${activeSession.id}`, 'PUT', { topicCovered });
      
      // 2. Submit manual attendance
      const records = rosterAttendance.map(a => ({
        enrollmentNumber: a.enrollmentNumber,
        status: a.status
      }));
      await apiCall('academic', '/api/attendance/manual', 'POST', {
        classSessionId: activeSession.id,
        records
      });

      showNotification('Class session completed and roster finalized.');
      setActiveSession(null);
      setTopicCovered('');
      loadData();
    } catch (err) {
      showNotification(err.message, true);
    }
  };

  const handleOpenRoster = async (session) => {
    setActiveSession(session);
    setTopicCovered(session.topicCovered || '');
    
    // Load class students (since we need to take their attendance)
    // Filter students by class program/year to matching class program/year
    const cls = classes.find(c => c.id === session.classId);
    let classStudents = students;
    if (cls) {
      classStudents = students.filter(s => s.program.toLowerCase() === cls.program.toLowerCase() && s.year === cls.year);
    }

    // Load current attendance status if any
    try {
      const attRes = await apiCall('academic', `/api/attendance/session/${session.id}`);
      const existing = attRes.success ? attRes.data : [];
      
      const roster = classStudents.map(st => {
        const record = existing.find(a => a.enrollmentNumber === st.enrollmentNumber);
        return {
          enrollmentNumber: st.enrollmentNumber,
          name: st.name,
          status: record?.status || 'Absent'
        };
      });
      setRosterAttendance(roster);
    } catch (err) {
      console.error(err);
    }
  };

  const toggleRosterStatus = (enrollmentNumber) => {
    setRosterAttendance(rosterAttendance.map(a => 
      a.enrollmentNumber === enrollmentNumber 
        ? { ...a, status: a.status === 'Present' ? 'Absent' : 'Present' } 
        : a
    ));
  };

  const handleAddAssignment = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...newAssignment, teacherId: user.id };
      const res = await apiCall('academic', '/api/assignment', 'POST', payload);
      if (res.success) {
        showNotification('Assignment posted successfully.');
        setShowAddAssignment(false);
        setNewAssignment({ classId: '', subjectId: '', title: '', description: '', dueDate: '' });
        loadData();
      }
    } catch (err) {
      showNotification(err.message, true);
    }
  };

  const handleOpenGrading = async (assignment) => {
    setActiveAssignmentForGrades(assignment);
    
    // Get class students
    const cls = classes.find(c => c.id === assignment.classId);
    let classStudents = students;
    if (cls) {
      classStudents = students.filter(s => s.program.toLowerCase() === cls.program.toLowerCase() && s.year === cls.year);
    }

    // Get current marks
    try {
      const marksRes = await apiCall('academic', `/api/assignment/${assignment.id}/marks`);
      const existingMarks = marksRes.success ? marksRes.data : [];

      const gradesList = classStudents.map(st => {
        const record = existingMarks.find(m => m.enrollmentNumber === st.enrollmentNumber);
        return {
          enrollmentNumber: st.enrollmentNumber,
          name: st.name,
          marks: record?.marks || '',
          isLocked: record?.isLocked || false
        };
      });
      setStudentGrades(gradesList);
    } catch (err) {
      console.error(err);
    }
  };

  const handleGradeChange = (enrollmentNumber, value) => {
    setStudentGrades(studentGrades.map(g => 
      g.enrollmentNumber === enrollmentNumber ? { ...g, marks: value } : g
    ));
  };

  const handleSubmitGrade = async (enrollmentNumber, marks) => {
    try {
      const res = await apiCall('academic', '/api/assignment/marks', 'POST', {
        assignmentId: activeAssignmentForGrades.id,
        enrollmentNumber,
        marks: parseFloat(marks),
        remarks: 'Graded by Teacher'
      });
      if (res.success) {
        showNotification('Grade submitted.');
        // Refresh local locked status
        setStudentGrades(studentGrades.map(g => 
          g.enrollmentNumber === enrollmentNumber ? { ...g, isLocked: true } : g
        ));
      }
    } catch (err) {
      showNotification(err.message, true);
    }
  };

  return (
    <div style={styles.dashboardContainer} className="animate-fade-in">
      {/* Sidebar */}
      <aside style={styles.sidebar} className="glass-panel">
        <div style={styles.sidebarHeader}>
          <div style={styles.adminAvatar}>T</div>
          <div>
            <h4 style={{ fontWeight: 700 }}>Faculty Profile</h4>
            <p style={styles.adminMail}>{user?.email}</p>
          </div>
        </div>

        <nav style={styles.sidebarNav}>
          <button 
            onClick={() => setActiveTab('sessions')} 
            style={{ ...styles.navItem, ...(activeTab === 'sessions' ? styles.navItemActive : {}) }}
          >
            <Calendar size={18} />
            <span>Class Sessions</span>
          </button>
          <button 
            onClick={() => setActiveTab('assignments')} 
            style={{ ...styles.navItem, ...(activeTab === 'assignments' ? styles.navItemActive : {}) }}
          >
            <ClipboardList size={18} />
            <span>Assignments Panel</span>
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
              Faculty Portal: {user?.name}
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
              Create assignments, record student grades, log class topics, and oversee class rosters.
            </p>
          </div>
        </header>

        {error && (
          <div style={styles.alertError} className="animate-fade-in">
            <ShieldAlert size={18} />
            <span>{error}</span>
          </div>
        )}
        {message && (
          <div style={styles.alertSuccess} className="animate-fade-in">
            <span>{message}</span>
          </div>
        )}

        {/* --- TABS --- */}

        {/* 1. SESSIONS TAB */}
        {activeTab === 'sessions' && (
          <div style={styles.contentGrid}>
            {!activeSession ? (
              <div style={styles.tableCard} className="glass-panel">
                <h3 style={{ fontWeight: 600, marginBottom: '20px' }}>Your Class Sessions</h3>
                <div style={styles.tableWrapper}>
                  <table style={styles.table}>
                    <thead>
                      <tr style={styles.tableHeaderRow}>
                        <th style={styles.th}>Date & Time (IST)</th>
                        <th style={styles.th}>Class</th>
                        <th style={styles.th}>Subject</th>
                        <th style={styles.th}>Status</th>
                        <th style={styles.th}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sessions.length === 0 && (
                        <tr>
                          <td colSpan="5" style={styles.noDataCell}>No sessions assigned to you in the schedule.</td>
                        </tr>
                      )}
                      {sessions.map((se) => {
                        const cls = classes.find(c => c.id === se.classId);
                        const subject = subjects.find(s => s.id === se.subjectId);
                        return (
                          <tr key={se.id} style={styles.tr}>
                            <td style={styles.td}><strong>{new Date(se.sessionDateTime).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</strong></td>
                            <td style={styles.td}>{cls?.name}</td>
                            <td style={styles.td}>{subject?.name}</td>
                            <td style={styles.td}>
                              <span className={`badge ${se.status === 'Completed' ? 'badge-student' : 'badge-labadmin'}`}>{se.status}</span>
                            </td>
                            <td style={styles.td}>
                              {se.status !== 'Completed' ? (
                                <button onClick={() => handleOpenRoster(se)} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
                                  Start & Log Session
                                </button>
                              ) : (
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Logged ✓</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div style={styles.tableCard} className="glass-panel">
                <div style={styles.cardHeader}>
                  <h3 style={{ fontWeight: 600 }}>Log Active Session</h3>
                  <button onClick={() => setActiveSession(null)} style={styles.closeBtn}><X size={18} /></button>
                </div>

                <form onSubmit={handleCompleteSession} style={styles.form}>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Log Topic Covered Today</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Introduction to Binary Search Trees and Complexity Analysis"
                      className="glass-input"
                      value={topicCovered}
                      onChange={(e) => setTopicCovered(e.target.value)}
                    />
                  </div>

                  <div style={{ marginTop: '12px' }}>
                    <label style={{ ...styles.label, display: 'block', marginBottom: '12px' }}>Student Roster Attendance Check (Check to Mark Present)</label>
                    <div style={styles.rosterList}>
                      {rosterAttendance.map((st) => (
                        <div key={st.enrollmentNumber} style={styles.rosterRow} onClick={() => toggleRosterStatus(st.enrollmentNumber)}>
                          <div>
                            <strong>{st.name}</strong>
                            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{st.enrollmentNumber}</p>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center' }}>
                            <span className={`badge ${st.status === 'Present' ? 'badge-student' : 'badge-labadmin'}`}>{st.status}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button type="submit" className="btn btn-primary" style={{ marginTop: '16px' }}>
                    Save Topic & Submit Attendance
                  </button>
                </form>
              </div>
            )}
          </div>
        )}

        {/* 2. ASSIGNMENTS TAB */}
        {activeTab === 'assignments' && (
          <div style={styles.contentGrid}>
            {!activeAssignmentForGrades ? (
              <div style={styles.tableCard} className="glass-panel">
                <div style={styles.cardHeader}>
                  <h3 style={{ fontWeight: 600 }}>Active Assignments</h3>
                  <button onClick={() => setShowAddAssignment(true)} className="btn btn-primary">
                    <Plus size={16} />
                    <span>Post Assignment</span>
                  </button>
                </div>

                <div style={styles.tableWrapper}>
                  <table style={styles.table}>
                    <thead>
                      <tr style={styles.tableHeaderRow}>
                        <th style={styles.th}>Title</th>
                        <th style={styles.th}>Class</th>
                        <th style={styles.th}>Due Date (IST)</th>
                        <th style={styles.th}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {assignments.length === 0 && (
                        <tr>
                          <td colSpan="4" style={styles.noDataCell}>No assignments created. Click 'Post Assignment' to start.</td>
                        </tr>
                      )}
                      {assignments.map((a) => {
                        const cls = classes.find(c => c.id === a.classId);
                        return (
                          <tr key={a.id} style={styles.tr}>
                            <td style={styles.td}><strong>{a.title}</strong></td>
                            <td style={styles.td}>{cls?.name}</td>
                            <td style={styles.td}>{new Date(a.dueDate).toLocaleDateString('en-IN')}</td>
                            <td style={styles.td}>
                              <button onClick={() => handleOpenGrading(a)} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
                                Enter Marks
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div style={styles.tableCard} className="glass-panel">
                <div style={styles.cardHeader}>
                  <div>
                    <h3 style={{ fontWeight: 600 }}>Grades Entry: {activeAssignmentForGrades.title}</h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                      Once grades are submitted, they are locked. Modifications must go through the Lab Admin / Class Teacher.
                    </p>
                  </div>
                  <button onClick={() => setActiveAssignmentForGrades(null)} style={styles.closeBtn}><X size={18} /></button>
                </div>

                <div style={styles.rosterList} style={{ marginTop: '20px' }}>
                  {studentGrades.map((st) => (
                    <div key={st.enrollmentNumber} style={styles.rosterRow} style={{ ...styles.rosterRow, cursor: 'default' }}>
                      <div>
                        <strong>{st.name}</strong>
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{st.enrollmentNumber}</p>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <input
                          type="number"
                          placeholder="Score"
                          disabled={st.isLocked}
                          value={st.marks}
                          onChange={(e) => handleGradeChange(st.enrollmentNumber, e.target.value)}
                          className="glass-input"
                          style={{ width: '80px', padding: '6px 8px', textAlign: 'center' }}
                        />
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>/ 100</span>
                        
                        {st.isLocked ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--warning)' }}>
                            <Lock size={14} />
                            <span style={{ fontSize: '0.78rem', fontWeight: 600 }}>Locked</span>
                          </div>
                        ) : (
                          <button 
                            onClick={() => handleSubmitGrade(st.enrollmentNumber, st.marks)}
                            className="btn btn-primary"
                            style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                            disabled={!st.marks}
                          >
                            Submit
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {showAddAssignment && (
              <div style={styles.modalOverlay}>
                <div style={styles.modal} className="glass-panel">
                  <div style={styles.modalHeader}>
                    <h3 style={{ fontWeight: 600 }}>Post Student Assignment</h3>
                    <button onClick={() => setShowAddAssignment(false)} style={styles.closeBtn}><X size={18} /></button>
                  </div>
                  
                  <form onSubmit={handleAddAssignment} style={styles.form}>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>Select Target Class</label>
                      <select
                        className="glass-input"
                        value={newAssignment.classId}
                        onChange={(e) => setNewAssignment({ ...newAssignment, classId: e.target.value })}
                        required
                      >
                        <option value="">Choose class</option>
                        {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>Select Subject</label>
                      <select
                        className="glass-input"
                        value={newAssignment.subjectId}
                        onChange={(e) => setNewAssignment({ ...newAssignment, subjectId: e.target.value })}
                        required
                      >
                        <option value="">Choose subject</option>
                        {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                    </div>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>Assignment Title</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Binary Search Tree Implementation"
                        className="glass-input"
                        value={newAssignment.title}
                        onChange={(e) => setNewAssignment({ ...newAssignment, title: e.target.value })}
                      />
                    </div>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>Description / Guidelines</label>
                      <textarea
                        rows="3"
                        placeholder="Detail formatting specifications, submission portals, etc."
                        className="glass-input"
                        value={newAssignment.description}
                        onChange={(e) => setNewAssignment({ ...newAssignment, description: e.target.value })}
                      />
                    </div>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>Due Date</label>
                      <input
                        type="date"
                        required
                        className="glass-input"
                        value={newAssignment.dueDate}
                        onChange={(e) => setNewAssignment({ ...newAssignment, dueDate: e.target.value })}
                      />
                    </div>
                    
                    <button type="submit" className="btn btn-primary" style={{ marginTop: '10px' }}>
                      Publish Assignment
                    </button>
                  </form>
                </div>
              </div>
            )}
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
    background: 'linear-gradient(135deg, var(--primary), var(--accent))',
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
    borderLeft: '4px solid var(--primary)',
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
  contentGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  tableCard: {
    padding: '24px',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
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
    transition: 'var(--transition-smooth)',
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
  rosterList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  rosterRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '14px 18px',
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid var(--border-glass)',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'var(--transition-smooth)',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  modal: {
    width: '100%',
    maxWidth: '480px',
    padding: '28px',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid var(--border-glass)',
    paddingBottom: '12px',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--text-muted)',
    cursor: 'pointer',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
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
  alertError: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '12px 16px',
    background: 'rgba(239, 68, 68, 0.12)',
    border: '1px solid rgba(239, 68, 68, 0.25)',
    borderRadius: '10px',
    color: '#fda4af',
    fontSize: '0.85rem',
  },
  alertSuccess: {
    padding: '12px 16px',
    background: 'rgba(16, 185, 129, 0.12)',
    border: '1px solid rgba(16, 185, 129, 0.25)',
    borderRadius: '10px',
    color: '#a7f3d0',
    fontSize: '0.85rem',
    textAlign: 'center',
  },
};

export default TeacherDashboard;
