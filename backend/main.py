from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from members.routes import router as members_router
from subscriptions.routes import router as subscriptions_router
from payments.routes import router as payments_router
from attendance.routes import router as attendance_router
from plans.routes import router as plans_router

app = FastAPI(
    title="F3 Manager API",
    description="Sistema de gestión para gimnasio",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routes
app.include_router(members_router)
app.include_router(subscriptions_router, prefix="/api")
app.include_router(payments_router, prefix="/api")
app.include_router(attendance_router, prefix="/api")
app.include_router(plans_router, prefix="/api")

@app.get("/")
def rool():
    return {
    "message": "F3 Manager API",
    "docs": "/docs",
    "status": "running"
    }
    
@app.get("/api/health")
def health():
    return {"status": "ok", "database": "connected"}