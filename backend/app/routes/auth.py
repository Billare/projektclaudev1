from fastapi import APIRouter, Depends
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session

from ..database import get_db
from ..auth import get_oauth, is_authenticated
from ..config import settings
from ..models import SpotifyToken
from ..fetcher import sync_all

router = APIRouter(prefix="/auth", tags=["auth"])


@router.get("/login")
def login(db: Session = Depends(get_db)):
    oauth = get_oauth(db)
    return RedirectResponse(oauth.get_authorize_url())


@router.get("/callback")
def callback(code: str, db: Session = Depends(get_db)):
    oauth = get_oauth(db)
    oauth.get_access_token(code, as_dict=True, check_cache=False)
    try:
        sync_all(db)
    except Exception:
        pass
    return RedirectResponse(settings.frontend_url)


@router.get("/status")
def auth_status(db: Session = Depends(get_db)):
    return {"authenticated": is_authenticated(db)}


@router.post("/logout")
def logout(db: Session = Depends(get_db)):
    db.query(SpotifyToken).filter_by(user_id="default").delete()
    db.commit()
    return {"message": "Logged out"}
