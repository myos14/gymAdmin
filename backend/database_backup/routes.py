# backend/database_backup/routes.py
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
import subprocess
from datetime import datetime
import os
from users.auth import require_admin
from users.models import User

router = APIRouter(prefix="/api/backup", tags=["backup"])

@router.get("/database")
def backup_database(current_user: User = Depends(require_admin)):
    """
    Generar respaldo de base de datos (solo admin)
    """
    try:
        # Obtener fecha actual
        fecha = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"fuerzafit_backup_{fecha}.sql"
        filepath = f"/tmp/{filename}"
        
        # Obtener credenciales de la base de datos
        db_user = os.getenv("DB_USER", "postgres")
        db_password = os.getenv("DB_PASSWORD")
        db_host = os.getenv("DB_HOST", "localhost")
        db_port = os.getenv("DB_PORT", "5432")
        db_name = os.getenv("DB_NAME", "f3manager")
        
        if not db_password:
            raise HTTPException(status_code=500, detail="DB_PASSWORD not configured")
        
        # Configurar variable de entorno para password
        env = os.environ.copy()
        env['PGPASSWORD'] = db_password
        
        # Ejecutar pg_dump
        result = subprocess.run(
            [
                "pg_dump",
                "-h", db_host,
                "-p", db_port,
                "-U", db_user,
                "-d", db_name,
                "-f", filepath,
                "--no-owner",
                "--no-acl"
            ],
            env=env,
            capture_output=True,
            text=True
        )
        
        if result.returncode != 0:
            raise HTTPException(
                status_code=500, 
                detail=f"Error al generar respaldo: {result.stderr}"
            )
        
        # Devolver archivo
        return FileResponse(
            filepath,
            media_type="application/sql",
            filename=filename,
            headers={
                "Content-Disposition": f"attachment; filename={filename}"
            }
        )
        
    except subprocess.CalledProcessError as e:
        raise HTTPException(status_code=500, detail=f"Error ejecutando pg_dump: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))