// ============================================================================
// VULNERABILITY TYPES
// ============================================================================

export interface Vulnerability {
  id: string;
  type: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  line: number;
  column: number;
  endLine?: number;
  endColumn?: number;
  message: string;
  description: string;
  cwe?: string;
  owasp?: string;
  code: string;
  fix?: string;
  riskScore: number;
  aiExplanation?: string;
  recommendation?: string;
  context?: string;
  fileName: string;
}

// ============================================================================
// SCAN RESULTS
// ============================================================================

export interface ScanResult {
  id: string;
  fileName: string;
  language: string;
  timestamp: Date;
  vulnerabilities: Vulnerability[];
  overallRiskScore: number;
  linesAnalyzed: number;
  scanDuration: number;
}

export interface ProjectScanResult {
  id: string;
  projectName: string;
  timestamp: Date;
  fileResults: ScanResult[];
  totalVulnerabilities: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  infoCount: number;
  overallRiskScore: number;
  fileName: string[];
}

// ============================================================================
// FIX SUGGESTIONS
// ============================================================================

export interface FixSuggestion {
  vulnerabilityId: string;
  originalCode: string;
  fixedCode: string;
  explanation: string;
  confidence: number;
  steps?: string[];
}

// ============================================================================
// SECURITY METRICS
// ============================================================================

export interface SecurityMetrics {
  totalScans: number;
  totalVulnerabilities: number;
  fixedVulnerabilities: number;
  averageRiskScore: number;
  topVulnerabilityTypes: { type: string; count: number }[];
  riskTrend: { date: string; score: number }[];
}

// ============================================================================
// BACKEND API TYPES
// ============================================================================

export interface BackendScanResponse {
  vulnerabilities: BackendVulnerability[];
  risk_score: number;
}

export interface BackendVulnerability {
  id: string;
  type: string;
  severity: string;
  line: number;
  description: string;
  location: string;
}

export interface BackendHistoryResponse {
  total: number;
  scans: BackendScanHistoryItem[];
}

export interface BackendScanHistoryItem {
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
}

export interface BackendStatsResponse {
  total_scans: number;
  total_vulnerabilities_found: number;
  risk_distribution: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    safe: number;
  };
}

// ============================================================================
// HEALTH & STATUS
// ============================================================================

export interface HealthStatus {
  status: string;
  api_version: string;
  model_loaded: boolean;
  model_accuracy: number;
  database: string;
  environment: string;
}

export interface AIStatus {
  status: string;
  ai_engine: string;
  model_info: {
    model_loaded: boolean;
    device: string;
    accuracy: number;
    f1_score: number;
    precision: number;
    recall: number;
    total_parameters: number;
    model_path: string;
    vectorizer_loaded: boolean;
  };
  capabilities: string[];
  supported_languages: string[];
}

export interface AIModelInfo {
  model_loaded: boolean;
  model_details: Record<string, any>;
  training_info: {
    dataset_size: string;
    training_time: string;
    framework: string;
    architecture: string;
    layers: string;
    total_parameters: number;
    feature_extraction: string;
  };
  performance_metrics: {
    accuracy: number;
    f1_score: number;
    precision: number;
    recall: number;
    auc_roc: number;
  };
}

// ============================================================================
// AI PREDICTION
// ============================================================================

export interface RiskPredictionRequest {
  code: string;
  language?: string;
}

export interface RiskPredictionResponse {
  risk_score: number;
  risk_level: string;
  is_vulnerable: boolean;
  confidence: number;
}

export interface BatchPredictionResult {
  total_samples: number;
  results: Array<{
    index: number;
    language: string;
    risk_score: number;
    risk_level: string;
    is_vulnerable: boolean;
    error?: string;
  }>;
  summary: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    safe: number;
    errors: number;
  };
}

// ============================================================================
// USER & AUTH (Future Use)
// ============================================================================

export interface User {
  id: string;
  email: string;
  username: string;
  full_name?: string;
  is_active: boolean;
  is_superuser: boolean;
  created_at: string;
  last_login?: string;
  total_scans: number;
  total_vulnerabilities_found: number;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: User;
}

// ============================================================================
// FILE & PROJECT TYPES
// ============================================================================

export interface FileToScan {
  name: string;
  path: string;
  content: string;
  language: string;
  size: number;
}

export interface ProjectConfig {
  name: string;
  rootPath: string;
  files: FileToScan[];
  excludePatterns: string[];
  includePatterns: string[];
}

