import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Signup from './pages/Signup'; // New

import LandingPage from './pages/LandingPage'; // New
import ForgotPassword from './pages/Forgotpassword';
import ResetPassword from './pages/Resetpassword';
import Users from './pages/Users';
import Contacts from './pages/Contacts';
import Opportunities from './pages/Opportunities';
import Tickets from './pages/Tickets';
import Products from './pages/Products';
import Invoices from './pages/Invoices';
import Payments from './pages/Payments';
import Tasks from './pages/Tasks';
import Calendar from './pages/Calendar';
import Attendance from './pages/Attendance';
import Payroll from './pages/Payroll';
import Settings from './pages/Settings';
import Explore from './pages/Explore';

import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <AuthProvider>
      <Toaster 
        position="top-right" 
        reverseOrder={false}
        toastOptions={{
          duration: 3500,
          style: {
            background: '#0f172a',
            color: '#f8fafc',
            borderRadius: '14px',
            fontSize: '13px',
            fontWeight: '600',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
            padding: '12px 16px'
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#ffffff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#ffffff',
            },
          },
        }} 
      />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        
        {/* Protected Routes (The "App") */}
        <Route path="/app" element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route index element={<Navigate to="/app/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="explore" element={<Explore />} />
            
            {/* Common Routes */}
            <Route path="tickets" element={<Tickets />} />
            <Route path="settings" element={<Settings />} />

            {/* Employee/Admin Only Routes */}
            <Route element={<ProtectedRoute allowedRoles={['Admin', 'Employee', 'Sales', 'HR']} />}>
                 <Route path="contacts" element={<Contacts />} />
                 <Route path="sales" element={<Opportunities />} />
                 <Route path="products" element={<Products />} />
                 <Route path="payments" element={<Payments />} />
                 <Route path="tasks" element={<Tasks />} />
                 <Route path="calendar" element={<Calendar />} />
                 <Route path="attendance" element={<Attendance />} />
                 <Route path="payroll" element={<Payroll />} />
            </Route>

            {/* Admin & Client Routes */}
            <Route element={<ProtectedRoute allowedRoles={['Admin', 'Client']} />}>
               <Route path="invoices" element={<Invoices />} />
            </Route>

            {/* Admin & HR Only Routes */}
            <Route element={<ProtectedRoute allowedRoles={['Admin', 'HR']} />}>
              <Route path="users" element={<Users />} />
            </Route>
          </Route>
        </Route>
      </Routes>
    </AuthProvider>
  );
}

export default App;
