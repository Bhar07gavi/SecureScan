// src/App.tsx

import React, { useState, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';  // ✅ ADD useAuth import
import { ThemeProvider, useTheme } from './contexts/ThemeContext'; // ✅ ADD useTheme import

// Components
import Header from './components/Header';
import CodeEditor from './components/CodeEditor';
import VulnerabilityList from './components/VulnerabilityList';
import VulnerabilityDetail from './components/VulnerabilityDetail';
import Dashboard from './components/Dashboard';

// Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ScanHistoryPage from './pages/ScanHistoryPage';
import SettingsPage from './pages/SettingsPage';

// Types & Services
import { InputMode, Vulnerability, ScanResult, ProjectScanResult, AnalysisStatus } from './types';
import { apiService } from './services/api';
import { sampleJavaScript } from './data/sampleCode';

// Icons
import {
  Play,
  RefreshCw,
  Download,
  CheckCircle,
  XCircle,
  BarChart2,
  List,
  LogIn
} from 'lucide-react';

// ============================================================================
// LOADING
// ============================================================================

const LoadingSpinner: React.FC = () => (
  <div className="min-h-screen bg-gray-900 flex items-center justify-center">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
  </div>
);

// ============================================================================
// PROTECTED ROUTE
// ============================================================================

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <LoadingSpinner />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

// ============================================================================
// PUBLIC ONLY ROUTE
// ============================================================================

const PublicOnlyRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <LoadingSpinner />;
  if (isAuthenticated) return <Navigate to="/" replace />;
  return <>{children}</>;
};

// ============================================================================
// LOGIN PROMPT MODAL
// ============================================================================

const LoginPromptModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
}> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-gray-800 border border-gray-700 rounded-2xl p-8 max-w-md w-full shadow-2xl">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white">
          <XCircle size={24} />
        </button>

        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <LogIn className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Login Required</h2>
          <p className="text-gray-400 mb-6">
            Please login or create an account to run security analysis.
          </p>

          <div className="text-left bg-gray-900/50 rounded-xl p-4 mb-6 space-y-2">
            {['AI-powered vulnerability detection', 'Save and track scan history', 'Export detailed reports', '98.57% accuracy rate'].map((text, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-gray-300">
                <CheckCircle size={16} className="text-green-400 flex-shrink-0" />
                <span>{text}</span>
              </div>
            ))}
          </div>

          <div className="space-y-3">
            <a href="/login" className="block w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold rounded-xl hover:opacity-90 transition-opacity text-center">
              Login
            </a>
            <a href="/register" className="block w-full py-3 bg-gray-700 text-white font-semibold rounded-xl hover:bg-gray-600 transition-colors text-center">
              Create Free Account
            </a>
          </div>
          <p className="text-xs text-gray-500 mt-4">Free account • No credit card required</p>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// SCANNER PAGE (Uses ThemeContext)
// ============================================================================

const ScannerPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const { isDark, toggleTheme } = useTheme(); // ✅ USE THEME CONTEXT
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  // Scanner state
  const [code, setCode] = useState(sampleJavaScript);
  const [inputMode, setInputMode] = useState<InputMode>('editor');
  const [analysisStatus, setAnalysisStatus] = useState<AnalysisStatus>('idle');
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [projectScanResult, setProjectScanResult] = useState<ProjectScanResult | null>(null);
  const [selectedVulnerability, setSelectedVulnerability] = useState<Vulnerability | null>(null);
  const [highlightedLines, setHighlightedLines] = useState<number[]>([]);
  const [activeView, setActiveView] = useState<'analysis' | 'dashboard'>('analysis');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  // Handle file upload
  const handleFileUpload = useCallback(async (files: FileList) => {
    const fileList = Array.from(files);
    setUploadedFiles(fileList);
    if (inputMode === 'file') {
      const file = fileList[0];
      if (file) {
        const content = await file.text();
        setCode(content);
        setScanResult(null);
        setProjectScanResult(null);
      }
    }
  }, [inputMode]);

  // Run analysis - CHECK AUTH
  const runAnalysis = async () => {
    if (!isAuthenticated) {
      setShowLoginPrompt(true);
      return;
    }

    setAnalysisStatus('scanning');
    setSelectedVulnerability(null);
    setHighlightedLines([]);

    try {
      if (inputMode === 'project' && uploadedFiles.length > 0) {
        setAnalysisStatus('analyzing');
        const fileContents: { name: string; content: string }[] = [];
        for (const file of uploadedFiles) {
          try {
            const content = await file.text();
            fileContents.push({ name: file.name, content });
          } catch (e) { console.warn(`Could not read: ${file.name}`); }
        }
        setAnalysisStatus('explaining');
        const result = await apiService.scanProject(fileContents);
        setProjectScanResult(result);
        setScanResult(null);
      } else {
        setAnalysisStatus('analyzing');
        const result = await apiService.scanCode(code, 'code.js');
        setAnalysisStatus('explaining');
        setScanResult(result);
        setProjectScanResult(null);
      }
      setAnalysisStatus('complete');
    } catch (error) {
      console.error('Analysis failed:', error);
      setAnalysisStatus('error');
    }
  };

  // Handle vulnerability selection
  const handleVulnerabilitySelect = (vulnerability: Vulnerability) => {
    setSelectedVulnerability(vulnerability);
    setHighlightedLines([vulnerability.line]);
  };

  // Get current vulnerabilities
  const currentVulnerabilities = scanResult?.vulnerabilities ||
    projectScanResult?.fileResults.flatMap(r => r.vulnerabilities) || [];

  // Export report
  const exportReport = () => {
    if (!isAuthenticated) { setShowLoginPrompt(true); return; }
    const report = {
      timestamp: new Date().toISOString(),
      scanResult: scanResult || projectScanResult,
      vulnerabilities: currentVulnerabilities,
    };
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `securescan-report-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ✅ DYNAMIC THEME CLASSES (using isDark from ThemeContext)
  const theme = {
    bg: isDark ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900',
    toolbar: isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200 shadow-sm',
    toggleBg: isDark ? 'bg-gray-700' : 'bg-gray-200',
    toggleActive: isDark ? 'bg-gray-600 text-white' : 'bg-white text-gray-900 shadow-sm',
    toggleInactive: isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-700',
    btnSecondary: isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
    border: isDark ? 'border-gray-700' : 'border-gray-200',
  };

  return (
    <div className={`min-h-screen ${theme.bg} transition-colors duration-300`}>
      <Header darkMode={isDark} onToggleDarkMode={toggleTheme} />
      <LoginPromptModal isOpen={showLoginPrompt} onClose={() => setShowLoginPrompt(false)} />

      {/* Toolbar */}
      <div className={`${theme.toolbar} border-b px-4 py-2 transition-colors duration-300`}>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={runAnalysis}
              disabled={analysisStatus === 'scanning' || analysisStatus === 'analyzing' || (!code && uploadedFiles.length === 0)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg font-medium hover:from-cyan-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {analysisStatus === 'scanning' || analysisStatus === 'analyzing' || analysisStatus === 'explaining' ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  {analysisStatus === 'scanning' ? 'Scanning...' : analysisStatus === 'analyzing' ? 'Analyzing...' : 'Explaining...'}
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Run Security Scan
                  {!isAuthenticated && <LogIn className="w-4 h-4 ml-1 opacity-70" />}
                </>
              )}
            </button>

            {/* View Toggle */}
            <div className={`flex ${theme.toggleBg} rounded-lg p-1 transition-colors duration-300`}>
              <button
                onClick={() => setActiveView('analysis')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  activeView === 'analysis' ? theme.toggleActive : theme.toggleInactive
                }`}
              >
                <List className="w-4 h-4" />
                <span className="hidden sm:inline">Analysis</span>
              </button>
              <button
                onClick={() => setActiveView('dashboard')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  activeView === 'dashboard' ? theme.toggleActive : theme.toggleInactive
                }`}
              >
                <BarChart2 className="w-4 h-4" />
                <span className="hidden sm:inline">Dashboard</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {analysisStatus === 'complete' && scanResult && (
              <div className="flex items-center gap-2 text-sm text-green-400">
                <CheckCircle className="w-4 h-4" />
                <span>{scanResult.vulnerabilities.length} issues found</span>
              </div>
            )}
            {analysisStatus === 'error' && (
              <div className="flex items-center gap-2 text-sm text-red-400">
                <XCircle className="w-4 h-4" />
                <span>Scan failed</span>
              </div>
            )}
            <button
              onClick={exportReport}
              disabled={!scanResult && !projectScanResult}
              className={`flex items-center gap-2 px-3 py-2 ${theme.btnSecondary} rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      {activeView === 'dashboard' ? (
        <Dashboard scanResult={scanResult} projectScanResult={projectScanResult} />
      ) : (
        <div className="flex flex-col lg:flex-row h-[calc(100vh-130px)]">
          <div className={`${selectedVulnerability ? 'lg:w-1/3' : 'lg:w-1/2'} w-full flex flex-col border-r ${theme.border} transition-all duration-300`}>
            <div className="flex-1 overflow-hidden">
              <CodeEditor
                code={code}
                onChange={setCode}
                inputMode={inputMode}
                onInputModeChange={setInputMode}
                onFileUpload={handleFileUpload}
                highlightedLines={highlightedLines}
                isScanning={analysisStatus === 'scanning' || analysisStatus === 'analyzing'}
              />
            </div>
          </div>

          <div className={`${selectedVulnerability ? 'lg:w-1/3' : 'lg:w-1/2'} w-full flex flex-col transition-all duration-300`}>
            <VulnerabilityList
              vulnerabilities={currentVulnerabilities}
              onVulnerabilitySelect={handleVulnerabilitySelect}
              selectedVulnerabilityId={selectedVulnerability?.id}
            />
          </div>

          {selectedVulnerability && (
            <div className="lg:w-1/3 w-full flex flex-col">
              <VulnerabilityDetail
                vulnerability={selectedVulnerability}
                onClose={() => { setSelectedVulnerability(null); setHighlightedLines([]); }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// APP ROUTES
// ============================================================================

const AppRoutes: React.FC = () => (
  <Routes>
    <Route path="/login" element={<PublicOnlyRoute><LoginPage /></PublicOnlyRoute>} />
    <Route path="/register" element={<PublicOnlyRoute><RegisterPage /></PublicOnlyRoute>} />
    <Route path="/" element={<ScannerPage />} />
    <Route path="/dashboard" element={<ScannerPage />} />
    <Route path="/history" element={<ProtectedRoute><ScanHistoryPage /></ProtectedRoute>} />
    <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

// ============================================================================
// MAIN APP - ✅ WRAP WITH THEMEPROVIDER
// ============================================================================

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ThemeProvider>
          <AppRoutes />
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;