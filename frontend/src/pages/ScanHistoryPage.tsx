// src/pages/ScanHistoryPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { historyApi } from '../services/api';
import Header from '../components/Header';
import {
  History,
  Search,
  Filter,
  Trash2,
  Eye,
  Calendar,
  Code,
  AlertTriangle,
  Shield,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  ArrowLeft,
  FileCode,
  Clock,
  XCircle,
  AlertCircle,
  CheckCircle,
  Download,
  MoreVertical,
  Loader2,
} from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

interface ScanHistoryItem {
  id: string;
  language: string;
  risk_score: number;
  risk_level: string;
  total_vulnerabilities: number;
  critical_count: number;
  high_count: number;
  medium_count: number;
  low_count: number;
  scan_date: string;
  code_snippet?: string;
  file_name?: string;
}

interface ScanDetail {
  id: string;
  code: string;
  language: string;
  vulnerabilities: Array<{
    id: string;
    type: string;
    severity: string;
    line: number;
    description: string;
  }>;
  risk_score: number;
  scan_date: string;
}

// ============================================================================
// SEVERITY BADGE COMPONENT
// ============================================================================

const SeverityBadge: React.FC<{ severity: string; count: number }> = ({ severity, count }) => {
  if (count === 0) return null;

  const colors: Record<string, string> = {
    critical: 'bg-red-500/20 text-red-400 border-red-500/30',
    high: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    low: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  };

  return (
    <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${colors[severity]}`}>
      {count} {severity}
    </span>
  );
};

// ============================================================================
// RISK LEVEL BADGE
// ============================================================================

const RiskLevelBadge: React.FC<{ level: string; score: number }> = ({ level, score }) => {
  const config: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
    Critical: { bg: 'bg-red-500/20', text: 'text-red-400', icon: <XCircle className="w-4 h-4" /> },
    High: { bg: 'bg-orange-500/20', text: 'text-orange-400', icon: <AlertTriangle className="w-4 h-4" /> },
    Medium: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', icon: <AlertCircle className="w-4 h-4" /> },
    Low: { bg: 'bg-blue-500/20', text: 'text-blue-400', icon: <Shield className="w-4 h-4" /> },
    Safe: { bg: 'bg-green-500/20', text: 'text-green-400', icon: <CheckCircle className="w-4 h-4" /> },
  };

  const { bg, text, icon } = config[level] || config['Safe'];

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${bg}`}>
      {icon}
      <span className={`text-sm font-medium ${text}`}>
        {level} ({Math.round(score * 100)}%)
      </span>
    </div>
  );
};

// ============================================================================
// SCAN DETAIL MODAL
// ============================================================================

