import { useState, useEffect } from 'react';
import { apiHelper } from '../utils/apiHelper';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkTokenValidity = async () => {
    try {
      await apiHelper.get('/auth/fetchUserByToken');
    } catch (error) {
      if (error?.message && error?.message?.includes('logged in from another device')) {
        // Token invalid due to login from another device - redirect handled by apiHelper
        return;
      }
      // Other errors - logout user
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await apiHelper.get('/auth/fetchUserByToken');
        const userData = response?.user || response?.data || response;
        setUser(userData);
        setIsAuthenticated(true);
      } catch (error) {
        if (error?.message && error?.message?.includes('logged in from another device')) {
          return;
        }
        setUser(null);
        setIsAuthenticated(false);
      }
      setLoading(false);
    };

    fetchUser();
  }, []);

  // Check token validity on user activity with throttling
  useEffect(() => {
    if (!isAuthenticated) return;

    let lastCheck = 0;
    const throttleDelay = 10000; // 10 seconds

    const handleActivity = () => {
      const now = Date.now();
      if (now - lastCheck > throttleDelay) {
        lastCheck = now;
        checkTokenValidity();
      }
    };

    // Listen for user activity
    const events = ['click', 'keydown'];
    events.forEach(event => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    // Check periodically every 60 seconds
    const interval = setInterval(checkTokenValidity, 60000);

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
      clearInterval(interval);
    };
  }, [isAuthenticated]);

  const setCookie = (name, value, days = 7) => {
    const expires = new Date();
    expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
    const cookieString = `${name}=${value};expires=${expires.toUTCString()};path=/`;
    // console.log('setCookie - Setting cookie:', cookieString);
    document.cookie = cookieString;
    // console.log('setCookie - Cookie set, current cookies:', document.cookie);
  };

  const getCookie = (name) => {
    const value = `; ${document?.cookie || ''}`;
    const parts = value?.split(`; ${name}=`);
    // console.log('getCookie - All cookies:', document.cookie);
    // console.log('getCookie - Looking for:', name, 'Found:', parts.length === 2 ? parts.pop().split(';').shift() : null);
    if (parts?.length === 2) return parts?.pop()?.split(';')?.shift();
    return null;
  };

  const login = (userData) => {
    // console.log('useAuth - Login called with:', { userData });
    // Check if user data is valid
    if (!userData) {
      window.location.href = '/login';
      return;
    }
    // Backend already set cookie, just update state
    setUser(userData);
    setIsAuthenticated(true);
    setLoading(false);
    // Save user role to localStorage
    if (userData?.role) {
      localStorage.setItem('userRole', userData.role);
    }
    // console.log('useAuth - Login state updated');
  };

  const logout = async () => {
    try {
      await apiHelper.get('/auth/logout');
    } catch (error) {
      console.log('Logout API error:', error);
    }
    if (typeof document !== 'undefined') {
      document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    }
    // Clear localStorage
    localStorage.removeItem('userRole');
    setUser(null);
    setIsAuthenticated(false);
  };

  return { user, isAuthenticated, loading, login, logout };
};