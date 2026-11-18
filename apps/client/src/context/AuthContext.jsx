import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const rawApiUrl = import.meta.env.VITE_API_URL || '';
const API_URL = rawApiUrl.endsWith('/') ? rawApiUrl.slice(0, -1) : rawApiUrl;

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

const sanitizeUser = (u) => {
    if (!u) return null;
    let copy = { ...u };
    if (!copy.originalRole) {
        copy.originalRole = copy.role;
    }
    if (copy.profilePic && typeof copy.profilePic === 'string' && copy.profilePic.includes('document-service:5007')) {
        copy.profilePic = copy.profilePic.replace('http://document-service:5007', '');
    }
    if (copy.role === 'Client') {
        delete copy.salary;
        delete copy.department;
        delete copy.designation;
    }
    return copy;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const token = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');
      if (token && savedUser && savedUser !== 'undefined') {
        return sanitizeUser(JSON.parse(savedUser));
      }
    } catch (e) {
      console.error("Error reading user from localStorage on init:", e);
    }
    return null;
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const hasAutoCheckedIn = useRef(false);

  const autoCheckIn = async (parsedUser) => {
    if (!parsedUser || !parsedUser.role || ['client', 'admin'].includes(parsedUser.role.toLowerCase())) return;
    if (hasAutoCheckedIn.current) return;
    hasAutoCheckedIn.current = true;
    try {
        const url = `${API_URL}/api/attendance/check-in`;
        const token = localStorage.getItem('token');
        const res = await fetch(url, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            },
            body: JSON.stringify({ userId: parsedUser.id || parsedUser._id }),
        });
        if (!res.ok && res.status !== 400) {
            console.warn("Auto check-in issue:", res.statusText);
        }
    } catch (err) {
        console.warn("Auto check-in skipped:", err.message);
    }
  };

  const autoCheckOut = async (currUser) => {
    if (currUser.role === 'Client' || currUser.role === 'Admin') return;
    try {
        const token = localStorage.getItem('token');
        await fetch(`${API_URL}/api/attendance/check-out`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            },
            body: JSON.stringify({ userId: currUser.id || currUser._id }),
        });
    } catch (err) {
        // Silent fail for checkout
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    
    if (token && savedUser && savedUser !== 'undefined') {
      try {
        const parsedUser = sanitizeUser(JSON.parse(savedUser));
        setUser(parsedUser);
        
        if (parsedUser) {
            autoCheckIn(parsedUser);
        }
      } catch (e) {
        console.error("Error parsing user from localStorage", e);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    } else if (savedUser === 'undefined') {
        localStorage.removeItem('user');
    }
    
    setLoading(false);

    if (token && savedUser && savedUser !== 'undefined') {
        checkAuth();
    }
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      
      if (res.ok && data.success) {
        const rawUser = data.data?.user || data.data;
        const token = data.data?.token || data.token;
        const userData = sanitizeUser(rawUser);
        
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);

        autoCheckIn(userData);
        setLoading(false);

        return { success: true, user: userData };
      } else {
        setLoading(false);
        return { success: false, message: data.message || 'Login failed' };
      }
    } catch (err) {
      setLoading(false);
      console.error("Login error:", err);
      return { success: false, message: 'Server connection error. Please try again.' };
    }
  };

  const register = async (name, email, password, role = 'Client') => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        const rawUser = data.data?.user || data.data;
        const token = data.data?.token || data.token;
        const userData = sanitizeUser(rawUser);

        if (token) {
            localStorage.setItem('token', token);
        }
        if (userData) {
            localStorage.setItem('user', JSON.stringify(userData));
            setUser(userData);
            autoCheckIn(userData);
        }

        setLoading(false);
        return { success: true, user: userData };
      } else {
        setLoading(false);
        return { success: false, message: data.message || 'Registration failed' };
      }
    } catch (err) {
      setLoading(false);
      return { success: false, message: 'Server connection error. Please try again.' };
    }
  };

  const loginWithUserData = (userData, token) => {
    setLoading(true);
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    if (userData) {
      hasAutoCheckedIn.current = false;
      autoCheckIn(userData);
    }
    setLoading(false);
  };

  const logout = () => {
    if (user) {
        autoCheckOut(user);
    }
    hasAutoCheckedIn.current = false;
    localStorage.clear();
    sessionStorage.clear();
    setUser(null);
    navigate('/login', { replace: true, state: {} });
  };

  const checkAuth = async () => {
    if (!user && !localStorage.getItem('user')) return;
    
    const storedUser = user || JSON.parse(localStorage.getItem('user'));
    if (!storedUser) return;
    const userId = storedUser.id || storedUser._id;
    if (!userId || userId === 'undefined') return;
    
    try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/api/auth/users/${userId}`, {
            headers: {
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            }
        });
        const data = await res.json();
        
        if (res.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setUser(null);
            return;
        }

        if (res.ok && data.success) {
            const updatedUser = data.data;
            const mergedUser = sanitizeUser({ ...storedUser, ...updatedUser });
            setUser(mergedUser);
            localStorage.setItem('user', JSON.stringify(mergedUser));
        }
    } catch (err) {
        console.error("Failed to refresh user data", err);
    }
  };

  const updateUserState = (updatedFields) => {
    setUser(prev => {
        const newObj = { ...prev, ...updatedFields };
        localStorage.setItem('user', JSON.stringify(newObj));
        return newObj;
    });
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, checkAuth, loginWithUserData, updateUserState }}>
      {children}
    </AuthContext.Provider>
  );
};