// ============================================================================
// UI STATE TYPES
// ============================================================================

export type InputMode = 'editor' | 'file' | 'project';

export type AnalysisStatus =
  | 'idle'
  | 'scanning'
  | 'analyzing'
  | 'explaining'
  | 'generating'
  | 'complete'
  | 'error';

export type SeverityLevel = 'critical' | 'high' | 'medium' | 'low' | 'info';

export type RiskLevel = 'Critical' | 'High' | 'Medium' | 'Low' | 'Safe';

export type SortOption = 'severity' | 'line' | 'type' | 'risk';

export type TabView = 'scanner' | 'history' | 'dashboard' | 'settings';

// ============================================================================
// NOTIFICATION TYPES
// ============================================================================

export interface Notification {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  message: string;
  time: Date;
  read: boolean;
}

// ============================================================================
// SETTINGS
// ============================================================================

export interface AppSettings {
  darkMode: boolean;
  autoRefresh: boolean;
  refreshInterval: number;
  fontSize: number;
  wordWrap: boolean;
  showMinimap: boolean;
  showLineNumbers: boolean;
  autoScan: boolean;
  maxFileSize: number;
  apiUrl: string;
}

// ============================================================================
// REMEDIATION RESOURCES
// ============================================================================

export interface RemediationResource {
  title: string;
  url: string;
  type: 'documentation' | 'tutorial' | 'reference' | 'tool';
}

// ============================================================================
// SCAN RULES
// ============================================================================

export interface ScanRule {
  type: string;
  severity: SeverityLevel;
  description: string;
  pattern?: string;
}

export interface ScanRulesResponse {
  total_rules: number;
  rules: ScanRule[];
}

// ============================================================================
// EXPORT REPORT
// ============================================================================

export interface ScanReport {
  id: string;
  title: string;
  generatedAt: Date;
  scanResult: ScanResult;
  projectResult?: ProjectScanResult;
  metrics: SecurityMetrics;
  format: 'pdf' | 'json' | 'csv' | 'html';
}

// ============================================================================
// HELPER TYPES
// ============================================================================

export type SeverityWeight = Record<SeverityLevel, number>;

export const SEVERITY_WEIGHTS: SeverityWeight = {
  critical: 10,
  high: 7,
  medium: 4,
  low: 2,
  info: 0.5,
};

export const SEVERITY_COLORS: Record<SeverityLevel, string> = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#eab308',
  low: '#3b82f6',
  info: '#6b7280',
};

export const SEVERITY_LABELS: Record<SeverityLevel, string> = {
  critical: 'Critical',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
  info: 'Info',
};

// CWE mapping for common vulnerability types
export const CWE_MAP: Record<string, string> = {
  'SQL Injection': 'CWE-89',
  'Cross-Site Scripting (XSS)': 'CWE-79',
  'Command Injection': 'CWE-78',
  'Code Injection': 'CWE-94',
  'Hardcoded Credentials': 'CWE-798',
  'Path Traversal': 'CWE-22',
  'Insecure Deserialization': 'CWE-502',
  'Weak Cryptography': 'CWE-327',
  'Weak Random': 'CWE-338',
  'SSRF': 'CWE-918',
  'XXE': 'CWE-611',
  'CORS Misconfiguration': 'CWE-942',
  'Prototype Pollution': 'CWE-1321',
  'Open Redirect': 'CWE-601',
  'LDAP Injection': 'CWE-90',
  'XPath Injection': 'CWE-643',
};

// OWASP Top 10 mapping
export const OWASP_MAP: Record<string, string> = {
  'SQL Injection': 'A03:2021',
  'Cross-Site Scripting (XSS)': 'A03:2021',
  'Command Injection': 'A03:2021',
  'Hardcoded Credentials': 'A07:2021',
  'Weak Cryptography': 'A02:2021',
  'Insecure Deserialization': 'A08:2021',
  'SSRF': 'A10:2021',
  'Broken Access Control': 'A01:2021',
  'Security Misconfiguration': 'A05:2021',
};


// ========== NEW AUTH TYPES ==========
export interface User {
  id: string;
  email: string;
  username: string;
  full_name?: string;
  is_active: boolean;
  created_at: string;
  total_scans: number;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: User;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  username: string;
  password: string;
  full_name?: string;
}

// ========== NEW HISTORY TYPES ==========
export interface ScanRecord {
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
}

export interface ScanHistoryResponse {
  total: number;
  scans: ScanRecord[];
}