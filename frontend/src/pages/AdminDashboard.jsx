import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Users, UserPlus, BookOpen, GraduationCap, BarChart3, 
  Trash2, Edit, FileDown, Plus, LogOut, Check, X, ShieldAlert 
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, LineChart, Line 
} from 'recharts';

const AdminDashboard = () => {
  const { user, logout, apiCall } = useAuth();
  const [activeTab, setActiveTab] = useState('teachers');
  
  // Teachers Management
  const [teachers, setTeachers] = useState([]);
  const [showAddTeacher, setShowAddTeacher] = useState(false);
  const [newTeacher, setNewTeacher] = useState({ name: '', email: '', phoneNumber: '', gender: 'Male', dateOfBirth: '', password: '' });
  const [editingTeacher, setEditingTeacher] = useState(null);

  // Students Management
  const [students, setStudents] = useState([]);
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [newStudent, setNewStudent] = useState({ name: '', email: '', phoneNumber: '', gender: 'Male', dateOfBirth: '', year: 1, program: '', password: '' });
  const [editingStudent, setEditingStudent] = useState(null);
  const [csvFile, setCsvFile] = useState(null);
  const [csvMessage, setCsvMessage] = useState('');

  // Subjects Management
  const [subjects, setSubjects] = useState([]);
  const [showAddSubject, setShowAddSubject] = useState(false);
  const [newSubject, setNewSubject] = useState({ code: '', name: '', department: '' });

  // Reports
  const [reportFilter, setReportFilter] = useState({ year: '', program: '' });
  const [reportData, setReportData] = useState(null);
  const [loadingReport, setLoadingReport] = useState(false);

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Fetch initial data
  const fetchData = async () => {
    try {
      if (activeTab === 'teachers') {
        const res = await apiCall('auth', '/api/admin/employees?role=Teacher');
        if (res.success) setTeachers(res.data);
      } else if (activeTab === 'students') {
        const res = await apiCall('auth', '/api/admin/students');
        if (res.success) setStudents(res.data);
      } else if (activeTab === 'subjects') {
        const res = await apiCall('academic', '/api/subject');
        if (res.success) setSubjects(res.data);
      } else if (activeTab === 'reports') {
        loadReport();
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to fetch dashboard data.');
    }
  };

  useEffect(() => {
    fetchData();
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

  // --- TEACHERS ---
  const handleAddTeacher = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...newTeacher, role: 'Teacher' };
      const res = await apiCall('auth', '/api/admin/employees', 'POST', payload);
      if (res.success) {
        showNotification('Teacher created successfully.');
        setShowAddTeacher(false);
        setNewTeacher({ name: '', email: '', phoneNumber: '', gender: 'Male', dateOfBirth: '', password: '' });
        fetchData();
      }
    } catch (err) {
      showNotification(err.message, true);
    }
  };

  const handleUpdateTeacher = async (e) => {
    e.preventDefault();
    try {
      const res = await apiCall('auth', `/api/admin/employees/${editingTeacher.id}`, 'PUT', editingTeacher);
      if (res.success) {
        showNotification('Teacher updated successfully.');
        setEditingTeacher(null);
        fetchData();
      }
    } catch (err) {
      showNotification(err.message, true);
    }
  };

  const handleDeleteTeacher = async (id) => {
    if (!window.confirm('Delete this teacher?')) return;
    try {
      const res = await apiCall('auth', `/api/admin/employees/${id}`, 'DELETE');
      if (res.success) {
        showNotification('Teacher deleted successfully.');
        fetchData();
      }
    } catch (err) {
      showNotification(err.message, true);
    }
  };

  // --- STUDENTS ---
  const handleAddStudent = async (e) => {
    e.preventDefault();
    try {
      const res = await apiCall('auth', '/api/admin/students', 'POST', newStudent);
      if (res.success) {
        showNotification('Student added successfully.');
        setShowAddStudent(false);
        setNewStudent({ name: '', email: '', phoneNumber: '', gender: 'Male', dateOfBirth: '', year: 1, program: '', password: '' });
        fetchData();
      }
    } catch (err) {
      showNotification(err.message, true);
    }
  };

  const handleUpdateStudent = async (e) => {
    e.preventDefault();
    try {
      const res = await apiCall('auth', `/api/admin/students/${editingStudent.id}`, 'PUT', editingStudent);
      if (res.success) {
        showNotification('Student updated successfully.');
        setEditingStudent(null);
        fetchData();
      }
    } catch (err) {
      showNotification(err.message, true);
    }
  };

  const handleDeleteStudent = async (id) => {
    if (!window.confirm('Delete this student?')) return;
    try {
      const res = await apiCall('auth', `/api/admin/students/${id}`, 'DELETE');
      if (res.success) {
        showNotification('Student deleted successfully.');
        fetchData();
      }
    } catch (err) {
      showNotification(err.message, true);
    }
  };

  const handleCsvImport = async (e) => {
    e.preventDefault();
    if (!csvFile) return;
    setCsvMessage('Uploading and parsing CSV...');
    try {
      const formData = new FormData();
      formData.append('file', csvFile);
      const res = await apiCall('auth', '/api/admin/students/import', 'POST', formData, true);
      if (res.success) {
        showNotification(res.message);
        setCsvFile(null);
        fetchData();
      }
    } catch (err) {
      showNotification(err.message, true);
    } finally {
      setCsvMessage('');
    }
  };

  // --- SUBJECTS ---
  const handleAddSubject = async (e) => {
    e.preventDefault();
    try {
      const res = await apiCall('academic', '/api/subject', 'POST', newSubject);
      if (res.success) {
        showNotification('Subject created successfully.');
        setShowAddSubject(false);
        setNewSubject({ code: '', name: '', department: '' });
        fetchData();
      }
    } catch (err) {
      showNotification(err.message, true);
    }
  };

  const handleDeleteSubject = async (id) => {
    if (!window.confirm('Delete this subject?')) return;
    try {
      const res = await apiCall('academic', `/api/subject/${id}`, 'DELETE');
      if (res.success) {
        showNotification('Subject deleted successfully.');
        fetchData();
      }
    } catch (err) {
      showNotification(err.message, true);
    }
  };

  // --- REPORTS ---
  const loadReport = async () => {
    setLoadingReport(true);
    try {
      let query = '?';
      if (reportFilter.year) query += `year=${reportFilter.year}&`;
      if (reportFilter.program) query += `program=${reportFilter.program}`;
      
      const res = await apiCall('academic', `/api/report/summary${query}`);
      if (res.success) {
        setReportData(res.data);
      }
    } catch (err) {
      showNotification(err.message, true);
    } finally {
      setLoadingReport(false);
    }
  };

  return (
    <div style={styles.dashboardContainer} className="animate-fade-in">
      {/* Sidebar Nav */}
      <aside style={styles.sidebar} className="glass-panel">
        <div style={styles.sidebarHeader}>
          <div style={styles.adminAvatar}>A</div>
          <div>
            <h4 style={{ fontWeight: 700 }}>Principal Panel</h4>
            <p style={styles.adminMail}>{user?.email}</p>
          </div>
        </div>

        <nav style={styles.sidebarNav}>
          <button 
            onClick={() => setActiveTab('teachers')} 
            style={{ ...styles.navItem, ...(activeTab === 'teachers' ? styles.navItemActive : {}) }}
          >
            <Users size={18} />
            <span>Manage Teachers</span>
          </button>
          <button 
            onClick={() => setActiveTab('students')} 
            style={{ ...styles.navItem, ...(activeTab === 'students' ? styles.navItemActive : {}) }}
          >
            <GraduationCap size={18} />
            <span>Manage Students</span>
          </button>
          <button 
            onClick={() => setActiveTab('subjects')} 
            style={{ ...styles.navItem, ...(activeTab === 'subjects' ? styles.navItemActive : {}) }}
          >
            <BookOpen size={18} />
            <span>Manage Subjects</span>
          </button>
          <button 
            onClick={() => setActiveTab('reports')} 
            style={{ ...styles.navItem, ...(activeTab === 'reports' ? styles.navItemActive : {}) }}
          >
            <BarChart3 size={18} />
            <span>Reports Panel</span>
          </button>
        </nav>

        <button onClick={logout} style={styles.logoutBtn} className="btn btn-secondary">
          <LogOut size={16} />
          <span>Logout</span>
        </button>
      </aside>

      {/* Main Content Area */}
      <main style={styles.mainContent}>
        {/* Top Header Card */}
        <header style={styles.mainHeader} className="glass-panel">
          <div>
            <h1 className="gradient-text" style={{ fontSize: '1.75rem', fontWeight: 800 }}>
              {activeTab === 'teachers' && 'Faculty Administration'}
              {activeTab === 'students' && 'Student Enrollment Desk'}
              {activeTab === 'subjects' && 'Department Subjects Matrix'}
              {activeTab === 'reports' && 'Academic Reports Engine'}
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
              Welcome back, Principal {user?.name}. You hold complete system rights.
            </p>
          </div>
        </header>

        {/* Global Notifications */}
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

        {/* --- TAB CONTENT --- */}

        {/* 1. TEACHERS TAB */}
        {activeTab === 'teachers' && (
          <div style={styles.contentGrid}>
            <div style={styles.tableCard} className="glass-panel">
              <div style={styles.cardHeader}>
                <h3 style={{ fontWeight: 600 }}>Active Teachers</h3>
                <button onClick={() => setShowAddTeacher(true)} className="btn btn-primary">
                  <UserPlus size={16} />
                  <span>Add Teacher</span>
                </button>
              </div>

              <div style={styles.tableWrapper}>
                <table style={styles.table}>
                  <thead>
                    <tr style={styles.tableHeaderRow}>
                      <th style={styles.th}>ID</th>
                      <th style={styles.th}>Name</th>
                      <th style={styles.th}>Email</th>
                      <th style={styles.th}>Phone</th>
                      <th style={styles.th}>Gender</th>
                      <th style={styles.th}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teachers.length === 0 && (
                      <tr>
                        <td colSpan="6" style={styles.noDataCell}>No teachers found. Click 'Add Teacher' to create one.</td>
                      </tr>
                    )}
                    {teachers.map((t) => (
                      <tr key={t.id} style={styles.tr}>
                        <td style={{ ...styles.td, fontWeight: '600', color: 'var(--secondary)' }}>{t.employeeId}</td>
                        <td style={styles.td}>{t.name}</td>
                        <td style={styles.td}>{t.email}</td>
                        <td style={styles.td}>{t.phoneNumber}</td>
                        <td style={styles.td}>{t.gender}</td>
                        <td style={styles.td}>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button onClick={() => setEditingTeacher(t)} style={styles.actionBtn} title="Edit"><Edit size={14} /></button>
                            <button onClick={() => handleDeleteTeacher(t.id)} style={{ ...styles.actionBtn, color: '#fda4af' }} title="Delete"><Trash2 size={14} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modals for Add/Edit */}
            {(showAddTeacher || editingTeacher) && (
              <div style={styles.modalOverlay}>
                <div style={styles.modal} className="glass-panel">
                  <div style={styles.modalHeader}>
                    <h3 style={{ fontWeight: 600 }}>{editingTeacher ? 'Edit Teacher Details' : 'Add New Teacher'}</h3>
                    <button onClick={() => { setShowAddTeacher(false); setEditingTeacher(null); }} style={styles.closeBtn}><X size={18} /></button>
                  </div>
                  
                  <form onSubmit={editingTeacher ? handleUpdateTeacher : handleAddTeacher} style={styles.form}>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>Full Name</label>
                      <input
                        type="text"
                        required
                        className="glass-input"
                        value={editingTeacher ? editingTeacher.name : newTeacher.name}
                        onChange={(e) => editingTeacher ? setEditingTeacher({ ...editingTeacher, name: e.target.value }) : setNewTeacher({ ...newTeacher, name: e.target.value })}
                      />
                    </div>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>Email Address (Unique)</label>
                      <input
                        type="email"
                        required
                        disabled={!!editingTeacher}
                        className="glass-input"
                        value={editingTeacher ? editingTeacher.email : newTeacher.email}
                        onChange={(e) => setNewTeacher({ ...newTeacher, email: e.target.value })}
                      />
                    </div>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <div style={{ ...styles.formGroup, flex: 1 }}>
                        <label style={styles.label}>Phone Number</label>
                        <input
                          type="text"
                          className="glass-input"
                          value={editingTeacher ? editingTeacher.phoneNumber : newTeacher.phoneNumber}
                          onChange={(e) => editingTeacher ? setEditingTeacher({ ...editingTeacher, phoneNumber: e.target.value }) : setNewTeacher({ ...newTeacher, phoneNumber: e.target.value })}
                        />
                      </div>
                      <div style={{ ...styles.formGroup, flex: 1 }}>
                        <label style={styles.label}>Gender</label>
                        <select
                          className="glass-input"
                          value={editingTeacher ? editingTeacher.gender : newTeacher.gender}
                          onChange={(e) => editingTeacher ? setEditingTeacher({ ...editingTeacher, gender: e.target.value }) : setNewTeacher({ ...newTeacher, gender: e.target.value })}
                        >
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <div style={{ ...styles.formGroup, flex: 1 }}>
                        <label style={styles.label}>Date of Birth</label>
                        <input
                          type="date"
                          required
                          className="glass-input"
                          value={editingTeacher ? editingTeacher.dateOfBirth.split('T')[0] : newTeacher.dateOfBirth}
                          onChange={(e) => editingTeacher ? setEditingTeacher({ ...editingTeacher, dateOfBirth: e.target.value }) : setNewTeacher({ ...newTeacher, dateOfBirth: e.target.value })}
                        />
                      </div>
                      <div style={{ ...styles.formGroup, flex: 1 }}>
                        <label style={styles.label}>{editingTeacher ? 'New Password (Optional)' : 'Password'}</label>
                        <input
                          type="password"
                          required={!editingTeacher}
                          className="glass-input"
                          placeholder={editingTeacher ? 'Leave blank to retain' : '••••••••'}
                          value={editingTeacher ? editingTeacher.password || '' : newTeacher.password}
                          onChange={(e) => editingTeacher ? setEditingTeacher({ ...editingTeacher, password: e.target.value }) : setNewTeacher({ ...newTeacher, password: e.target.value })}
                        />
                      </div>
                    </div>
                    
                    <button type="submit" className="btn btn-primary" style={{ marginTop: '10px' }}>
                      Save Faculty
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 2. STUDENTS TAB */}
        {activeTab === 'students' && (
          <div style={styles.contentGrid}>
            {/* Top Area - manual add & CSV upload side by side */}
            <div style={styles.csvCard} className="glass-panel">
              <h3 style={{ fontWeight: 600, marginBottom: '12px' }}>Bulk Student CSV Importer</h3>
              <form onSubmit={handleCsvImport} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <input 
                  type="file" 
                  accept=".csv"
                  onChange={(e) => setCsvFile(e.target.files[0])}
                  style={styles.fileInput} 
                />
                <button type="submit" className="btn btn-primary" disabled={!csvFile}>
                  <FileDown size={16} />
                  <span>Upload</span>
                </button>
              </form>
              {csvMessage && <p style={{ fontSize: '0.8rem', color: 'var(--secondary)', marginTop: '8px' }}>{csvMessage}</p>}
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                CSV format: <strong>Name,Email,PhoneNumber,Gender,DateOfBirth,Year,Program</strong>
              </p>
            </div>

            <div style={styles.tableCard} className="glass-panel">
              <div style={styles.cardHeader}>
                <h3 style={{ fontWeight: 600 }}>Enrolled Roster</h3>
                <button onClick={() => setShowAddStudent(true)} className="btn btn-primary">
                  <UserPlus size={16} />
                  <span>Add Student Manually</span>
                </button>
              </div>

              <div style={styles.tableWrapper}>
                <table style={styles.table}>
                  <thead>
                    <tr style={styles.tableHeaderRow}>
                      <th style={styles.th}>Enrollment ID</th>
                      <th style={styles.th}>Name</th>
                      <th style={styles.th}>Email</th>
                      <th style={styles.th}>Course Program</th>
                      <th style={styles.th}>Academic Year</th>
                      <th style={styles.th}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.length === 0 && (
                      <tr>
                        <td colSpan="6" style={styles.noDataCell}>No students registered. Add manually or upload a CSV class list.</td>
                      </tr>
                    )}
                    {students.map((s) => (
                      <tr key={s.id} style={styles.tr}>
                        <td style={{ ...styles.td, fontWeight: '600', color: 'var(--success)' }}>{s.enrollmentNumber}</td>
                        <td style={styles.td}>{s.name}</td>
                        <td style={styles.td}>{s.email}</td>
                        <td style={styles.td}>{s.program}</td>
                        <td style={styles.td}>Year {s.year}</td>
                        <td style={styles.td}>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button onClick={() => setEditingStudent(s)} style={styles.actionBtn} title="Edit"><Edit size={14} /></button>
                            <button onClick={() => handleDeleteStudent(s.id)} style={{ ...styles.actionBtn, color: '#fda4af' }} title="Delete"><Trash2 size={14} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modals for Add/Edit Students */}
            {(showAddStudent || editingStudent) && (
              <div style={styles.modalOverlay}>
                <div style={styles.modal} className="glass-panel">
                  <div style={styles.modalHeader}>
                    <h3 style={{ fontWeight: 600 }}>{editingStudent ? 'Edit Student Profile' : 'Add New Student'}</h3>
                    <button onClick={() => { setShowAddStudent(false); setEditingStudent(null); }} style={styles.closeBtn}><X size={18} /></button>
                  </div>
                  
                  <form onSubmit={editingStudent ? handleUpdateStudent : handleAddStudent} style={styles.form}>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>Full Name</label>
                      <input
                        type="text"
                        required
                        className="glass-input"
                        value={editingStudent ? editingStudent.name : newStudent.name}
                        onChange={(e) => editingStudent ? setEditingStudent({ ...editingStudent, name: e.target.value }) : setNewStudent({ ...newStudent, name: e.target.value })}
                      />
                    </div>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>Email Address (Unique)</label>
                      <input
                        type="email"
                        required
                        disabled={!!editingStudent}
                        className="glass-input"
                        value={editingStudent ? editingStudent.email : newStudent.email}
                        onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
                      />
                    </div>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <div style={{ ...styles.formGroup, flex: 1 }}>
                        <label style={styles.label}>Phone Number</label>
                        <input
                          type="text"
                          className="glass-input"
                          value={editingStudent ? editingStudent.phoneNumber : newStudent.phoneNumber}
                          onChange={(e) => editingStudent ? setEditingStudent({ ...editingStudent, phoneNumber: e.target.value }) : setNewStudent({ ...newStudent, phoneNumber: e.target.value })}
                        />
                      </div>
                      <div style={{ ...styles.formGroup, flex: 1 }}>
                        <label style={styles.label}>Gender</label>
                        <select
                          className="glass-input"
                          value={editingStudent ? editingStudent.gender : newStudent.gender}
                          onChange={(e) => editingStudent ? setEditingStudent({ ...editingStudent, gender: e.target.value }) : setNewStudent({ ...newStudent, gender: e.target.value })}
                        >
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <div style={{ ...styles.formGroup, flex: 1 }}>
                        <label style={styles.label}>Academic Year</label>
                        <input
                          type="number"
                          required
                          min="1"
                          max="4"
                          className="glass-input"
                          value={editingStudent ? editingStudent.year : newStudent.year}
                          onChange={(e) => editingStudent ? setEditingStudent({ ...editingStudent, year: parseInt(e.target.value) }) : setNewStudent({ ...newStudent, year: parseInt(e.target.value) })}
                        />
                      </div>
                      <div style={{ ...styles.formGroup, flex: 1.5 }}>
                        <label style={styles.label}>Course / Program</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. B.Tech CSE"
                          className="glass-input"
                          value={editingStudent ? editingStudent.program : newStudent.program}
                          onChange={(e) => editingStudent ? setEditingStudent({ ...editingStudent, program: e.target.value }) : setNewStudent({ ...newStudent, program: e.target.value })}
                        />
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <div style={{ ...styles.formGroup, flex: 1 }}>
                        <label style={styles.label}>Date of Birth</label>
                        <input
                          type="date"
                          required
                          className="glass-input"
                          value={editingStudent ? editingStudent.dateOfBirth.split('T')[0] : newStudent.dateOfBirth}
                          onChange={(e) => editingStudent ? setEditingStudent({ ...editingStudent, dateOfBirth: e.target.value }) : setNewStudent({ ...newStudent, dateOfBirth: e.target.value })}
                        />
                      </div>
                      <div style={{ ...styles.formGroup, flex: 1 }}>
                        <label style={styles.label}>{editingStudent ? 'New Password (Optional)' : 'Password'}</label>
                        <input
                          type="password"
                          required={!editingStudent}
                          className="glass-input"
                          placeholder={editingStudent ? 'Leave blank to retain' : '••••••••'}
                          value={editingStudent ? editingStudent.password || '' : newStudent.password}
                          onChange={(e) => editingStudent ? setEditingStudent({ ...editingStudent, password: e.target.value }) : setNewStudent({ ...newStudent, password: e.target.value })}
                        />
                      </div>
                    </div>
                    
                    <button type="submit" className="btn btn-primary" style={{ marginTop: '10px' }}>
                      Save Student Record
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 3. SUBJECTS TAB */}
        {activeTab === 'subjects' && (
          <div style={styles.contentGrid}>
            <div style={styles.tableCard} className="glass-panel">
              <div style={styles.cardHeader}>
                <h3 style={{ fontWeight: 600 }}>Active Subject Catalog</h3>
                <button onClick={() => setShowAddSubject(true)} className="btn btn-primary">
                  <Plus size={16} />
                  <span>Create Subject</span>
                </button>
              </div>

              <div style={styles.tableWrapper}>
                <table style={styles.table}>
                  <thead>
                    <tr style={styles.tableHeaderRow}>
                      <th style={styles.th}>Subject Code</th>
                      <th style={styles.th}>Subject Name</th>
                      <th style={styles.th}>Department / Division</th>
                      <th style={styles.th}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subjects.length === 0 && (
                      <tr>
                        <td colSpan="4" style={styles.noDataCell}>No subjects exist. Click 'Create Subject' to construct one.</td>
                      </tr>
                    )}
                    {subjects.map((sub) => (
                      <tr key={sub.id} style={styles.tr}>
                        <td style={{ ...styles.td, fontWeight: '600', color: 'var(--accent)' }}>{sub.code}</td>
                        <td style={styles.td}>{sub.name}</td>
                        <td style={styles.td}><span className="badge badge-teacher">{sub.department}</span></td>
                        <td style={styles.td}>
                          <button onClick={() => handleDeleteSubject(sub.id)} style={{ ...styles.actionBtn, color: '#fda4af' }} title="Delete"><Trash2 size={14} /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {showAddSubject && (
              <div style={styles.modalOverlay}>
                <div style={styles.modal} className="glass-panel">
                  <div style={styles.modalHeader}>
                    <h3 style={{ fontWeight: 600 }}>Add Department Subject</h3>
                    <button onClick={() => setShowAddSubject(false)} style={styles.closeBtn}><X size={18} /></button>
                  </div>
                  
                  <form onSubmit={handleAddSubject} style={styles.form}>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>Subject Code</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. CS101"
                        className="glass-input"
                        value={newSubject.code}
                        onChange={(e) => setNewSubject({ ...newSubject, code: e.target.value })}
                      />
                    </div>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>Subject Name</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Programming in C"
                        className="glass-input"
                        value={newSubject.name}
                        onChange={(e) => setNewSubject({ ...newSubject, name: e.target.value })}
                      />
                    </div>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>Department Group</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Computer Science / Math"
                        className="glass-input"
                        value={newSubject.department}
                        onChange={(e) => setNewSubject({ ...newSubject, department: e.target.value })}
                      />
                    </div>
                    
                    <button type="submit" className="btn btn-primary" style={{ marginTop: '10px' }}>
                      Publish Subject
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 4. REPORTS TAB */}
        {activeTab === 'reports' && (
          <div style={styles.contentGrid}>
            {/* Filter bar */}
            <div style={styles.filterBar} className="glass-panel">
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center', width: '100%' }}>
                <div style={{ flex: 1, minWidth: '150px' }}>
                  <label style={styles.filterLabel}>Academic Year</label>
                  <input
                    type="number"
                    placeholder="All Years"
                    className="glass-input"
                    value={reportFilter.year}
                    onChange={(e) => setReportFilter({ ...reportFilter, year: e.target.value })}
                  />
                </div>
                <div style={{ flex: 1.5, minWidth: '200px' }}>
                  <label style={styles.filterLabel}>Course / Program</label>
                  <input
                    type="text"
                    placeholder="e.g. B.Tech CSE"
                    className="glass-input"
                    value={reportFilter.program}
                    onChange={(e) => setReportFilter({ ...reportFilter, program: e.target.value })}
                  />
                </div>
                <button onClick={loadReport} className="btn btn-primary" style={{ marginTop: '22px' }}>
                  Generate Filtered Report
                </button>
              </div>
            </div>

            {loadingReport ? (
              <p style={{ textAlign: 'center', margin: '40px 0', color: 'var(--text-secondary)' }}>Aggregating system statistics...</p>
            ) : reportData ? (
              <div style={styles.reportSummaryGrid}>
                {/* Metric Cards */}
                <div style={styles.metricsContainer}>
                  <div style={styles.metricCard} className="glass-panel">
                    <span style={styles.metricLabel}>Total Sessions Taught</span>
                    <span style={styles.metricVal}>{reportData.totalSessions}</span>
                  </div>
                  <div style={styles.metricCard} className="glass-panel">
                    <span style={styles.metricLabel}>Avg. Attendance Rate</span>
                    <span style={{ ...styles.metricVal, color: 'var(--success)' }}>{reportData.attendanceStats.percentage}%</span>
                  </div>
                  <div style={styles.metricCard} className="glass-panel">
                    <span style={styles.metricLabel}>Avg. Assignment Score</span>
                    <span style={{ ...styles.metricVal, color: 'var(--secondary)' }}>{reportData.marksStats.averageAssignmentMarks}</span>
                  </div>
                  <div style={styles.metricCard} className="glass-panel">
                    <span style={styles.metricLabel}>Avg. Semester Exam Score</span>
                    <span style={{ ...styles.metricVal, color: 'var(--accent)' }}>{reportData.marksStats.averageExamMarks}</span>
                  </div>
                </div>

                {/* Graph visualization */}
                {reportData.subjectBreakdown && reportData.subjectBreakdown.length > 0 && (
                  <div style={styles.chartCard} className="glass-panel">
                    <h3 style={{ fontWeight: 600, marginBottom: '24px' }}>Subject-wise Attendance & Grades Performance</h3>
                    <div style={{ width: '100%', height: 350 }}>
                      <ResponsiveContainer>
                        <BarChart
                          data={reportData.subjectBreakdown}
                          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                          <XAxis dataKey="subjectCode" stroke="var(--text-secondary)" />
                          <YAxis yAxisId="left" orientation="left" stroke="var(--secondary)" />
                          <YAxis yAxisId="right" orientation="right" stroke="var(--accent)" />
                          <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} />
                          <Legend />
                          <Bar yAxisId="left" dataKey="attendanceRate" name="Attendance %" fill="var(--secondary)" radius={[4, 4, 0, 0]} />
                          <Bar yAxisId="right" dataKey="averageMarks" name="Average Marks" fill="var(--accent)" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p style={{ textAlign: 'center', margin: '40px 0', color: 'var(--text-secondary)' }}>Click 'Generate Filtered Report' to compile results.</p>
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
    paddingBottom: '24px',
    borderBottom: '1px solid var(--border-glass)',
    marginBottom: '24px',
  },
  adminAvatar: {
    width: '44px',
    height: '44px',
    borderRadius: '12px',
    background: 'linear-gradient(135deg, var(--accent), var(--primary))',
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
    maxWidth: '520px',
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
  csvCard: {
    padding: '24px',
  },
  fileInput: {
    flexGrow: 1,
    padding: '10px',
    border: '1px dashed var(--border-glass)',
    borderRadius: '10px',
    color: 'var(--text-secondary)',
    fontFamily: 'var(--font-sans)',
    fontSize: '0.9rem',
    cursor: 'pointer',
  },
  filterBar: {
    padding: '20px',
  },
  filterLabel: {
    fontSize: '0.78rem',
    color: 'var(--text-secondary)',
    fontWeight: '500',
    display: 'block',
    marginBottom: '6px',
  },
  reportSummaryGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  metricsContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '16px',
  },
  metricCard: {
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  metricLabel: {
    fontSize: '0.82rem',
    color: 'var(--text-secondary)',
  },
  metricVal: {
    fontSize: '2rem',
    fontWeight: '800',
  },
  chartCard: {
    padding: '24px',
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

export default AdminDashboard;
