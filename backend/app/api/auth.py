from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import hash_password, create_access_token
from app.models.models import User
from app.schemas.schemas import UserCreate, UserLogin, UserOut, TokenResponse
from app.services.auth_service import authenticate_user, get_current_user
from app.security_engine.audit_logger import log_audit_event

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=TokenResponse)
def register_user(user_in: UserCreate, response: Response, db: Session = Depends(get_db)):
    existing = db.query(User).filter(
        (User.username == user_in.username) | (User.email == user_in.email)
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username or email already registered"
        )

    user = User(
        username=user_in.username,
        email=user_in.email,
        hashed_password=hash_password(user_in.password),
        full_name=user_in.full_name,
        role=user_in.role or "user"
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(user.username, role=user.role)
    response.set_cookie(
        key="access_token",
        value=f"Bearer {token}",
        httponly=True,
        samesite="lax",
        secure=False  # Local hackathon development
    )

    log_audit_event(db, "USER_REGISTERED", f"New user '{user.username}' registered", actor=user.username)
    return TokenResponse(access_token=token, user=user)

@router.post("/login", response_model=TokenResponse)
def login_user(login_data: UserLogin, response: Response, db: Session = Depends(get_db)):
    user = authenticate_user(db, login_data.username, login_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password"
        )

    token = create_access_token(user.username, role=user.role)
    response.set_cookie(
        key="access_token",
        value=f"Bearer {token}",
        httponly=True,
        samesite="lax",
        secure=False
    )

    log_audit_event(db, "USER_LOGIN", f"User '{user.username}' logged in successfully", actor=user.username)
    return TokenResponse(access_token=token, user=user)

@router.post("/logout")
def logout_user(response: Response, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    response.delete_cookie(key="access_token")
    log_audit_event(db, "USER_LOGOUT", f"User '{current_user.username}' logged out", actor=current_user.username)
    return {"message": "Logged out successfully"}

@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user
