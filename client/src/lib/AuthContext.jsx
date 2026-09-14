import { createContext, useContext, useEffect, useState, useCallback } from 'react';

const AuthContext = createContext(null);

const API_URL = 'http://localhost:3000/api';

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  // Get the current login session from the Express server
  const refreshSession = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/auth/session`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to get session');
      }

      const data = await response.json();

      setSession(data.session || null);
    } catch (error) {
      console.error('Session error:', error);
      setSession(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Check the session when the application starts
  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  // Log out through the Express server
  const logout = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Logout failed');
      }

      setSession(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        session,
        loading,
        refreshSession,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);

  if (!ctx) {
    throw new Error('useAuth must be used inside an AuthProvider');
  }

  return ctx;
}