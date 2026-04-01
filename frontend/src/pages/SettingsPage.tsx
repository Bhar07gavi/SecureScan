// src/pages/SettingsPage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { authApi } from '../services/api';
import Header from '../components/Header';
import {
  User,
  Mail,
  Lock,
  Moon,
  Sun,
  Bell,
  Shield,
  Trash2,
  Save,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  Loader2,
  ArrowLeft,
  Camera,
  LogOut,
  Monitor,
} from 'lucide-react';

// ============================================================================
// SETTINGS PAGE
// ============================================================================

const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout, refreshUser } = useAuth();
  const { theme, isDark, toggleTheme, setTheme } = useTheme();

  // Tab state
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'appearance' | 'notifications' | 'danger'>('profile');

  // Profile state
  const [username, setUsername] = useState(user?.username || '');
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Notification settings
  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    scanComplete: true,
    weeklyReport: false,
    securityUpdates: true,
  });

  // Delete account state
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Update local state when user changes
  useEffect(() => {
    if (user) {
      setUsername(user.username || '');
      setFullName(user.full_name || '');
    }
  }, [user]);

  // Handle profile update
  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileError('');
    setProfileSuccess('');

    try {
      await authApi.updateProfile({ username, full_name: fullName });
      setProfileSuccess('Profile updated successfully!');
      // Optionally refresh user data
      if (refreshUser) await refreshUser();
    } catch (error: any) {
      setProfileError(error.response?.data?.detail || 'Failed to update profile');
    } finally {
      setProfileLoading(false);
    }
  };

  // Handle password change
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordLoading(true);
    setPasswordError('');
    setPasswordSuccess('');

    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      setPasswordLoading(false);
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters');
      setPasswordLoading(false);
      return;
    }

    try {
      await authApi.changePassword(currentPassword, newPassword);
      setPasswordSuccess('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      setPasswordError(error.response?.data?.detail || 'Failed to change password');
    } finally {
      setPasswordLoading(false);
    }
  };

  // Handle account deletion
  const handleDeleteAccount = async () => {
    if (deleteConfirm !== 'DELETE') return;

    setDeleteLoading(true);
    try {
      await authApi.deleteAccount();
      await logout();
      navigate('/login');
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Failed to delete account');
    } finally {
      setDeleteLoading(false);
    }
  };

  // Handle logout
  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Theme classes
  const themeClasses = {
    bg: isDark ? 'bg-gray-900' : 'bg-gray-50',
    card: isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200',
    text: isDark ? 'text-white' : 'text-gray-900',
    textMuted: isDark ? 'text-gray-400' : 'text-gray-600',
    input: isDark 
      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500',
    tabActive: isDark 
      ? 'bg-gray-700 text-white' 
      : 'bg-cyan-50 text-cyan-700 border-cyan-200',
    tabInactive: isDark 
      ? 'text-gray-400 hover:text-white hover:bg-gray-700/50' 
      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100',
  };

  // Sidebar tabs
  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'appearance', label: 'Appearance', icon: isDark ? Moon : Sun },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'danger', label: 'Danger Zone', icon: Trash2 },
  ] as const;

  return (
    <div className={`min-h-screen ${themeClasses.bg} transition-colors duration-300`}>
      <Header darkMode={isDark} onToggleDarkMode={toggleTheme} />

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Back Button & Title */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate('/')}
            className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-200'} transition-colors`}
          >
            <ArrowLeft className={`w-5 h-5 ${themeClasses.text}`} />
          </button>
          <div>
            <h1 className={`text-2xl font-bold ${themeClasses.text}`}>Settings</h1>
            <p className={themeClasses.textMuted}>Manage your account and preferences</p>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <div className="lg:w-64 flex-shrink-0">
            <nav className={`${themeClasses.card} border rounded-xl p-2 space-y-1`}>
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                    activeTab === tab.id ? themeClasses.tabActive : themeClasses.tabInactive
                  } ${tab.id === 'danger' ? 'text-red-400 hover:text-red-300' : ''}`}
                >
                  <tab.icon className={`w-5 h-5 ${tab.id === 'danger' && activeTab !== tab.id ? 'text-red-400' : ''}`} />
                  <span className="font-medium">{tab.label}</span>
                </button>
              ))}

              {/* Logout Button */}
              <hr className={`my-2 ${isDark ? 'border-gray-700' : 'border-gray-200'}`} />
              <button
                onClick={handleLogout}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors text-red-400 hover:bg-red-500/10`}
              >
                <LogOut className="w-5 h-5" />
                <span className="font-medium">Logout</span>
              </button>
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <div className={`${themeClasses.card} border rounded-xl p-6`}>
              
              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <div>
                  <h2 className={`text-xl font-semibold ${themeClasses.text} mb-6`}>Profile Information</h2>

                  {/* Avatar Section */}
                  <div className="flex items-center gap-6 mb-8">
                    <div className="relative">
                      <div className="w-24 h-24 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center text-white text-3xl font-bold">
                        {user?.username?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <button className="absolute bottom-0 right-0 p-2 bg-cyan-500 rounded-full text-white hover:bg-cyan-600 transition-colors">
                        <Camera className="w-4 h-4" />
                      </button>
                    </div>
                    <div>
                      <h3 className={`font-semibold ${themeClasses.text}`}>{user?.username}</h3>
                      <p className={themeClasses.textMuted}>{user?.email}</p>
                    </div>
                  </div>

                  {/* Profile Form */}
                  <form onSubmit={handleProfileUpdate} className="space-y-6">
                    {profileSuccess && (
                      <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400">
                        <CheckCircle className="w-5 h-5" />
                        <span>{profileSuccess}</span>
                      </div>
                    )}
                    {profileError && (
                      <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400">
                        <AlertCircle className="w-5 h-5" />
                        <span>{profileError}</span>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className={`block text-sm font-medium ${themeClasses.textMuted} mb-2`}>
                          Username
                        </label>
                        <div className="relative">
                          <User className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${themeClasses.textMuted}`} />
                          <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className={`w-full pl-10 pr-4 py-3 ${themeClasses.input} border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500`}
                          />
                        </div>
                      </div>

                      <div>
                        <label className={`block text-sm font-medium ${themeClasses.textMuted} mb-2`}>
                          Full Name
                        </label>
                        <div className="relative">
                          <User className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${themeClasses.textMuted}`} />
                          <input
                            type="text"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            className={`w-full pl-10 pr-4 py-3 ${themeClasses.input} border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500`}
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className={`block text-sm font-medium ${themeClasses.textMuted} mb-2`}>
                        Email Address
                      </label>
                      <div className="relative">
                        <Mail className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${themeClasses.textMuted}`} />
                        <input
                          type="email"
                          value={user?.email || ''}
                          disabled
                          className={`w-full pl-10 pr-4 py-3 ${themeClasses.input} border rounded-lg opacity-60 cursor-not-allowed`}
                        />
                      </div>
                      <p className={`text-sm ${themeClasses.textMuted} mt-1`}>Email cannot be changed</p>
                    </div>

                    <button
                      type="submit"
                      disabled={profileLoading}
                      className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                      {profileLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Save className="w-5 h-5" />
                      )}
                      Save Changes
                    </button>
                  </form>
                </div>
              )}

              {/* Security Tab */}
              {activeTab === 'security' && (
                <div>
                  <h2 className={`text-xl font-semibold ${themeClasses.text} mb-6`}>Security Settings</h2>

                  <form onSubmit={handlePasswordChange} className="space-y-6 max-w-md">
                    {passwordSuccess && (
                      <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400">
                        <CheckCircle className="w-5 h-5" />
                        <span>{passwordSuccess}</span>
                      </div>
                    )}
                    {passwordError && (
                      <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400">
                        <AlertCircle className="w-5 h-5" />
                        <span>{passwordError}</span>
                      </div>
                    )}

                    <div>
                      <label className={`block text-sm font-medium ${themeClasses.textMuted} mb-2`}>
                        Current Password
                      </label>
                      <div className="relative">
                        <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${themeClasses.textMuted}`} />
                        <input
                          type={showCurrentPassword ? 'text' : 'password'}
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          className={`w-full pl-10 pr-12 py-3 ${themeClasses.input} border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          className={`absolute right-3 top-1/2 -translate-y-1/2 ${themeClasses.textMuted} hover:text-white`}
                        >
                          {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className={`block text-sm font-medium ${themeClasses.textMuted} mb-2`}>
                        New Password
                      </label>
                      <div className="relative">
                        <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${themeClasses.textMuted}`} />
                        <input
                          type={showNewPassword ? 'text' : 'password'}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className={`w-full pl-10 pr-12 py-3 ${themeClasses.input} border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className={`absolute right-3 top-1/2 -translate-y-1/2 ${themeClasses.textMuted} hover:text-white`}
                        >
                          {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className={`block text-sm font-medium ${themeClasses.textMuted} mb-2`}>
                        Confirm New Password
                      </label>
                      <div className="relative">
                        <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${themeClasses.textMuted}`} />
                        <input
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className={`w-full pl-10 pr-4 py-3 ${themeClasses.input} border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500`}
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={passwordLoading || !currentPassword || !newPassword || !confirmPassword}
                      className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                      {passwordLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Shield className="w-5 h-5" />
                      )}
                      Change Password
                    </button>
                  </form>
                </div>
              )}

              {/* Appearance Tab */}
              {activeTab === 'appearance' && (
                <div>
                  <h2 className={`text-xl font-semibold ${themeClasses.text} mb-6`}>Appearance</h2>

                  <div className="space-y-6">
                    <div>
                      <h3 className={`font-medium ${themeClasses.text} mb-4`}>Theme</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {/* Light Theme */}
                        <button
                          onClick={() => setTheme('light')}
                          className={`p-4 rounded-xl border-2 transition-all ${
                            theme === 'light'
                              ? 'border-cyan-500 bg-cyan-500/10'
                              : isDark ? 'border-gray-700 hover:border-gray-600' : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="w-full h-20 bg-gray-100 rounded-lg mb-3 flex items-center justify-center">
                            <Sun className="w-8 h-8 text-yellow-500" />
                          </div>
                          <span className={`font-medium ${themeClasses.text}`}>Light</span>
                        </button>

                        {/* Dark Theme */}
                        <button
                          onClick={() => setTheme('dark')}
                          className={`p-4 rounded-xl border-2 transition-all ${
                            theme === 'dark'
                              ? 'border-cyan-500 bg-cyan-500/10'
                              : isDark ? 'border-gray-700 hover:border-gray-600' : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="w-full h-20 bg-gray-800 rounded-lg mb-3 flex items-center justify-center">
                            <Moon className="w-8 h-8 text-blue-400" />
                          </div>
                          <span className={`font-medium ${themeClasses.text}`}>Dark</span>
                        </button>

                        {/* System Theme */}
                        <button
                          onClick={() => {
                            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                            setTheme(prefersDark ? 'dark' : 'light');
                          }}
                          className={`p-4 rounded-xl border-2 transition-all ${
                            isDark ? 'border-gray-700 hover:border-gray-600' : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="w-full h-20 bg-gradient-to-r from-gray-100 to-gray-800 rounded-lg mb-3 flex items-center justify-center">
                            <Monitor className="w-8 h-8 text-gray-500" />
                          </div>
                          <span className={`font-medium ${themeClasses.text}`}>System</span>
                        </button>
                      </div>
                    </div>

                    {/* Quick Toggle */}
                    <div className={`p-4 ${isDark ? 'bg-gray-700/50' : 'bg-gray-100'} rounded-xl`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className={`font-medium ${themeClasses.text}`}>Quick Toggle</h4>
                          <p className={`text-sm ${themeClasses.textMuted}`}>
                            Currently using {theme} mode
                          </p>
                        </div>
                        <button
                          onClick={toggleTheme}
                          className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                            isDark ? 'bg-cyan-500' : 'bg-gray-300'
                          }`}
                        >
                          <span
                            className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                              isDark ? 'translate-x-7' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Notifications Tab */}
              {activeTab === 'notifications' && (
                <div>
                  <h2 className={`text-xl font-semibold ${themeClasses.text} mb-6`}>Notification Preferences</h2>

                  <div className="space-y-4">
                    {[
                      { key: 'emailAlerts', label: 'Email Alerts', desc: 'Receive alerts via email' },
                      { key: 'scanComplete', label: 'Scan Complete', desc: 'Get notified when scans finish' },
                      { key: 'weeklyReport', label: 'Weekly Report', desc: 'Receive weekly security summary' },
                      { key: 'securityUpdates', label: 'Security Updates', desc: 'Important security announcements' },
                    ].map((item) => (
                      <div
                        key={item.key}
                        className={`flex items-center justify-between p-4 ${isDark ? 'bg-gray-700/50' : 'bg-gray-100'} rounded-xl`}
                      >
                        <div>
                          <h4 className={`font-medium ${themeClasses.text}`}>{item.label}</h4>
                          <p className={`text-sm ${themeClasses.textMuted}`}>{item.desc}</p>
                        </div>
                        <button
                          onClick={() =>
                            setNotifications((prev) => ({
                              ...prev,
                              [item.key]: !prev[item.key as keyof typeof notifications],
                            }))
                          }
                          className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                            notifications[item.key as keyof typeof notifications]
                              ? 'bg-cyan-500'
                              : isDark ? 'bg-gray-600' : 'bg-gray-300'
                          }`}
                        >
                          <span
                            className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                              notifications[item.key as keyof typeof notifications]
                                ? 'translate-x-7'
                                : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Danger Zone Tab */}
              {activeTab === 'danger' && (
                <div>
                  <h2 className="text-xl font-semibold text-red-400 mb-6">Danger Zone</h2>

                  <div className="p-6 border-2 border-red-500/30 rounded-xl bg-red-500/5">
                    <h3 className={`font-semibold ${themeClasses.text} mb-2`}>Delete Account</h3>
                    <p className={`${themeClasses.textMuted} mb-4`}>
                      Once you delete your account, there is no going back. All your data including scan history will be permanently deleted.
                    </p>

                    <div className="mb-4">
                      <label className={`block text-sm font-medium ${themeClasses.textMuted} mb-2`}>
                        Type <span className="text-red-400 font-mono">DELETE</span> to confirm
                      </label>
                      <input
                        type="text"
                        value={deleteConfirm}
                        onChange={(e) => setDeleteConfirm(e.target.value)}
                        placeholder="DELETE"
                        className={`w-full max-w-xs px-4 py-3 ${themeClasses.input} border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500`}
                      />
                    </div>

                    <button
                      onClick={handleDeleteAccount}
                      disabled={deleteConfirm !== 'DELETE' || deleteLoading}
                      className="flex items-center gap-2 px-6 py-3 bg-red-500 text-white font-medium rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {deleteLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Trash2 className="w-5 h-5" />
                      )}
                      Delete My Account
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;