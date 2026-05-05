"""
FastAPI application entry point.

Creates the app instance, attaches CORS middleware using origins from configuration,
and mounts the API router. Run via uvicorn with --host/--port flags derived from
HOST and PORT environment variables.
"""

from fastapi import FastAPI
from app.api import router
from app.config import get_config
from fastapi.middleware.cors import CORSMiddleware

config = get_config()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=config.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router.router)
