import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { User, Lock, Save, LogOut, Shield, ChevronRight, Camera, AlertCircle, Loader2, Eye, EyeOff, CheckCircle2, Building2, Briefcase, Mail } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Settings = () => {
    const { user, logout, checkAuth, updateUserState } = useAuth();
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
            if (updateUserState) updateUserState(profileData);
            setMessage({ type: 'success', text: 'Profile updated successfully!' });
            toast.success('Profile updated successfully!');
            if (checkAuth) await checkAuth();
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.message || 'Update failed' });
            toast.error(err.response?.data?.message || 'Update failed');
        } finally {
            setLoading(false);
        }
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            toast.error("File size is too large! Max 5MB allowed.");
            return;
        }

        const formData = new FormData();
        formData.append('file', file);

        setUploading(true);
        try {
            const uploadRes = await axios.post('/api/documents/upload', formData);
            const imageUrl = uploadRes.data.data.url;

            await axios.put(`/api/auth/users/${user.id || user._id}`, { profilePic: imageUrl });
            
            setProfileData(prev => ({ ...prev, profilePic: imageUrl }));
            if (updateUserState) updateUserState({ profilePic: imageUrl });
            setMessage({ type: 'success', text: 'Profile picture updated!' });
            toast.success('Profile picture updated!');
            if (checkAuth) await checkAuth();
        } catch (err) {
            console.error("Upload failed", err);
            setMessage({ type: 'error', text: 'Failed to upload image' });
            toast.error('Failed to upload image');
        } finally {
            setUploading(false);
        }
    };

    const handlePasswordUpdate = async (e) => {
        e.preventDefault();
        if (passData.newPassword !== passData.confirmPassword) {
            setMessage({ type: 'error', text: 'Passwords do not match' });
            toast.error('Passwords do not match');
            return;
        }
        setLoading(true);
        setMessage({ type: '', text: '' });
        try {
            await axios.put(`/api/auth/users/${user.id || user._id}`, { password: passData.newPassword });
            setMessage({ type: 'success', text: 'Password updated successfully!' });
            toast.success('Password updated successfully!');
            setPassData({ newPassword: '', confirmPassword: '' });
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.message || 'Update failed' });
            toast.error(err.response?.data?.message || 'Update failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-slate-50 font-sans selection:bg-slate-200 selection:text-slate-900 antialiased"
             style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
            
            {/* Executive Header Bar */}
            <div className="bg-white border-b border-slate-200/80 px-6 sm:px-8 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
                <div>
                     <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Account Settings</h1>
                     <p className="text-slate-500 text-xs sm:text-sm font-medium mt-0.5">Manage your profile details, avatar, security preferences, and session controls.</p>
                </div>
                <div className="flex items-center gap-2 bg-slate-100/80 px-3.5 py-1.5 rounded-xl border border-slate-200/80">
                    <Shield size={16} className="text-slate-700" />
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">{user?.role} Portal</span>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="flex-1 p-6 sm:p-8 max-w-[1400px] w-full mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
                    
                    {/* Left Side Navigation Panel */}
                    <div className="lg:col-span-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs space-y-6">
                        
                        {/* Profile Brief Header */}
                        <div className="flex items-center gap-4 pb-6 border-b border-slate-100">
                            <div className="w-14 h-14 rounded-2xl bg-slate-900 text-white font-black text-xl flex items-center justify-center overflow-hidden shrink-0 shadow-2xs border border-slate-800">
                                {profileData.profilePic ? (
                                    <img src={profileData.profilePic} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    profileData.name?.charAt(0) || 'U'
                                )}
                            </div>
                            <div className="min-w-0">
                                <h3 className="font-extrabold text-slate-900 text-base truncate">{user?.name}</h3>
                                <p className="text-slate-400 text-xs font-medium truncate mt-0.5">{user?.email}</p>
                                <span className="inline-block mt-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
                                    {user?.role}
                                </span>
                            </div>
                        </div>

                        {/* Navigation Tabs */}
                        <div className="space-y-1.5">
                            <button
                                onClick={() => setActiveTab('profile')}
                                className={`w-full flex items-center justify-between p-3.5 rounded-xl text-xs sm:text-sm font-bold transition-all border cursor-pointer ${
                                    activeTab === 'profile'
                                        ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                                        : 'bg-slate-50/70 text-slate-600 border-slate-200/60 hover:bg-slate-100 hover:text-slate-900'
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <User size={18} />
                                    <span>My Profile Details</span>
                                </div>
                                <ChevronRight size={16} className={activeTab === 'profile' ? 'opacity-100' : 'opacity-40'} />
                            </button>

                            <button
                                onClick={() => setActiveTab('security')}
                                className={`w-full flex items-center justify-between p-3.5 rounded-xl text-xs sm:text-sm font-bold transition-all border cursor-pointer ${
                                    activeTab === 'security'
                                        ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                                        : 'bg-slate-50/70 text-slate-600 border-slate-200/60 hover:bg-slate-100 hover:text-slate-900'
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <Lock size={18} />
                                    <span>Password & Security</span>
                                </div>
                                <ChevronRight size={16} className={activeTab === 'security' ? 'opacity-100' : 'opacity-40'} />
                            </button>
                        </div>

                        {/* Sign Out Card */}
                        <div className="pt-4 border-t border-slate-100">
                            <button 
                                onClick={logout}
                                className="w-full bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/80 rounded-xl py-3 px-4 flex items-center justify-center gap-2 font-extrabold text-xs sm:text-sm transition-all cursor-pointer shadow-2xs"
                            >
                                <LogOut size={16} /> Sign Out Account
                            </button>
                        </div>
                    </div>

                    {/* Right Side Content Panel */}
                    <div className="lg:col-span-8 bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-2xs">
                        
                        {/* Alert Banner */}
                        {message.text && (
                            <div className={`p-4 rounded-xl mb-6 flex items-center gap-3 text-xs sm:text-sm font-bold border ${
                                message.type === 'success' 
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                                    : 'bg-rose-50 text-rose-800 border-rose-200'
                            }`}>
                                {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                                <span>{message.text}</span>
                            </div>
                        )}

                        {/* PROFILE TAB */}
                        {activeTab === 'profile' && (
                            <div className="space-y-8">
                                <div className="border-b border-slate-100 pb-6">
                                    <h2 className="text-xl font-extrabold text-slate-900">Personal Information</h2>
                                    <p className="text-xs sm:text-sm font-medium text-slate-500 mt-1">Update your display avatar, full name, and organizational details.</p>
                                </div>

                                {/* Avatar Upload Section */}
                                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 p-5 rounded-2xl bg-slate-50/70 border border-slate-200/80">
                                    <div className="relative shrink-0">
                                        <div className="w-20 h-20 rounded-2xl bg-slate-900 text-white font-black text-2xl flex items-center justify-center overflow-hidden border-2 border-white shadow-md">
                                            {uploading ? (
                                                <Loader2 size={24} className="animate-spin text-white" />
                                            ) : profileData.profilePic ? (
                                                <img src={profileData.profilePic} alt="Profile" className="w-full h-full object-cover" />
                                            ) : (
                                                profileData.name?.charAt(0) || 'U'
                                            )}
                                        </div>
                                        <button 
                                            onClick={() => fileInputRef.current?.click()}
                                            disabled={uploading}
                                            className="absolute -bottom-1 -right-1 bg-slate-900 text-white p-2 rounded-xl border-2 border-white shadow-xs hover:bg-slate-800 transition-all cursor-pointer"
                                            title="Upload Picture"
                                        >
                                            <Camera size={14} />
                                        </button>
                                        <input 
                                            type="file" 
                                            ref={fileInputRef} 
                                            className="hidden" 
                                            accept="image/*"
                                            onChange={handleImageUpload}
                                        />
                                    </div>
                                    <div>
                                        <h4 className="font-extrabold text-slate-900 text-sm">Profile Avatar</h4>
                                        <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">
                                            Upload a professional avatar picture. Allowed formats: PNG, JPG or WEBP (Max size 5MB).
                                        </p>
                                        <button 
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            disabled={uploading}
                                            className="mt-3 px-3.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl text-xs font-bold text-slate-800 transition-all cursor-pointer"
                                        >
                                            {uploading ? 'Uploading...' : 'Choose File'}
                                        </button>
                                    </div>
                                </div>

                                {/* Profile Form */}
                                <form onSubmit={handleProfileUpdate} className="space-y-6">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 mb-1.5">Full Name <span className="text-rose-500">*</span></label>
                                            <input 
                                                required
                                                type="text" 
                                                value={profileData.name} 
                                                onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 outline-none transition-all text-xs sm:text-sm font-medium text-slate-900 shadow-2xs"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 mb-1.5">Email Address</label>
                                            <input 
                                                disabled
                                                type="email" 
                                                value={profileData.email} 
                                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-100/70 text-slate-500 font-medium text-xs sm:text-sm cursor-not-allowed outline-none"
                                            />
                                        </div>
                                    </div>

                                    {!isClient && (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                            <div>
                                                <label className="block text-xs font-bold text-slate-700 mb-1.5">Designation</label>
                                                <input 
                                                    type="text" 
                                                    value={profileData.designation} 
                                                    onChange={(e) => setProfileData({...profileData, designation: e.target.value})}
                                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 outline-none transition-all text-xs sm:text-sm font-medium text-slate-900 shadow-2xs"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-700 mb-1.5">Department</label>
                                                <input 
                                                    type="text" 
                                                    value={profileData.department} 
                                                    onChange={(e) => setProfileData({...profileData, department: e.target.value})}
                                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 outline-none transition-all text-xs sm:text-sm font-medium text-slate-900 shadow-2xs"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    <div className="pt-6 border-t border-slate-100 flex justify-end">
                                        <button 
                                            type="submit" 
                                            disabled={loading} 
                                            className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-xs flex items-center gap-2 transition-all cursor-pointer border-none disabled:opacity-50"
                                        >
                                            <Save size={16} /> {loading ? 'Saving Changes...' : 'Save Profile Changes'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {/* SECURITY TAB */}
                        {activeTab === 'security' && (
                            <div className="space-y-8">
                                <div className="border-b border-slate-100 pb-6">
                                    <h2 className="text-xl font-extrabold text-slate-900">Password & Security</h2>
                                    <p className="text-xs sm:text-sm font-medium text-slate-500 mt-1">Ensure your account uses a strong password to safeguard system access.</p>
                                </div>

                                <form onSubmit={handlePasswordUpdate} className="space-y-6 max-w-lg">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1.5">New Password <span className="text-rose-500">*</span></label>
                                        <div className="relative">
                                            <input 
                                                required
                                                type={showNewPassword ? "text" : "password"} 
                                                value={passData.newPassword}
                                                onChange={(e) => setPassData({...passData, newPassword: e.target.value})}
                                                placeholder="Enter new strong password"
                                                className="w-full pl-4 pr-12 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 outline-none transition-all text-xs sm:text-sm font-medium text-slate-900 shadow-2xs"
                                            />
                                            <button 
                                                type="button"
                                                onClick={() => setShowNewPassword(!showNewPassword)}
                                                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 border-none bg-transparent cursor-pointer"
                                            >
                                                {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </button>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1.5">Confirm New Password <span className="text-rose-500">*</span></label>
                                        <div className="relative">
                                            <input 
                                                required
                                                type={showConfirmPassword ? "text" : "password"} 
                                                value={passData.confirmPassword}
                                                onChange={(e) => setPassData({...passData, confirmPassword: e.target.value})}
                                                placeholder="Confirm new password"
                                                className="w-full pl-4 pr-12 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 outline-none transition-all text-xs sm:text-sm font-medium text-slate-900 shadow-2xs"
                                            />
                                            <button 
                                                type="button"
                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 border-none bg-transparent cursor-pointer"
                                            >
                                                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-slate-600 text-xs font-medium space-y-1 leading-relaxed">
                                        <p className="font-extrabold text-slate-900 uppercase tracking-wider text-[10px]">Password Security Requirements:</p>
                                        <p>• At least 6 characters long</p>
                                        <p>• Mix of letters, numbers, and special symbols recommended</p>
                                    </div>

                                    <div className="pt-4 border-t border-slate-100 flex justify-end">
                                        <button 
                                            type="submit" 
                                            disabled={loading} 
                                            className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-xs flex items-center gap-2 transition-all cursor-pointer border-none disabled:opacity-50"
                                        >
                                            <Lock size={16} /> {loading ? 'Updating Password...' : 'Update Password'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
};

export default Settings;
