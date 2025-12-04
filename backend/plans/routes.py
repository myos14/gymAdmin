from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from database import get_db
from plans.models import Plan
from plans.schemas import PlanCreate, PlanUpdate, PlanResponse

router = APIRouter(prefix="/plans", tags=["plans"])

@router.post("/", response_model=PlanResponse, status_code=status.HTTP_201_CREATED)
def create_plan(plan: PlanCreate, db: Session = Depends(get_db)):
    """Crear un nuevo plan de suscripción"""
    
    #Check if plan with same name exists
    existing_plan = db.query(Plan).filter(Plan.name == plan.name).first()
    if existing_plan:
        raise HTTPException(
            status_code=400,
            detail=f"Ya existe un plan con el nombre {plan.name}"
        )
    
    db_plan = Plan(**plan.model_dump())
    
    db.add(db_plan)
    db.commit()
    db.refresh(db_plan)
    
    return db_plan

@router.get("/", response_model=List[PlanResponse])
def get_plans(
    active_only: bool = True,
    skip : int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Listar todos los planes disponibles"""
    query = db.query(Plan)
    
    if active_only:
        query = query.filter(Plan.is_active == True)
        
    plans = query.offset(skip).limit(limit).all()
    
    return plans

@router.get("/{plan_id}", response_model=PlanResponse)
def get_plan(plan_id: int, db: Session = Depends(get_db)):
    """Obtener un plan específico"""
    plan = db.query(Plan).filter(Plan.id == plan_id).first()
    
    if not plan:
        raise HTTPException(status_code=404, detail="Plano no encontrado")
    
    return plan

@router.put("/{plan_id}", response_model=PlanResponse)
def update_plan(
    plan_id: int,
    plan_update: PlanUpdate,
    db: Session = Depends(get_db)
):
    """Actualizar un plan de suscripción"""
    db_plan = db.query(Plan).filter(Plan.id == plan_id).first()
    
    if not db_plan:
        raise HTTPException(status_code=404, detail="Plano no encontrado")
    
    #Check if new name conflicts with existing plan
    if plan_update.name and plan_update.name != db_plan.name:
        existing = db.query(Plan).filter(Plan.name == plan_update.name).first()
        if existing:
            raise HTTPException(
                status_code=400,
                detail="Ya existe un plan con el nombre '{plan_update.name}'"
            )
    
    update_data = plan_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_plan, field, value)
        
    db.commit()
    db.refresh(db_plan)
    
    return db_plan

@router.delete("/{plan_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_plan(plan_id: int, db: Session = Depends(get_db)):
    """Desactivar un plan de suscripción""" # Soft delete - It's not physically deleted to preserve referential integrity
    
    db_plan = db.query(Plan).filter(Plan.id == plan_id).first()
    
    if not db_plan:
        raise HTTPException(status_code=404, detail="Plano no encontrado")
    
    # Soft delete - just mark it as inactive
    db_plan.is_active = False
    
    db.commit()
    
    return None