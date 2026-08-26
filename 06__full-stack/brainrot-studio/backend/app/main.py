import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api.routes import assets, auth, generation, health, projects, scenes, timeline, videos, wizard
from app.core.config import settings


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="AI-powered short video creation and publishing API",
)

media_dir = os.path.join(os.getcwd(), "media")
os.makedirs(media_dir, exist_ok=True)
app.mount("/media", StaticFiles(directory=media_dir), name="media")


app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(
    health.router,
    prefix="/api/v1",
)

app.include_router(
    auth.router,
    prefix="/api/v1",
)

app.include_router(
    projects.router,
    prefix="/api/v1",
)

app.include_router(
    videos.router,
    prefix="/api/v1",
)

app.include_router(
    timeline.router,
    prefix="/api/v1",
)

app.include_router(
    scenes.router,
    prefix="/api/v1",
)

app.include_router(
    assets.router,
    prefix="/api/v1",
)

app.include_router(
    generation.router,
    prefix="/api/v1",
)

app.include_router(
    wizard.router,
    prefix="/api/v1",
)