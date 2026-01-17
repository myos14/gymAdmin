# backend/database_backup/routes.py
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from datetime import datetime
import io
from sqlalchemy import text, inspect
from database import get_db
from sqlalchemy.orm import Session
from users.auth import require_admin
from users.models import User

router = APIRouter(prefix="/api/backup", tags=["backup"])

@router.get("/database")
def backup_database(
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Generar respaldo de datos (solo admin)
    """
    try:
        # Obtener todas las tablas
        inspector = inspect(db.bind)
        tables = inspector.get_table_names()
        
        # Crear contenido del respaldo
        backup_lines = []
        fecha = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        backup_lines.append(f"-- FuerzaFit Database Backup")
        backup_lines.append(f"-- Date: {fecha}")
        backup_lines.append(f"-- Tables: {', '.join(tables)}\n")
        
        # Para cada tabla exportar INSERT statements
        for table in tables:
            try:
                # Obtener columnas
                columns_query = text(f"""
                    SELECT column_name 
                    FROM information_schema.columns 
                    WHERE table_name = :table_name
                    ORDER BY ordinal_position;
                """)
                columns_result = db.execute(columns_query, {"table_name": table})
                columns = [row[0] for row in columns_result]
                
                # Obtener datos
                data_query = text(f"SELECT * FROM {table};")
                rows = db.execute(data_query).fetchall()
                
                if rows:
                    backup_lines.append(f"\n-- Table: {table} ({len(rows)} rows)")
                    backup_lines.append(f"DELETE FROM {table};")
                    
                    for row in rows:
                        values = []
                        for val in row:
                            if val is None:
                                values.append("NULL")
                            elif isinstance(val, str):
                                escaped = val.replace("'", "''")
                                values.append(f"'{escaped}'")
                            elif isinstance(val, (datetime, )):
                                values.append(f"'{val}'")
                            elif isinstance(val, bool):
                                values.append(str(val).upper())
                            else:
                                values.append(str(val))
                        
                        cols = ", ".join(columns)
                        vals = ", ".join(values)
                        backup_lines.append(f"INSERT INTO {table} ({cols}) VALUES ({vals});")
                    
            except Exception as e:
                backup_lines.append(f"-- Error in table {table}: {str(e)}")
        
        # Convertir a bytes
        content = "\n".join(backup_lines).encode('utf-8')
        
        # Nombre del archivo
        fecha_archivo = datetime.now().strftime("%Y-%m-%d")
        filename = f"fuerzafit_backup_{fecha_archivo}.sql"
        
        return StreamingResponse(
            io.BytesIO(content),
            media_type="application/sql",
            headers={
                "Content-Disposition": f"attachment; filename={filename}"
            }
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Error generating backup: {str(e)}"
        )