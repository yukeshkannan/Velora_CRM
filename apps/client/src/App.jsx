import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import LoadingSpinner from './components/LoadingSpinner';
import { Toaster } from 'react-hot-toast';

// --- Route-Based Code Splitting (React.lazy for On-Demand Chunk Loading) ---
const LandingPage = lazy(() => import('./pages/LandingPage'));
const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));
const ForgotPassword = lazy(() => import('./pages/Forgotpassword'));
const ResetPassword = lazy(() => import('./pages/Resetpassword'));

const Dashboard = lazy(() => import('./pages/Dashboard'));
const Explore = lazy(() => import('./pages/Explore'));
const Tickets = lazy(() => import('./pages/Tickets'));
const Settings = lazy(() => import('./pages/Settings'));

const Contacts = lazy(() => import('./pages/Contacts'));
const Opportunities = lazy(() => import('./pages/Opportunities'));
const Products = lazy(() => import('./pages/Products'));
const Payments = lazy(() => import('./pages/Payments'));
const Tasks = lazy(() => import('./pages/Tasks'));
const Calendar = lazy(() => import('./pages/Calendar'));
const Attendance = lazy(() => import('./pages/Attendance'));
const Payroll = lazy(() => import('./pages/Payroll'));
const Invoices = lazy(() => import('./pages/Invoices'));
const Users = lazy(() => import('./pages/Users'));

function AppContent() {
  const { loading } = useAuth();

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <Suspense fallback={<LoadingSpinner fullScreen />}>
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
    </Suspense>
  );
}

function App() {
  return (
    <AuthProvider>
      <Toaster 
        position="top-right" 
        reverseOrder={false}
        gutter={8}
        containerStyle={{ top: 24, right: 24 }}
        toastOptions={{
          duration: 3500,
          style: {
            background: 'rgba(15, 23, 42, 0.95)',
            backdropFilter: 'blur(12px)',
            color: '#ffffff',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '16px',
            fontSize: '13px',
            fontWeight: '700',
            letterSpacing: '-0.2px',
            boxShadow: '0 20px 30px -10px rgba(0, 0, 0, 0.35)',
            padding: '12px 18px',
            fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
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
      <AppContent />
    </AuthProvider>
  );
}

export default App;

