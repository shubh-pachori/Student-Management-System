import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { KeyRound, Mail, UserCheck, ShieldAlert, ArrowRight, Eye, EyeOff } from 'lucide-react';

const Login = () => {
  const { login, requestOtp, resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Forgot Password flow
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [step, setStep] = useState(1); // 1 = request, 2 = verify & reset
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const data = await requestOtp(forgotEmail);
      if (data.success) {
        setSuccess(`OTP sent to console and API response! Code is ${data.otpCode}`);
        setOtpCode(data.otpCode); // Autofill for ease of review
        setStep(2);
      }
    } catch (err) {
      setError(err.message || 'Failed to request OTP. Make sure the email exists.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const data = await resetPassword(forgotEmail, otpCode, newPassword);
      if (data.success) {
        setSuccess('Password reset successfully. You can now login.');
        setTimeout(() => {
          setShowForgot(false);
          setStep(1);
          setForgotEmail('');
          setOtpCode('');
          setNewPassword('');
          setError('');
          setSuccess('');
        }, 2000);
      }
    } catch (err) {
      setError(err.message || 'Failed to reset password. Check OTP.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container} className="animate-fade-in">
      <div style={styles.card} className="glass-panel">
        <div style={styles.header}>
          <div style={styles.logoContainer}>
            <UserCheck size={32} color="#06b6d4" />
          </div>
          <h2 style={styles.title}>EduPortal</h2>
          <p style={styles.subtitle}>Microservices Student Management System</p>
        </div>

        {error && (
          <div style={styles.alertError}>
            <ShieldAlert size={18} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div style={styles.alertSuccess}>
            <span>{success}</span>
          </div>
        )}

        {!showForgot ? (
          <form onSubmit={handleLogin} style={styles.form}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>School Email Address</label>
              <div style={styles.inputWrapper}>
                <Mail size={18} style={styles.inputIcon} />
                <input
                  type="email"
                  placeholder="name@school.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="glass-input"
                  required
                  style={{ paddingLeft: '44px' }}
                />
              </div>
            </div>

            <div style={styles.inputGroup}>
              <div style={styles.labelWrapper}>
                <label style={styles.label}>Password</label>
                <button
                  type="button"
                  onClick={() => setShowForgot(true)}
                  style={styles.forgotBtn}
                >
                  Forgot Password?
                </button>
              </div>
              <div style={styles.inputWrapper}>
                <KeyRound size={18} style={styles.inputIcon} />
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="glass-input"
                  required
                  style={{ paddingLeft: '44px', paddingRight: '44px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  style={styles.eyeBtn}
                >
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={styles.submitBtn} disabled={loading}>
              {loading ? 'Authenticating...' : 'Sign In'}
              {!loading && <ArrowRight size={18} />}
            </button>
            <div style={styles.devHint}>
              <strong>Dev Account:</strong> admin@school.com / AdminPassword123
            </div>
          </form>
        ) : (
          <div style={styles.forgotContainer}>
            <h3 style={styles.forgotTitle}>Reset Password</h3>
            <p style={styles.forgotSubtitle}>No signup is possible; request OTP via your registered school email.</p>
            
            {step === 1 ? (
              <form onSubmit={handleRequestOtp} style={styles.form}>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Registered Email</label>
                  <div style={styles.inputWrapper}>
                    <Mail size={18} style={styles.inputIcon} />
                    <input
                      type="email"
                      placeholder="name@school.com"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      className="glass-input"
                      required
                      style={{ paddingLeft: '44px' }}
                    />
                  </div>
                </div>
                <div style={styles.btnRow}>
                  <button type="button" onClick={() => setShowForgot(false)} className="btn btn-secondary" style={{ flex: 1 }}>
                    Back
                  </button>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1.5 }} disabled={loading}>
                    {loading ? 'Sending...' : 'Request OTP'}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleResetPassword} style={styles.form}>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>OTP Verification Code</label>
                  <input
                    type="text"
                    placeholder="Enter 6-digit code"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    className="glass-input"
                    required
                  />
                </div>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>New Secure Password</label>
                  <input
                    type="password"
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="glass-input"
                    required
                  />
                </div>
                <div style={styles.btnRow}>
                  <button type="button" onClick={() => setStep(1)} className="btn btn-secondary" style={{ flex: 1 }}>
                    Back
                  </button>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1.5 }} disabled={loading}>
                    {loading ? 'Resetting...' : 'Change Password'}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    padding: '20px',
  },
  card: {
    width: '100%',
    maxWidth: '440px',
    padding: '40px',
  },
  header: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: '32px',
  },
  logoContainer: {
    width: '64px',
    height: '64px',
    borderRadius: '16px',
    background: 'rgba(6, 182, 212, 0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '16px',
    border: '1px solid rgba(6, 182, 212, 0.2)',
  },
  title: {
    fontSize: '2rem',
    fontWeight: '800',
    color: '#fff',
    letterSpacing: '-0.02em',
    marginBottom: '4px',
  },
  subtitle: {
    fontSize: '0.88rem',
    color: 'var(--text-secondary)',
    textAlign: 'center',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  labelWrapper: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: '0.85rem',
    fontWeight: '500',
    color: 'var(--text-secondary)',
  },
  inputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  inputIcon: {
    position: 'absolute',
    left: '16px',
    color: 'var(--text-muted)',
  },
  forgotBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--primary)',
    fontSize: '0.8rem',
    cursor: 'pointer',
    fontFamily: 'var(--font-sans)',
  },
  eyeBtn: {
    position: 'absolute',
    right: '16px',
    background: 'none',
    border: 'none',
    color: 'var(--text-muted)',
    cursor: 'pointer',
  },
  submitBtn: {
    marginTop: '8px',
    width: '100%',
  },
  devHint: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
    textAlign: 'center',
    marginTop: '8px',
    padding: '8px',
    background: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid var(--border-glass)',
    borderRadius: '8px',
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
    marginBottom: '20px',
  },
  alertSuccess: {
    padding: '12px 16px',
    background: 'rgba(16, 185, 129, 0.12)',
    border: '1px solid rgba(16, 185, 129, 0.25)',
    borderRadius: '10px',
    color: '#a7f3d0',
    fontSize: '0.85rem',
    marginBottom: '20px',
    textAlign: 'center',
  },
  forgotContainer: {
    display: 'flex',
    flexDirection: 'column',
  },
  forgotTitle: {
    fontSize: '1.25rem',
    fontWeight: '600',
    color: '#fff',
    marginBottom: '6px',
  },
  forgotSubtitle: {
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
    marginBottom: '20px',
    lineHeight: '1.4',
  },
  btnRow: {
    display: 'flex',
    gap: '12px',
    marginTop: '10px',
  },
};

export default Login;
