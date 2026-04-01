from fastapi import APIRouter, HTTPException, Request
from app.schemas.vulnerability import ProjectScanRequest, ProjectScanResponse, FileScanResult, Vulnerability
from app.services.model_service import model_service
from app.api.endpoints.scanner import STATIC_RULES, detect_language
from app.models.scan import ScanHistory, VulnerabilityData
import re
from datetime import datetime
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/scan-project", response_model=ProjectScanResponse)
async def scan_project(data: ProjectScanRequest, request: Request):
    """Scan multiple files - supports 10+ programming languages"""
    try:
        results = []
        total_vulnerabilities = 0
        total_risk = 0.0

        for file in data.files:
            vulnerabilities = []
            detected_lang = detect_language(file.code, file.language)

            for rule in STATIC_RULES:
                matches = list(re.finditer(rule["pattern"], file.code, re.IGNORECASE | re.MULTILINE))
                for match in matches:
                    line_number = file.code.count('\n', 0, match.start()) + 1
                    line_start = file.code.rfind('\n', 0, match.start())
                    column_number = match.start() - line_start

                    vulnerabilities.append(Vulnerability(
                        id=f"{file.name}_vuln_{len(vulnerabilities)}",
                        type=rule["type"],
                        severity=rule["severity"],
                        line=line_number,
                        description=rule["description"],
                        location=f"Line {line_number}, Column {column_number}"
                    ))

            risk_score = await model_service.predict_risk(file.code)
            total_risk += risk_score
            total_vulnerabilities += len(vulnerabilities)

            results.append(FileScanResult(
                fileName=file.name,
                language=detected_lang,
                vulnerabilities=vulnerabilities,
                risk_score=risk_score,
                total_vulnerabilities=len(vulnerabilities)
            ))

        overall_risk = total_risk / len(data.files) if data.files else 0.0

        if overall_risk >= 0.8: risk_level = "Critical"
        elif overall_risk >= 0.6: risk_level = "High"
        elif overall_risk >= 0.4: risk_level = "Medium"
        elif overall_risk >= 0.2: risk_level = "Low"
        else: risk_level = "Safe"

        # Save to MongoDB
        try:
            all_vulns = []
            for r in results:
                for v in r.vulnerabilities:
                    all_vulns.append(VulnerabilityData(
                        id=v.id, type=v.type, severity=v.severity,
                        line=v.line, description=v.description, location=v.location
                    ))

            scan_record = ScanHistory(
                code=f"Project scan: {len(data.files)} files",
                language="multi",
                vulnerabilities=all_vulns[:50],
                risk_score=overall_risk,
                risk_level=risk_level,
                total_vulnerabilities=total_vulnerabilities,
                critical_count=sum(1 for v in all_vulns if v.severity == "Critical"),
                high_count=sum(1 for v in all_vulns if v.severity == "High"),
                medium_count=sum(1 for v in all_vulns if v.severity == "Medium"),
                low_count=sum(1 for v in all_vulns if v.severity == "Low"),
                ip_address=request.client.host if request.client else None,
                scan_date=datetime.utcnow()
            )
            await scan_record.insert()
            logger.info(f"✅ Project scan saved ({len(data.files)} files)")
        except Exception as db_error:
            logger.error(f"❌ DB error: {db_error}")

        return ProjectScanResponse(
            results=results,
            total_files=len(data.files),
            total_vulnerabilities=total_vulnerabilities,
            overall_risk_score=overall_risk
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/supported-languages")
async def get_supported_languages():
    return {
        "languages": [
            {"name": "Python", "extensions": [".py"]},
            {"name": "JavaScript", "extensions": [".js", ".jsx"]},
            {"name": "TypeScript", "extensions": [".ts", ".tsx"]},
            {"name": "Java", "extensions": [".java"]},
            {"name": "PHP", "extensions": [".php"]},
            {"name": "Go", "extensions": [".go"]},
            {"name": "Rust", "extensions": [".rs"]},
            {"name": "C/C++", "extensions": [".c", ".cpp"]},
            {"name": "Ruby", "extensions": [".rb"]},
            {"name": "SQL", "extensions": [".sql"]},
        ],
        "total": 10
    }