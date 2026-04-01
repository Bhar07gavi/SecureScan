import { Vulnerability } from '../types';

// Enhanced vulnerability patterns with more comprehensive detection
const VULNERABILITY_PATTERNS = [
  // ==================== SQL INJECTION ====================
  {
    pattern: /(?:query|execute|exec|raw|sql)\s*\(\s*[`'"].*\$\{|(?:query|execute|exec|raw|sql)\s*\(\s*["`'].*\+\s*\w+/gi,
    type: 'SQL Injection',
    severity: 'critical' as const,
    cwe: 'CWE-89',
    owasp: 'A03:2021',
    description: 'SQL injection vulnerability: User input is directly concatenated into SQL queries. Use parameterized queries or prepared statements.',
    recommendation: 'Use parameterized queries: db.query("SELECT * FROM users WHERE id = ?", [userId])'
  },
  {
    pattern: /SELECT\s+.*\s+FROM\s+.*\s+WHERE\s+.*["`']?\s*[\+&]\s*\w+/gi,
    type: 'SQL Injection',
    severity: 'critical' as const,
    cwe: 'CWE-89',
    owasp: 'A03:2021',
    description: 'SQL query constructed with string concatenation, vulnerable to injection attacks.',
    recommendation: 'Replace string concatenation with parameterized queries'
  },
  {
    pattern: /cursor\.execute\s*\(\s*[f"'].*%s.*["']\s*%/gi,
    type: 'SQL Injection',
    severity: 'critical' as const,
    cwe: 'CWE-89',
    owasp: 'A03:2021',
    description: 'Python SQL query using string formatting (% or f-strings) is vulnerable to injection.',
    recommendation: 'Use parameterized queries: cursor.execute("SELECT * FROM users WHERE id = %s", (user_id,))'
  },

  // ==================== XSS ====================
  {
    pattern: /\.innerHTML\s*=/gi,
    type: 'Cross-Site Scripting (XSS)',
    severity: 'high' as const,
    cwe: 'CWE-79',
    owasp: 'A03:2021',
    description: 'Direct assignment to innerHTML can allow malicious script injection.',
    recommendation: 'Use textContent for plain text or sanitize HTML with DOMPurify'
  },
  {
    pattern: /document\.write\s*\(/gi,
    type: 'Cross-Site Scripting (XSS)',
    severity: 'high' as const,
    cwe: 'CWE-79',
    owasp: 'A03:2021',
    description: 'document.write() can execute arbitrary JavaScript and is vulnerable to XSS.',
    recommendation: 'Use modern DOM manipulation methods like createElement and appendChild'
  },
  {
    pattern: /dangerouslySetInnerHTML/gi,
    type: 'Cross-Site Scripting (XSS)',
    severity: 'high' as const,
    cwe: 'CWE-79',
    owasp: 'A03:2021',
    description: 'Using dangerouslySetInnerHTML bypasses React\'s XSS protection.',
    recommendation: 'Sanitize HTML with DOMPurify before using dangerouslySetInnerHTML'
  },
  {
    pattern: /\.outerHTML\s*=/gi,
    type: 'Cross-Site Scripting (XSS)',
    severity: 'high' as const,
    cwe: 'CWE-79',
    owasp: 'A03:2021',
    description: 'Setting outerHTML with user input can lead to XSS.',
    recommendation: 'Use textContent or sanitize input with DOMPurify'
  },
  {
    pattern: /v-html\s*=/gi,
    type: 'Cross-Site Scripting (XSS)',
    severity: 'high' as const,
    cwe: 'CWE-79',
    owasp: 'A03:2021',
    description: 'Vue.js v-html directive can execute scripts from user input.',
    recommendation: 'Sanitize HTML or use v-text for plain text'
  },

  // ==================== COMMAND INJECTION ====================
  {
    pattern: /(?:exec|spawn|execSync|spawnSync|execFile)\s*\([^)]*\+[^)]*\)/gi,
    type: 'Command Injection',
    severity: 'critical' as const,
    cwe: 'CWE-78',
    owasp: 'A03:2021',
    description: 'Command execution with concatenated user input can lead to command injection.',
    recommendation: 'Use array syntax for arguments: execFile("cmd", [arg1, arg2])'
  },
  {
    pattern: /os\.system\s*\(/gi,
    type: 'Command Injection',
    severity: 'critical' as const,
    cwe: 'CWE-78',
    owasp: 'A03:2021',
    description: 'os.system() with user input allows arbitrary command execution.',
    recommendation: 'Use subprocess.run() with list arguments instead'
  },
  {
    pattern: /shell\s*[:=]\s*[Tt]rue/gi,
    type: 'Command Injection',
    severity: 'critical' as const,
    cwe: 'CWE-78',
    owasp: 'A03:2021',
    description: 'Using shell=True with subprocess allows shell injection attacks.',
    recommendation: 'Remove shell=True and pass commands as list: subprocess.run(["cmd", arg])'
  },
  {
    pattern: /Runtime\.getRuntime\(\)\.exec/gi,
    type: 'Command Injection',
    severity: 'critical' as const,
    cwe: 'CWE-78',
    owasp: 'A03:2021',
    description: 'Java Runtime.exec() with concatenated strings is vulnerable to injection.',
    recommendation: 'Use ProcessBuilder with separate arguments'
  },

  // ==================== PATH TRAVERSAL ====================
  {
    pattern: /(?:readFile|readFileSync|writeFile|writeFileSync|open)\s*\([^)]*\+/gi,
    type: 'Path Traversal',
    severity: 'high' as const,
    cwe: 'CWE-22',
    owasp: 'A01:2021',
    description: 'File path constructed with concatenation may allow directory traversal attacks (../).',
    recommendation: 'Use path.join() and validate paths with path.resolve()'
  },
  {
    pattern: /\.\.\/|\.\.\\|\.\.\//gi,
    type: 'Path Traversal',
    severity: 'medium' as const,
    cwe: 'CWE-22',
    owasp: 'A01:2021',
    description: 'Directory traversal sequence detected in code.',
    recommendation: 'Validate and sanitize all file paths, use path.basename()'
  },

  // ==================== HARDCODED SECRETS ====================
  {
    pattern: /(?:password|passwd|pwd|secret|api[_-]?key|apikey|access[_-]?key|secret[_-]?key|private[_-]?key|token|auth)\s*[:=]\s*["`'][^"`'\s]{8,}["`']/gi,
    type: 'Hardcoded Credentials',
    severity: 'critical' as const,
    cwe: 'CWE-798',
    owasp: 'A07:2021',
    description: 'Hardcoded credentials or secrets detected. Never store secrets in source code.',
    recommendation: 'Use environment variables: process.env.API_KEY or config files (not in git)'
  },
  {
    pattern: /(?:AKIA|ASIA)[A-Z0-9]{16}/g,
    type: 'Hardcoded AWS Credentials',
    severity: 'critical' as const,
    cwe: 'CWE-798',
    owasp: 'A07:2021',
    description: 'AWS access key detected in code. Rotate this key immediately!',
    recommendation: 'Use AWS IAM roles, environment variables, or AWS Secrets Manager'
  },
  {
    pattern: /-----BEGIN (?:RSA |EC |DSA )?PRIVATE KEY-----/gi,
    type: 'Hardcoded Private Key',
    severity: 'critical' as const,
    cwe: 'CWE-798',
    owasp: 'A07:2021',
    description: 'Private key exposed in source code.',
    recommendation: 'Remove key immediately, rotate credentials, use secure key storage'
  },
  {
    pattern: /ghp_[a-zA-Z0-9]{36}|github_pat_[a-zA-Z0-9]{22}_[a-zA-Z0-9]{59}/g,
    type: 'Hardcoded GitHub Token',
    severity: 'critical' as const,
    cwe: 'CWE-798',
    owasp: 'A07:2021',
    description: 'GitHub personal access token detected in code.',
    recommendation: 'Revoke token immediately and use GitHub Secrets for CI/CD'
  },

  // ==================== CODE INJECTION ====================
  {
    pattern: /\beval\s*\(/gi,
    type: 'Code Injection',
    severity: 'critical' as const,
    cwe: 'CWE-95',
    owasp: 'A03:2021',
    description: 'eval() can execute arbitrary code and is a critical security risk.',
    recommendation: 'Use JSON.parse() for data or safer alternatives'
  },
  {
    pattern: /new\s+Function\s*\([^)]*["`'][^"`']*["`']/gi,
    type: 'Code Injection',
    severity: 'high' as const,
    cwe: 'CWE-95',
    owasp: 'A03:2021',
    description: 'Dynamic function creation with strings can lead to code injection.',
    recommendation: 'Avoid dynamic code generation or strictly validate input'
  },
  {
    pattern: /exec\s*\([^)]*user|exec\s*\([^)]*input|exec\s*\([^)]*request/gi,
    type: 'Code Injection',
    severity: 'critical' as const,
    cwe: 'CWE-95',
    owasp: 'A03:2021',
    description: 'Python exec() with user input allows arbitrary code execution.',
    recommendation: 'Never use exec() with user input, use safer alternatives'
  },

  // ==================== WEAK CRYPTOGRAPHY ====================
  {
    pattern: /createHash\s*\(\s*["`']md5["`']\)/gi,
    type: 'Weak Cryptography',
    severity: 'high' as const,
    cwe: 'CWE-327',
    owasp: 'A02:2021',
    description: 'MD5 is cryptographically broken and must not be used for security.',
    recommendation: 'Use SHA-256 or SHA-512: crypto.createHash("sha256")'
  },
  {
    pattern: /createHash\s*\(\s*["`']sha1["`']\)/gi,
    type: 'Weak Cryptography',
    severity: 'medium' as const,
    cwe: 'CWE-327',
    owasp: 'A02:2021',
    description: 'SHA-1 is deprecated for security purposes.',
    recommendation: 'Use SHA-256 or better: crypto.createHash("sha256")'
  },
  {
    pattern: /hashlib\.md5|hashlib\.sha1/gi,
    type: 'Weak Cryptography',
    severity: 'high' as const,
    cwe: 'CWE-327',
    owasp: 'A02:2021',
    description: 'Python: MD5/SHA1 are weak hash functions.',
    recommendation: 'Use hashlib.sha256() or for passwords use bcrypt/Argon2'
  },

  // ==================== WEAK RANDOM ====================
  {
    pattern: /Math\.random\(\)/gi,
    type: 'Weak Random Number Generator',
    severity: 'medium' as const,
    cwe: 'CWE-338',
    owasp: 'A02:2021',
    description: 'Math.random() is not cryptographically secure.',
    recommendation: 'Use crypto.randomBytes() or crypto.getRandomValues() for security'
  },
  {
    pattern: /random\.random\(\)|random\.randint/gi,
    type: 'Weak Random Number Generator',
    severity: 'medium' as const,
    cwe: 'CWE-338',
    owasp: 'A02:2021',
    description: 'Python random module is not cryptographically secure.',
    recommendation: 'Use secrets module: secrets.token_urlsafe()'
  },

  // ==================== INSECURE PROTOCOLS ====================
  {
    pattern: /https?:\/\/(?!localhost|127\.0\.0\.1)/gi,
    type: 'Insecure HTTP',
    severity: 'low' as const,
    cwe: 'CWE-319',
    owasp: 'A02:2021',
    description: 'Unencrypted HTTP connection detected.',
    recommendation: 'Use HTTPS for all network communications'
  },
  {
    pattern: /ftp:\/\//gi,
    type: 'Insecure FTP',
    severity: 'medium' as const,
    cwe: 'CWE-319',
    owasp: 'A02:2021',
    description: 'FTP transmits credentials in plaintext.',
    recommendation: 'Use SFTP or FTPS instead'
  },

  // ==================== PROTOTYPE POLLUTION ====================
  {
    pattern: /__proto__|constructor\[['"]prototype['"]\]/gi,
    type: 'Prototype Pollution',
    severity: 'high' as const,
    cwe: 'CWE-1321',
    owasp: 'A08:2021',
    description: 'Direct manipulation of __proto__ can lead to prototype pollution.',
    recommendation: 'Use Object.create(null) or Map for untrusted data'
  },

  // ==================== DESERIALIZATION ====================
  {
    pattern: /pickle\.loads?\s*\(|yaml\.load\s*\((?!.*Loader\s*=)/gi,
    type: 'Insecure Deserialization',
    severity: 'critical' as const,
    cwe: 'CWE-502',
    owasp: 'A08:2021',
    description: 'Insecure deserialization can allow remote code execution.',
    recommendation: 'Use JSON or yaml.safe_load(), never deserialize untrusted data'
  },
  {
    pattern: /unserialize\s*\(/gi,
    type: 'Insecure Deserialization',
    severity: 'critical' as const,
    cwe: 'CWE-502',
    owasp: 'A08:2021',
    description: 'PHP unserialize() with user input allows code execution.',
    recommendation: 'Use JSON instead or validate data structure before unserialize'
  },

  // ==================== CORS MISCONFIGURATION ====================
  {
    pattern: /Access-Control-Allow-Origin['":\s]*\*/gi,
    type: 'Insecure CORS Configuration',
    severity: 'high' as const,
    cwe: 'CWE-942',
    owasp: 'A05:2021',
    description: 'CORS configured to allow all origins (*) is a security risk.',
    recommendation: 'Restrict to specific trusted domains'
  },
  {
    pattern: /Access-Control-Allow-Credentials['":\s]*true/gi,
    type: 'CORS with Credentials',
    severity: 'medium' as const,
    cwe: 'CWE-942',
    owasp: 'A05:2021',
    description: 'CORS with credentials enabled requires careful origin validation.',
    recommendation: 'Ensure Access-Control-Allow-Origin is not "*" when using credentials'
  },

  // ==================== DEBUG & LOGGING ====================
  {
    pattern: /console\.(log|debug|info|warn|error)\s*\(/gi,
    type: 'Debug Statement',
    severity: 'info' as const,
    cwe: 'CWE-489',
    owasp: '',
    description: 'Console statement found. May leak sensitive information in production.',
    recommendation: 'Remove or use proper logging library with levels'
  },
  {
    pattern: /debugger\s*;/gi,
    type: 'Debug Statement',
    severity: 'medium' as const,
    cwe: 'CWE-489',
    owasp: '',
    description: 'Debugger statement will pause execution in production.',
    recommendation: 'Remove all debugger statements before deployment'
  },
  {
    pattern: /print\s*\([^)]*(?:password|secret|token|key)/gi,
    type: 'Sensitive Data in Logs',
    severity: 'high' as const,
    cwe: 'CWE-532',
    owasp: 'A09:2021',
    description: 'Logging sensitive data like passwords or keys.',
    recommendation: 'Never log sensitive information, use sanitized logs'
  },

  // ==================== ERROR HANDLING ====================
  {
    pattern: /catch\s*\([^)]*\)\s*\{\s*\}/gi,
    type: 'Empty Catch Block',
    severity: 'medium' as const,
    cwe: 'CWE-391',
    owasp: '',
    description: 'Empty catch block silently swallows errors.',
    recommendation: 'Log errors or handle them appropriately'
  },
  {
    pattern: /except\s*:\s*pass/gi,
    type: 'Empty Exception Handler',
    severity: 'medium' as const,
    cwe: 'CWE-391',
    owasp: '',
    description: 'Python: Empty except block silences all errors.',
    recommendation: 'Handle specific exceptions or at least log the error'
  },

  // ==================== AUTHENTICATION & SESSION ====================
  {
    pattern: /session\[['"](?:admin|is_admin|role)['"]\]\s*=\s*(?:true|['"]admin['"])/gi,
    type: 'Insecure Session Management',
    severity: 'high' as const,
    cwe: 'CWE-384',
    owasp: 'A07:2021',
    description: 'Directly setting admin/role in session without proper authentication.',
    recommendation: 'Implement proper authentication and authorization checks'
  },
  {
    pattern: /localStorage\.setItem\s*\([^)]*(?:token|password|secret)/gi,
    type: 'Sensitive Data in Local Storage',
    severity: 'high' as const,
    cwe: 'CWE-312',
    owasp: 'A02:2021',
    description: 'Storing sensitive data in localStorage is insecure (XSS accessible).',
    recommendation: 'Use httpOnly cookies for sensitive tokens'
  },

  // ==================== FILE UPLOAD ====================
  {
    pattern: /\.(?:save|saveTo|write)\s*\([^)]*(?:filename|name)\)/gi,
    type: 'Unrestricted File Upload',
    severity: 'high' as const,
    cwe: 'CWE-434',
    owasp: 'A04:2021',
    description: 'File upload without validation can allow malicious file execution.',
    recommendation: 'Validate file type, size, and content; use whitelist for extensions'
  },

  // ==================== REGEX DOS ====================
  {
    pattern: /new RegExp\([^)]*\+[^)]*\)/gi,
    type: 'Regular Expression DoS',
    severity: 'medium' as const,
    cwe: 'CWE-1333',
    owasp: 'A06:2021',
    description: 'User-controlled regex can cause ReDoS (catastrophic backtracking).',
    recommendation: 'Never build regex from user input, use simple string matching'
  },

  // ==================== XXE (XML External Entity) ====================
  {
    pattern: /parseXML|DOMParser|xml\.etree|lxml\.etree/gi,
    type: 'XML External Entity (XXE)',
    severity: 'high' as const,
    cwe: 'CWE-611',
    owasp: 'A05:2021',
    description: 'XML parsing without disabling external entities can lead to XXE attacks.',
    recommendation: 'Disable external entity processing in XML parser'
  },
];

// Calculate risk score based on vulnerabilities
function calculateRiskScore(vulnerabilities: Vulnerability[]): number {
  if (vulnerabilities.length === 0) return 0;
  
  const severityWeights = {
    critical: 10,
    high: 7,
    medium: 4,
    low: 2,
    info: 0.5
  };
  
  const totalWeight = vulnerabilities.reduce(
    (sum, v) => sum + severityWeights[v.severity],
    0
  );
  
  const avgWeight = totalWeight / vulnerabilities.length;
  return Math.min(100, Math.round(avgWeight * 10));
}

// Get line and column number from code and match index
function getLineAndColumn(code: string, matchIndex: number): { line: number; column: number } {
  const lines = code.substring(0, matchIndex).split('\n');
  const line = lines.length;
  const column = lines[lines.length - 1].length + 1;
  return { line, column };
}

// Extract code context around vulnerability
function extractCodeContext(code: string, lineNumber: number, contextLines: number = 2): string {
  const lines = code.split('\n');
  const start = Math.max(0, lineNumber - contextLines - 1);
  const end = Math.min(lines.length, lineNumber + contextLines);
  
  return lines.slice(start, end)
    .map((line, index) => {
      const actualLine = start + index + 1;
      const marker = actualLine === lineNumber ? '→ ' : '  ';
      return `${marker}${actualLine}: ${line}`;
    })
    .join('\n');
}

// Generate fix suggestions
function generateFix(vulnerability: Vulnerability, code: string): string {
  const fixes: Record<string, (v: Vulnerability) => string> = {
    'SQL Injection': (v) => {
      if (v.code.includes('execute') || v.code.includes('query')) {
        return '// Use parameterized queries\ndb.query("SELECT * FROM users WHERE id = ?", [userId])';
      }
      if (v.code.includes('cursor.execute')) {
        return 'cursor.execute("SELECT * FROM users WHERE id = %s", (user_id,))';
      }
      return v.code.replace(/\$\{[^}]+\}|\+\s*\w+/g, '?');
    },
    'Cross-Site Scripting (XSS)': (v) => {
      if (v.code.includes('.innerHTML')) {
        return v.code.replace('.innerHTML =', '.textContent =');
      }
      if (v.code.includes('dangerouslySetInnerHTML')) {
        return '// Sanitize HTML\nimport DOMPurify from "dompurify";\n<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(html) }} />';
      }
      return v.code;
    },
    'Code Injection': (v) => {
      if (v.code.includes('eval(')) {
        return v.code.replace(/eval\s*\(/g, 'JSON.parse(');
      }
      return '// Avoid eval(), use safer alternatives like JSON.parse()';
    },
    'Weak Cryptography': (v) => {
      return v.code
        .replace(/md5/gi, 'sha256')
        .replace(/sha1/gi, 'sha256')
        .replace(/hashlib\.md5/gi, 'hashlib.sha256');
    },
    'Hardcoded Credentials': () => {
      return '// Use environment variables\nconst apiKey = process.env.API_KEY;\nconst password = process.env.DB_PASSWORD;';
    },
    'Command Injection': () => {
      return '// Use array syntax to prevent injection\nconst { execFile } = require("child_process");\nexecFile("command", [arg1, arg2], callback);';
    },
    'Insecure HTTP': (v) => {
      return v.code.replace(/http:\/\//g, 'https://');
    },
    'Empty Catch Block': (v) => {
      return v.code.replace(
        /catch\s*\((\w+)\)\s*\{\s*\}/,
        'catch ($1) {\n  console.error("Error occurred:", $1);\n  // Handle error appropriately\n}'
      );
    },
    'Path Traversal': () => {
      return '// Sanitize file paths\nconst path = require("path");\nconst safePath = path.join(baseDir, path.basename(userInput));';
    },
    'Insecure Deserialization': () => {
      return '// Use JSON instead\nconst data = JSON.parse(jsonString);\n// Or use yaml.safe_load() for YAML';
    },
  };
  
  const fixFn = fixes[vulnerability.type];
  return fixFn ? fixFn(vulnerability) : vulnerability.code;
}

// Detect programming language
export function detectLanguage(code: string, fileName?: string): string {
  if (fileName) {
    const ext = fileName.split('.').pop()?.toLowerCase();
    const extMap: Record<string, string> = {
      js: 'JavaScript',
      jsx: 'JavaScript (React)',
      ts: 'TypeScript',
      tsx: 'TypeScript (React)',
      py: 'Python',
      java: 'Java',
      php: 'PHP',
      rb: 'Ruby',
      go: 'Go',
      rs: 'Rust',
      cs: 'C#',
      cpp: 'C++',
      c: 'C',
      swift: 'Swift',
      kt: 'Kotlin',
      scala: 'Scala',
      sql: 'SQL',
    };
    if (ext && extMap[ext]) return extMap[ext];
  }
  
  // Pattern-based detection
  if (code.includes('import React') || code.includes('from "react"') || code.includes('from \'react\'')) return 'JavaScript (React)';
  if (code.includes('interface ') && (code.includes(': string') || code.includes(': number'))) return 'TypeScript';
  if (code.includes('def ') || code.includes('import ') && code.includes(':') && code.includes('from ')) return 'Python';
  if (code.includes('public class') || code.includes('System.out') || code.includes('public static void')) return 'Java';
  if (code.includes('<?php')) return 'PHP';
  if (code.includes('package main') || code.includes('func main()')) return 'Go';
  if (code.includes('fn main()') || code.includes('let mut')) return 'Rust';
  if (code.includes('using System;') || code.includes('namespace ')) return 'C#';
  
  return 'JavaScript';
}

// Main static analysis function with improved detection
export function analyzeCode(code: string, fileName?: string): Vulnerability[] {
  const vulnerabilities: Vulnerability[] = [];
  const language = detectLanguage(code, fileName);
  const lines = code.split('\n');
  const actualFileName = fileName || 'Untitled';
  
  // Track unique vulnerabilities to avoid duplicates
  const seen = new Set<string>();
  
  VULNERABILITY_PATTERNS.forEach((patternDef) => {
    const regex = new RegExp(patternDef.pattern.source, patternDef.pattern.flags);
    let match;
    
    while ((match = regex.exec(code)) !== null) {
      const { line, column } = getLineAndColumn(code, match.index);
      const codeLine = lines[line - 1]?.trim() || '';
      
      // Create unique key to avoid duplicate detections
      const uniqueKey = `${patternDef.type}-${line}-${column}`;
      if (seen.has(uniqueKey)) continue;
      seen.add(uniqueKey);
      
      const vulnerability: Vulnerability = {
        id: crypto.randomUUID(),
        type: patternDef.type,
        severity: patternDef.severity,
        line,
        column,
        message: `${patternDef.type} detected`,
        description: patternDef.description,
        cwe: patternDef.cwe,
        owasp: patternDef.owasp,
        code: codeLine,
        recommendation: patternDef.recommendation,
        riskScore: 0,
        fix: '',
        context: extractCodeContext(code, line),
        fileName: actualFileName,
      };
      
      vulnerability.fix = generateFix(vulnerability, code);
      vulnerability.riskScore = calculateRiskScore([vulnerability]);
      
      vulnerabilities.push(vulnerability);
    }
  });
  
  // Sort by severity (critical first) then by line number
  const severityOrder = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
  vulnerabilities.sort((a, b) => {
    if (severityOrder[a.severity] !== severityOrder[b.severity]) {
      return severityOrder[a.severity] - severityOrder[b.severity];
    }
    return a.line - b.line;
  });
  
  return vulnerabilities;
}

// Get vulnerability statistics
export function getVulnerabilityStats(vulnerabilities: Vulnerability[]): {
  total: number;
  bySeverity: Record<string, number>;
  byType: Record<string, number>;
  criticalLines: number[];
} {
  const stats = {
    total: vulnerabilities.length,
    bySeverity: {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      info: 0,
    },
    byType: {} as Record<string, number>,
    criticalLines: [] as number[],
  };
  
  vulnerabilities.forEach(v => {
    stats.bySeverity[v.severity]++;
    stats.byType[v.type] = (stats.byType[v.type] || 0) + 1;
    if (v.severity === 'critical' || v.severity === 'high') {
      stats.criticalLines.push(v.line);
    }
  });
  
  return stats;
}

export { calculateRiskScore, extractCodeContext };