import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

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
  const [user, setUser] = useState(null);
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
    setLoading(false);

    // Refresh user role from DB in background to avoid stale localStorage roles
    if (token && savedUser && savedUser !== 'undefined') {
        checkAuth();
    }
  }, []);

  const login = async (email, password) => {
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

        return { success: true, user: userData };
      } else {
        return { success: false, message: data.message || 'Login failed' };
      }
    } catch (err) {
      console.error("Login error:", err);
      return { success: false, message: 'Server connection error. Please try again.' };
    }
  };

  const register = async (name, email, password, role = 'Client') => {
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

        return { success: true, user: userData };
      } else {
        return { success: false, message: data.message || 'Registration failed' };
      }
    } catch (err) {
      return { success: false, message: 'Server connection error. Please try again.' };
    }
  };

  const loginWithUserData = (userData, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    if (userData) {
      hasAutoCheckedIn.current = false;
      autoCheckIn(userData);
    }
  };

  const logout = () => {
    if (user) {
        autoCheckOut(user);
    }
    hasAutoCheckedIn.current = false;
    localStorage.clear(); // Bulletproof reset: Wipes out all active and stale session variables
    setUser(null);
    navigate('/');
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

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Loading...</div>;
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, checkAuth, loginWithUserData, updateUserState }}>
      {children}
    </AuthContext.Provider>
  );
};
