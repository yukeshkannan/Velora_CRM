import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Plus, Search, Mail, Phone, Building2, Pencil, Trash2, X, Filter, 
    MoreHorizontal, Download, User
} from 'lucide-react';
import { exportToCSV } from '../utils/exportUtils';
import LoadingSpinner from '../components/LoadingSpinner';

const Contacts = () => {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    status: 'New'
  });

  // Status options for dropdown
  const statusOptions = ['New', 'Contacted', 'Qualified', 'Customer', 'Lost'];

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    try {
      const response = await axios.get('/api/contacts');
      setContacts(response.data.data || []);
      setLoading(false);
    } catch (err) {
      console.error("Failed to fetch contacts", err);
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleEdit = (contact) => {
    setEditingContact(contact);
    setFormData({
      name: contact.name,
      email: contact.email,
      phone: contact.phone || '',
      company: contact.company || '',
      status: contact.status || 'New'
    });
    setIsDrawerOpen(true);
  };

  const handleDelete = async (contactId) => {
    try {
        await axios.delete(`/api/contacts/${contactId}`);
        toast.success('Contact deleted successfully');
        setContacts(contacts.filter(c => c._id !== contactId));
        setShowDeleteConfirm(null);
    } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to delete contact');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingContact) {
        await axios.put(`/api/contacts/${editingContact._id}`, formData);
        toast.success('Contact updated successfully');
      } else {
        await axios.post('/api/contacts', formData);
        toast.success('Contact created successfully');
      }
      
      handleCloseDrawer();
      fetchContacts(); 
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed');
    }
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false); 
    setEditingContact(null);
    setFormData({ name: '', email: '', phone: '', company: '', status: 'New' });
  };

  const filteredContacts = contacts.filter(contact => 
    contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.company?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusStyle = (status) => {
      switch(status) {
          case 'Customer': return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
          case 'Qualified': return 'bg-indigo-50 text-indigo-700 border border-indigo-200';
          case 'Contacted': return 'bg-amber-50 text-amber-700 border border-amber-200';
          case 'Lost': return 'bg-rose-50 text-rose-700 border border-rose-200';
          default: return 'bg-slate-100 text-slate-700 border border-slate-200';
      }
  };

  if (loading) return <LoadingSpinner message="Loading Contacts..." />;

  return (
    <div className="h-full flex flex-col bg-slate-50 overflow-hidden font-sans selection:bg-slate-200 selection:text-slate-900 antialiased"
         style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
      
      {/* Header */}
      <div className="bg-white border-b border-slate-200/80 px-8 py-5 flex justify-between items-center shrink-0">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Contacts Directory</h1>
          <p className="text-slate-500 text-xs sm:text-sm font-medium mt-0.5">Manage leads, client contacts, and customer relationships.</p>
        </div>
        <div className="flex items-center gap-3">
            <button 
                onClick={() => exportToCSV(contacts, 'contacts')}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-xs hover:bg-slate-50 transition-all shadow-xs cursor-pointer"
            >
                <Download size={16} />
                <span className="hidden sm:inline">Export</span>
            </button>
            <button 
                onClick={() => setIsDrawerOpen(true)}
                className="bg-slate-900 text-white px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm hover:bg-slate-800 transition-all shadow-xs flex items-center gap-2 cursor-pointer"
            >
                <Plus size={16} /> Add Contact
            </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="px-8 py-4 flex gap-4 items-center shrink-0">
        <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search contacts by name, email, company..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white focus:bg-white focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 outline-none transition-all text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400 shadow-2xs"
            />
        </div>
      </div>

      {/* Content Area - Fixed height container for scroll */}
      <div className="flex-1 px-8 pb-8 overflow-y-auto">
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <table className="w-full text-left border-collapse">
                <thead className="bg-slate-100/70 border-b border-slate-200/80">
                    <tr>
                        <th className="px-6 py-3.5 text-[11px] font-extrabold text-slate-700 uppercase tracking-wider">Name</th>
                        <th className="px-6 py-3.5 text-[11px] font-extrabold text-slate-700 uppercase tracking-wider">Contact Info</th>
                        <th className="px-6 py-3.5 text-[11px] font-extrabold text-slate-700 uppercase tracking-wider">Company</th>
                        <th className="px-6 py-3.5 text-[11px] font-extrabold text-slate-700 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3.5 text-[11px] font-extrabold text-slate-700 uppercase tracking-wider text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {filteredContacts.map(contact => (
                        <tr key={contact._id} className="hover:bg-slate-50/80 transition-colors group">
                            <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-xs text-slate-900">
                                        {contact.name.charAt(0)}
                                    </div>
                                    <div>
                                        <div className="font-bold text-sm text-slate-900">{contact.name}</div>
                                        <div className="text-[11px] text-slate-400 font-medium">Added recently</div>
                                    </div>
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                    <div className="flex flex-col gap-1 text-xs font-medium text-slate-600">
                                    <div className="flex items-center gap-2"><Mail size={14} className="text-slate-400"/> {contact.email}</div>
                                    {contact.phone && <div className="flex items-center gap-2"><Phone size={14} className="text-slate-400"/> {contact.phone}</div>}
                                    </div>
                            </td>
                            <td className="px-6 py-4 text-xs font-semibold text-slate-800">
                                {contact.company ? (
                                    <div className="flex items-center gap-2"><Building2 size={15} className="text-slate-400"/> {contact.company}</div>
                                ) : '-'}
                            </td>
                            <td className="px-6 py-4">
                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${getStatusStyle(contact.status)}`}>
                                    {contact.status || 'New'}
                                </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                                <div className="flex justify-end gap-1.5">
                                    <button onClick={() => handleEdit(contact)} className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer" title="Edit">
                                        <Pencil size={16} />
                                    </button>
                                    <button onClick={() => setShowDeleteConfirm(contact)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer" title="Delete">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                    {filteredContacts.length === 0 && (
                        <tr>
                            <td colSpan="5" className="px-6 py-12 text-center text-slate-400">
                                <div className="flex flex-col items-center gap-3">
                                    <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center">
                                        <User size={24} className="text-slate-400" />
                                    </div>
                                    <p className="font-semibold text-xs text-slate-600">No contacts found</p>
                                </div>
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
      </div>

      {/* Smooth Side Drawer Panel */}
      <AnimatePresence>
        {isDrawerOpen && (
          <>
              <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40" 
                  onClick={handleCloseDrawer} 
              />
              <motion.div 
                  initial={{ x: '100%', opacity: 0.5 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: '100%', opacity: 0 }}
                  transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                  className="fixed top-0 right-0 bottom-0 w-full sm:w-[460px] bg-white z-50 shadow-2xl flex flex-col border-l border-slate-200/80"
              >
                  <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                      <div>
                          <h2 className="text-lg font-extrabold text-slate-900">{editingContact ? 'Edit Contact' : 'New Contact'}</h2>
                          <p className="text-slate-500 text-xs font-medium mt-0.5">{editingContact ? 'Update details below.' : 'Add a new lead or customer.'}</p>
                      </div>
                      <button onClick={handleCloseDrawer} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-900 transition-colors cursor-pointer"><X size={18} /></button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-6">
                      <form id="contactForm" onSubmit={handleSubmit} className="space-y-4">
                          <div>
                              <label className="block text-xs font-bold text-slate-700 mb-1.5">Full Name <span className="text-rose-500">*</span></label>
                              <input 
                                  required 
                                  type="text" 
                                  name="name" 
                                  value={formData.name} 
                                  onChange={handleChange} 
                                  placeholder="e.g. John Doe"
                                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 outline-none transition-all text-xs sm:text-sm font-medium text-slate-900"
                              />
                          </div>

                          <div>
                              <label className="block text-xs font-bold text-slate-700 mb-1.5">Email <span className="text-rose-500">*</span></label>
                              <input 
                                  required 
                                  type="email" 
                                  name="email" 
                                  value={formData.email} 
                                  onChange={handleChange}
                                  placeholder="e.g. john@company.com"
                                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 outline-none transition-all text-xs sm:text-sm font-medium text-slate-900"
                              />
                          </div>

                           <div className="grid grid-cols-2 gap-3">
                              <div>
                                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Phone</label>
                                  <input 
                                      type="text" 
                                      name="phone" 
                                      value={formData.phone} 
                                      onChange={handleChange}
                                      placeholder="+1 (555) 000-0000"
                                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 outline-none transition-all text-xs sm:text-sm font-medium text-slate-900"
                                  />
                              </div>
                              <div>
                                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Company</label>
                                  <input 
                                      type="text" 
                                      name="company" 
                                      value={formData.company} 
                                      onChange={handleChange}
                                      placeholder="Company Ltd."
                                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 outline-none transition-all text-xs sm:text-sm font-medium text-slate-900"
                                  />
                              </div>
                          </div>

                          <div>
                              <label className="block text-xs font-bold text-slate-700 mb-1.5">Status</label>
                              <select 
                                  name="status" 
                                  value={formData.status} 
                                  onChange={handleChange}
                                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-slate-900 outline-none transition-all text-xs sm:text-sm font-medium text-slate-900 cursor-pointer"
                              >
                                  {statusOptions.map(option => <option key={option} value={option}>{option}</option>)}
                              </select>
                          </div>
                      </form>
                  </div>

                  <div className="p-4 border-t border-slate-100 bg-slate-50 flex gap-3">
                      <button onClick={handleCloseDrawer} className="flex-1 text-slate-700 font-bold hover:bg-slate-200/60 py-2.5 text-xs rounded-xl transition-colors cursor-pointer">Cancel</button>
                      <button form="contactForm" type="submit" className="flex-1 bg-slate-900 text-white font-bold py-2.5 text-xs rounded-xl hover:bg-slate-800 shadow-xs transition-colors cursor-pointer">
                          {editingContact ? 'Save Changes' : 'Create Contact'}
                      </button>
                  </div>
              </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
           <div className="bg-white p-6 rounded-2xl w-full max-w-sm text-center shadow-2xl border border-slate-200/80">
                <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4 border border-rose-100">
                    <Trash2 size={24} />
                </div>
                <h2 className="text-lg font-extrabold text-slate-900 mb-1">Delete Contact?</h2>
                <p className="text-slate-500 text-xs font-medium mb-6 leading-relaxed">
                    Are you sure you want to delete <strong>{showDeleteConfirm.name}</strong>? This action cannot be undone.
                </p>
                <div className="flex gap-3">
                    <button className="flex-1 py-2.5 rounded-xl font-bold text-xs text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer" onClick={() => setShowDeleteConfirm(null)}>Cancel</button>
                    <button className="flex-1 py-2.5 rounded-xl font-bold text-xs bg-rose-600 text-white hover:bg-rose-700 shadow-xs transition-colors cursor-pointer" onClick={() => handleDelete(showDeleteConfirm._id)}>Delete</button>
                </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default Contacts;
