import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem('sms_token'));
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('sms_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(false);

  const authUrl = 'http://localhost:5003';
  const acadUrl = 'http://localhost:5002';

  // Base API caller that routes to correct microservice
  const apiCall = async (service, endpoint, method = 'GET', body = null, isMultipart = false) => {
    const baseUrl = service === 'auth' ? authUrl : acadUrl;
    const url = `${baseUrl}${endpoint}`;

    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    let options = { method, headers };

    if (body) {
      if (isMultipart) {
        options.body = body; // let browser set content-type for FormData
      } else {
        headers['Content-Type'] = 'application/json';
        options.body = JSON.stringify(body);
      }
    }

    try {
      const response = await fetch(url, options);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
      }
      return data;
    } catch (error) {
      console.error(`API Call failed: ${url}`, error);
      throw error;
    }
  };

  const login = async (email, password) => {
    setLoading(true);
    try {
      const data = await apiCall('auth', '/api/auth/login', 'POST', { email, password });
      if (data.success && data.token) {
        setToken(data.token);
        setUser(data.user);
        localStorage.setItem('sms_token', data.token);
        localStorage.setItem('sms_user', JSON.stringify(data.user));
      }
      return data;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('sms_token');
    localStorage.removeItem('sms_user');
  };

  const requestOtp = async (email) => {
    return await apiCall('auth', '/api/auth/forgot-password', 'POST', { email });
  };

  const resetPassword = async (email, otpCode, newPassword) => {
    return await apiCall('auth', '/api/auth/reset-password', 'POST', { email, otpCode, newPassword });
  };

  // Fetch full profile info if needed
  const fetchProfile = async () => {
    try {
      const data = await apiCall('auth', '/api/users/profile', 'GET');
      if (data.success) {
        // Update user state with full details
        const updatedUser = { ...user, ...data.data };
        setUser(updatedUser);
        localStorage.setItem('sms_user', JSON.stringify(updatedUser));
      }
      return data;
    } catch (error) {
      console.error("Failed to fetch user profile", error);
    }
  };

  useEffect(() => {
    if (token) {
      fetchProfile();
    }
  }, [token]);

  return (
    <AuthContext.Provider value={{ token, user, loading, login, logout, requestOtp, resetPassword, apiCall, fetchProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
