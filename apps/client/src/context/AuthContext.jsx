import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '../components/LoadingSpinner';

const rawApiUrl = import.meta.env.VITE_API_URL;
// Bulletproof fix: If we are on Vercel, force relative path (empty string)
// Always use the configured API URL (from Vercel env vars)
let API_URL = rawApiUrl || '';

// CRITICAL FIX: Ensure API_URL does not end with slash, to avoid //api (double slash)
if (API_URL === '/' || API_URL.endsWith('/')) {
    API_URL = API_URL.replace(/\/$/, "");
}

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

  /* Auto Check-in Logic - Only for Employees/Staff (Excluding Admin & Client) */
  const autoCheckIn = async (parsedUser) => {
    if (!parsedUser || !parsedUser.role || ['client', 'admin'].includes(parsedUser.role.toLowerCase())) return; // Admin and Clients don't have attendance
    if (hasAutoCheckedIn.current) return;
    hasAutoCheckedIn.current = true;
    try {
        const url = `${API_URL}/api/attendance/check-in`;
        console.log("Checking in via:", url);
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
    if (currUser.role === 'Client' || currUser.role === 'Admin') return; // Admin and Clients don't have attendance
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
    // Check for stored token
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    
    if (token && savedUser && savedUser !== 'undefined') {
      try {
        const parsedUser = sanitizeUser(JSON.parse(savedUser));
        setUser(parsedUser);
        
        // Auto Check-in on session restore
        if (parsedUser) {
            autoCheckIn(parsedUser);
        }

      } catch (e) {
        console.error("Error parsing user from local storage", e);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    } else {
        // Clear potential bad state
        if (savedUser === 'undefined') {
            localStorage.removeItem('user');
        }
    }
    
    // Smooth 0.7s initial loader transition
    const timer = setTimeout(() => {
        setLoading(false);
    }, 700);

    // Refresh user role from DB in background to avoid stale localStorage roles
    if (token && savedUser && savedUser !== 'undefined') {
        checkAuth();
    }

    return () => clearTimeout(timer);
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

        // Auto Check-in on Login
        autoCheckIn(userData);

        setTimeout(() => {
          setLoading(false);
        }, 700);

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

        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);

        // Auto Check-in on Register
        autoCheckIn(userData);

        setTimeout(() => {
          setLoading(false);
        }, 700);

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
    setTimeout(() => {
      setLoading(false);
    }, 700);
  };

  const logout = () => {
    setLoading(true);
    if (user) {
        autoCheckOut(user);
    }
    hasAutoCheckedIn.current = false;
    localStorage.clear();
    sessionStorage.clear();
    setUser(null);
    setTimeout(() => {
      setLoading(false);
      navigate('/login', { replace: true, state: {} });
    }, 700);
  };

  // Refresh User Data (Profile Updates)
  const checkAuth = async () => {
    if (!user && !localStorage.getItem('user')) return;
    
    // Get ID from current state or storage
    const storedUser = user || JSON.parse(localStorage.getItem('user'));
    if (!storedUser) return;
    const userId = storedUser.id || storedUser._id;
    if (!userId || userId === 'undefined') return;
    
    try {
        console.log("Refreshing user data...");
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/api/auth/users/${userId}`, {
            headers: {
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            }
        });
        const data = await res.json();
        
        if (res.status === 401) {
            // Stale or expired session in localStorage -> clean up
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
            console.log("User data refreshed:", mergedUser);
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

  const switchPersonaRole = (targetRole) => {
    if (!user) return;
    const rolePresets = {
      Admin: { role: 'Admin', designation: 'Executive Administrator', department: 'Management' },
      HR: { role: 'HR', designation: 'People Operations Lead', department: 'Human Resources' },
      Sales: { role: 'Sales', designation: 'Enterprise Account Executive', department: 'Sales & Marketing' },
      Employee: { role: 'Employee', designation: 'Software Engineer', department: 'Engineering' },
      Client: { role: 'Client', designation: undefined, department: undefined, salary: undefined }
    };

    const preset = rolePresets[targetRole] || { role: targetRole };
    const updatedUser = sanitizeUser({
      ...user,
      ...preset
    });

    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
    return updatedUser;
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, checkAuth, loginWithUserData, updateUserState, switchPersonaRole }}>
      {children}
    </AuthContext.Provider>
  );
};
