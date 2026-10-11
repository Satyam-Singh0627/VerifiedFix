# VerifiedFix — AI-Assisted Security Verification Platform

> **Team ByteForce** | Hackathon Solution for **“The Verified Fix”**  
> **Core Promise:** *Detect → Prove → Explain → Patch → Verify → Report*

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688.svg?logo=fastapi)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/Frontend-React%20%2B%20Vite%20%2B%20Tailwind-61DAFB.svg?logo=react)](https://react.dev/)
[![Tests](https://img.shields.io/badge/Tests-9%20Passed-10b981.svg)](https://docs.pytest.org/)

---

## 1. Product Overview

**VerifiedFix** is an AI-assisted application security verification platform that identifies real security flaws, proves their exploitability with empirical evidence, proposes minimal patches, applies them only under human-in-the-loop review, and rigorously verifies the fix using repeatable security and regression tests.

Unlike conventional static analysis tools or LLM code generation assistants that merely claim a fix works, **VerifiedFix never allows the AI to declare its own patch verified**. Final verification is mathematically and empirically bound to actual test suite execution.

---

## 2. The 6-Stage Security Workflow

```
[ 1. DETECT ] ──────► Active scanner inspects document access endpoints across identities
       │
[ 2. PROVE ]  ──────► Controlled exploit reproduction (Bob reads Alice's private Doc #12)
       │
[ 3. EXPLAIN ]──────► Root cause analysis with exact code locations (CWE-639 / OWASP A01)
       │
[ 4. PATCH ]  ──────► Minimal scoped diff proposal with human approval gate (Approve / Reject)
       │
[ 5. VERIFY ] ──────► Authoritative 10-point test matrix proves exploit blocked & regressions safe
       │
[ 6. REPORT ] ──────► Comprehensive, tamper-evident audit dossier with JSON/PDF export
```

---

## 3. Seeded Target Application: DocVault

VerifiedFix inspects and secures a realistic SQLite-backed document portal called **DocVault**.

### Deterministic Demo Credentials

| Identity | Username | Password | Role | Purpose in Demo |
| :--- | :--- | :--- | :--- | :--- |
| **Alice** | `alice` | `Password123!` | Normal User | Document Owner (Owns confidential Doc #12) |
| **Bob** | `bob` | `Password123!` | Normal User | Unauthorized Attacker (Contractor tenant) |
| **Carol** | `carol` | `Password123!` | Normal User | Authorized Recipient (Explicit share on Doc #14) |
| **Admin** | `admin` | `Password123!` | Administrator | System Administrator (Authorized audit access) |

### Centralized Authorization Policy

| Action | Document Owner | Authorized Recipient (Share) | System Admin | Outsider / Non-Owner |
| :--- | :---: | :---: | :---: | :---: |
| **View Private Document** | ✅ Allow | ❌ Deny | ✅ Allow | ❌ Deny |
| **View Shared Document** | ✅ Allow | ✅ Allow | ✅ Allow | ❌ Deny |
| **Delete Document** | ✅ Allow | ❌ Deny | ✅ Allow | ❌ Deny |
| **Share Document** | ✅ Allow | ❌ Deny | ✅ Allow | ❌ Deny |
| **Upload Document** | ✅ Allow | ✅ Allow | ✅ Allow | ✅ Allow (when auth) |

### Intentionally Vulnerable Demonstration State
In the baseline demo state, `/api/documents/{id}` checks authentication but fails to verify document ownership or explicit sharing (`is_vulnerable = True`). When Bob requests document `12`, the vulnerable baseline returns Alice's private M&A projections.

Applying the patch binds document retrieval to `check_document_permission()`, returning **HTTP 403 Forbidden** to Bob while preserving Alice, Carol, and Admin access.

---

## 4. Quick Start & Local Execution

### Prerequisites
- Python 3.11+ (Python 3.14 compatible)
- Node.js 18+ and npm

### One-Click Launch (Windows PowerShell)
```powershell
.\start_all.ps1
```
Or with Windows Command Prompt:
```cmd
start_all.bat
```

### Manual Setup & Execution

#### 1. Backend Setup
```powershell
# Create & activate venv
python -m venv .venv
.\.venv\Scripts\Activate.ps1

# Install dependencies
pip install -r backend\requirements.txt

# Run backend (Starts on http://127.0.0.1:8000)
python backend\run_backend.py
```

#### 2. Frontend Setup
```powershell
cd frontend
npm install
npm run dev
# Starts Vite dev server on http://localhost:5173
```

- **VerifiedFix Dashboard:** [http://localhost:5173](http://localhost:5173)
- **DocVault Portal Experience:** [http://localhost:5173/docvault](http://localhost:5173/docvault)
- **FastAPI Interactive Swagger Docs:** [http://localhost:8000/docs](http://localhost:8000/docs)

---

## 5. The Two-Minute Hackathon Demonstration Script

Follow this step-by-step path for judging presentations:

1. **Show the Vulnerability (30s):**
   - Click **DocVault Demo** in the top navigation.
   - Switch active user to **Bob (Attacker)**.
   - In the **IDOR Playground**, enter Document ID `12` and click **Send Request as bob**.
   - Observe **HTTP 200 OK**: Bob successfully reads Alice's confidential *“Q3 Financial Strategy & M&A Expansion Plans”*.

2. **Run Security Scan (20s):**
   - Navigate to **Security Scans** (or click **Run Security Scan** on the Overview).
   - Observe live scan execution across 7 tenant boundary checks.
   - Confirm finding: *Insecure Direct Object Reference (CWE-639)* with High severity.

3. **Inspect Finding & Root Cause (20s):**
   - Click **Findings**.
   - Review empirical exploit evidence, redacted response, and exact code location in `document_service.py`.

4. **Review & Apply Minimal Patch (25s):**
   - Click **Patch Review**.
   - Inspect the Split/Unified diff (+8 lines / -3 lines).
   - Verify scope validation (file allowlisted, 11 <= 25 changed lines, no arbitrary execution).
   - Click **Approve & Apply**.

5. **Prove Fix with Verification Suite (25s):**
   - Click **Verification** and run the test suite.
   - Observe the **10-point test matrix** execute live:
     - Test #2 (*IDOR Exploit Resistance*): Bob now receives **HTTP 403 Forbidden**!
     - Tests #1, 3, 5, 8 (*Regressions*): Alice, Carol, and Admin retain legitimate access.
   - Status transitions authoritatively to glowing emerald **VERIFIED**.

6. **Generate Report & Reset (15s):**
   - Open **Reports** to view the certified verification dossier with JSON/PDF export.
   - Click **Reset Demo** in the top bar to restore the baseline for another presentation.

---

## 6. Automated Test Suite Execution

Run the backend test suite via `pytest`:
```powershell
.\.venv\Scripts\pytest.exe backend\tests -v
```

### Verified Test Results:
```text
backend/tests/test_docvault.py::test_seeded_identities_login PASSED
backend/tests/test_docvault.py::test_alice_can_view_her_own_document PASSED
backend/tests/test_docvault.py::test_bob_can_view_his_own_document PASSED
backend/tests/test_docvault.py::test_carol_can_view_shared_document PASSED
backend/tests/test_docvault.py::test_bob_cannot_delete_alice_document PASSED
backend/tests/test_docvault.py::test_bob_cannot_share_alice_document PASSED
backend/tests/test_docvault.py::test_admin_retains_authorized_access PASSED
backend/tests/test_docvault.py::test_unauthenticated_request_is_rejected PASSED
backend/tests/test_security_workflow.py::test_full_security_workflow_end_to_end PASSED

======================= 9 passed in 2.05s =======================
```

---

## 7. Project Architecture

```
verifiedfix/
├── backend/
│   ├── app/
│   │   ├── api/                 # Document, scan, patch, verification & report endpoints
│   │   ├── core/                # Config, SQLite engine, and PBKDF2/JWT security
│   │   ├── db/                  # Deterministic seed and demo reset logic
│   │   ├── models/              # SQLAlchemy models for DocVault and Security Engine
│   │   ├── schemas/             # Pydantic v2 validation schemas
│   │   ├── security_engine/     # Scanner, exploit runner, patch validator, verification engine
│   │   ├── services/            # Centralized auth and document permission policies
│   │   └── main.py              # FastAPI app registration and CORS
│   ├── tests/                   # Pytest automated test suite
│   ├── requirements.txt         # Pinned Python dependencies
│   └── run_backend.py           # Backend runner
├── frontend/
│   ├── src/
│   │   ├── components/          # Navbar, DiffViewer, ResetDemoModal
│   │   ├── pages/               # Overview, Scans, Findings, Patches, Verification, Reports, DocVault
│   │   ├── services/            # API client with token & session handling
│   │   ├── types/               # TypeScript interface contracts
│   │   └── App.tsx              # Main route switcher
│   ├── package.json
│   └── vite.config.ts           # Vite + Tailwind + Proxy configuration
├── start_all.ps1                # PowerShell multi-process launcher
├── start_all.bat                # Windows batch launcher
├── .env.example                 # Environment variables template
└── README.md                    # Comprehensive documentation
```

---

## 8. AI Provider Integration & Local Fallback Mode

- **Zero-Dependency Local Fallback:** By default (`AI_PROVIDER=local`), VerifiedFix operates 100% offline using deterministic analysis and prevalidated patch templates. No OpenAI, Anthropic, or Gemini API keys are needed to launch or demonstrate the complete workflow.
- **Optional External Providers:** Set `AI_PROVIDER=openai` (or `anthropic`, `gemini`) and supply your API key in `.env` to augment plain-language explanations. If external calls fail or timeout, the engine gracefully falls back to deterministic analysis without interrupting the user.

---

## 9. Security Safeguards

- **Strict Sandbox Scoping:** Scanner targets only configured local demo endpoints.
- **Privacy Redaction:** Sensitive tokens and confidential document contents are redacted before appearing in audit evidence logs.
- **Patch Scope Enforcement:** Rejects patches targeting files outside allowlisted paths, exceeding line budgets, or introducing unsafe primitives.
- **Authoritative Separation:** AI predictions are classified as advisory; verification status requires empirical test execution.

---

*Built with passion by Team ByteForce for The Verified Fix Hackathon.*
