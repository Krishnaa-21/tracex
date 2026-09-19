from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.db.database import Base, engine
# Import all models to register with Base.metadata
from app.db.models import (
    Officer,
    Case,
    EvidenceFile,
    Entity,
    EntityLink,
    CaseSummary,
)
from app.db.seed import seed_data
from app.db.seed_demo import seed_demo_cases
from app.api.routes.auth import router as auth_router
from app.api.routes.cases import router as cases_router
from app.api.routes.evidence import router as evidence_router
from app.api.routes.correlation import router as correlation_router
from app.api.routes.geo import router as geo_router
from app.api.routes.reports import router as reports_router
from app.api.routes.chat import router as chat_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create all tables on startup
    Base.metadata.create_all(bind=engine)
    # Seed initial officer if empty
    seed_data()
    # Seed demo cases if cases table is empty
    seed_demo_cases()
    yield


app = FastAPI(
    title="TraceX — Cyber Fraud Operations Room",
    description="Unified evidence ingestion, entity correlation, and investigative reporting console.",
    version="0.1.0",
    lifespan=lifespan,
)

# Enable CORS for all local dev servers and ports
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://[::1]:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "http://[::1]:5174",
        "http://localhost:5175",
        "http://127.0.0.1:5175",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:4173",
        "http://127.0.0.1:4173",
    ],
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API routers
app.include_router(auth_router, prefix="/api/auth")
app.include_router(cases_router, prefix="/api")
app.include_router(evidence_router, prefix="/api")
app.include_router(correlation_router, prefix="/api")
app.include_router(geo_router, prefix="/api")
app.include_router(reports_router, prefix="/api")
app.include_router(chat_router, prefix="/api")


@app.get("/")
def root():
    return {"message": "TraceX API is running"}
