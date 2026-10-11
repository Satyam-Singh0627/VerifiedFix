from typing import Dict, Any, Tuple
from app.models.models import PatchProposal

ALLOWED_FILES = ["backend/app/services/document_service.py"]
MAX_CHANGED_LINES = 25
DISALLOWED_PATTERNS = ["os.system", "subprocess", "exec(", "eval(", "__import__", "shutil"]

def validate_patch_scope(patch: PatchProposal) -> Tuple[bool, str]:
    """
    Validates patch safety, target scope, and allowed boundaries:
    - Verifies file is in allowlist.
    - Ensures changed line count does not exceed limit.
    - Rejects arbitrary code execution or unsafe primitives.
    """
    if patch.affected_file not in ALLOWED_FILES:
        return False, f"Patch targets disallowed file: {patch.affected_file}. Scope restricted to {ALLOWED_FILES}"

    total_changed = patch.lines_added + patch.lines_removed
    if total_changed > MAX_CHANGED_LINES:
        return False, f"Patch exceeds maximum allowed line budget ({total_changed} > {MAX_CHANGED_LINES})"

    for pattern in DISALLOWED_PATTERNS:
        if pattern in patch.after_code:
            return False, f"Patch contains dangerous or disallowed primitive: '{pattern}'"

    return True, "Patch passed scope and safety validation checks."
