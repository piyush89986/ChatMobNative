import React, { createContext, useState, useEffect, useContext } from 'react';
import { storage } from '../utils/storage';
import { DEFAULT_HOST } from '../utils/constants';
import { setApiBaseUrl } from '../api/client';
import { loginUser, registerUser } from '../api/auth';
import { getMyProfile } from '../api/user';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [serverUrl, setServerUrlState] = useState(DEFAULT_HOST);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize Auth state & Server URL on boot
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        let savedUrl = await storage.getServerUrl();
        // If saved URL is an old local development IP/host, migrate to DEFAULT_HOST
        if (
          !savedUrl ||
          savedUrl.includes('localhost') ||
          savedUrl.includes('10.41.') ||
          savedUrl.includes('10.0.2.2') ||
          savedUrl.includes('127.0.0.1')
        ) {
          savedUrl = DEFAULT_HOST;
          await storage.setServerUrl(DEFAULT_HOST);
        }
        setServerUrlState(savedUrl);
        setApiBaseUrl(savedUrl);

        const savedToken = await storage.getToken();
        const savedUser = await storage.getUser();

        if (savedToken) {
          setToken(savedToken);
          if (savedUser) setUser(savedUser);

          // Verify token against /users/me
          try {
            const res = await getMyProfile();
            if (res && (res.success || res.status) && res.data) {
              setUser(res.data);
              await storage.setUser(res.data);
            }
          } catch (err) {
            console.log('Session verification warning:', err.message);
            // If invalid token, clear
            if (err.message && (err.message.includes('401') || err.message.includes('Unauthrized'))) {
              await storage.clearAll();
              setToken(null);
              setUser(null);
            }
          }
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (login_user, password) => {
    const response = await loginUser({ login_user, password });
    if (response && (response.success || response.status) && response.data) {
      const userData = response.data;
      const authToken = userData.token;

      setToken(authToken);
      setUser(userData);
      await storage.setToken(authToken);
      await storage.setUser(userData);
      return userData;
    } else {
      throw new Error(response?.message || 'Login failed');
    }
  };

  const register = async (payload) => {
    const response = await registerUser(payload);
    if (response && (response.success || response.status) && response.data) {
      // Auto login or return user
      return response.data;
    } else {
      throw new Error(response?.message || 'Registration failed');
    }
  };

  const logout = async () => {
    await storage.clearAll();
    setToken(null);
    setUser(null);
  };

  const updateProfileData = async (updatedUser) => {
    setUser(updatedUser);
    await storage.setUser(updatedUser);
  };

  const updateServerUrl = async (newUrl) => {
    const cleanUrl = newUrl.trim().replace(/\/$/, '');
    setServerUrlState(cleanUrl);
    setApiBaseUrl(cleanUrl);
    await storage.setServerUrl(cleanUrl);
  };

  const refreshProfile = async () => {
    try {
      const res = await getMyProfile();
      if (res?.data) {
        setUser(res.data);
        await storage.setUser(res.data);
      }
    } catch (e) {
      console.log('Could not refresh profile', e.message);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        serverUrl,
        isLoading,
        login,
        register,
        logout,
        updateProfileData,
        updateServerUrl,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
