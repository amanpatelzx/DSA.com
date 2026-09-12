import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch authenticated user profile using token
  const fetchMe = async (authToken) => {
    const t = authToken || token;
    if (!t) {
      setUser(null);
      setLoading(false);
      return null;
    }

    try {
      const res = await axios.get('http://localhost:5000/api/users/me', {
        headers: {
          Authorization: `Bearer ${t}`
        }
      });
      if (res.data?.user) {
        setUser(res.data.user);
        if (res.data.user.username) {
          localStorage.setItem('username', res.data.user.username);
        }
        return res.data.user;
      }
    } catch (err) {
      console.error('Failed to authenticate token:', err.response?.data?.message || err.message);
      // If token is invalid or expired, log out
      if (err.response?.status === 401 || err.response?.status === 404) {
        logout();
      }
      return null;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchMe(token);
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = async (newToken, userData) => {
    localStorage.setItem('token', newToken);
    if (userData?.username) {
      localStorage.setItem('username', userData.username);
    }
    setToken(newToken);
    if (userData) {
      setUser(userData);
    }
    // Sync full user data from backend
    await fetchMe(newToken);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        loading,
        isLoggedIn: !!token,
        login,
        logout,
        refreshUser: () => fetchMe(token)
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
