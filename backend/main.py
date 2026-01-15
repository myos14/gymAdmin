from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
import os
from dotenv import load_dotenv
from sqlalchemy.orm import Session
from database import get_db


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

@app.post("/api/setup-users", include_in_schema=False)
def setup_users(db: Session = Depends(get_db)):
    """
    Endpoint temporal para crear usuarios iniciales.
    """
    from users.models import User
    from users.auth import get_password_hash
    
    created_users = []
    
    admin = db.query(User).filter(User.username == "admin").first()
    if not admin:
        admin = User(
            username="admin",
            email="admin@fuerzafit.com",
            full_name="Administrador",
            role="admin",
            hashed_password=get_password_hash("admin123"),
            is_active=True
        )
        db.add(admin)
        created_users.append({
            "username": "admin",
            "password": "admin123",
            "role": "admin"
        })
    
    recep = db.query(User).filter(User.username == "recepcion").first()
    if not recep:
        recep = User(
            username="recepcion",
            email="recepcion@fuerzafit.com",
            full_name="Recepcionista",
            role="employee",
            hashed_password=get_password_hash("recepcion123"),
            is_active=True
        )
        db.add(recep)
        created_users.append({
            "username": "recepcion",
            "password": "recepcion123",
            "role": "employee"
        })
    
    if created_users:
        db.commit()
        return {
            "message": "Usuarios creados exitosamente",
            "users": created_users,
            "status": "created"
        }
    else:
        return {
            "message": "Los usuarios ya existen",
            "status": "exists"
        }

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