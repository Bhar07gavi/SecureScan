import axios from 'axios';
import { ScanResult, ProjectScanResult, Vulnerability, FixSuggestion, SecurityMetrics } from '../types';
import { analyzeCode, detectLanguage } from './staticAnalyzer';
import { generateAIExplanation, generateAIFix, calculateFixConfidence } from './aiService';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

// Request Interceptor - Add Auth Token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    console.log('🚀 API Request:', config.method?.toUpperCase(), config.url);
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor - Handle 401
axiosInstance.interceptors.response.use(
  (response) => {
    console.log('✅ API Response:', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error('❌ API Error:', error.response?.data || error.message);
    if (error.response?.status === 401 && !window.location.pathname.includes('/login')) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const generateId = () => crypto.randomUUID();

interface BackendScanResponse {
  vulnerabilities: Array<{ id: string; type: string; severity: string; line: number; description: string; location: string }>;
  risk_score: number;
}

interface BackendHistoryResponse {
  total: number;
  scans: Array<{ id: string; language: string; risk_score: number; risk_level: string; total_vulnerabilities: number; critical_count: number; high_count: number; medium_count: number; low_count: number; scan_date: string }>;
}

interface BackendStatsResponse {
  total_scans: number;
  total_vulnerabilities_found: number;
  risk_distribution: { critical: number; high: number; medium: number; low: number; safe: number };
}

class ApiService {
  private useBackend: boolean = true;

  constructor() { this.checkBackendHealth(); }

  async checkBackendHealth(): Promise<boolean> {
    try {
      const response = await axiosInstance.get('/health', { timeout: 5000 });
      this.useBackend = response.status === 200;
      console.log(`Backend: ${this.useBackend ? '✅ Available' : '❌ Unavailable'}`);
      return this.useBackend;
    } catch {
      this.useBackend = false;
      return false;
    }
  }

async scanCode(code: string, fileName?: string): Promise<ScanResult> {
  const startTime = Date.now();
  const language = detectLanguage(code, fileName);
  const actualFileName = fileName || 'Untitled';
  let vulnerabilities: Vulnerability[] = [];
  let backendRiskScore = 0;

  try {
    if (this.useBackend) {
      const response = await axiosInstance.post<BackendScanResponse>('/api/scan/scan', { 
        code, 
        language: language.toLowerCase() 
      });
      vulnerabilities = response.data.vulnerabilities.map(v => ({
        id: v.id, 
        type: v.type, 
        severity: this.mapSeverity(v.severity), 
        line: v.line, 
        column: 0,
        message: v.description, 
        description: v.description, 
        code: this.extractCodeSnippet(code, v.line),
        cwe: this.getCWEForType(v.type), 
        recommendation: this.getRecommendation(v.type), 
        riskScore: 0, 
        aiExplanation: '',
        fileName: actualFileName,  // ✅ ADD FILE NAME
      }));
      backendRiskScore = response.data.risk_score * 100;
      await Promise.all(vulnerabilities.map(async (vuln) => { 
        vuln.aiExplanation = await generateAIExplanation(vuln); 
      }));
    } else {
      const rawVulns = analyzeCode(code, fileName);
      // ✅ ADD FILE NAME TO EACH VULNERABILITY
      vulnerabilities = rawVulns.map(v => ({
        ...v,
        fileName: actualFileName,
      }));
      for (const vuln of vulnerabilities) { 
        vuln.aiExplanation = await generateAIExplanation(vuln); 
      }
    }
  } catch (error: any) {
    if (error.code === 'ERR_NETWORK' || error.response?.status >= 500) {
      const rawVulns = analyzeCode(code, fileName);
      // ✅ ADD FILE NAME HERE TOO
      vulnerabilities = rawVulns.map(v => ({
        ...v,
        fileName: actualFileName,
      }));
      for (const vuln of vulnerabilities) { 
        vuln.aiExplanation = await generateAIExplanation(vuln); 
      }
    } else { 
      throw new Error(`Scan failed: ${error.message}`); 
    }
  }

  return {
    id: generateId(), 
    fileName: actualFileName, 
    language, 
    timestamp: new Date(),
    vulnerabilities, 
    overallRiskScore: backendRiskScore || this.calculateOverallRisk(vulnerabilities),
    linesAnalyzed: code.split('\n').length, 
    scanDuration: Date.now() - startTime,
  };
}

  async scanProject(files: { name: string; content: string }[]): Promise<ProjectScanResult> {
    const fileResults: ScanResult[] = [];
    const fileNames: string[] = [];  // ✅ Track file names
  
    for (let i = 0; i < files.length; i += 5) {
      const chunk = files.slice(i, i + 5);
      const results = await Promise.allSettled(
        chunk.map(file => this.scanCode(file.content, file.name))
      );
      results.forEach((r, idx) => { 
        if (r.status === 'fulfilled') {
          fileResults.push(r.value);
          fileNames.push(chunk[idx].name);  // ✅ Add file name
        }
      });
    }
  
  const allVulns = fileResults.flatMap(r => r.vulnerabilities);
  
  return {
    id: generateId(), 
    projectName: 'Project Scan', 
    timestamp: new Date(), 
    fileResults,
    fileName: fileNames,  // ✅ Include all file names
    totalVulnerabilities: allVulns.length,
    criticalCount: allVulns.filter(v => v.severity === 'critical').length,
    highCount: allVulns.filter(v => v.severity === 'high').length,
    mediumCount: allVulns.filter(v => v.severity === 'medium').length,
    lowCount: allVulns.filter(v => v.severity === 'low').length,
    infoCount: allVulns.filter(v => v.severity === 'info').length,
    overallRiskScore: this.calculateOverallRisk(allVulns),
  };
}

  async getFixSuggestion(vulnerability: Vulnerability): Promise<FixSuggestion> {
    await delay(300 + Math.random() * 200);
    const fix = await generateAIFix(vulnerability);
    return { vulnerabilityId: vulnerability.id, originalCode: fix.original, fixedCode: fix.fixed, explanation: fix.explanation, confidence: calculateFixConfidence(vulnerability) };
  }

  async getMetrics(): Promise<SecurityMetrics> {
    try {
      if (this.useBackend) {
        const [statsRes, historyRes] = await Promise.all([
          axiosInstance.get<BackendStatsResponse>('/stats'),
          axiosInstance.get<BackendHistoryResponse>('/api/scan/history?limit=100'),
        ]);
        const stats = statsRes.data;
        const history = historyRes.data.scans;
        const typeCount: Record<string, number> = {};
        history.forEach(s => { typeCount['Various Types'] = (typeCount['Various Types'] || 0) + s.total_vulnerabilities; });
        const sixMonthsAgo = new Date(); sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        const recent = history.filter(s => new Date(s.scan_date) >= sixMonthsAgo);
        return {
          totalScans: stats.total_scans, totalVulnerabilities: stats.total_vulnerabilities_found,
          fixedVulnerabilities: Math.floor(stats.total_vulnerabilities_found * 0.7),
          averageRiskScore: this.calculateAverageRisk(recent),
          topVulnerabilityTypes: Object.entries(typeCount).map(([type, count]) => ({ type, count })),
          riskTrend: this.calculateRiskTrend(recent),
        };
      }
    } catch { /* fallback */ }
    return { totalScans: 0, totalVulnerabilities: 0, fixedVulnerabilities: 0, averageRiskScore: 0, topVulnerabilityTypes: [], riskTrend: [] };
  }

  async getScanHistory(limit = 10, skip = 0) {
    const response = await axiosInstance.get<BackendHistoryResponse>(`/api/scan/history?limit=${limit}&skip=${skip}`);
    return response.data;
  }

  private mapSeverity(s: string): 'critical' | 'high' | 'medium' | 'low' | 'info' {
    const m: Record<string, any> = { Critical: 'critical', High: 'high', Medium: 'medium', Low: 'low' };
    return m[s] || 'info';
  }

  private extractCodeSnippet(code: string, line: number): string {
    const lines = code.split('\n');
    return lines.slice(Math.max(0, line - 2), Math.min(lines.length, line + 1)).join('\n');
  }

  private getCWEForType(type: string): string {
    const m: Record<string, string> = { 'SQL Injection': 'CWE-89', 'XSS': 'CWE-79', 'Command Injection': 'CWE-78', 'Code Injection': 'CWE-94', 'Hardcoded Credential': 'CWE-798', 'Path Traversal': 'CWE-22', 'Insecure Deserialization': 'CWE-502', 'Weak Cryptography': 'CWE-327', 'Weak Random': 'CWE-338', 'SSRF': 'CWE-918' };
    return m[type] || 'CWE-Unknown';
  }

  private getRecommendation(type: string): string {
    const m: Record<string, string> = { 'SQL Injection': 'Use parameterized queries', 'XSS': 'Sanitize inputs', 'Command Injection': 'Avoid shell execution', 'Hardcoded Credential': 'Use environment variables', 'Path Traversal': 'Validate file paths', 'Weak Cryptography': 'Use SHA-256+', 'Insecure Deserialization': 'Validate before deserializing' };
    return m[type] || 'Review and fix';
  }

  private calculateOverallRisk(vulns: Vulnerability[]): number {
    if (!vulns.length) return 0;
    const w = { critical: 10, high: 7, medium: 4, low: 2, info: 0.5 };
    return Math.min(100, Math.round((vulns.reduce((s, v) => s + (w[v.severity] || 0), 0) / vulns.length) * 12));
  }

  private calculateAverageRisk(scans: any[]): number {
    if (!scans.length) return 0;
    return Math.round(scans.reduce((s: number, scan: any) => s + scan.risk_score * 100, 0) / scans.length);
  }

  private calculateRiskTrend(scans: any[]): Array<{ date: string; score: number }> {
    const monthly: Record<string, number[]> = {};
    scans.forEach(s => {
      const d = new Date(s.scan_date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      (monthly[key] ||= []).push(s.risk_score * 100);
    });
    return Object.entries(monthly).map(([date, scores]) => ({ date, score: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) })).sort((a, b) => a.date.localeCompare(b.date)).slice(-6);
  }
}

// ============================================
// EXPORTS
// ============================================

export const apiService = new ApiService();
export const scanCode = (code: string, fileName?: string) => apiService.scanCode(code, fileName);
export const scanProject = (files: { name: string; content: string }[]) => apiService.scanProject(files);
export const getFixSuggestion = (vuln: Vulnerability) => apiService.getFixSuggestion(vuln);
export const getMetrics = () => apiService.getMetrics();
export const getScanHistory = (limit = 10, skip = 0) => apiService.getScanHistory(limit, skip);
export const checkHealth = async () => (await axiosInstance.get('/health')).data;
export const getStatistics = async () => (await axiosInstance.get('/stats')).data;
export const checkBackendHealth = () => checkHealth();
export { axiosInstance as api };

// ============================================
// AUTH API
// ============================================

export const authApi = {
  login: async (email: string, password: string) => {
    const response = await axiosInstance.post('/api/auth/login', { email, password });
    
    // ✅ Save token immediately after login
    const token = response.data.access_token || response.data.token;
    if (token) {
      localStorage.setItem('token', token);
      console.log('✅ Token saved to localStorage');
    } else {
      console.warn('⚠️ No token in response:', response.data);
    }
    
    return response.data;
  },

  register: async (data: { email: string; username: string; password: string; full_name?: string }) => {
    const response = await axiosInstance.post('/api/auth/register', data);
    
    // ✅ Save token if backend auto-logs in on registration
    const token = response.data.access_token || response.data.token;
    if (token) {
      localStorage.setItem('token', token);
      console.log('✅ Token saved after registration');
    }
    
    return response.data;
  },

  googleLogin: async (credential: string) => {
    const response = await axiosInstance.post('/api/auth/google', { token: credential });
    
    // ✅ Save Google auth token
    const token = response.data.access_token || response.data.token;
    if (token) {
      localStorage.setItem('token', token);
      console.log('✅ Google token saved');
    }
    
    return response.data;
  },

  getMe: async () => {
    const response = await axiosInstance.get('/api/auth/me');
    return response.data;
  },

  updateProfile: async (data: { username?: string; full_name?: string }) => {
    const response = await axiosInstance.put('/api/auth/me', data);
    return response.data;
  },

  changePassword: async (currentPassword: string, newPassword: string) => {
    const response = await axiosInstance.post('/api/auth/change-password', {
      current_password: currentPassword,
      new_password: newPassword
    });
    return response.data;
  },

  logout: async () => {
    try { 
      await axiosInstance.post('/api/auth/logout'); 
    } catch (error) {
      console.warn('Logout API failed, clearing local state anyway');
    }
    localStorage.removeItem('token');
  },

  deleteAccount: async () => {
    const response = await axiosInstance.delete('/api/auth/me');
    localStorage.removeItem('token');
    return response.data;
  }
 
};
// ============================================
// HISTORY API
// ============================================

export const historyApi = {
  getScans: async (limit = 10, skip = 0) => {
    const response = await axiosInstance.get(`/api/scan/history?limit=${limit}&skip=${skip}`);
    return response.data;
  },

  getScanById: async (scanId: string) => {
    const response = await axiosInstance.get(`/api/scan/history/${scanId}`);
    return response.data;
  },

  deleteScan: async (scanId: string) => {
    const response = await axiosInstance.delete(`/api/scan/history/${scanId}`);
    return response.data;
  }
};