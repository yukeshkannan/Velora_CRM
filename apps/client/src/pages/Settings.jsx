import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { User, Lock, Save, LogOut, Shield, Bell, ChevronRight, Camera, AlertCircle, Loader2, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Settings = () => {
    const { user, logout, checkAuth } = useAuth();
    const isClient = user?.role === 'Client';
    const [activeTab, setActiveTab] = useState('profile');
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const fileInputRef = useRef(null);
    
    // Profile State
    const [profileData, setProfileData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        designation: user?.designation || '',
        department: user?.department || '',
        profilePic: user?.profilePic || ''
    });

    // Password State
    const [passData, setPassData] = useState({
        newPassword: '',
        confirmPassword: ''
    });
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    useEffect(() => {
        if(user) {
            setProfileData({
                name: user.name || '',
                email: user.email || '',
                designation: user.designation || '',
                department: user.department || '',
                profilePic: user.profilePic || ''
            });
        }
    }, [user]);

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: '', text: '' });
        try {
            await axios.put(`/api/auth/users/${user.id || user._id}`, profileData);
            setMessage({ type: 'success', text: 'Profile updated successfully!' });
            if (checkAuth) await checkAuth(); // Refresh user context
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.message || 'Update failed' });
        } finally {
            setLoading(false);
        }
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Check file size (5MB limit)
        if (file.size > 5 * 1024 * 1024) {
            toast.error("File is too large! Max 5MB allowed.");
            return;
        }

        const formData = new FormData();
        formData.append('file', file);

        setUploading(true);
        try {
            const uploadRes = await axios.post('/api/documents/upload', formData);

            const imageUrl = uploadRes.data.data.url;

            // 2. Update User Profile in Auth Service
            await axios.put(`/api/auth/users/${user.id || user._id}`, { profilePic: imageUrl });
            
            setProfileData(prev => ({ ...prev, profilePic: imageUrl }));
            setMessage({ type: 'success', text: 'Profile picture updated!' });
            if (checkAuth) await checkAuth();
        } catch (err) {
            console.error("Upload failed", err);
            setMessage({ type: 'error', text: 'Failed to upload image' });
        } finally {
            setUploading(false);
        }
    };

    const handlePasswordUpdate = async (e) => {
        e.preventDefault();
        if (passData.newPassword !== passData.confirmPassword) {
            setMessage({ type: 'error', text: 'Passwords do not match' });
            return;
        }
        setLoading(true);
        setMessage({ type: '', text: '' });
        try {
            await axios.put(`/api/auth/users/${user.id || user._id}`, { password: passData.newPassword });
            setMessage({ type: 'success', text: 'Password updated successfully!' });
            setPassData({ newPassword: '', confirmPassword: '' });
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.message || 'Update failed' });
        } finally {
            setLoading(false);
        }
    };

    const NavItem = ({ id, label, icon: Icon, description }) => (
        <button
            onClick={() => setActiveTab(id)}
            style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                width: '100%', padding: '1rem',
                border: 'none', borderRadius: '8px',
                backgroundColor: activeTab === id ? '#eff6ff' : 'transparent',
                color: activeTab === id ? '#2563eb' : '#64748b',
                textAlign: 'left', cursor: 'pointer', transition: 'all 0.2s',
                marginBottom: '0.5rem'
            }}
        >
            <div style={{ backgroundColor: activeTab === id ? '#fff' : '#f1f5f9', padding: '8px', borderRadius: '6px', boxShadow: activeTab === id ? '0 1px 2px rgba(0,0,0,0.05)' : 'none' }}>
                <Icon size={18} color={activeTab === id ? '#2563eb' : '#64748b'} />
            </div>
            <div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', color: activeTab === id ? '#1e293b' : '#475569' }}>{label}</div>
            </div>
            {activeTab === id && <ChevronRight size={16} style={{ marginLeft: 'auto',  opacity: 0.5 }} />}
        </button>
    );

    return (
        <div style={{ minHeight: 'calc(100vh - 64px)', backgroundColor: '#f8fafc', fontFamily: "'Inter', sans-serif", display: 'flex', justifyContent: 'center', padding: '2rem 1rem' }}>
            <div style={{ display: 'flex', width: '100%', maxWidth: '1100px', backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9', minHeight: '600px', height: 'fit-content' }}>
                
                {/* Left Sidebar */}
                <div style={{ width: '280px', backgroundColor: '#ffffff', borderRight: '1px solid #f1f5f9', padding: '2rem', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ marginBottom: '2rem' }}>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>Settings</h2>
                        <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '4px' }}>Manage your account.</p>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <NavItem id="profile" label="My Profile" icon={User} description="Name, Email, Role" />
                        <NavItem id="security" label="Password & Security" icon={Lock} description="Change Password" />
                    </div>

                    <div style={{ marginTop: 'auto', paddingTop: '2rem' }}>
                        <button 
                            onClick={logout}
                            style={{ 
                                display: 'flex', alignItems: 'center', gap: '10px',
                                width: '100%', padding: '0.75rem 1rem',
                                border: '1px solid #fecaca', borderRadius: '8px',
                                backgroundColor: '#fee2e2', color: '#b91c1c',
                                fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            <LogOut size={18} /> Sign Out
                        </button>
                    </div>
                </div>

                {/* Right Content */}
                <div style={{ flex: 1, padding: '3rem 4rem' }}>
                    {message.text && (
                        <div style={{ 
                            padding: '1rem 1.5rem', borderRadius: '10px', marginBottom: '2rem',
                            backgroundColor: message.type === 'success' ? '#f0fdf4' : '#fef2f2',
                            border: `1px solid ${message.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
                            color: message.type === 'success' ? '#166534' : '#991b1b',
                            fontWeight: 500, display: 'flex', alignItems: 'center', gap: '10px'
                        }}>
                             {message.type === 'success' ? <Shield size={18} /> : <AlertCircle size={18} />} {message.text}
                        </div>
                    )}

                    {activeTab === 'profile' && (
                        <div>
                            <div style={{ marginBottom: '2.5rem', display: 'flex', alignItems: 'center', gap: '2rem' }}>
                                <div style={{ position: 'relative' }}>
                                    <div style={{ 
                                        width: '120px', height: '120px', borderRadius: '50%', backgroundColor: '#eff6ff', 
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        color: '#2563eb', fontSize: '2.5rem', fontWeight: 700, border: '4px solid white', 
                                        boxShadow: '0 4px 15px rgba(0,0,0,0.1)', overflow: 'hidden'
                                    }}>
                                        {uploading ? (
                                            <Loader2 size={32} className="animate-spin text-blue-500" />
                                        ) : profileData.profilePic ? (
                                            <img src={profileData.profilePic} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : (
                                            profileData.name?.charAt(0) || 'U'
                                        )}
                                    </div>
                                    <button 
                                        onClick={() => fileInputRef.current.click()}
                                        disabled={uploading}
                                        style={{ 
                                            position: 'absolute', bottom: '5px', right: '5px',
                                            backgroundColor: '#0f172a', color: 'white',
                                            width: '36px', height: '36px', borderRadius: '50%',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            cursor: 'pointer', border: '3px solid #fff',
                                            boxShadow: '0 2px 5px rgba(0,0,0,0.2)', transition: 'transform 0.2s'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                                        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                    >
                                        <Camera size={18} />
                                    </button>
                                    <input 
                                        type="file" 
                                        ref={fileInputRef} 
                                        style={{ display: 'none' }} 
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                    />
                                </div>
                                <div>
                                    <h3 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a' }}>{user?.name}</h3>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                                        <span style={{ fontSize: '0.85rem', fontWeight: 700, padding: '3px 10px', borderRadius: '6px', backgroundColor: '#eff6ff', color: '#2563eb', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{user?.role}</span>
                                        <span style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 500 }}>{user?.email}</span>
                                    </div>
                                    <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '10px', fontStyle: 'italic' }}>PNG, JPG or JPEG. Max 5MB.</p>
                                </div>
                            </div>

                            <form onSubmit={handleProfileUpdate} style={{ display: 'grid', gap: '1.5rem' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>Full Name</label>
                                        <input 
                                            type="text" 
                                            value={profileData.name} 
                                            onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                                            style={{ padding: '0.85rem', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none', backgroundColor: '#f8fafc', color: '#0f172a', fontWeight: 500, fontSize: '0.95rem' }}
                                        />
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>Email Address</label>
                                        <input 
                                            disabled
                                            type="email" 
                                            value={profileData.email} 
                                            style={{ padding: '0.85rem', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none', backgroundColor: '#f1f5f9', color: '#64748b', fontWeight: 500, fontSize: '0.95rem', cursor: 'not-allowed' }}
                                        />
                                    </div>
                                </div>
                                {!isClient && (
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>Designation</label>
                                        <input 
                                            type="text" 
                                            value={profileData.designation} 
                                            onChange={(e) => setProfileData({...profileData, designation: e.target.value})}
                                            style={{ padding: '0.85rem', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none', backgroundColor: '#f8fafc', color: '#0f172a', fontWeight: 500, fontSize: '0.95rem' }}
                                        />
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>Department</label>
                                        <input 
                                            type="text" 
                                            value={profileData.department} 
                                            onChange={(e) => setProfileData({...profileData, department: e.target.value})}
                                            style={{ padding: '0.85rem', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none', backgroundColor: '#f8fafc', color: '#0f172a', fontWeight: 500, fontSize: '0.95rem' }}
                                        />
                                    </div>
                                </div>
                                )}

                                <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '2rem', marginTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
                                    <button type="submit" disabled={loading} style={{ 
                                        padding: '0.85rem 2rem', backgroundColor: '#0f172a', color: 'white', 
                                        border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', gap: '8px', opacity: loading ? 0.8 : 1, transition: 'background-color 0.2s'
                                    }}>
                                        <Save size={18} /> {loading ? 'Saving...' : 'Save Changes'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {activeTab === 'security' && (
                        <div>
                             <div style={{ marginBottom: '2.5rem' }}>
                                <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' }}>Security</h3>
                                <p style={{ color: '#64748b' }}>Manage your password and account security.</p>
                            </div>

                            <form onSubmit={handlePasswordUpdate} style={{ display: 'grid', gap: '1.5rem', maxWidth: '400px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>New Password</label>
                                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                                        <input 
                                            type={showNewPassword ? "text" : "password"} 
                                            value={passData.newPassword}
                                            onChange={(e) => setPassData({...passData, newPassword: e.target.value})}
                                            style={{ padding: '0.85rem', paddingRight: '2.75rem', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none', backgroundColor: '#f8fafc', color: '#0f172a', width: '100%' }}
                                        />
                                        <button 
                                            type="button"
                                            onClick={() => setShowNewPassword(!showNewPassword)}
                                            style={{ position: 'absolute', right: '12px', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center' }}
                                        >
                                            {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>Confirm Password</label>
                                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                                        <input 
                                            type={showConfirmPassword ? "text" : "password"} 
                                            value={passData.confirmPassword}
                                            onChange={(e) => setPassData({...passData, confirmPassword: e.target.value})}
                                            style={{ padding: '0.85rem', paddingRight: '2.75rem', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none', backgroundColor: '#f8fafc', color: '#0f172a', width: '100%' }}
                                        />
                                        <button 
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            style={{ position: 'absolute', right: '12px', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center' }}
                                        >
                                            {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>

                                <div style={{ marginTop: '1rem' }}>
                                    <button type="submit" disabled={loading} style={{ 
                                        padding: '0.85rem 2rem', backgroundColor: '#0f172a', color: 'white', 
                                        border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', gap: '8px', opacity: loading ? 0.8 : 1, width: '100%', justifyContent: 'center'
                                    }}>
                                        <Lock size={18} /> {loading ? 'Updating...' : 'Update Password'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Settings;
