import re
from typing import Dict, Any

def redact_sensitive_content(text: str) -> str:
    """Safely redacts sensitive credentials, tokens, and private data for audit presentation."""
    if not text:
        return ""
    # Redact Authorization tokens
    text = re.sub(r'Bearer\s+[A-Za-z0-9\-._~+/]+=*', 'Bearer [REDACTED_TOKEN]', text)
    # Redact passwords
    text = re.sub(r'("password":\s*")[^"]+(")', r'\1[REDACTED_PASSWORD]\2', text)
    # Redact confidential document excerpts if marked confidential
    text = re.sub(r'(MERGER_VALUATION|ACQUISITION_TARGET_PRICE|PROPRIETARY_KEY)=\S+', r'\1=[REDACTED_FINANCIAL_DATA]', text)
    return text

def format_http_evidence(
    method: str,
    url: str,
    headers: Dict[str, str],
    status_code: int,
    body: str,
    user_context: str
) -> Dict[str, Any]:
    """Generates a structured, safe evidence packet."""
    redacted_headers = {
        k: ("[REDACTED]" if k.lower() in ["authorization", "cookie"] else v)
        for k, v in headers.items()
    }
    redacted_body = redact_sensitive_content(body)
    
    return {
        "method": method,
        "url": url,
        "headers": redacted_headers,
        "status_code": status_code,
        "body_preview": redacted_body[:500] if len(redacted_body) > 500 else redacted_body,
        "authenticated_as": user_context
    }
