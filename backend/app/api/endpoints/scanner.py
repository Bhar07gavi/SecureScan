from fastapi import APIRouter, HTTPException, Request
from app.schemas.vulnerability import CodeInput, ScanResponse, Vulnerability
from app.services.model_service import model_service
from app.models.scan import ScanHistory, VulnerabilityData
import re
from typing import List
from datetime import datetime
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

# Multi-language static analysis rules
STATIC_RULES = [
    # SQL Injection (Python, JS, Java, PHP)
    {"type": "SQL Injection", "pattern": r"execute\s*\(\s*['\"].*\+", "severity": "Critical", "description": "SQL injection via string concatenation"},
    {"type": "SQL Injection", "pattern": r"execute\s*\(\s*f['\"]", "severity": "Critical", "description": "SQL injection via f-string"},
    {"type": "SQL Injection", "pattern": r"cursor\.execute\s*\(\s*['\"].*\+", "severity": "Critical", "description": "SQL injection in cursor.execute()"},
    {"type": "SQL Injection", "pattern": r"query\s*=\s*['\"]SELECT.*\+", "severity": "Critical", "description": "SQL query with concatenation"},

    # XSS (JS, React, PHP)
    {"type": "XSS", "pattern": r"innerHTML\s*=", "severity": "High", "description": "XSS via innerHTML"},
    {"type": "XSS", "pattern": r"document\.write\s*\(", "severity": "High", "description": "XSS via document.write"},
    {"type": "XSS", "pattern": r"dangerouslySetInnerHTML", "severity": "High", "description": "XSS via dangerouslySetInnerHTML"},

    # Command Injection (Python, JS, Java, PHP)
    {"type": "Command Injection", "pattern": r"os\.system\s*\(", "severity": "Critical", "description": "Command injection via os.system()"},
    {"type": "Command Injection", "pattern": r"subprocess.*shell\s*=\s*True", "severity": "Critical", "description": "Command injection with shell=True"},
    {"type": "Command Injection", "pattern": r"Runtime\.getRuntime\(\)\.exec", "severity": "Critical", "description": "Java command injection"},
    {"type": "Command Injection", "pattern": r"shell_exec\s*\(", "severity": "Critical", "description": "PHP command injection"},
    {"type": "Command Injection", "pattern": r"exec\s*\(\s*['\"].*\+", "severity": "Critical", "description": "exec with concatenation"},

    # Code Injection (Python, JS, PHP)
    {"type": "Code Injection", "pattern": r"\beval\s*\(", "severity": "Critical", "description": "Code injection via eval()"},
    {"type": "Code Injection", "pattern": r"\bexec\s*\(", "severity": "Critical", "description": "Code injection via exec()"},
    {"type": "Code Injection", "pattern": r"new\s+Function\s*\(", "severity": "High", "description": "Dynamic function creation"},

    # Hardcoded Credentials (All languages)
    {"type": "Hardcoded Credential", "pattern": r"password\s*=\s*['\"][^'\"]{3,}['\"]", "severity": "Critical", "description": "Hardcoded password"},
    {"type": "Hardcoded Credential", "pattern": r"api[_-]?key\s*=\s*['\"][^'\"]{10,}['\"]", "severity": "Critical", "description": "Hardcoded API key"},
    {"type": "Hardcoded Credential", "pattern": r"secret[_-]?key\s*=\s*['\"][^'\"]{10,}['\"]", "severity": "Critical", "description": "Hardcoded secret key"},
    {"type": "Hardcoded Credential", "pattern": r"(?:AKIA|ASIA)[A-Z0-9]{16}", "severity": "Critical", "description": "AWS access key"},
    {"type": "Hardcoded Credential", "pattern": r"token\s*=\s*['\"][^'\"]{20,}['\"]", "severity": "High", "description": "Hardcoded token"},

    # Path Traversal
    {"type": "Path Traversal", "pattern": r"open\s*\([^)]*\+", "severity": "High", "description": "Path traversal via file open"},
    {"type": "Path Traversal", "pattern": r"readFile\s*\([^)]*\+", "severity": "High", "description": "Path traversal via readFile"},

    # Insecure Deserialization (Python, PHP, Java)
    {"type": "Insecure Deserialization", "pattern": r"pickle\.loads?\s*\(", "severity": "Critical", "description": "Insecure pickle deserialization"},
    {"type": "Insecure Deserialization", "pattern": r"yaml\.load\s*\(", "severity": "High", "description": "Insecure YAML loading"},
    {"type": "Insecure Deserialization", "pattern": r"unserialize\s*\(", "severity": "Critical", "description": "PHP insecure deserialization"},

    # Weak Cryptography
    {"type": "Weak Cryptography", "pattern": r"\bmd5\s*\(", "severity": "High", "description": "MD5 is broken"},
    {"type": "Weak Cryptography", "pattern": r"hashlib\.md5", "severity": "High", "description": "Python MD5"},
    {"type": "Weak Cryptography", "pattern": r"\bsha1\s*\(", "severity": "Medium", "description": "SHA1 deprecated"},
    {"type": "Weak Cryptography", "pattern": r"createHash\s*\(\s*['\"]md5", "severity": "High", "description": "Node.js MD5"},

    # Weak Random
    {"type": "Weak Random", "pattern": r"random\.(randint|random|choice)\s*\(", "severity": "Medium", "description": "Weak random for security"},
    {"type": "Weak Random", "pattern": r"Math\.random\s*\(", "severity": "Medium", "description": "Math.random() not secure"},

    # SSRF
    {"type": "SSRF", "pattern": r"requests\.(get|post)\s*\([^)]*\+", "severity": "High", "description": "SSRF via user URL"},

    # Debug/Logging
    {"type": "Debug Statement", "pattern": r"console\.log\s*\([^)]*password", "severity": "Medium", "description": "Logging sensitive data"},
    {"type": "Debug Statement", "pattern": r"print\s*\([^)]*password", "severity": "Medium", "description": "Printing sensitive data"},

    # CORS
    {"type": "CORS Misconfiguration", "pattern": r"Access-Control-Allow-Origin.*\*", "severity": "High", "description": "CORS allows all origins"},

    # Prototype Pollution (JS)
    {"type": "Prototype Pollution", "pattern": r"__proto__", "severity": "High", "description": "Prototype pollution risk"},
]


