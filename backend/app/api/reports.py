import json
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.security_engine.report_generator import generate_security_report

router = APIRouter(prefix="/reports", tags=["Security Reports"])

@router.get("/latest")
def get_latest_report(db: Session = Depends(get_db)):
    report = generate_security_report(db)
    return report

@router.get("/download/json")
def download_json_report(scan_id: Optional[str] = None, db: Session = Depends(get_db)):
    report = generate_security_report(db, scan_id=scan_id)
    report_json = json.dumps(report, indent=2)
    filename = f"verifiedfix_security_report_{report.get('report_id', 'latest')}.json"
    
    return Response(
        content=report_json,
        media_type="application/json",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@router.get("/{scan_id}")
def get_report_by_scan_id(scan_id: str, db: Session = Depends(get_db)):
    report = generate_security_report(db, scan_id=scan_id)
    return report
