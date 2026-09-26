from fastapi import APIRouter

from app.api.v1 import auth, health, repositories, sessions

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(auth.router)
api_router.include_router(repositories.router)
api_router.include_router(sessions.router)