const ScanDetailModal: React.FC<{
  scan: ScanDetail | null;
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
}> = ({ scan, isOpen, onClose, isDark }) => {
  if (!isOpen || !scan) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div
        className={`relative w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl ${
          isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        } border shadow-2xl`}
      >
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <div>
            <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Scan Details
            </h2>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {new Date(scan.scan_date).toLocaleString()}
            </p>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
          >
            <XCircle className={`w-6 h-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-180px)] p-6">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-gray-100'}`}>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Language</p>
              <p className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {scan.language}
              </p>
            </div>
            <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-gray-100'}`}>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Risk Score</p>
              <p className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {Math.round(scan.risk_score * 100)}%
              </p>
            </div>
            <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-gray-100'}`}>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Vulnerabilities</p>
              <p className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {scan.vulnerabilities.length}
              </p>
            </div>
            <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-gray-100'}`}>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Lines</p>
              <p className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {scan.code.split('\n').length}
              </p>
            </div>
          </div>

          {/* Code */}
          <div className="mb-6">
            <h3 className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-2`}>
              Scanned Code
            </h3>
            <pre
              className={`p-4 rounded-xl text-sm overflow-x-auto ${
                isDark ? 'bg-gray-900 text-gray-300' : 'bg-gray-900 text-gray-300'
              }`}
            >
              <code>{scan.code}</code>
            </pre>
          </div>

          {/* Vulnerabilities */}
          {scan.vulnerabilities.length > 0 && (
            <div>
              <h3 className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-2`}>
                Vulnerabilities Found
              </h3>
              <div className="space-y-3">
                {scan.vulnerabilities.map((vuln, idx) => (
                  <div
                    key={vuln.id || idx}
                    className={`p-4 rounded-xl border ${isDark ? 'bg-gray-700/30 border-gray-700' : 'bg-gray-50 border-gray-200'}`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {vuln.type}
                          </span>
                          <SeverityBadge severity={vuln.severity.toLowerCase()} count={1} />
                        </div>
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          {vuln.description}
                        </p>
                      </div>
                      <span className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                        Line {vuln.line}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`flex justify-end gap-3 p-6 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <button
            onClick={onClose}
            className={`px-4 py-2 rounded-lg ${
              isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const ScanHistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  // State
  const [scans, setScans] = useState<ScanHistoryItem[]>([]);
  const [totalScans, setTotalScans] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [languageFilter, setLanguageFilter] = useState('all');
  const [riskFilter, setRiskFilter] = useState('all');

  // Detail modal
  const [selectedScan, setSelectedScan] = useState<ScanDetail | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Delete state
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch scan history
  const fetchHistory = useCallback(async () => {
    if (!isAuthenticated) return;

    setIsLoading(true);
    setError('');

    try {
      const skip = (currentPage - 1) * itemsPerPage;
      const response = await historyApi.getScans(itemsPerPage, skip);
      setScans(response.scans || []);
      setTotalScans(response.total || 0);
    } catch (err: any) {
      console.error('Failed to fetch history:', err);
      setError(err.response?.data?.detail || 'Failed to load scan history');
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, currentPage, itemsPerPage]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // View scan details
  const handleViewScan = async (scanId: string) => {
    setIsDetailLoading(true);
    try {
      const detail = await historyApi.getScanById(scanId);
      setSelectedScan(detail);
      setShowDetailModal(true);
    } catch (err: any) {
      alert('Failed to load scan details');
    } finally {
      setIsDetailLoading(false);
    }
  };

  // Delete scan
  const handleDeleteScan = async (scanId: string) => {
    if (!window.confirm('Are you sure you want to delete this scan?')) return;

    setDeleteId(scanId);
    setIsDeleting(true);

    try {
      await historyApi.deleteScan(scanId);
      setScans((prev) => prev.filter((s) => s.id !== scanId));
      setTotalScans((prev) => prev - 1);
    } catch (err: any) {
      alert('Failed to delete scan');
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
  };

  // Export scan
  const handleExportScan = async (scan: ScanHistoryItem) => {
    const data = {
      ...scan,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `scan-${scan.id.slice(0, 8)}-${new Date(scan.scan_date).toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Filter scans
  const filteredScans = scans.filter((scan) => {
    const matchesSearch =
      searchQuery === '' ||
      scan.language.toLowerCase().includes(searchQuery.toLowerCase()) ||
      scan.id.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesLanguage = languageFilter === 'all' || scan.language.toLowerCase() === languageFilter;

    const matchesRisk = riskFilter === 'all' || scan.risk_level.toLowerCase() === riskFilter;

    return matchesSearch && matchesLanguage && matchesRisk;
  });

  // Get unique languages for filter
  const uniqueLanguages = [...new Set(scans.map((s) => s.language.toLowerCase()))];

  // Pagination
  const totalPages = Math.ceil(totalScans / itemsPerPage);

  // Theme classes
  const theme = {
    bg: isDark ? 'bg-gray-900' : 'bg-gray-50',
    card: isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200',
    text: isDark ? 'text-white' : 'text-gray-900',
    textMuted: isDark ? 'text-gray-400' : 'text-gray-600',
    input: isDark
      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500',
    hover: isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100',
    tableRow: isDark ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50',
  };

  return (
    <div className={`min-h-screen ${theme.bg} transition-colors duration-300`}>
      <Header darkMode={isDark} onToggleDarkMode={toggleTheme} />

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className={`p-2 rounded-lg ${theme.hover} transition-colors`}
            >
              <ArrowLeft className={`w-5 h-5 ${theme.text}`} />
            </button>
            <div>
              <h1 className={`text-2xl font-bold ${theme.text} flex items-center gap-3`}>
                <History className="w-7 h-7 text-cyan-500" />
                Scan History
              </h1>
              <p className={theme.textMuted}>
                {totalScans} total scan{totalScans !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          <button
            onClick={fetchHistory}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg hover:opacity-90 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Filters */}
        <div className={`${theme.card} border rounded-xl p-4 mb-6`}>
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${theme.textMuted}`} />
              <input
                type="text"
                placeholder="Search by language or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-10 pr-4 py-2.5 ${theme.input} border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500`}
              />
            </div>

            {/* Language Filter */}
            <div className="relative">
              <Filter className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${theme.textMuted}`} />
              <select
                value={languageFilter}
                onChange={(e) => setLanguageFilter(e.target.value)}
                className={`pl-10 pr-8 py-2.5 ${theme.input} border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 appearance-none cursor-pointer`}
              >
                <option value="all">All Languages</option>
                {uniqueLanguages.map((lang) => (
                  <option key={lang} value={lang}>
                    {lang.charAt(0).toUpperCase() + lang.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Risk Filter */}
            <div className="relative">
              <Shield className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${theme.textMuted}`} />
              <select
                value={riskFilter}
                onChange={(e) => setRiskFilter(e.target.value)}
                className={`pl-10 pr-8 py-2.5 ${theme.input} border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 appearance-none cursor-pointer`}
              >
                <option value="all">All Risk Levels</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
                <option value="safe">Safe</option>
              </select>
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 mb-6">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
            <button onClick={fetchHistory} className="ml-auto text-sm underline">
              Retry
            </button>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className={`${theme.card} border rounded-xl p-12 text-center`}>
            <Loader2 className={`w-10 h-10 ${theme.textMuted} animate-spin mx-auto mb-4`} />
            <p className={theme.textMuted}>Loading scan history...</p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredScans.length === 0 && (
          <div className={`${theme.card} border rounded-xl p-12 text-center`}>
            <History className={`w-16 h-16 ${theme.textMuted} mx-auto mb-4 opacity-50`} />
            <h3 className={`text-xl font-semibold ${theme.text} mb-2`}>No Scans Found</h3>
            <p className={`${theme.textMuted} mb-6`}>
              {searchQuery || languageFilter !== 'all' || riskFilter !== 'all'
                ? 'No scans match your filters. Try adjusting your search criteria.'
                : "You haven't run any security scans yet."}
            </p>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg hover:opacity-90"
            >
              Run Your First Scan
            </button>
          </div>
        )}

        {/* Scans Table */}
        {!isLoading && filteredScans.length > 0 && (
          <div className={`${theme.card} border rounded-xl overflow-hidden`}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className={isDark ? 'bg-gray-700/50' : 'bg-gray-50'}>
                  <tr>
                    <th className={`px-6 py-4 text-left text-sm font-medium ${theme.textMuted}`}>
                      Date & Time
                    </th>
                    <th className={`px-6 py-4 text-left text-sm font-medium ${theme.textMuted}`}>
                      Language
                    </th>
                    <th className={`px-6 py-4 text-left text-sm font-medium ${theme.textMuted}`}>
                      Risk Level
                    </th>
                    <th className={`px-6 py-4 text-left text-sm font-medium ${theme.textMuted}`}>
                      Vulnerabilities
                    </th>
                    <th className={`px-6 py-4 text-right text-sm font-medium ${theme.textMuted}`}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDark ? 'divide-gray-700' : 'divide-gray-200'}`}>
                  {filteredScans.map((scan) => (
                    <tr key={scan.id} className={`${theme.tableRow} transition-colors`}>
                      {/* Date */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                            <Calendar className={`w-4 h-4 ${theme.textMuted}`} />
                          </div>
                          <div>
                            <p className={`font-medium ${theme.text}`}>
                              {new Date(scan.scan_date).toLocaleDateString()}
                            </p>
                            <p className={`text-sm ${theme.textMuted}`}>
                              {new Date(scan.scan_date).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Language */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <FileCode className={`w-4 h-4 ${theme.textMuted}`} />
                          <span className={theme.text}>
                            {scan.language.charAt(0).toUpperCase() + scan.language.slice(1)}
                          </span>
                        </div>
                      </td>

                      {/* Risk Level */}
                      <td className="px-6 py-4">
                        <RiskLevelBadge level={scan.risk_level} score={scan.risk_score} />
                      </td>

                      {/* Vulnerabilities */}
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-2">
                          {scan.total_vulnerabilities === 0 ? (
                            <span className="text-green-400 text-sm">No issues found</span>
                          ) : (
                            <>
                              <SeverityBadge severity="critical" count={scan.critical_count} />
                              <SeverityBadge severity="high" count={scan.high_count} />
                              <SeverityBadge severity="medium" count={scan.medium_count} />
                              <SeverityBadge severity="low" count={scan.low_count} />
                            </>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleViewScan(scan.id)}
                            disabled={isDetailLoading}
                            className={`p-2 rounded-lg ${theme.hover} transition-colors`}
                            title="View Details"
                          >
                            <Eye className={`w-4 h-4 ${theme.textMuted}`} />
                          </button>
                          <button
                            onClick={() => handleExportScan(scan)}
                            className={`p-2 rounded-lg ${theme.hover} transition-colors`}
                            title="Export"
                          >
                            <Download className={`w-4 h-4 ${theme.textMuted}`} />
                          </button>
                          <button
                            onClick={() => handleDeleteScan(scan.id)}
                            disabled={isDeleting && deleteId === scan.id}
                            className={`p-2 rounded-lg hover:bg-red-500/10 transition-colors`}
                            title="Delete"
                          >
                            {isDeleting && deleteId === scan.id ? (
                              <Loader2 className="w-4 h-4 text-red-400 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4 text-red-400" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className={`flex items-center justify-between px-6 py-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                <p className={`text-sm ${theme.textMuted}`}>
                  Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
                  {Math.min(currentPage * itemsPerPage, totalScans)} of {totalScans} scans
                </p>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className={`p-2 rounded-lg ${theme.hover} disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
                  >
                    <ChevronLeft className={`w-5 h-5 ${theme.text}`} />
                  </button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }

                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                            currentPage === pageNum
                              ? 'bg-cyan-500 text-white'
                              : `${theme.hover} ${theme.text}`
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className={`p-2 rounded-lg ${theme.hover} disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
                  >
                    <ChevronRight className={`w-5 h-5 ${theme.text}`} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <ScanDetailModal
        scan={selectedScan}
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedScan(null);
        }}
        isDark={isDark}
      />
    </div>
  );
};

export default ScanHistoryPage;