from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from database import get_db
from .models import Member
from .schemas import MemberResponse, MemberCreate, MemberUpdate
from datetime import date, datetime
from typing import Optional

router = APIRouter(prefix="/members", tags=["Members"])

# helper function
def capitalize_name(name: str) -> str:
    """Capitalize first letter of each word"""
    if not name:
        return name
    return ' '.join(word.capitalize() for word in name.split())

@router.get("/", response_model=list[MemberResponse])
def get_members(
    search: Optional[str] = None,
    is_active: Optional[bool] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Get all members with optional filters"""
    query = db.query(Member)
    
    # Search filter
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            or_(
                Member.first_name.ilike(search_pattern),
                Member.last_name_paternal.ilike(search_pattern),
                Member.last_name_maternal.ilike(search_pattern),
                Member.email.ilike(search_pattern),
                Member.phone.ilike(search_pattern)
            )
        )
        
    # Active status filter
    if is_active is not None:
        query = query.filter(Member.is_active == is_active)
    
    members = query.order_by(Member.created_at.desc()).offset(skip).limit(limit).all()
    return members

@router.get("/{member_id}", response_model=MemberResponse)
def get_member(member_id: int, db: Session = Depends(get_db)):
    """Get a specific member by ID"""
    member = db.query(Member).filter(Member.id == member_id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Miembro no encontrado")
    return member

@router.post("/", response_model=MemberResponse, status_code=201)
def create_member(member: MemberCreate, db: Session = Depends(get_db)):
    """Create a new member"""
    
    # Check if email already exists
    if member.email:
        existing = db.query(Member).filter(Member.email == member.email).first()
        if existing:
            raise HTTPException(status_code=400, detail="El email ya está registrado")
    
    # ← CAPITALIZAR NOMBRES Y APELLIDOS
    db_member = Member(
        first_name=capitalize_name(member.first_name),
        last_name_paternal=capitalize_name(member.last_name_paternal),
        last_name_maternal=capitalize_name(member.last_name_maternal) if member.last_name_maternal else None,
        phone=member.phone,
        email=member.email.lower() if member.email else None,
        date_of_birth=member.date_of_birth,
        emergency_contact=capitalize_name(member.emergency_contact) if member.emergency_contact else None,
        emergency_phone=member.emergency_phone,
        registration_date=date.today(),
        is_active=True
    )
    db.add(db_member)
    db.commit()
    db.refresh(db_member)
    return db_member

@router.put("/{member_id}", response_model=MemberResponse)
def update_member(member_id: int, member: MemberUpdate, db: Session = Depends(get_db)):
    """Update an existing member"""
    db_member = db.query(Member).filter(Member.id == member_id).first()
    if not db_member:
        raise HTTPException(status_code=404, detail="Miembro no encontrado")
    
    # Check email uniqueness if changing email
    if member.email and member.email != db_member.email:
        existing = db.query(Member).filter(
            and_(
                Member.email == member.email,
                Member.id != member_id
            )
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="El email ya está registrado")
    
    update_data = member.model_dump(exclude_unset=True)
    
    # ← CAPITALIZAR SI SE ESTÁN ACTUALIZANDO NOMBRES
    if 'first_name' in update_data:
        update_data['first_name'] = capitalize_name(update_data['first_name'])
    if 'last_name_paternal' in update_data:
        update_data['last_name_paternal'] = capitalize_name(update_data['last_name_paternal'])
    if 'last_name_maternal' in update_data and update_data['last_name_maternal']:
        update_data['last_name_maternal'] = capitalize_name(update_data['last_name_maternal'])
    if 'emergency_contact' in update_data and update_data['emergency_contact']:
        update_data['emergency_contact'] = capitalize_name(update_data['emergency_contact'])
    if 'email' in update_data and update_data['email']:
        update_data['email'] = update_data['email'].lower()
    
    for key, value in update_data.items():
        setattr(db_member, key, value)
    
    db_member.updated_at = datetime.now()
    db.commit()
    db.refresh(db_member)
    return db_member

@router.patch("/{member_id}/toggle-status", response_model=MemberResponse)
def toggle_member_status(member_id: int, db: Session = Depends(get_db)):
    """Toggle member active status"""
    db_member = db.query(Member).filter(Member.id == member_id).first()
    if not db_member:
        raise HTTPException(status_code=404, detail="Miembro no encontrado")
    
    db_member.is_active = not db_member.is_active
    db_member.updated_at = datetime.now()
    db.commit()
    db.refresh(db_member)
    return db_member

@router.delete("/{member_id}")
def delete_member(member_id: int, db: Session = Depends(get_db)):
    """Delete a member (soft delete by setting is_active=False)"""
    db_member = db.query(Member).filter(Member.id == member_id).first()
    if not db_member:
        raise HTTPException(status_code=404, detail="Miembro no encontrado")
    
    # Soft delete
    db_member.is_active = False
    db.commit()
    return {"message": "Miembro desactivado correctamente"}