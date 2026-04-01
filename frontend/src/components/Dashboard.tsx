import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  Legend,
} from 'recharts';
import {
  FiShield,
  FiAlertTriangle,
  FiCheckCircle,
  FiTrendingDown,
  FiTrendingUp,
  FiActivity,
  FiPieChart,
  FiRefreshCw,
  FiDatabase,
  FiCpu,
  FiClock,
  FiZap,
  FiBarChart2,
} from 'react-icons/fi';
import { SecurityMetrics, ScanResult, ProjectScanResult } from '../types';
import { getMetrics, getScanHistory, checkHealth } from '../services/api';

interface DashboardProps {
  scanResult?: ScanResult | null;
  projectScanResult?: ProjectScanResult | null;
}

const SEVERITY_COLORS = {
  Critical: '#ef4444',
  High: '#f97316',
  Medium: '#eab308',
  Low: '#3b82f6',
  Info: '#6b7280',
};

const COLORS = ['#ef4444', '#f97316', '#eab308', '#3b82f6', '#6b7280'];

const Dashboard: React.FC<DashboardProps> = ({ scanResult, projectScanResult }) => {
  const [metrics, setMetrics] = useState<SecurityMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [backendHealth, setBackendHealth] = useState<any>(null);
  const [recentScans, setRecentScans] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Load dashboard data from backend
  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [metricsData, healthData, historyData] = await Promise.allSettled([
        getMetrics(),
        checkHealth(),
        getScanHistory(10, 0),
      ]);

      if (metricsData.status === 'fulfilled') {
        setMetrics(metricsData.value);
      }

      if (healthData.status === 'fulfilled') {
        setBackendHealth(healthData.value);
      }

      if (historyData.status === 'fulfilled') {
        setRecentScans(historyData.value.scans || []);
      }

      setLastRefresh(new Date());
    } catch (err: any) {
      console.error('Dashboard load error:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load and auto-refresh
  useEffect(() => {
    loadDashboardData();

    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(loadDashboardData, 15000); // Refresh every 15 seconds
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [loadDashboardData, autoRefresh]);

  // Reload when new scan completes
  useEffect(() => {
    if (scanResult || projectScanResult) {
      // Small delay to allow backend to save
      setTimeout(loadDashboardData, 1000);
    }
  }, [scanResult, projectScanResult, loadDashboardData]);

  // Current scan data
  const currentVulnerabilities = scanResult?.vulnerabilities ||
    projectScanResult?.fileResults.flatMap(r => r.vulnerabilities) || [];

  const severityData = [
    { name: 'Critical', value: currentVulnerabilities.filter(v => v.severity === 'critical').length },
    { name: 'High', value: currentVulnerabilities.filter(v => v.severity === 'high').length },
    { name: 'Medium', value: currentVulnerabilities.filter(v => v.severity === 'medium').length },
    { name: 'Low', value: currentVulnerabilities.filter(v => v.severity === 'low').length },
    { name: 'Info', value: currentVulnerabilities.filter(v => v.severity === 'info').length },
  ].filter(d => d.value > 0);

  const vulnerabilityTypeData = Object.entries(
    currentVulnerabilities.reduce((acc, v) => {
      acc[v.type] = (acc[v.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([type, count]) => ({
    type: type.length > 20 ? type.slice(0, 20) + '...' : type,
    fullType: type,
    count
  }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  const overallRisk = scanResult?.overallRiskScore ||
    projectScanResult?.overallRiskScore || 0;

  // Format time ago
  const formatTimeAgo = (date: Date | string) => {
    const now = new Date();
    const d = new Date(date);
    const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return d.toLocaleDateString();
  };

  // Get risk level label
  const getRiskLabel = (score: number) => {
    if (score >= 70) return { label: 'Critical Risk', color: 'text-red-500', bg: 'bg-red-500/20' };
    if (score >= 40) return { label: 'Moderate Risk', color: 'text-yellow-500', bg: 'bg-yellow-500/20' };
    if (score >= 20) return { label: 'Low Risk', color: 'text-blue-500', bg: 'bg-blue-500/20' };
    return { label: 'Minimal Risk', color: 'text-green-500', bg: 'bg-green-500/20' };
  };

  const risk = getRiskLabel(overallRisk);

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 shadow-xl">
          <p className="text-gray-400 text-xs mb-1">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm font-medium" style={{ color: entry.color }}>
              {entry.name || entry.dataKey}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-6 space-y-6 overflow-auto h-full bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
          <FiActivity className="text-cyan-400" />
          Security Dashboard
        </h2>
        <div className="flex items-center gap-3">
          {/* Auto Refresh Toggle */}
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-colors ${
              autoRefresh
                ? 'bg-green-500/10 text-green-400'
                : 'bg-gray-700 text-gray-400'
            }`}
          >
            <FiRefreshCw size={12} className={autoRefresh ? 'animate-spin' : ''} />
            Auto Refresh {autoRefresh ? 'ON' : 'OFF'}
          </button>

          {/* Manual Refresh */}
          <button
            onClick={loadDashboardData}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-1.5 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors text-xs disabled:opacity-50"
          >
            <FiRefreshCw size={12} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>

          {/* Last Updated */}
          <span className="text-xs text-gray-500 flex items-center gap-1">
            <FiClock size={12} />
            {formatTimeAgo(lastRefresh)}
          </span>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 flex items-center justify-between">
          <span className="text-sm text-red-400">{error}</span>
          <button
            onClick={loadDashboardData}
            className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1"
          >
            <FiRefreshCw size={12} />
            Retry
          </button>
        </div>
      )}

      {/* System Status Bar */}
      {backendHealth && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className={`flex items-center gap-2 p-2 rounded-lg text-xs ${
            backendHealth.status === 'healthy' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
          }`}>
            <FiActivity size={14} />
            API: {backendHealth.status === 'healthy' ? 'Online' : 'Offline'}
          </div>
          <div className={`flex items-center gap-2 p-2 rounded-lg text-xs ${
            backendHealth.model_loaded ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
          }`}>
            <FiCpu size={14} />
            AI Model: {backendHealth.model_loaded ? `${(backendHealth.model_accuracy * 100).toFixed(1)}%` : 'Not Loaded'}
          </div>
          <div className={`flex items-center gap-2 p-2 rounded-lg text-xs ${
            backendHealth.database === 'connected' ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'
          }`}>
            <FiDatabase size={14} />
            DB: {backendHealth.database === 'connected' ? 'Connected' : 'Disconnected'}
          </div>
          <div className="flex items-center gap-2 p-2 rounded-lg text-xs bg-cyan-500/10 text-cyan-400">
            <FiShield size={14} />
            Environment: {backendHealth.environment || 'Unknown'}
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Risk Score */}
        <div className="bg-gray-800 rounded-xl p-5 border border-gray-700 hover:border-gray-600 transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Current Risk Score</p>
              <p className={`text-4xl font-bold mt-1 ${risk.color}`}>
                {overallRisk}
              </p>
              <p className={`text-xs mt-1 ${risk.color}`}>{risk.label}</p>
            </div>
            <div className={`p-3 rounded-xl ${risk.bg}`}>
              <FiShield className={`w-7 h-7 ${risk.color}`} />
            </div>
          </div>
          {/* Risk Progress Bar */}
          <div className="mt-3 bg-gray-700 rounded-full h-2 overflow-hidden">
            <div
              className={`h-2 rounded-full transition-all duration-700 ${
                overallRisk >= 70 ? 'bg-gradient-to-r from-red-600 to-red-400' :
                overallRisk >= 40 ? 'bg-gradient-to-r from-yellow-600 to-yellow-400' :
                'bg-gradient-to-r from-green-600 to-green-400'
              }`}
              style={{ width: `${overallRisk}%` }}
            />
          </div>
        </div>

        {/* Vulnerabilities Found */}
        <div className="bg-gray-800 rounded-xl p-5 border border-gray-700 hover:border-gray-600 transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Vulnerabilities Found</p>
              <p className="text-4xl font-bold text-white mt-1">
                {currentVulnerabilities.length > 0
                  ? currentVulnerabilities.length
                  : metrics?.totalVulnerabilities || 0
                }
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {currentVulnerabilities.length > 0 ? 'In current scan' : 'Total across all scans'}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-orange-500/20">
              <FiAlertTriangle className="w-7 h-7 text-orange-500" />
            </div>
          </div>
          {/* Severity Mini-bars */}
          <div className="mt-3 flex items-center gap-1">
            {['critical', 'high', 'medium', 'low'].map(sev => {
              const count = currentVulnerabilities.filter(v => v.severity === sev).length;
              if (count === 0 && currentVulnerabilities.length === 0) return null;
              return (
                <div
                  key={sev}
                  className={`h-2 rounded-full flex-1 ${
                    sev === 'critical' ? 'bg-red-500' :
                    sev === 'high' ? 'bg-orange-500' :
                    sev === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'
                  }`}
                  style={{
                    opacity: currentVulnerabilities.length > 0
                      ? Math.max(0.2, count / currentVulnerabilities.length)
                      : 0.2
                  }}
                  title={`${sev}: ${count}`}
                />
              );
            })}
          </div>
        </div>

        {/* Critical Issues */}
        <div className="bg-gray-800 rounded-xl p-5 border border-gray-700 hover:border-gray-600 transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Critical Issues</p>
              <p className="text-4xl font-bold text-red-500 mt-1">
                {currentVulnerabilities.filter(v => v.severity === 'critical').length ||
                  (metrics?.topVulnerabilityTypes?.[0]?.count || 0)}
              </p>
              <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                <FiZap size={10} />
                Requires immediate action
              </p>
            </div>
            <div className="p-3 rounded-xl bg-red-500/20">
              <FiZap className="w-7 h-7 text-red-500" />
            </div>
          </div>
        </div>

        {/* Total Scans / Lines */}
        <div className="bg-gray-800 rounded-xl p-5 border border-gray-700 hover:border-gray-600 transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">
                {metrics?.totalScans ? 'Total Scans' : 'Lines Analyzed'}
              </p>
              <p className="text-4xl font-bold text-cyan-400 mt-1">
                {metrics?.totalScans ||
                  scanResult?.linesAnalyzed ||
                  projectScanResult?.fileResults.reduce((sum, r) => sum + r.linesAnalyzed, 0) ||
                  0}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {scanResult?.scanDuration
                  ? `Last scan: ${scanResult.scanDuration}ms`
                  : metrics?.totalScans
                    ? 'Across all sessions'
                    : 'Ready to scan'
                }
              </p>
            </div>
            <div className="p-3 rounded-xl bg-cyan-500/20">
              <FiBarChart2 className="w-7 h-7 text-cyan-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Severity Distribution (Pie Chart) */}
        <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <FiPieChart className="text-cyan-400" />
            Severity Distribution
          </h3>
          {severityData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={severityData}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={100}
                  paddingAngle={4}
                  dataKey="value"
                  animationBegin={0}
                  animationDuration={800}
                >
                  {severityData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={SEVERITY_COLORS[entry.name as keyof typeof SEVERITY_COLORS] || COLORS[index]}
                      strokeWidth={0}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  formatter={(value: string) => (
                    <span className="text-gray-300 text-xs">{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <FiPieChart className="w-12 h-12 mb-3 text-gray-600" />
              <p className="text-sm">No scan data available</p>
              <p className="text-xs text-gray-600 mt-1">Run a scan to see distribution</p>
            </div>
          )}
        </div>

        {/* Vulnerability Types (Bar Chart) */}
        <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <FiAlertTriangle className="text-orange-400" />
            Top Vulnerability Types
          </h3>
          {vulnerabilityTypeData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={vulnerabilityTypeData} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" horizontal={false} />
                <XAxis type="number" stroke="#9ca3af" tick={{ fontSize: 12 }} />
                <YAxis
                  dataKey="type"
                  type="category"
                  stroke="#9ca3af"
                  width={120}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="count"
                  fill="#06b6d4"
                  radius={[0, 6, 6, 0]}
                  animationBegin={0}
                  animationDuration={800}
                >
                  {vulnerabilityTypeData.map((_, index) => (
                    <Cell
                      key={`bar-${index}`}
                      fill={index === 0 ? '#ef4444' : index === 1 ? '#f97316' : '#06b6d4'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <FiBarChart2 className="w-12 h-12 mb-3 text-gray-600" />
              <p className="text-sm">No vulnerabilities detected</p>
              <p className="text-xs text-gray-600 mt-1">Your code looks clean!</p>
            </div>
          )}
        </div>
      </div>

      {/* Risk Trend */}
      <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <FiTrendingDown className="text-green-400" />
            Security Risk Trend
          </h3>
          {metrics?.riskTrend && metrics.riskTrend.length > 1 && (
            <span className={`text-xs px-3 py-1 rounded-full flex items-center gap-1 ${
              metrics.riskTrend[metrics.riskTrend.length - 1].score < metrics.riskTrend[0].score
                ? 'bg-green-500/20 text-green-400'
                : 'bg-red-500/20 text-red-400'
            }`}>
              {metrics.riskTrend[metrics.riskTrend.length - 1].score < metrics.riskTrend[0].score ? (
                <><FiTrendingDown size={12} /> Improving</>
              ) : (
                <><FiTrendingUp size={12} /> Increasing</>
              )}
            </span>
          )}
        </div>
        {metrics?.riskTrend && metrics.riskTrend.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={metrics.riskTrend}>
              <defs>
                <linearGradient id="colorRiskScore" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" stroke="#9ca3af" tick={{ fontSize: 12 }} />
              <YAxis stroke="#9ca3af" domain={[0, 100]} tick={{ fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="score"
                stroke="#06b6d4"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorRiskScore)"
                animationDuration={1000}
                dot={{ r: 4, fill: '#06b6d4', strokeWidth: 2, stroke: '#1f2937' }}
                activeDot={{ r: 6, fill: '#06b6d4', strokeWidth: 2, stroke: '#fff' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex flex-col items-center justify-center h-48 text-gray-500">
            <FiTrendingDown className="w-12 h-12 mb-3 text-gray-600" />
            <p className="text-sm">Not enough data for trend analysis</p>
            <p className="text-xs text-gray-600 mt-1">Run more scans to see the trend</p>
          </div>
        )}
      </div>

      {/* Recent Scans History (from MongoDB) */}
      {recentScans.length > 0 && (
        <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <FiClock className="text-cyan-400" />
              Recent Scan History
              <span className="text-xs text-gray-500 font-normal">(from MongoDB)</span>
            </h3>
            <span className="text-xs text-gray-500">
              {recentScans.length} recent scans
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-400 border-b border-gray-700">
                  <th className="text-left py-3 px-3">Date</th>
                  <th className="text-left py-3 px-3">Language</th>
                  <th className="text-center py-3 px-3">Risk Level</th>
                  <th className="text-center py-3 px-3">Risk Score</th>
                  <th className="text-center py-3 px-3">Vulnerabilities</th>
                  <th className="text-center py-3 px-3">Critical</th>
                </tr>
              </thead>
              <tbody>
                {recentScans.map((scan, idx) => (
                  <tr
                    key={scan.id || idx}
                    className="border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors"
                  >
                    <td className="py-3 px-3 text-gray-300 text-xs">
                      {new Date(scan.scan_date).toLocaleString()}
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-1 bg-gray-700 rounded text-xs text-gray-300">
                        {scan.language || 'python'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        scan.risk_level === 'Critical' ? 'bg-red-500/20 text-red-400' :
                        scan.risk_level === 'High' ? 'bg-orange-500/20 text-orange-400' :
                        scan.risk_level === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' :
                        scan.risk_level === 'Low' ? 'bg-blue-500/20 text-blue-400' :
                        'bg-green-500/20 text-green-400'
                      }`}>
                        {scan.risk_level}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-16 bg-gray-700 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-2 rounded-full ${
                              scan.risk_score >= 0.7 ? 'bg-red-500' :
                              scan.risk_score >= 0.4 ? 'bg-yellow-500' : 'bg-green-500'
                            }`}
                            style={{ width: `${scan.risk_score * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-400 w-10 text-right">
                          {(scan.risk_score * 100).toFixed(0)}%
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className={`text-sm font-medium ${
                        scan.total_vulnerabilities > 5 ? 'text-red-400' :
                        scan.total_vulnerabilities > 0 ? 'text-yellow-400' : 'text-green-400'
                      }`}>
                        {scan.total_vulnerabilities}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      {scan.critical_count > 0 ? (
                        <span className="text-red-400 font-bold flex items-center justify-center gap-1">
                          <FiZap size={12} />
                          {scan.critical_count}
                        </span>
                      ) : (
                        <span className="text-green-400">✓</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* File Results for Project Scan */}
      {projectScanResult && (
        <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <FiActivity className="text-cyan-400" />
            Project File Results
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-400 border-b border-gray-700">
                  <th className="text-left py-3 px-3">File</th>
                  <th className="text-left py-3 px-3">Language</th>
                  <th className="text-center py-3 px-3">Issues</th>
                  <th className="text-center py-3 px-3">Risk</th>
                  <th className="text-center py-3 px-3">Lines</th>
                </tr>
              </thead>
              <tbody>
                {projectScanResult.fileResults
                  .sort((a, b) => b.overallRiskScore - a.overallRiskScore)
                  .map((file, idx) => (
                    <tr key={idx} className="border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors">
                      <td className="py-3 px-3 text-gray-200 font-mono text-xs truncate max-w-[200px]">
                        {file.fileName}
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-1 bg-gray-700 rounded text-xs text-gray-300">
                          {file.language}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                          file.vulnerabilities.length === 0 ? 'bg-green-500/20 text-green-400' :
                          file.vulnerabilities.length < 5 ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-red-500/20 text-red-400'
                        }`}>
                          {file.vulnerabilities.length}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-16 bg-gray-700 rounded-full h-2 overflow-hidden">
                            <div
                              className={`h-2 rounded-full ${
                                file.overallRiskScore >= 70 ? 'bg-red-500' :
                                file.overallRiskScore >= 40 ? 'bg-yellow-500' : 'bg-green-500'
                              }`}
                              style={{ width: `${file.overallRiskScore}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-400 w-8">{file.overallRiskScore}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center text-xs text-gray-400">
                        {file.linesAnalyzed}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="text-center text-xs text-gray-600 py-4">
        <p>SecureScan AI • Powered by Deep Learning • {backendHealth?.model_accuracy ? `${(backendHealth.model_accuracy * 100).toFixed(2)}% Accuracy` : 'Loading...'}</p>
      </div>
    </div>
  );
};

export default Dashboard;