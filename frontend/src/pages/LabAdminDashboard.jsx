import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Calendar, Users, BookOpen, FileSpreadsheet, Plus, 
  Clock, Edit, LogOut, Check, X, ShieldAlert, KeyRound 
} from 'lucide-react';

const LabAdminDashboard = () => {
  const { user, logout, apiCall } = useAuth();
  const [activeTab, setActiveTab] = useState('config');

  // Lists
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);

  const [selectedClass, setSelectedClass] = useState(null);

  // Class Config state
  const [assignments, setAssignments] = useState([]);
  const [showAssignTeacher, setShowAssignTeacher] = useState(false);
  const [newAssignment, setNewAssignment] = useState({ subjectId: '', teacherId: '', scheduleTime: '' });

  // Sessions state
  const [sessions, setSessions] = useState([]);
  const [showAddSession, setShowAddSession] = useState(false);
  const [newSession, setNewSession] = useState({ subjectId: '', teacherId: '', sessionDateTime: '' });
  const [reschedulingSession, setReschedulingSession] = useState(null);
  const [rescheduleData, setRescheduleData] = useState({ newDateTime: '', newTeacherId: '' });

  // Overrides / Editing state
  const [sessionAttendance, setSessionAttendance] = useState([]);
  const [selectedSessionForAttendance, setSelectedSessionForAttendance] = useState('');
  const [selectedAssignmentForMarks, setSelectedAssignmentForMarks] = useState('');
  const [assignmentsList, setAssignmentsList] = useState([]);
  const [assignmentMarks, setAssignmentMarks] = useState([]);
  
  // Exams state
  const [exams, setExams] = useState([]);
  const [showAddExam, setShowAddExam] = useState(false);
  const [newExam, setNewExam] = useState({ subjectId: '', title: '', examDate: '', maxMarks: 100 });
  const [selectedExamForMarks, setSelectedExamForMarks] = useState('');
  const [examMarks, setExamMarks] = useState([]);

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadData = async () => {
    try {
      // Load all classes
      const classRes = await apiCall('academic', '/api/class');
      if (classRes.success) {
        setClasses(classRes.data);
        // Find class assigned to this Lab Admin
        const myClass = classRes.data.find(c => c.labAdminId === user.id);
        if (myClass) {
          setSelectedClass(myClass);
        } else if (classRes.data.length > 0) {
          setSelectedClass(classRes.data[0]);
        }
      }

      // Load subjects
      const subRes = await apiCall('academic', '/api/subject');
      if (subRes.success) setSubjects(subRes.data);

      // Load teachers
      const teachRes = await apiCall('auth', '/api/admin/employees?role=Teacher');
      if (teachRes.success) setTeachers(teachRes.data);

      // Load students
      const studRes = await apiCall('auth', '/api/admin/students');
      if (studRes.success) setStudents(studRes.data);

    } catch (err) {
      console.error(err);
      setError(err.message || 'Error loading dashboard metadata.');
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadClassSpecifics = async () => {
    if (!selectedClass) return;
    try {
      // Load teacher-subject assignments
      const assignRes = await apiCall('academic', `/api/class/${selectedClass.id}/assignments`);
      if (assignRes.success) setAssignments(assignRes.data);

      // Load class sessions
      const sessRes = await apiCall('academic', `/api/session/class/${selectedClass.id}`);
      if (sessRes.success) {
        setSessions(sessRes.data);
        if (sessRes.data.length > 0) {
          setSelectedSessionForAttendance(sessRes.data[0].id);
        }
      }

      // Load assignments for marks override
      const taskRes = await apiCall('academic', `/api/assignment/class/${selectedClass.id}`);
      if (taskRes.success) {
        setAssignmentsList(taskRes.data);
        if (taskRes.data.length > 0) {
          setSelectedAssignmentForMarks(taskRes.data[0].id);
        }
      }

      // Load exams
      const examRes = await apiCall('academic', `/api/exam/class/${selectedClass.id}`);
      if (examRes.success) {
        setExams(examRes.data);
        if (examRes.data.length > 0) {
          setSelectedExamForMarks(examRes.data[0].id);
        }
      }

    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadClassSpecifics();
  }, [selectedClass, activeTab]);

  // Load attendance override list
  useEffect(() => {
    if (activeTab === 'override' && selectedSessionForAttendance) {
      apiCall('academic', `/api/attendance/session/${selectedSessionForAttendance}`)
        .then(res => {
          if (res.success) setSessionAttendance(res.data);
        });
    }
  }, [selectedSessionForAttendance, activeTab]);

  // Load assignment marks override list
  useEffect(() => {
    if (activeTab === 'override' && selectedAssignmentForMarks) {
      apiCall('academic', `/api/assignment/${selectedAssignmentForMarks}/marks`)
        .then(res => {
          if (res.success) setAssignmentMarks(res.data);
        });
    }
  }, [selectedAssignmentForMarks, activeTab]);

  // Load exam marks override list
  useEffect(() => {
    if (activeTab === 'exams' && selectedExamForMarks) {
      apiCall('academic', `/api/exam/${selectedExamForMarks}/marks`)
        .then(res => {
          if (res.success) setExamMarks(res.data);
        });
    }
  }, [selectedExamForMarks, activeTab]);

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
  const handleAssignTeacher = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...newAssignment, classId: selectedClass.id };
      const res = await apiCall('academic', '/api/class/assignments', 'POST', payload);
      if (res.success) {
        showNotification('Teacher assigned to class subject successfully.');
        setShowAssignTeacher(false);
        setNewAssignment({ subjectId: '', teacherId: '', scheduleTime: '' });
        loadClassSpecifics();
      }
    } catch (err) {
      showNotification(err.message, true);
    }
  };

  const handleRemoveAssignment = async (id) => {
    if (!window.confirm("Remove this teacher assignment?")) return;
    try {
      const res = await apiCall('academic', `/api/class/assignments/${id}`, 'DELETE');
      if (res.success) {
        showNotification('Assignment removed successfully.');
        loadClassSpecifics();
      }
    } catch (err) {
      showNotification(err.message, true);
    }
  };

  const handleAddSession = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...newSession, classId: selectedClass.id };
      const res = await apiCall('academic', '/api/session', 'POST', payload);
      if (res.success) {
        showNotification('Class session scheduled.');
        setShowAddSession(false);
        setNewSession({ subjectId: '', teacherId: '', sessionDateTime: '' });
        loadClassSpecifics();
      }
    } catch (err) {
      showNotification(err.message, true);
    }
  };

  const handleReschedule = async (e) => {
    e.preventDefault();
    try {
      const res = await apiCall('academic', `/api/session/reschedule/${reschedulingSession.id}`, 'PUT', rescheduleData);
      if (res.success) {
        showNotification('Session rescheduled.');
        setReschedulingSession(null);
        loadClassSpecifics();
      }
    } catch (err) {
      showNotification(err.message, true);
    }
  };

  const handleDeleteSession = async (id) => {
    if (!window.confirm("Delete this session? All checks will be lost.")) return;
    try {
      const res = await apiCall('academic', `/api/session/${id}`, 'DELETE');
      if (res.success) {
        showNotification('Session deleted successfully.');
        loadClassSpecifics();
      }
    } catch (err) {
      showNotification(err.message, true);
    }
  };

  const handleAttendanceOverride = async (enrollmentNumber, status) => {
    try {
      const res = await apiCall('academic', '/api/attendance/edit', 'PUT', {
        classSessionId: selectedSessionForAttendance,
        enrollmentNumber,
        status
      });
      if (res.success) {
        showNotification('Student attendance record adjusted.');
        // Refresh local list
        setSessionAttendance(sessionAttendance.map(a => a.enrollmentNumber === enrollmentNumber ? { ...a, status, isManual: true } : a));
      }
    } catch (err) {
      showNotification(err.message, true);
    }
  };

  const handleMarkOverride = async (enrollmentNumber, value) => {
    try {
      const res = await apiCall('academic', '/api/assignment/marks', 'POST', {
        assignmentId: selectedAssignmentForMarks,
        enrollmentNumber,
        marks: parseFloat(value),
        remarks: 'Override by Coordinator'
      });
      if (res.success) {
        showNotification('Grades override successful.');
        setAssignmentMarks(assignmentMarks.map(m => m.enrollmentNumber === enrollmentNumber ? { ...m, marks: parseFloat(value) } : m));
      }
    } catch (err) {
      showNotification(err.message, true);
    }
  };

  const handleAddExam = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...newExam, classId: selectedClass.id };
      const res = await apiCall('academic', '/api/exam', 'POST', payload);
      if (res.success) {
        showNotification('Semester exam created successfully.');
        setShowAddExam(false);
        setNewExam({ subjectId: '', title: '', examDate: '', maxMarks: 100 });
        loadClassSpecifics();
      }
    } catch (err) {
      showNotification(err.message, true);
    }
  };

  const handleExamMarkSubmit = async (enrollmentNumber, value) => {
    try {
      const res = await apiCall('academic', '/api/exam/marks', 'POST', {
        examId: selectedExamForMarks,
        enrollmentNumber,
        marks: parseFloat(value),
        remarks: 'Exam scoring submitted'
      });
      if (res.success) {
        showNotification('Exam score recorded.');
        loadClassSpecifics(); // Refresh lists
      }
    } catch (err) {
      showNotification(err.message, true);
    }
  };

  return (
    <div style={styles.dashboardContainer} className="animate-fade-in">
      {/* Sidebar Nav */}
      <aside style={styles.sidebar} className="glass-panel">
        <div style={styles.sidebarHeader}>
          <div style={styles.adminAvatar}>C</div>
          <div>
            <h4 style={{ fontWeight: 700 }}>Class Coordinator</h4>
            <p style={styles.adminMail}>{user?.email}</p>
          </div>
        </div>

        <div style={styles.classSelector}>
          <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Currently Managing:</label>
          <select
            value={selectedClass?.id || ''}
            onChange={(e) => setSelectedClass(classes.find(c => c.id === e.target.value))}
            className="glass-input"
            style={{ padding: '8px 12px', marginTop: '4px' }}
          >
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        <nav style={styles.sidebarNav}>
          <button 
            onClick={() => setActiveTab('config')} 
            style={{ ...styles.navItem, ...(activeTab === 'config' ? styles.navItemActive : {}) }}
          >
            <Users size={18} />
            <span>Class Teachers</span>
          </button>
          <button 
            onClick={() => setActiveTab('sessions')} 
            style={{ ...styles.navItem, ...(activeTab === 'sessions' ? styles.navItemActive : {}) }}
          >
            <Calendar size={18} />
            <span>Schedule Sessions</span>
          </button>
          <button 
            onClick={() => setActiveTab('override')} 
            style={{ ...styles.navItem, ...(activeTab === 'override' ? styles.navItemActive : {}) }}
          >
            <Clock size={18} />
            <span>Override Dashboard</span>
          </button>
          <button 
            onClick={() => setActiveTab('exams')} 
            style={{ ...styles.navItem, ...(activeTab === 'exams' ? styles.navItemActive : {}) }}
          >
            <FileSpreadsheet size={18} />
            <span>Exams Hub</span>
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
              Class Coordinator Console: {selectedClass?.name}
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
              Responsible for assigning teachers, scheduling classes, configuring exams, and executing overrides.
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

        {/* 1. CLASS CONFIG (ASSIGN TEACHERS) */}
        {activeTab === 'config' && (
          <div style={styles.contentGrid}>
            <div style={styles.tableCard} className="glass-panel">
              <div style={styles.cardHeader}>
                <h3 style={{ fontWeight: 600 }}>Teacher Allocations</h3>
                <button onClick={() => setShowAssignTeacher(true)} className="btn btn-primary">
                  <Plus size={16} />
                  <span>Assign Teacher</span>
                </button>
              </div>

              <div style={styles.tableWrapper}>
                <table style={styles.table}>
                  <thead>
                    <tr style={styles.tableHeaderRow}>
                      <th style={styles.th}>Subject</th>
                      <th style={styles.th}>Assigned Teacher</th>
                      <th style={styles.th}>Scheduled Time Slot</th>
                      <th style={styles.th}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assignments.length === 0 && (
                      <tr>
                        <td colSpan="4" style={styles.noDataCell}>No teachers allocated yet. Set subject teachers here.</td>
                      </tr>
                    )}
                    {assignments.map((as) => {
                      const subject = subjects.find(s => s.id === as.subjectId);
                      const teacher = teachers.find(t => t.id === as.teacherId);
                      return (
                        <tr key={as.id} style={styles.tr}>
                          <td style={styles.td}><strong>{subject?.name}</strong> ({subject?.code})</td>
                          <td style={styles.td}>{teacher?.name}</td>
                          <td style={styles.td}>{as.scheduleTime}</td>
                          <td style={styles.td}>
                            <button onClick={() => handleRemoveAssignment(as.id)} style={{ ...styles.actionBtn, color: '#fda4af' }} title="Remove Allocation"><Trash2 size={14} /></button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {showAssignTeacher && (
              <div style={styles.modalOverlay}>
                <div style={styles.modal} className="glass-panel">
                  <div style={styles.modalHeader}>
                    <h3 style={{ fontWeight: 600 }}>Assign Class Teacher</h3>
                    <button onClick={() => setShowAssignTeacher(false)} style={styles.closeBtn}><X size={18} /></button>
                  </div>
                  
                  <form onSubmit={handleAssignTeacher} style={styles.form}>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>Select Department Subject</label>
                      <select
                        className="glass-input"
                        value={newAssignment.subjectId}
                        onChange={(e) => setNewAssignment({ ...newAssignment, subjectId: e.target.value })}
                        required
                      >
                        <option value="">Choose subject</option>
                        {subjects.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
                      </select>
                    </div>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>Select Teacher</label>
                      <select
                        className="glass-input"
                        value={newAssignment.teacherId}
                        onChange={(e) => setNewAssignment({ ...newAssignment, teacherId: e.target.value })}
                        required
                      >
                        <option value="">Choose teacher</option>
                        {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                      </select>
                    </div>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>Weekly Schedule (e.g. Mon 10:00 AM)</label>
                      <input
                        type="text"
                        required
                        placeholder="Monday 10:00 AM - 11:30 AM"
                        className="glass-input"
                        value={newAssignment.scheduleTime}
                        onChange={(e) => setNewAssignment({ ...newAssignment, scheduleTime: e.target.value })}
                      />
                    </div>
                    
                    <button type="submit" className="btn btn-primary" style={{ marginTop: '10px' }}>
                      Register Allocation
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 2. SESSIONS CALENDAR */}
        {activeTab === 'sessions' && (
          <div style={styles.contentGrid}>
            <div style={styles.tableCard} className="glass-panel">
              <div style={styles.cardHeader}>
                <h3 style={{ fontWeight: 600 }}>Class Session Logs</h3>
                <button onClick={() => setShowAddSession(true)} className="btn btn-primary">
                  <Plus size={16} />
                  <span>Add Class Session</span>
                </button>
              </div>

              <div style={styles.tableWrapper}>
                <table style={styles.table}>
                  <thead>
                    <tr style={styles.tableHeaderRow}>
                      <th style={styles.th}>Date & Time (IST)</th>
                      <th style={styles.th}>Subject</th>
                      <th style={styles.th}>Teacher</th>
                      <th style={styles.th}>Status</th>
                      <th style={styles.th}>Topic Log</th>
                      <th style={styles.th}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sessions.length === 0 && (
                      <tr>
                        <td colSpan="6" style={styles.noDataCell}>No sessions logged. Create a class session above.</td>
                      </tr>
                    )}
                    {sessions.map((se) => {
                      const subject = subjects.find(s => s.id === se.subjectId);
                      const teacher = teachers.find(t => t.id === se.teacherId);
                      return (
                        <tr key={se.id} style={styles.tr}>
                          <td style={styles.td}><strong>{new Date(se.sessionDateTime).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</strong></td>
                          <td style={styles.td}>{subject?.name}</td>
                          <td style={styles.td}>{teacher?.name}</td>
                          <td style={styles.td}>
                            <span className={`badge ${se.status === 'Completed' ? 'badge-student' : 'badge-labadmin'}`}>{se.status}</span>
                          </td>
                          <td style={{ ...styles.td, color: se.topicCovered ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                            {se.topicCovered || 'Not covered yet'}
                          </td>
                          <td style={styles.td}>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button onClick={() => { setReschedulingSession(se); setRescheduleData({ newDateTime: se.sessionDateTime.split('T')[0] + 'T10:00', newTeacherId: se.teacherId }); }} style={styles.actionBtn} title="Reschedule"><Edit size={14} /></button>
                              <button onClick={() => handleDeleteSession(se.id)} style={{ ...styles.actionBtn, color: '#fda4af' }} title="Delete Session"><Trash2 size={14} /></button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Add Session modal */}
            {showAddSession && (
              <div style={styles.modalOverlay}>
                <div style={styles.modal} className="glass-panel">
                  <div style={styles.modalHeader}>
                    <h3 style={{ fontWeight: 600 }}>Create New Class Session</h3>
                    <button onClick={() => setShowAddSession(false)} style={styles.closeBtn}><X size={18} /></button>
                  </div>
                  
                  <form onSubmit={handleAddSession} style={styles.form}>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>Subject</label>
                      <select
                        className="glass-input"
                        value={newSession.subjectId}
                        onChange={(e) => setNewSession({ ...newSession, subjectId: e.target.value })}
                        required
                      >
                        <option value="">Choose subject</option>
                        {subjects.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
                      </select>
                    </div>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>Teacher</label>
                      <select
                        className="glass-input"
                        value={newSession.teacherId}
                        onChange={(e) => setNewSession({ ...newSession, teacherId: e.target.value })}
                        required
                      >
                        <option value="">Choose teacher</option>
                        {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                      </select>
                    </div>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>Session Date & Time</label>
                      <input
                        type="datetime-local"
                        required
                        className="glass-input"
                        value={newSession.sessionDateTime}
                        onChange={(e) => setNewSession({ ...newSession, sessionDateTime: e.target.value })}
                      />
                    </div>
                    
                    <button type="submit" className="btn btn-primary" style={{ marginTop: '10px' }}>
                      Schedule Session
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* Reschedule Modal */}
            {reschedulingSession && (
              <div style={styles.modalOverlay}>
                <div style={styles.modal} className="glass-panel">
                  <div style={styles.modalHeader}>
                    <h3 style={{ fontWeight: 600 }}>Reschedule Class Session</h3>
                    <button onClick={() => setReschedulingSession(null)} style={styles.closeBtn}><X size={18} /></button>
                  </div>
                  
                  <form onSubmit={handleReschedule} style={styles.form}>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>New Date & Time</label>
                      <input
                        type="datetime-local"
                        required
                        className="glass-input"
                        value={rescheduleData.newDateTime}
                        onChange={(e) => setRescheduleData({ ...rescheduleData, newDateTime: e.target.value })}
                      />
                    </div>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>Modify Assigned Teacher</label>
                      <select
                        className="glass-input"
                        value={rescheduleData.newTeacherId}
                        onChange={(e) => setRescheduleData({ ...rescheduleData, newTeacherId: e.target.value })}
                        required
                      >
                        {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                      </select>
                    </div>
                    
                    <button type="submit" className="btn btn-primary" style={{ marginTop: '10px' }}>
                      Reschedule Now
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 3. OVERRIDE BOARD */}
        {activeTab === 'override' && (
          <div style={styles.contentGrid}>
            <div style={styles.twoColumnGrid}>
              
              {/* Column 1: Attendance Override */}
              <div style={styles.tableCard} className="glass-panel" style={{ flex: 1, padding: '24px' }}>
                <h3 style={{ fontWeight: 600, marginBottom: '16px' }}>Attendance Override</h3>
                
                <div style={styles.formGroup} style={{ marginBottom: '20px' }}>
                  <label style={styles.label}>Choose Class Session</label>
                  <select
                    className="glass-input"
                    value={selectedSessionForAttendance}
                    onChange={(e) => setSelectedSessionForAttendance(e.target.value)}
                  >
                    {sessions.map(s => {
                      const subject = subjects.find(sub => sub.id === s.subjectId);
                      return (
                        <option key={s.id} value={s.id}>
                          {subject?.code} - {new Date(s.sessionDateTime).toLocaleDateString('en-IN')}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div style={styles.overrideList}>
                  {students.map((st) => {
                    const record = sessionAttendance.find(a => a.enrollmentNumber === st.enrollmentNumber);
                    const status = record?.status || 'Absent';
                    return (
                      <div key={st.id} style={styles.overrideRow}>
                        <div>
                          <strong>{st.name}</strong>
                          <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{st.enrollmentNumber}</p>
                        </div>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button 
                            onClick={() => handleAttendanceOverride(st.enrollmentNumber, 'Present')}
                            className="btn"
                            style={{ 
                              padding: '6px 12px', fontSize: '0.8rem',
                              background: status === 'Present' ? 'var(--success)' : 'rgba(255,255,255,0.05)'
                            }}
                          >
                            Present
                          </button>
                          <button 
                            onClick={() => handleAttendanceOverride(st.enrollmentNumber, 'Absent')}
                            className="btn"
                            style={{ 
                              padding: '6px 12px', fontSize: '0.8rem',
                              background: status === 'Absent' ? 'var(--danger)' : 'rgba(255,255,255,0.05)'
                            }}
                          >
                            Absent
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Column 2: Locked Grades Override */}
              <div style={styles.tableCard} className="glass-panel" style={{ flex: 1, padding: '24px' }}>
                <h3 style={{ fontWeight: 600, marginBottom: '16px' }}>Grades Override (Teacher Locks)</h3>
                
                <div style={styles.formGroup} style={{ marginBottom: '20px' }}>
                  <label style={styles.label}>Choose Assignment</label>
                  <select
                    className="glass-input"
                    value={selectedAssignmentForMarks}
                    onChange={(e) => setSelectedAssignmentForMarks(e.target.value)}
                  >
                    {assignmentsList.length === 0 && <option value="">No assignments</option>}
                    {assignmentsList.map(a => <option key={a.id} value={a.id}>{a.title}</option>)}
                  </select>
                </div>

                <div style={styles.overrideList}>
                  {students.map((st) => {
                    const record = assignmentMarks.find(m => m.enrollmentNumber === st.enrollmentNumber);
                    const marks = record?.marks || '';
                    return (
                      <div key={st.id} style={styles.overrideRow}>
                        <div>
                          <strong>{st.name}</strong>
                          <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{st.enrollmentNumber}</p>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <input
                            type="number"
                            placeholder="N/A"
                            value={marks}
                            onChange={(e) => handleMarkOverride(st.enrollmentNumber, e.target.value)}
                            className="glass-input"
                            style={{ width: '80px', padding: '6px 8px', textAlign: 'center' }}
                          />
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>/ 100</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* 4. EXAMS HUB */}
        {activeTab === 'exams' && (
          <div style={styles.contentGrid}>
            <div style={styles.twoColumnGrid}>
              
              <div style={styles.tableCard} className="glass-panel" style={{ flex: 1 }}>
                <div style={styles.cardHeader}>
                  <h3 style={{ fontWeight: 600 }}>Class Exams</h3>
                  <button onClick={() => setShowAddExam(true)} className="btn btn-primary">
                    <Plus size={16} />
                    <span>Create Exam</span>
                  </button>
                </div>

                <div style={styles.tableWrapper}>
                  <table style={styles.table}>
                    <thead>
                      <tr style={styles.tableHeaderRow}>
                        <th style={styles.th}>Exam Title</th>
                        <th style={styles.th}>Date</th>
                        <th style={styles.th}>Max Marks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {exams.length === 0 && (
                        <tr>
                          <td colSpan="3" style={styles.noDataCell}>No exams scheduled yet.</td>
                        </tr>
                      )}
                      {exams.map((ex) => (
                        <tr 
                          key={ex.id} 
                          style={{ 
                            ...styles.tr, 
                            cursor: 'pointer',
                            background: selectedExamForMarks === ex.id ? 'rgba(255,255,255,0.03)' : ''
                          }}
                          onClick={() => setSelectedExamForMarks(ex.id)}
                        >
                          <td style={styles.td}><strong>{ex.title}</strong></td>
                          <td style={styles.td}>{new Date(ex.examDate).toLocaleDateString('en-IN')}</td>
                          <td style={styles.td}>{ex.maxMarks}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Exam Marks Entry */}
              {selectedExamForMarks && (
                <div style={styles.tableCard} className="glass-panel" style={{ flex: 1, padding: '24px' }}>
                  <h3 style={{ fontWeight: 600, marginBottom: '16px' }}>Exam Grade Entry</h3>
                  <div style={styles.overrideList}>
                    {students.map((st) => {
                      const record = examMarks.find(m => m.enrollmentNumber === st.enrollmentNumber);
                      const score = record?.marks || '';
                      return (
                        <div key={st.id} style={styles.overrideRow}>
                          <div>
                            <strong>{st.name}</strong>
                            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{st.enrollmentNumber}</p>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <input
                              type="number"
                              placeholder="Score"
                              value={score}
                              onChange={(e) => handleExamMarkSubmit(st.enrollmentNumber, e.target.value)}
                              className="glass-input"
                              style={{ width: '80px', padding: '6px 8px', textAlign: 'center' }}
                            />
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>/ 100</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

            </div>

            {showAddExam && (
              <div style={styles.modalOverlay}>
                <div style={styles.modal} className="glass-panel">
                  <div style={styles.modalHeader}>
                    <h3 style={{ fontWeight: 600 }}>Schedule Semester Exam</h3>
                    <button onClick={() => setShowAddExam(false)} style={styles.closeBtn}><X size={18} /></button>
                  </div>
                  
                  <form onSubmit={handleAddExam} style={styles.form}>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>Select Subject</label>
                      <select
                        className="glass-input"
                        value={newExam.subjectId}
                        onChange={(e) => setNewExam({ ...newExam, subjectId: e.target.value })}
                        required
                      >
                        <option value="">Choose subject</option>
                        {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                    </div>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>Exam Title (e.g. Midterm/Finals)</label>
                      <input
                        type="text"
                        required
                        className="glass-input"
                        value={newExam.title}
                        onChange={(e) => setNewExam({ ...newExam, title: e.target.value })}
                      />
                    </div>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <div style={{ ...styles.formGroup, flex: 1.5 }}>
                        <label style={styles.label}>Exam Date</label>
                        <input
                          type="date"
                          required
                          className="glass-input"
                          value={newExam.examDate}
                          onChange={(e) => setNewExam({ ...newExam, examDate: e.target.value })}
                        />
                      </div>
                      <div style={{ ...styles.formGroup, flex: 1 }}>
                        <label style={styles.label}>Max Score</label>
                        <input
                          type="number"
                          required
                          className="glass-input"
                          value={newExam.maxMarks}
                          onChange={(e) => setNewExam({ ...newExam, maxMarks: parseFloat(e.target.value) })}
                        />
                      </div>
                    </div>
                    
                    <button type="submit" className="btn btn-primary" style={{ marginTop: '10px' }}>
                      Publish Exam Details
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

const Trash2 = ({ size, color }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color || "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
);

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
  classSelector: {
    marginBottom: '24px',
  },
  adminAvatar: {
    width: '44px',
    height: '44px',
    borderRadius: '12px',
    background: 'linear-gradient(135deg, var(--secondary), var(--primary))',
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
    borderLeft: '4px solid var(--secondary)',
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
  actionBtn: {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid var(--border-glass)',
    borderRadius: '8px',
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--text-primary)',
    cursor: 'pointer',
    transition: 'var(--transition-smooth)',
  },
  twoColumnGrid: {
    display: 'flex',
    gap: '24px',
    flexWrap: 'wrap',
  },
  overrideList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  overrideRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '14px 18px',
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid var(--border-glass)',
    borderRadius: '12px',
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
    maxWidth: '500px',
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

export default LabAdminDashboard;
