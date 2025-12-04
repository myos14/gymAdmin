from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from .models import Member
from .schemas import MemberResponse, MemberCreate, MemberUpdate
from datetime import date

router = APIRouter(prefix="/api/members", tags=["Members"])

@router.get("/", response_model=list[MemberResponse])
def get_members(db: Session = Depends(get_db)):
    members = db.query(Member).all()
    return members

@router.get("/{member_id}", response_model=MemberResponse)
def get_member(member_id: int, db: Session = Depends(get_db)):
    member = db.query(Member).filter(Member.id == member_id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Miembro no encontrado")
    return member

@router.post("/", response_model=MemberResponse, status_code=201)
def create_member(member: MemberCreate, db: Session = Depends(get_db)):
    db_member = Member(
        first_name=member.first_name,
        last_name_paternal=member.last_name_paternal,
        last_name_maternal=member.last_name_maternal,
        phone=member.phone,
        email=member.email,
        registration_date=date.today(),
    )
    db.add(db_member)
    db.commit()
    db.refresh(db_member)
    return db_member

@router.put("/{member_id}", response_model=MemberResponse)
def update_member(member_id: int, member: MemberUpdate, db: Session = Depends(get_db)):
    db_member = db.query(Member).filter(Member.id == member_id).first()
    if not db_member:
        raise HTTPException(status_code=404, detail="Miembro no encontrado")
    
    update_data = member.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_member, key, value)
        
    db.commit()
    db.refresh(db_member)
    return db_member

@router.delete("/{member_id}")
def delete_member(member_id: int, db: Session = Depends(get_db)):
    db_member = db.query(Member).filter(Member.id == member_id).first()
    if not db_member:
        raise HTTPException(status_code=404, detail="Miembro no encontrado")
    
    db.delete(db_member)
    db.commit()
    return {"message": "Miembro eliminado correctamente"}