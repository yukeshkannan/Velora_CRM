import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, User, Briefcase, Mail, Shield, X, Check, Building2, Eye, EyeOff, Pencil, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';

const roleOptions = {
  Admin: {
    departments: ['Administration', 'IT Operations', 'Management'],
    designations: ['System Administrator', 'Operations Director', 'IT Manager']
  },
  Employee: {
    departments: ['Engineering', 'Customer Support', 'IT Operations'],
    designations: ['Software Developer', 'Support Engineer', 'Systems Engineer', 'Junior Developer']
  },
  Sales: {
    departments: ['Sales', 'Marketing', 'Business Development'],
    designations: ['Sales Executive', 'Account Manager', 'Business Development Representative', 'Sales Lead']
  },
  HR: {
    departments: ['Human Resources', 'People Operations'],
    designations: ['HR Specialist', 'Recruiter', 'HR Coordinator', 'HR Manager']
  }
};

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [editingUser, setEditingUser] = useState(null); 
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null); 

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'Employee',
    designation: '',
    department: '',
    baseSalary: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { user: currentUser } = useAuth(); 

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await axios.get('/api/auth/users');
      // Filter strictly for internal staff members (excluding external clients)
      const internalStaff = (response.data.data || []).filter(u => u.role !== 'Client');
      setUsers(internalStaff);
      setLoading(false);
    } catch (err) {
      console.error("Failed to fetch users", err);
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'role') {
      const depts = roleOptions[value]?.departments || [];
      const desigs = roleOptions[value]?.designations || [];
      setFormData(prev => ({
        ...prev,
        [name]: value,
        department: depts[0] || '',
        designation: desigs[0] || ''
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: '', // Leave empty to keep existing
      role: user.role,
      designation: user.designation || '',
      department: user.department || '',
      baseSalary: user.salary?.base || ''
    });
    setIsDrawerOpen(true);
    setSuccess('');
    setError('');
  };

  const handleDelete = async (userId, e) => {
    e.stopPropagation(); // Prevent card click
    try {
        await axios.delete(`/api/auth/users/${userId}`);
        setUsers(users.filter(u => u._id !== userId));
        setShowDeleteConfirm(null);
        setSuccess('User deleted successfully');
    } catch (err) {
        setError('Failed to delete user');
    }
  };

  const confirmDelete = (e, user) => {
      e.stopPropagation();
      setShowDeleteConfirm(user);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    try {
      const payload = {
        ...formData,
        salary: { base: Number(formData.baseSalary) || 0, allowances: 0 }
      };

      if (editingUser) {
        // Update existing user
        await axios.put(`/api/auth/users/${editingUser._id}`, payload);
        setSuccess('User updated successfully!');
      } else {
        // Create new user
        await axios.post('/api/auth/create-user', payload);
        
        // AUTO-CREATION: If Role is Client, also create a CRM Contact
        if (payload.role === 'Client') {
             try {
                 await axios.post('/api/contacts', {
                     name: payload.name,
                     email: payload.email,
                     company: payload.department || 'Independent',
                     status: 'Customer' 
                 });
                 setSuccess('User created & Linked to CRM Contact!');
             } catch (contactErr) {
                 console.error("Auto-contact creation failed", contactErr);
                 setSuccess('User created, but failed to create Contact profile (Email might exist).');
             }
        } else {
             setSuccess('User created successfully!');
        }
      }
      
      setFormData({
        name: '', email: '', password: '',
        role: 'Employee', 
        department: 'Engineering',
        designation: 'Software Developer',
        baseSalary: ''
      });
      setIsDrawerOpen(false);
      setEditingUser(null);
      fetchUsers(); 
    } catch (err) {
      setError(err.response?.data?.message || (editingUser ? 'Failed to update user' : 'Failed to create user'));
    }
  };

  const openDrawer = () => {
    setEditingUser(null);
    setFormData({
        name: '', email: '', password: '',
        role: 'Employee', 
        department: 'Engineering',
        designation: 'Software Developer',
        baseSalary: ''
    });
    setIsDrawerOpen(true);
    setSuccess('');
    setError('');
  };

  if (loading) return <LoadingSpinner message="Loading Users..." />;

  const depts = [...(roleOptions[formData.role]?.departments || [])];
  const desigs = [...(roleOptions[formData.role]?.designations || [])];

  if (formData.department && !depts.includes(formData.department)) {
    depts.push(formData.department);
  }
  if (formData.designation && !desigs.includes(formData.designation)) {
    desigs.push(formData.designation);
  }

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto font-sans selection:bg-slate-200 selection:text-slate-900 antialiased"
         style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
      
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">User Management</h1>
          <p className="text-slate-500 text-xs sm:text-sm font-medium mt-0.5">Manage team members, system access, roles, and department assignments.</p>
        </div>
        <button 
          className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-xs flex items-center gap-2 transition-all cursor-pointer" 
          onClick={openDrawer}
        >
          <Plus size={16} />
          Add New User
        </button>
      </div>

      {/* Users List Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden mt-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-100/70 border-b border-slate-200/80">
              <tr>
                <th className="px-6 py-3.5 text-[11px] font-extrabold text-slate-700 uppercase tracking-wider">User</th>
                <th className="px-6 py-3.5 text-[11px] font-extrabold text-slate-700 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3.5 text-[11px] font-extrabold text-slate-700 uppercase tracking-wider">Department</th>
                <th className="px-6 py-3.5 text-[11px] font-extrabold text-slate-700 uppercase tracking-wider">Designation</th>
                <th className="px-6 py-3.5 text-[11px] font-extrabold text-slate-700 uppercase tracking-wider">Base Salary</th>
                <th className="px-6 py-3.5 text-[11px] font-extrabold text-slate-700 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => (
                <tr 
                  key={u._id} 
                  className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                  onClick={() => handleEdit(u)}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 text-slate-900 flex items-center justify-center font-bold text-xs">
                        {u.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-sm text-slate-900">{u.name}</div>
                        <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <Mail size={12} className="text-slate-400" />
                          <span>{u.email}</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      u.role === 'Admin' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                      u.role === 'HR' ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                      u.role === 'Sales' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                      u.role === 'Client' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                      'bg-slate-100 text-slate-700 border border-slate-200'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs font-semibold text-slate-700">
                    <div className="flex items-center gap-1.5">
                      <Building2 size={14} className="text-slate-400" />
                      <span>{u.department || 'General'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs font-semibold text-slate-700">
                    <div className="flex items-center gap-1.5">
                      <Briefcase size={14} className="text-slate-400" />
                      <span>{u.designation || '-'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs font-bold text-slate-900">
                    {u.salary?.base ? `₹${u.salary.base.toLocaleString()}` : '₹0'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                      <button 
                        onClick={() => handleEdit(u)} 
                        className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                        title="Edit User"
                      >
                        <Pencil size={16} />
                      </button>
                      <button 
                        onClick={(e) => confirmDelete(e, u)} 
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Delete User"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-slate-400">
                    No users registered in the system.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <AnimatePresence>
        {isDrawerOpen && (
          <>
              <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40" 
                  onClick={() => setIsDrawerOpen(false)} 
              />
              <motion.div 
                  initial={{ x: '100%', opacity: 0.5 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: '100%', opacity: 0 }}
                  transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                  className="fixed top-0 right-0 bottom-0 w-full sm:w-[460px] bg-white z-50 shadow-2xl flex flex-col border-l border-slate-200/80"
              >
                  <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                      <h2 className="text-xl font-bold text-slate-900">{editingUser ? 'Edit User' : 'New User'}</h2>
                      <button onClick={() => setIsDrawerOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors border-none bg-transparent cursor-pointer"><X size={24} /></button>
                  </div>

                  <div className="flex-1 p-8 overflow-y-auto">
                      {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm font-medium">{error}</div>}
                      
                      <form id="userForm" onSubmit={handleSubmit} className="flex flex-col gap-6">
                          <div>
                              <label className="block mb-2 font-semibold text-slate-700">Full Name</label>
                              <input required type="text" name="name" value={formData.name} onChange={handleChange} 
                              className="w-full p-3 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all" />
                          </div>

                          <div>
                              <label className="block mb-2 font-semibold text-slate-700">Email Address</label>
                              <input required type="email" name="email" value={formData.email} onChange={handleChange}
                              className="w-full p-3 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all" />
                          </div>

                          <div>
                              <label className="block mb-2 font-semibold text-slate-700">Password {editingUser && <span className="text-xs font-normal text-slate-400 ml-1">(Leave blank to keep current)</span>}</label>
                              <div className="relative">
                              <input 
                                  required={!editingUser} // Only required for new users
                                  type={showPassword ? "text" : "password"} 
                                  name="password" 
                                  value={formData.password} 
                                  onChange={handleChange}
                                  className="w-full p-3 pr-12 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all" 
                              />
                              <button 
                                  type="button"
                                  onClick={() => setShowPassword(!showPassword)}
                                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 border-none bg-transparent cursor-pointer"
                              >
                                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                              </button>
                              </div>
                          </div>

                          <div className="grid grid-cols-2 gap-6">
                              <div>
                                  <label className="block mb-2 font-semibold text-slate-700">Role</label>
                                  <select name="role" value={formData.role} onChange={handleChange}
                                      className="w-full p-3 rounded-lg border border-slate-200 focus:border-slate-900 outline-none transition-all bg-white cursor-pointer text-xs font-extrabold text-slate-900">
                                      <option value="Employee">Employee</option>
                                      <option value="Sales">Sales</option>
                                      <option value="HR">HR</option>
                                      <option value="Admin">Admin</option>
                                  </select>
                              </div>

                              <div>
                                  <label className="block mb-2 font-semibold text-slate-700">Department</label>
                                  <select name="department" value={formData.department} onChange={handleChange}
                                      className="w-full p-3 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all bg-white cursor-pointer">
                                      {depts.map((d, i) => (
                                          <option key={i} value={d}>{d}</option>
                                      ))}
                                  </select>
                              </div>
                          </div>

                          <div>
                              <label className="block mb-2 font-semibold text-slate-700">Designation</label>
                              <select name="designation" value={formData.designation} onChange={handleChange}
                                  className="w-full p-3 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all bg-white cursor-pointer">
                                  {desigs.map((d, i) => (
                                      <option key={i} value={d}>{d}</option>
                                  ))}
                              </select>
                          </div>

                           <div>
                              <label className="block mb-2 font-semibold text-slate-700">Base Salary (₹)</label>
                              <input type="number" name="baseSalary" value={formData.baseSalary} onChange={handleChange}
                              className="w-full p-3 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all" placeholder="e.g. 50000" />
                          </div>
                      </form>
                  </div>

                   <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-4">
                      <button onClick={() => setIsDrawerOpen(false)} className="px-6 py-2.5 rounded-lg text-slate-600 font-semibold hover:bg-slate-200 transition-colors cursor-pointer border-none bg-transparent">Cancel</button>
                      <button form="userForm" type="submit" className="px-6 py-2.5 rounded-lg bg-slate-900 text-white font-semibold hover:bg-slate-800 transition-colors shadow-xs cursor-pointer border-none">
                          {editingUser ? 'Update User' : 'Create User'}
                      </button>
                  </div>
              </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
           <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl animate-scale-up">
                <div className="w-16 h-16 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto mb-6">
                    <Trash2 size={32} />
                </div>
                <h2 className="text-xl font-bold text-slate-900 mb-2">Delete User?</h2>
                <p className="text-slate-500 mb-8">
                    Are you sure you want to delete <strong>{showDeleteConfirm.name}</strong>? This action cannot be undone.
                </p>
                <div className="flex gap-4">
                    <button 
                        className="flex-1 py-3 rounded-xl font-semibold text-slate-600 hover:bg-slate-100 transition-colors" 
                        onClick={() => setShowDeleteConfirm(null)}
                    >
                        Cancel
                    </button>
                    <button 
                        className="flex-1 py-3 rounded-xl font-semibold bg-red-600 text-white hover:bg-red-700 transition-colors shadow-lg shadow-red-200" 
                        onClick={(e) => handleDelete(showDeleteConfirm._id, e)}
                    >
                        Delete User
                    </button>
                </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default Users;
