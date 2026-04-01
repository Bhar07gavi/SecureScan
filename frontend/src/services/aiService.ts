import { Vulnerability } from '../types';
import { api } from './api';

// AI Service with backend integration
class AIService {
  private useBackendAI: boolean = true;
  
  // AI Explanation Templates (fallback when backend unavailable)
  private readonly AI_EXPLANATIONS: Record<string, (vuln: Vulnerability) => string> = {
    'SQL Injection': (vuln) => `
**What is this vulnerability?**
SQL Injection occurs when user input is directly incorporated into SQL queries without proper sanitization or parameterization.

**Why is it dangerous?**
An attacker could manipulate the SQL query to:
- Extract sensitive data from the database
- Modify or delete data
- Execute administrative operations on the database
- In some cases, execute commands on the operating system

**How does it apply to your code?**
Your code at line ${vuln.line} appears to concatenate user input directly into a SQL query. This allows an attacker to inject malicious SQL code that will be executed by the database.

**Real-world Impact:**
- Data breaches exposing millions of user records
- Financial loss from unauthorized transactions
- Complete database compromise

**Recommended Fix:**
Use parameterized queries or prepared statements instead of string concatenation. Most database libraries support this pattern where user input is passed separately from the query structure.

**Example:**
\`\`\`python
# ❌ Vulnerable
query = "SELECT * FROM users WHERE id = '" + user_id + "'"

# ✅ Secure
cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
\`\`\`
    `,
    
    'Cross-Site Scripting (XSS)': (vuln) => `
**What is this vulnerability?**
Cross-Site Scripting (XSS) allows attackers to inject malicious scripts into web pages viewed by other users.

**Why is it dangerous?**
- Steal user cookies and session tokens
- Perform actions on behalf of the user
- Deface websites
- Redirect users to malicious sites
- Capture keystrokes and sensitive information

**How does it apply to your code?**
At line ${vuln.line}, you're directly inserting content into the DOM using a method that doesn't sanitize the input. Any user-controlled data in this content could contain malicious scripts.

**Real-world Impact:**
- Account takeover and credential theft
- Spreading malware to site visitors
- Defacement and reputation damage

**Recommended Fix:**
Use textContent instead of innerHTML, or use React's built-in escaping by default. If you must render HTML, use a sanitization library like DOMPurify.

**Example:**
\`\`\`javascript
// ❌ Vulnerable
element.innerHTML = userInput;

// ✅ Secure
element.textContent = userInput;
// or in React
<div>{userInput}</div>
\`\`\`
    `,
    
    'Command Injection': (vuln) => `
**What is this vulnerability?**
Command Injection occurs when an application passes unsafe user data to system commands.

**Why is it dangerous?**
- Execute arbitrary commands on the server
- Access sensitive files and data
- Take complete control of the server
- Use the compromised server to attack other systems
- Install backdoors and malware

**How does it apply to your code?**
At line ${vuln.line}, you're using a function that executes system commands. If user input reaches this function without proper validation, an attacker could execute arbitrary commands.

**Real-world Impact:**
- Complete server compromise
- Data theft and destruction
- Ransomware attacks
- Use of your server for criminal activities

**Recommended Fix:**
Avoid executing system commands with user input. If necessary, use a whitelist of allowed characters and validate all input. Consider using safer alternatives that don't invoke a shell.

**Example:**
\`\`\`python
# ❌ Vulnerable
os.system('ping ' + user_host)

# ✅ Secure
subprocess.run(['ping', '-c', '1', validated_host], capture_output=True)
\`\`\`
    `,
    
    'Hardcoded Credentials': (vuln) => `
**What is this vulnerability?**
Hardcoded credentials are secret values (passwords, API keys, tokens) directly embedded in the source code.

**Why is it dangerous?**
- Anyone with access to the code can see the credentials
- Credentials can't be changed without modifying code
- Version control history permanently stores these secrets
- Different environments can't use different credentials
- Exposed in compiled binaries and public repositories

**How does it apply to your code?**
At line ${vuln.line}, a secret value appears to be directly embedded in your code. This value will be visible to anyone who can access the source code.

**Real-world Impact:**
- Unauthorized access to systems and data
- API abuse and resource theft
- Data breaches and privacy violations
- Financial losses from compromised accounts

**Recommended Fix:**
Move secrets to environment variables or a secure secrets management service. Access them through process.env or your framework's configuration system.

**Example:**
\`\`\`javascript
// ❌ Vulnerable
const apiKey = 'sk-1234567890abcdef';

// ✅ Secure
const apiKey = process.env.API_KEY;
// Set in .env file: API_KEY=sk-1234567890abcdef
\`\`\`
    `,
    
    'Code Injection': (vuln) => `
**What is this vulnerability?**
Code Injection occurs when dangerous functions like eval() execute arbitrary code strings, making them a serious security risk.

**Why is it dangerous?**
- Execute arbitrary code in your application context
- Bypass security controls and authentication
- Lead to complete application compromise
- Make code harder to debug and maintain
- Allow attackers to inject malicious logic

**How does it apply to your code?**
At line ${vuln.line}, you're using a function that dynamically executes code. If any user-controlled input reaches this function, it could be used to execute malicious code.

**Real-world Impact:**
- Remote code execution (RCE)
- Data theft and manipulation
- Server compromise
- Malware injection

**Recommended Fix:**
Replace eval() with safer alternatives. For parsing JSON, use JSON.parse(). For dynamic property access, use object bracket notation with validated keys.

**Example:**
\`\`\`javascript
// ❌ Vulnerable
eval(userCode);

// ✅ Secure
const data = JSON.parse(jsonString); // For JSON
const value = obj[validatedKey]; // For dynamic access
\`\`\`
    `,

    'Path Traversal': (vuln) => `
**What is this vulnerability?**
Path Traversal allows attackers to access files and directories outside the intended directory by manipulating file paths.

**Why is it dangerous?**
- Read sensitive files (passwords, configuration files)
- Access source code and intellectual property
- Execute arbitrary files if combined with upload
- Overwrite critical system files

**How does it apply to your code?**
At line ${vuln.line}, file paths are constructed using user input without proper validation, allowing "../" sequences to escape the intended directory.

**Recommended Fix:**
Validate and sanitize all file paths. Use path.resolve() and check that the final path is within allowed directories.

**Example:**
\`\`\`javascript
// ❌ Vulnerable
const filePath = '/uploads/' + userFileName;

// ✅ Secure
const filePath = path.join('/uploads', path.basename(userFileName));
\`\`\`
    `,

    'Weak Cryptography': (vuln) => `
**What is this vulnerability?**
Using weak or outdated cryptographic algorithms (MD5, SHA1) that can be easily broken by modern attacks.

**Why is it dangerous?**
- Passwords can be cracked
- Data integrity cannot be verified
- Signatures can be forged
- Encrypted data can be decrypted

**How does it apply to your code?**
At line ${vuln.line}, you're using a cryptographic algorithm that is no longer considered secure.

**Recommended Fix:**
Use modern algorithms like SHA-256, SHA-512, or bcrypt for password hashing.

**Example:**
\`\`\`javascript
// ❌ Vulnerable
const hash = crypto.createHash('md5').update(password).digest('hex');

// ✅ Secure
const hash = crypto.createHash('sha256').update(password).digest('hex');
// or for passwords, use bcrypt
\`\`\`
    `,

    'Insecure Deserialization': (vuln) => `
**What is this vulnerability?**
Insecure deserialization can allow attackers to execute arbitrary code by crafting malicious serialized objects.

**Why is it dangerous?**
- Remote code execution
- Denial of service attacks
- Authentication bypass
- Data tampering

**How does it apply to your code?**
At line ${vuln.line}, you're deserializing data without proper validation.

**Recommended Fix:**
Use safe data formats like JSON. Validate all data before deserialization. Avoid pickle/serialize with untrusted data.

**Example:**
\`\`\`python
# ❌ Vulnerable
data = pickle.loads(user_input)

# ✅ Secure
data = json.loads(user_input)  # JSON is safer
# or validate before deserializing
\`\`\`
    `,
  };

