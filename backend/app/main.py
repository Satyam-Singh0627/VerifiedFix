from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import engine, Base, SessionLocal
from app.api.auth import router as auth_router
from app.api.documents import router as documents_router
from app.api.scans import router as scans_router
from app.api.patches import router as patches_router
from app.api.verification import router as verification_router
from app.api.reports import router as reports_router
from app.api.audit import router as audit_router
from app.api.system import router as system_router
from app.models.models import User
from app.db.seed import seed_database

# Create tables
Base.metadata.create_all(bind=engine)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Ensure database has baseline seed identities and demo state upon startup."""
    db = SessionLocal()
    try:
        user_count = db.query(User).count()
        if user_count == 0:
            seed_database(db)
    finally:
        db.close()
    yield

app = FastAPI(
    title=f"{settings.PROJECT_NAME} — AI-Assisted Security Verification Platform",
    description=(
        "Developed by Team ByteForce for 'The Verified Fix' Hackathon.\n\n"
        "Core workflow: Detect → Prove → Explain → Patch → Verify → Report.\n"
        "Target Application: DocVault Enterprise Document Portal (IDOR Baseline Demo)."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# Enable CORS for local Vite development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(documents_router, prefix=settings.API_V1_STR)
app.include_router(scans_router, prefix=settings.API_V1_STR)
app.include_router(patches_router, prefix=settings.API_V1_STR)
app.include_router(verification_router, prefix=settings.API_V1_STR)
app.include_router(reports_router, prefix=settings.API_V1_STR)
app.include_router(audit_router, prefix=settings.API_V1_STR)
app.include_router(system_router, prefix=settings.API_V1_STR)

@app.get("/health")
@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "VerifiedFix Security Engine",
        "team": "Team ByteForce",
        "mode": "Local Deterministic & AI Augmented"
    }
