import sys
import os

BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from dotenv import load_dotenv

load_dotenv(os.path.join(BACKEND_DIR, ".env"))

from database import connect_db, disconnect_db
from routers import health, schemes


@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_db()
    yield
    await disconnect_db()


app = FastAPI(
    title="Welfare App API",
    description="Backend API for the India Welfare Schemes platform",
    version="1.0.0",
    lifespan=lifespan,
)

allowed_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, tags=["health"])
app.include_router(schemes.router, prefix="/schemes", tags=["schemes"])


@app.get("/")
async def root():
    return {
        "app": "Welfare Schemes API",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs",
    }