  // Generate AI explanation
  async generateAIExplanation(vulnerability: Vulnerability): Promise<string> {
    try {
      // Try to get AI-enhanced explanation from backend
      if (this.useBackendAI) {
        const response = await api.post('/api/ai/explain', {
          vulnerability: {
            type: vulnerability.type,
            code: vulnerability.code,
            line: vulnerability.line,
            severity: vulnerability.severity,
          }
        });
        
        if (response.data?.explanation) {
          return response.data.explanation;
        }
      }
    } catch (error) {
      console.warn('Backend AI unavailable, using template explanations');
    }

    // Fallback to template-based explanations
    const explanationFn = this.AI_EXPLANATIONS[vulnerability.type];
    
    if (explanationFn) {
      return explanationFn(vulnerability);
    }
    
    // Generic explanation
    return this.generateGenericExplanation(vulnerability);
  }

  // Generate generic explanation for unknown types
  private generateGenericExplanation(vulnerability: Vulnerability): string {
    return `
**What is this vulnerability?**
${vulnerability.message || vulnerability.type}

**Risk Level:** ${vulnerability.severity.toUpperCase()}

**Location:** Line ${vulnerability.line}, Column ${vulnerability.column || 0}

**CWE Classification:** ${vulnerability.cwe || 'Not classified'}

**Description:**
This security issue was detected by our AI-powered analysis engine. The code pattern at the specified location may introduce security risks to your application.

**Impact:**
Depending on the context and how this code is used, this vulnerability could lead to:
- Unauthorized access to sensitive data
- Application compromise
- Data integrity issues
- Compliance violations

**Recommended Action:**
1. Review the flagged code carefully
2. Consult OWASP guidelines for this vulnerability type
3. Apply security best practices
4. Test the fix thoroughly
5. Consider a security audit for critical systems

**Additional Resources:**
- OWASP Top 10: https://owasp.org/www-project-top-ten/
- CWE Details: https://cwe.mitre.org/data/definitions/${vulnerability.cwe?.replace('CWE-', '')}.html
    `;
  }

