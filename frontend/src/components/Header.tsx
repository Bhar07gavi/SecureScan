// src/components/Header.tsx - ALWAYS VISIBLE, LOGIN/REGISTER BUTTONS

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Shield,
  GitBranch,
  Settings as SettingsIcon,
  Moon,
  Sun,
  Bell,
  Activity,
  Database,
  Cpu,
  Wifi,
  WifiOff,
  ChevronDown,
  X,
  ExternalLink,
  RefreshCw,
  User,
  LogOut,
  Clock,
  Home
} from 'lucide-react';
import { checkHealth } from '../services/api';
import { HealthStatus } from '../types';

interface HeaderProps {
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

const Header: React.FC<HeaderProps> = ({ darkMode, onToggleDarkMode }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuth();

  // State
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [showStatus, setShowStatus] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [notifications, setNotifications] = useState<Array<{
    id: string;
    type: 'success' | 'warning' | 'error' | 'info';
    message: string;
    time: Date;
    read: boolean;
  }>>([]);

  // Refs
  const statusRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  // Close all dropdowns
  const closeAllDropdowns = useCallback(() => {
    setShowStatus(false);
    setShowNotifications(false);
    setShowUserMenu(false);
  }, []);

  // Toggle dropdown
  const toggleDropdown = useCallback((setter: React.Dispatch<React.SetStateAction<boolean>>) => {
    closeAllDropdowns();
    setter(prev => !prev);
  }, [closeAllDropdowns]);

  // Check backend health
  useEffect(() => {
    const checkBackendHealth = async () => {
      try {
        const data = await checkHealth();
        setHealth(data);
        setIsConnected(true);
        setLastChecked(new Date());
      } catch {
        setIsConnected(false);
        setHealth(null);
      }
    };

    checkBackendHealth();
    const interval = setInterval(checkBackendHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        statusRef.current && !statusRef.current.contains(target) &&
        notifRef.current && !notifRef.current.contains(target) &&
        userRef.current && !userRef.current.contains(target)
      ) {
        closeAllDropdowns();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeAllDropdowns();
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [closeAllDropdowns]);

  // Notification helpers
  const markAllRead = () => setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  const clearNotifications = () => setNotifications([]);
  const unreadCount = notifications.filter(n => !n.read).length;

  const getNotificationIcon = (type: string) => {
    const icons = { success: '✅', warning: '⚠️', error: '❌', info: 'ℹ️' };
    return icons[type as keyof typeof icons] || 'ℹ️';
  };

  const formatTime = (date: Date) => {
    const diff = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return date.toLocaleDateString();
  };

  const refreshHealth = async () => {
    try {
      const data = await checkHealth();
      setHealth(data);
      setIsConnected(true);
      setLastChecked(new Date());
    } catch {
      setIsConnected(false);
    }
  };

  // Handle logout
  const handleLogout = () => {
    logout();
    closeAllDropdowns();
    navigate('/');
  };

  // Get user initials
  const getUserInitials = () => {
    if (!user?.username) return 'U';
    return user.username.substring(0, 2).toUpperCase();
  };

  // Check if route is active
  const isActive = (path: string) => location.pathname === path;

  // Don't show on login/register pages
  if (location.pathname === '/login' || location.pathname === '/register') {
    return null;
  }

  return (
    <>
      <header className="bg-gray-900 border-b border-gray-700 px-3 sm:px-6 py-3 relative z-50">
        <div className="flex items-center justify-between max-w-full">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 sm:gap-3 flex-shrink-0 group">
            <div className="relative">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
                <Shield className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className={`absolute -top-1 -right-1 w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full border-2 border-gray-900 ${
                isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'
              }`} />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-base sm:text-xl font-bold text-white tracking-tight">
                SecureScan<span className="text-cyan-400">AI</span>
              </h1>
              <p className="text-[10px] sm:text-xs text-gray-500 hidden sm:block">AI-Powered Code Security</p>
            </div>
          </Link>

          {/* Center - Navigation (Desktop) - Only for authenticated users */}
          {isAuthenticated && (
            <nav className="hidden md:flex items-center gap-1 flex-shrink-0">
              <Link
                to="/"
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  isActive('/') ? 'bg-cyan-500/20 text-cyan-400' : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                <Home size={14} />
                <span className="hidden lg:inline">Scanner</span>
              </Link>
              <Link
                to="/history"
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  isActive('/history') ? 'bg-cyan-500/20 text-cyan-400' : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                <Clock size={14} />
                <span className="hidden lg:inline">History</span>
              </Link>
              <Link
                to="/settings"
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  isActive('/settings') ? 'bg-cyan-500/20 text-cyan-400' : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                <SettingsIcon size={14} />
                <span className="hidden lg:inline">Settings</span>
              </Link>
            </nav>
          )}

          {/* Center - Backend Status */}
          <div className="hidden lg:flex items-center gap-4 flex-shrink-0">
            <div ref={statusRef} className="relative">
              <button
                onClick={() => toggleDropdown(setShowStatus)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-colors ${
                  isConnected
                    ? 'bg-green-500/10 text-green-400 hover:bg-green-500/20'
                    : 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
                }`}
              >
                {isConnected ? <Wifi size={14} /> : <WifiOff size={14} />}
                <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
                <ChevronDown size={12} className={`transition-transform ${showStatus ? 'rotate-180' : ''}`} />
              </button>

              {/* Status Dropdown */}
              {showStatus && (
                <div className="absolute top-full mt-2 right-0 w-72 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl p-4 space-y-3 z-[100]">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-white">System Status</h3>
                    <button onClick={() => setShowStatus(false)} className="text-gray-500 hover:text-white">
                      <X size={16} />
                    </button>
                  </div>

                  {[
                    { icon: Activity, label: 'API Server', status: isConnected, text: isConnected ? 'Online' : 'Offline' },
                    { icon: Cpu, label: 'AI Model', status: health?.model_loaded, text: health?.model_loaded ? 'Loaded' : 'Not Loaded' },
                    { icon: Database, label: 'MongoDB', status: health?.database === 'connected', text: health?.database === 'connected' ? 'Connected' : 'Disconnected' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-2 bg-gray-900 rounded-lg">
                      <div className="flex items-center gap-2">
                        <item.icon size={14} className="text-gray-400" />
                        <span className="text-sm text-gray-300">{item.label}</span>
                      </div>
                      <span className={`text-xs font-medium ${item.status ? 'text-green-400' : 'text-red-400'}`}>
                        ● {item.text}
                      </span>
                    </div>
                  ))}

                  {health?.model_accuracy && (
                    <div className="flex items-center justify-between p-2 bg-gray-900 rounded-lg">
                      <span className="text-sm text-gray-300">Accuracy</span>
                      <span className="text-xs font-bold text-cyan-400">{(health.model_accuracy * 100).toFixed(2)}%</span>
                    </div>
                  )}

                  <button onClick={refreshHealth} className="w-full py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors flex items-center justify-center gap-2 text-xs">
                    <RefreshCw size={12} /> Refresh
                  </button>
                </div>
              )}
            </div>

            {health?.model_loaded && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 rounded-lg">
                <Cpu size={14} className="text-cyan-400" />
                <span className="text-xs text-gray-400">
                  AI: <span className="text-cyan-400 font-bold">{(health.model_accuracy * 100).toFixed(1)}%</span>
                </span>
              </div>
            )}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Dark Mode */}
            <button
              onClick={onToggleDarkMode}
              className="p-1.5 sm:p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
              title={darkMode ? 'Light Mode' : 'Dark Mode'}
            >
              {darkMode ? <Sun className="w-4 h-4 sm:w-5 sm:h-5" /> : <Moon className="w-4 h-4 sm:w-5 sm:h-5" />}
            </button>

            {isAuthenticated ? (
              <>
                {/* Notifications */}
                <div ref={notifRef} className="relative">
                  <button
                    onClick={() => toggleDropdown(setShowNotifications)}
                    className="p-1.5 sm:p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors relative"
                    title="Notifications"
                  >
                    <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center font-bold">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Notifications Dropdown */}
                  {showNotifications && (
                    <div className="absolute top-full mt-2 right-0 w-80 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl overflow-hidden z-[100]">
                      <div className="flex items-center justify-between p-3 border-b border-gray-700">
                        <h3 className="text-sm font-semibold text-white">Notifications</h3>
                        <div className="flex items-center gap-2">
                          {unreadCount > 0 && (
                            <button onClick={markAllRead} className="text-xs text-cyan-400 hover:text-cyan-300">
                              Read all
                            </button>
                          )}
                          {notifications.length > 0 && (
                            <button onClick={clearNotifications} className="text-xs text-gray-500 hover:text-gray-300">
                              Clear
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="max-h-80 overflow-auto">
                        {notifications.length === 0 ? (
                          <div className="p-6 text-center">
                            <Bell className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                            <p className="text-sm text-gray-500">No notifications</p>
                          </div>
                        ) : (
                          notifications.map(notification => (
                            <div
                              key={notification.id}
                              className={`p-3 border-b border-gray-700/50 hover:bg-gray-700/30 ${
                                !notification.read ? 'bg-gray-700/20' : ''
                              }`}
                            >
                              <div className="flex items-start gap-2">
                                <span className="text-sm flex-shrink-0">{getNotificationIcon(notification.type)}</span>
                                <div className="flex-1 min-w-0">
                                  <p className={`text-sm break-words ${!notification.read ? 'text-white' : 'text-gray-400'}`}>
                                    {notification.message}
                                  </p>
                                  <p className="text-xs text-gray-500 mt-1">{formatTime(notification.time)}</p>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* GitHub */}
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hidden sm:block p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                  title="GitHub"
                >
                  <GitBranch className="w-5 h-5" />
                </a>

                {/* Separator */}
                <div className="hidden sm:block h-6 w-px bg-gray-700 mx-1" />

                {/* User Menu */}
                <div ref={userRef} className="relative">
                  <button
                    onClick={() => toggleDropdown(setShowUserMenu)}
                    className="flex items-center gap-2 p-1 hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-xs sm:text-sm font-medium shadow-lg shadow-purple-500/20">
                      {getUserInitials()}
                    </div>
                    <ChevronDown
                      size={12}
                      className={`text-gray-400 transition-transform hidden sm:block ${showUserMenu ? 'rotate-180' : ''}`}
                    />
                  </button>

                  {/* User Dropdown */}
                  {showUserMenu && (
                    <div className="absolute top-full mt-2 right-0 w-56 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl overflow-hidden z-[100]">
                      {/* User Info */}
                      <div className="p-3 border-b border-gray-700">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-medium">
                            {getUserInitials()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-white truncate">{user?.username || 'User'}</p>
                            <p className="text-xs text-gray-500 truncate">{user?.email || 'user@example.com'}</p>
                          </div>
                        </div>
                      </div>

                      {/* Menu Items */}
                      <div className="py-1">
                        <div className="md:hidden">
                          <Link
                            to="/"
                            onClick={() => setShowUserMenu(false)}
                            className={`flex items-center gap-3 px-3 py-2.5 text-sm transition-colors ${
                              isActive('/') ? 'bg-cyan-500/20 text-cyan-400' : 'text-gray-300 hover:bg-gray-700'
                            }`}
                          >
                            <Home size={14} />
                            <span>Scanner</span>
                          </Link>
                          <Link
                            to="/history"
                            onClick={() => setShowUserMenu(false)}
                            className={`flex items-center gap-3 px-3 py-2.5 text-sm transition-colors ${
                              isActive('/history') ? 'bg-cyan-500/20 text-cyan-400' : 'text-gray-300 hover:bg-gray-700'
                            }`}
                          >
                            <Clock size={14} />
                            <span>History</span>
                          </Link>
                          <div className="border-t border-gray-700 my-1" />
                        </div>

                        <Link
                          to="/settings"
                          onClick={() => setShowUserMenu(false)}
                          className={`flex items-center gap-3 px-3 py-2.5 text-sm transition-colors ${
                            isActive('/settings') ? 'bg-cyan-500/20 text-cyan-400' : 'text-gray-300 hover:bg-gray-700'
                          }`}
                        >
                          <SettingsIcon size={14} />
                          <span>Settings</span>
                        </Link>
                        <a
                          href="http://127.0.0.1:8000/docs"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-300 hover:bg-gray-700 transition-colors"
                        >
                          <ExternalLink size={14} />
                          <span>API Docs</span>
                        </a>
                      </div>

                      {/* Sign Out */}
                      <div className="border-t border-gray-700 py-1">
                        <button
                          onClick={handleLogout}
                          className="flex items-center gap-3 px-3 py-2.5 text-sm text-red-400 hover:bg-gray-700 w-full transition-colors"
                        >
                          <LogOut size={14} />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                {/* Not logged in - Show Login/Register buttons */}
                <Link
                  to="/login"
                  className="px-3 py-1.5 text-gray-300 hover:text-white transition-colors text-sm font-medium"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-1.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg font-medium hover:opacity-90 transition-opacity text-sm"
                >
                  Sign Up Free
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Status Panel */}
      {showStatus && (
        <div className="lg:hidden fixed inset-0 top-[52px] z-40" onClick={() => setShowStatus(false)}>
          <div className="absolute inset-0 bg-black/50" />
          <div
            className="relative mx-3 mt-2 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl p-4 space-y-3 max-w-md"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">System Status</h3>
              <button onClick={() => setShowStatus(false)} className="text-gray-500 hover:text-white">
                <X size={16} />
              </button>
            </div>

            {[
              { icon: Activity, label: 'API Server', status: isConnected, text: isConnected ? 'Online' : 'Offline' },
              { icon: Cpu, label: 'AI Model', status: health?.model_loaded, text: health?.model_loaded ? 'Loaded' : 'Not Loaded' },
              { icon: Database, label: 'MongoDB', status: health?.database === 'connected', text: health?.database === 'connected' ? 'Connected' : 'Disconnected' },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between p-2.5 bg-gray-900 rounded-lg">
                <div className="flex items-center gap-2">
                  <item.icon size={14} className="text-gray-400" />
                  <span className="text-sm text-gray-300">{item.label}</span>
                </div>
                <span className={`text-xs font-medium ${item.status ? 'text-green-400' : 'text-red-400'}`}>
                  ● {item.text}
                </span>
              </div>
            ))}

            <button onClick={refreshHealth} className="w-full py-2.5 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 flex items-center justify-center gap-2 text-sm">
              <RefreshCw size={14} /> Refresh Status
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;