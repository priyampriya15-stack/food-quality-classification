"""FastAPI Application Main Entry Point.

Initializes database tables, manages model loading lifecycle, configures CORS,
mounts static uploads preview directory, and registers API routers.
"""

import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from backend.app.api.router import api_router
from backend.app.core.config import settings
from backend.app.core.database import init_db
from backend.app.services.prediction_service import FOOD_SAFETY_DISCLAIMER, prediction_service

logging.basicConfig(
    level=logging.INFO,
    format="[%(asctime)s] [%(levelname)s] %(name)s: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown lifecycle manager."""
    logger.info("Initializing database schema...")
    init_db()

    # Ensure uploads directory exists
    settings.uploads_path.mkdir(parents=True, exist_ok=True)
    logger.info(f"Uploads directory verified at: {settings.uploads_path}")

    # Attempt to pre-load active model if trained weights exist
    if prediction_service.is_model_available():
        logger.info(f"Pre-loading active model: '{prediction_service.active_model_name}'")
        prediction_service.load_active_model()
    else:
        logger.warning(
            f"Active model '{prediction_service.active_model_name}' weights not found in '{settings.models_path}'. "
            "Server running in ready-to-train state."
        )

    yield

    logger.info("Application shutting down.")


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Automated Visual Food Quality Classification API using Deep Learning.",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS Middleware for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static uploads directory for safe image previews
uploads_dir = settings.uploads_path
uploads_dir.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(uploads_dir)), name="uploads")

# Include API v1 router
app.include_router(api_router)


@app.get("/", tags=["Root"])
def root():
    """API Welcome and information endpoint."""
    return {
        "app_name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "docs_url": "/docs",
        "api_v1": "/api/v1",
        "health_check": "/api/v1/health",
        "disclaimer": FOOD_SAFETY_DISCLAIMER,
    }