  // Generate fix suggestions
  async generateAIFix(vulnerability: Vulnerability): Promise<{ 
    original: string; 
    fixed: string; 
    explanation: string;
    steps: string[];
  }> {
    try {
      // Try to get AI-generated fix from backend
      if (this.useBackendAI) {
        const response = await api.post('/api/ai/suggest-fix', {
          vulnerability: {
            type: vulnerability.type,
            code: vulnerability.code,
            line: vulnerability.line,
            language: 'auto', // Backend should detect
          }
        });
        
        if (response.data?.fix) {
          return {
            original: vulnerability.code,
            fixed: response.data.fix.code,
            explanation: response.data.fix.explanation,
            steps: response.data.fix.steps || [],
          };
        }
      }
    } catch (error) {
      console.warn('Backend AI fix unavailable, using template fixes');
    }

    // Fallback to template-based fixes
    return this.getTemplateFix(vulnerability);
  }

  // Template-based fix generation
  private getTemplateFix(vulnerability: Vulnerability): { 
    original: string; 
    fixed: string; 
    explanation: string;
    steps: string[];
  } {
    const fixTemplates: Record<string, { 
      fixed: string; 
      explanation: string;
      steps: string[];
    }> = {
      'SQL Injection': {
        fixed: `// Use parameterized queries\nconst query = "SELECT * FROM users WHERE id = ?";\ndb.query(query, [userId]);`,
        explanation: 'Replaced string concatenation with parameterized query. The database driver will properly escape the parameter, preventing SQL injection attacks.',
        steps: [
          'Replace string concatenation with parameterized query syntax',
          'Pass user input as separate parameters array',
          'Verify all queries in the codebase use this pattern',
          'Test with malicious input to confirm fix',
        ]
      },
      'Cross-Site Scripting (XSS)': {
        fixed: vulnerability.code.includes('.innerHTML')
          ? vulnerability.code.replace('.innerHTML =', '.textContent =')
          : '// Use React\'s built-in escaping\n<div>{userContent}</div>',
        explanation: 'Used textContent instead of innerHTML to prevent script execution. User content will be treated as plain text and safely displayed without interpretation.',
        steps: [
          'Replace innerHTML with textContent for plain text',
          'Use DOMPurify if HTML rendering is required',
          'Implement Content Security Policy (CSP) headers',
          'Audit all user input rendering points',
        ]
      },
      'Command Injection': {
        fixed: `// Use execFile with arguments array\nconst { execFile } = require('child_process');\nexecFile('command', [validatedArg], (error, stdout) => {\n  if (error) console.error(error);\n  console.log(stdout);\n});`,
        explanation: 'Used execFile with arguments array instead of string concatenation. This prevents shell interpretation of special characters and command injection.',
        steps: [
          'Replace exec/system with execFile',
          'Pass arguments as array, not concatenated string',
          'Validate all inputs against whitelist',
          'Consider if system command is necessary',
        ]
      },
      'Hardcoded Credentials': {
        fixed: `// Use environment variables\nconst apiKey = process.env.API_KEY;\nconst password = process.env.DB_PASSWORD;\n\nif (!apiKey || !password) {\n  throw new Error('Missing required credentials');\n}`,
        explanation: 'Moved credentials to environment variables. Set these in your .env file or deployment configuration. Never commit .env to version control.',
        steps: [
          'Remove hardcoded credentials from code',
          'Create .env file with secrets',
          'Add .env to .gitignore',
          'Use environment variables in code',
          'Rotate exposed credentials immediately',
        ]
      },
      'Code Injection': {
        fixed: `// Safe alternatives to eval\nconst data = JSON.parse(jsonString); // For JSON parsing\nconst value = obj[validatedKey]; // For dynamic property access\nconst fn = new Function('return ' + validatedCode)(); // Last resort, with validation`,
        explanation: 'Replaced eval() with safer alternatives. JSON.parse() safely parses JSON, bracket notation allows validated dynamic access, and Function constructor is slightly safer than eval.',
        steps: [
          'Identify why eval() is used',
          'Replace with JSON.parse for data',
          'Use bracket notation for property access',
          'If absolutely necessary, validate input strictly',
        ]
      },
      'Weak Cryptography': {
        fixed: `const crypto = require('crypto');\nconst hash = crypto.createHash('sha256').update(data).digest('hex');\n\n// For passwords, use bcrypt:\n// const bcrypt = require('bcrypt');\n// const hash = await bcrypt.hash(password, 10);`,
        explanation: 'Replaced weak hash algorithm (MD5/SHA1) with SHA-256 for general hashing, or bcrypt for password hashing. These are currently considered secure.',
        steps: [
          'Identify hash algorithm usage (MD5, SHA1)',
          'Replace with SHA-256 or SHA-512',
          'For passwords, use bcrypt or Argon2',
          'Re-hash existing data with new algorithm',
        ]
      },
      'Path Traversal': {
        fixed: `const path = require('path');\nconst basePath = '/safe/directory';\nconst safePath = path.join(basePath, path.basename(userInput));\n\n// Verify path is within allowed directory\nif (!safePath.startsWith(path.resolve(basePath))) {\n  throw new Error('Invalid path');\n}`,
        explanation: 'Used path.basename to remove directory components and path.join for safe concatenation. Added verification that final path is within allowed directory.',
        steps: [
          'Use path.basename to strip directory traversal',
          'Use path.join for safe path concatenation',
          'Verify final path is within allowed directory',
          'Implement whitelist of allowed files if possible',
        ]
      },
      'Insecure Deserialization': {
        fixed: `// Use JSON instead of pickle/serialize\nconst data = JSON.parse(userInput);\n\n// Or validate before deserializing:\nif (isValidData(serializedData)) {\n  const data = deserialize(serializedData);\n}`,
        explanation: 'Replaced insecure deserialization with JSON.parse, which is safe. If you must use pickle/serialize, validate data structure before deserializing.',
        steps: [
          'Replace pickle/serialize with JSON when possible',
          'Implement strict input validation',
          'Use signed/encrypted serialization',
          'Never deserialize untrusted data',
        ]
      },
    };
    
    const fix = fixTemplates[vulnerability.type];
    
    if (fix) {
      return {
        original: vulnerability.code,
        ...fix
      };
    }
    
    // Generic fix
    return {
      original: vulnerability.code,
      fixed: vulnerability.fix || '// Review and apply security best practices\n// Consult OWASP guidelines for specific recommendations',
      explanation: 'Apply security best practices specific to this vulnerability type. Validate all user input, use security-focused libraries, and follow defense-in-depth principles.',
      steps: [
        'Research this vulnerability type thoroughly',
        'Review OWASP and CWE documentation',
        'Implement recommended security controls',
        'Test the fix with security tools',
        'Consider a professional security audit',
      ]
    };
  }

