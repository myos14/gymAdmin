from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
import os
from dotenv import load_dotenv

load_dotenv()

# Import routes
from members.routes import router as members_router
from plans.routes import router as plans_router
from subscriptions.routes import router as subscriptions_router
from attendance.routes import router as attendance_router
from payments.routes import router as payments_router
from dashboard.routes import router as dashboard_router
from users.routes import router as users_router

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="F3 Manager API",
    description="API para gestión de gimnasio FU3RZA FIT",
    version="1.0.0"
)

# CORS configuration
origins = os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routes
app.include_router(members_router, prefix="/api")
app.include_router(plans_router, prefix="/api")
app.include_router(subscriptions_router, prefix="/api")
app.include_router(attendance_router, prefix="/api")
app.include_router(payments_router, prefix="/api")
app.include_router(dashboard_router, prefix="/api")
app.include_router(users_router, prefix="/api")

@app.get("/")
def read_root():
    return {
        "message": "F3 Manager API",
        "status": "running",
        "version": "1.0.0"
    }

@app.get("/health")
def health_check():
    return {"status": "healthy"}