def detect_language(code: str, language: str = "auto") -> str:
    """Detect programming language from code content"""
    if language and language != "auto":
        return language
    if 'import React' in code or 'from "react"' in code:
        return 'javascript'
    if 'def ' in code and ':' in code:
        return 'python'
    if 'public class' in code or 'System.out' in code:
        return 'java'
    if '<?php' in code:
        return 'php'
    if 'package main' in code:
        return 'go'
    if 'fn main()' in code:
        return 'rust'
    return 'javascript'


@router.post("/scan", response_model=ScanResponse)
async def scan_code(data: CodeInput, request: Request):
    """Scan code - supports multiple languages"""
    try:
        vulnerabilities: List[Vulnerability] = []
        detected_lang = detect_language(data.code, data.language)

        # Static Analysis
        for rule in STATIC_RULES:
            matches = list(re.finditer(rule["pattern"], data.code, re.IGNORECASE | re.MULTILINE))
            for match in matches:
                line_number = data.code.count('\n', 0, match.start()) + 1
                line_start = data.code.rfind('\n', 0, match.start())
                column_number = match.start() - line_start

                vulnerabilities.append(Vulnerability(
                    id=f"vuln_{len(vulnerabilities)}",
                    type=rule["type"],
                    severity=rule["severity"],
                    line=line_number,
                    description=rule["description"],
                    location=f"Line {line_number}, Column {column_number}"
                ))

        # AI Prediction
        risk_score = await model_service.predict_risk(data.code)

        # Risk Level
        if risk_score >= 0.8: risk_level = "Critical"
        elif risk_score >= 0.6: risk_level = "High"
        elif risk_score >= 0.4: risk_level = "Medium"
        elif risk_score >= 0.2: risk_level = "Low"
        else: risk_level = "Safe"

        # Save to MongoDB
        try:
            vuln_data = [
                VulnerabilityData(
                    id=v.id, type=v.type, severity=v.severity,
                    line=v.line, description=v.description, location=v.location
                ) for v in vulnerabilities
            ]

            scan_record = ScanHistory(
                code=data.code[:2000],
                language=detected_lang,
                vulnerabilities=vuln_data,
                risk_score=risk_score,
                risk_level=risk_level,
                total_vulnerabilities=len(vulnerabilities),
                critical_count=sum(1 for v in vulnerabilities if v.severity == "Critical"),
                high_count=sum(1 for v in vulnerabilities if v.severity == "High"),
                medium_count=sum(1 for v in vulnerabilities if v.severity == "Medium"),
                low_count=sum(1 for v in vulnerabilities if v.severity == "Low"),
                ip_address=request.client.host if request.client else None,
                scan_date=datetime.utcnow()
            )
            await scan_record.insert()
            logger.info(f"✅ Scan saved (ID: {scan_record.id})")
        except Exception as db_error:
            logger.error(f"❌ DB error: {db_error}")

        return ScanResponse(vulnerabilities=vulnerabilities, risk_score=risk_score)

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/history")
async def get_scan_history(limit: int = 10, skip: int = 0):
    try:
        scans = await ScanHistory.find_all().sort("-scan_date").skip(skip).limit(limit).to_list()
        total = await ScanHistory.count()
        return {
            "total": total,
            "scans": [
                {
                    "id": str(s.id), "language": s.language,
                    "risk_score": s.risk_score, "risk_level": s.risk_level,
                    "total_vulnerabilities": s.total_vulnerabilities,
                    "critical_count": s.critical_count, "high_count": s.high_count,
                    "medium_count": s.medium_count, "low_count": s.low_count,
                    "scan_date": s.scan_date.isoformat()
                } for s in scans
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/health")
async def scanner_health():
    return {
        "status": "healthy",
        "model_loaded": model_service.is_loaded,
        "total_rules": len(STATIC_RULES),
        "supported_languages": [
            "Python", "JavaScript", "TypeScript", "Java",
            "PHP", "Go", "Rust", "C/C++", "Ruby", "SQL"
        ]
    }


@router.get("/rules")
async def get_rules():
    return {
        "total_rules": len(STATIC_RULES),
        "rules": [{"type": r["type"], "severity": r["severity"], "description": r["description"]} for r in STATIC_RULES]
    }