  // Calculate confidence score for fix
  calculateFixConfidence(vulnerability: Vulnerability): number {
    const highConfidenceTypes = [
      'SQL Injection',
      'Cross-Site Scripting (XSS)',
      'Hardcoded Credentials',
      'Weak Cryptography',
      'Insecure HTTP',
      'Path Traversal',
    ];
    
    const mediumConfidenceTypes = [
      'Command Injection',
      'Code Injection',
      'Insecure Deserialization',
      'Weak Random',
    ];
    
    if (highConfidenceTypes.includes(vulnerability.type)) {
      return 0.90;
    }
    
    if (mediumConfidenceTypes.includes(vulnerability.type)) {
      return 0.75;
    }
    
    return 0.60;
  }

  // Get remediation resources
  getRemediationResources(vulnerability: Vulnerability): {
    title: string;
    url: string;
  }[] {
    const cweId = vulnerability.cwe?.replace('CWE-', '');
    
    return [
      {
        title: 'OWASP Top 10',
        url: 'https://owasp.org/www-project-top-ten/'
      },
      {
        title: `CWE-${cweId} Details`,
        url: `https://cwe.mitre.org/data/definitions/${cweId}.html`
      },
      {
        title: 'OWASP Cheat Sheet Series',
        url: 'https://cheatsheetseries.owasp.org/'
      },
      {
        title: 'Security Best Practices',
        url: 'https://owasp.org/www-project-secure-coding-practices-quick-reference-guide/'
      }
    ];
  }
}

// Export singleton instance
const aiService = new AIService();

export const generateAIExplanation = (vuln: Vulnerability) => 
  aiService.generateAIExplanation(vuln);

export const generateAIFix = (vuln: Vulnerability) => 
  aiService.generateAIFix(vuln);

export const calculateFixConfidence = (vuln: Vulnerability) => 
  aiService.calculateFixConfidence(vuln);

export const getRemediationResources = (vuln: Vulnerability) => 
  aiService.getRemediationResources(vuln);

export { aiService };