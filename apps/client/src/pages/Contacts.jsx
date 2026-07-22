import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
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
          case 'Customer': return 'bg-green-100 text-green-700';
          case 'Qualified': return 'bg-blue-100 text-blue-700';
          case 'Contacted': return 'bg-yellow-100 text-yellow-700';
          case 'Lost': return 'bg-red-100 text-red-700';
          default: return 'bg-slate-100 text-slate-700';
      }
  };

  if (loading) return <LoadingSpinner message="Loading Contacts..." />;

  return (
    <div className="h-full flex flex-col bg-slate-50 overflow-hidden font-sans">
      
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-8 py-5 flex justify-between items-center shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Contacts</h1>
          <p className="text-slate-500 text-sm mt-1">Manage and track your customer relationships.</p>
        </div>
        <div className="flex items-center gap-3">
            <button 
                onClick={() => exportToCSV(contacts, 'contacts')}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
            >
                <Download size={18} />
                <span className="hidden sm:inline">Export</span>
            </button>
            <button 
                onClick={() => setIsDrawerOpen(true)}
                className="bg-amber-600 text-white px-5 py-2 rounded-xl font-bold text-sm hover:bg-amber-700 transition-colors shadow-lg shadow-amber-200 flex items-center gap-2"
            >
                <Plus size={18} /> Add Contact
            </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="px-8 py-4 flex gap-4 items-center shrink-0">
        <div className="relative flex-1 max-w-md">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search contacts..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:border-amber-600 focus:ring-2 focus:ring-amber-100 outline-none transition-all bg-white"
            />
        </div>
      </div>

      {/* Content Area - Fixed height container for scroll */}
      <div className="flex-1 px-8 pb-8 overflow-y-auto">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 border-b border-slate-100">
                    <tr>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Name</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Contact Info</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Company</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {filteredContacts.map(contact => (
                        <tr key={contact._id} className="hover:bg-slate-50 transition-colors group">
                            <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600">
                                        {contact.name.charAt(0)}
                                    </div>
                                    <div>
                                        <div className="font-bold text-slate-900">{contact.name}</div>
                                        <div className="text-xs text-slate-500">Added recently</div>
                                    </div>
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                    <div className="flex flex-col gap-1 text-sm text-slate-600">
                                    <div className="flex items-center gap-2"><Mail size={14} className="text-slate-400"/> {contact.email}</div>
                                    {contact.phone && <div className="flex items-center gap-2"><Phone size={14} className="text-slate-400"/> {contact.phone}</div>}
                                    </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-700 font-medium">
                                {contact.company ? (
                                    <div className="flex items-center gap-2"><Building2 size={16} className="text-slate-400"/> {contact.company}</div>
                                ) : '-'}
                            </td>
                            <td className="px-6 py-4">
                                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${getStatusStyle(contact.status)}`}>
                                    {contact.status || 'New'}
                                </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                                <div className="flex justify-end gap-2">
                                    <button onClick={() => handleEdit(contact)} className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" title="Edit">
                                        <Pencil size={18} />
                                    </button>
                                    <button onClick={() => setShowDeleteConfirm(contact)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                    {filteredContacts.length === 0 && (
                        <tr>
                            <td colSpan="5" className="px-6 py-12 text-center text-slate-400">
                                <div className="flex flex-col items-center gap-3">
                                    <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center">
                                        <User size={32} className="text-slate-300" />
                                    </div>
                                    <p className="font-medium">No contacts found</p>
                                </div>
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
      </div>

      {/* Drawer */}
      {isDrawerOpen && (
        <>
            <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40" onClick={handleCloseDrawer} />
            <div className="fixed top-0 right-0 bottom-0 w-[450px] bg-white z-50 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900">{editingContact ? 'Edit Contact' : 'New Contact'}</h2>
                        <p className="text-slate-500 text-sm mt-0.5">{editingContact ? 'Update details below.' : 'Add a new customer.'}</p>
                    </div>
                    <button onClick={handleCloseDrawer} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors"><X size={20} /></button>
                </div>

                <div className="flex-1 overflow-y-auto p-8">
                    <form id="contactForm" onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Full Name <span className="text-red-500">*</span></label>
                            <input 
                                required 
                                type="text" 
                                name="name" 
                                value={formData.name} 
                                onChange={handleChange} 
                                placeholder="e.g. John Doe"
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-amber-600 outline-none transition-all"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Email <span className="text-red-500">*</span></label>
                            <input 
                                required 
                                type="email" 
                                name="email" 
                                value={formData.email} 
                                onChange={handleChange}
                                placeholder="e.g. john@company.com"
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-amber-600 outline-none transition-all"
                            />
                        </div>

                         <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Phone</label>
                                <input 
                                    type="text" 
                                    name="phone" 
                                    value={formData.phone} 
                                    onChange={handleChange}
                                    placeholder="+1 (555) 000-0000"
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Company</label>
                                <input 
                                    type="text" 
                                    name="company" 
                                    value={formData.company} 
                                    onChange={handleChange}
                                    placeholder="Company Ltd."
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Status</label>
                            <select 
                                name="status" 
                                value={formData.status} 
                                onChange={handleChange}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white outline-none"
                            >
                                {statusOptions.map(option => <option key={option} value={option}>{option}</option>)}
                            </select>
                        </div>
                    </form>
                </div>

                <div className="p-6 border-t border-slate-100 bg-slate-50 flex gap-4">
                    <button onClick={handleCloseDrawer} className="flex-1 text-slate-600 font-bold hover:bg-slate-200 py-3 rounded-xl transition-colors">Cancel</button>
                    <button form="contactForm" type="submit" className="flex-1 bg-amber-600 text-white font-bold py-3 rounded-xl hover:bg-amber-700 shadow-lg shadow-amber-200 transition-colors">
                        {editingContact ? 'Save Changes' : 'Create Contact'}
                    </button>
                </div>
            </div>
        </>
      )}

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center backdrop-blur-sm">
           <div className="bg-white p-8 rounded-2xl w-[400px] text-center shadow-2xl animate-in zoom-in duration-200">
                <div className="w-16 h-16 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto mb-6">
                    <Trash2 size={32} />
                </div>
                <h2 className="text-xl font-bold text-slate-900 mb-2">Delete Contact?</h2>
                <p className="text-slate-500 mb-8 leading-relaxed">
                    Are you sure you want to delete <strong>{showDeleteConfirm.name}</strong>? This action cannot be undone.
                </p>
                <div className="flex gap-4">
                    <button className="flex-1 py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-colors" onClick={() => setShowDeleteConfirm(null)}>Cancel</button>
                    <button className="flex-1 py-3 rounded-xl font-bold bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-200 transition-colors" onClick={() => handleDelete(showDeleteConfirm._id)}>Delete</button>
                </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default Contacts;
