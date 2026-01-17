**Proyecto Final de Ingeniería en Software: Sistema de Gestión para gimmnasio**

**Autor:** Oscar Romero Hernández 
**Matrícula:** ID21159
**Universidad:** Instituto Tecnológico DASC
**Fecha:** 16 de Enero de 2026

## Descripción
Sistema web completo para la administración de gimnasios desarrollado como proyecto final. Incluye gestión de miembros, planes de membresía, suscripciones, control de asistencias, pagos y reportes financieros.
El sistema está en proceso de desarrollo para el gimnasio FUERZA FIT: check-in y acceso por medio de código QR.

## Aplicación en Producción
**Frontend (Vercel):** https://gym-admin-liart.vercel.app/ 
**Backend API (Render):** https://f3-manager-api.onrender.com/
---

## Datos hasta el respaldo de la base de datos
- **Miembros registrados:** 43
- **Suscripciones activas:** 33
- **Planes disponibles:** 7

## Tecnologías Utilizadas
### Backend
- **Python 3.11**
- **FastAPI** - Framework
- **PostgreSQL** - Base de datos relacional
- **SQLAlchemy** - ORM para manejo de datos
- **Pydantic** - Validación de datos
- **JWT** - Autenticación y autorización

### Frontend
- **React 18** - Biblioteca de interfaces
- **Vite** - Build tool y dev server
- **Tailwind CSS** - Framework de estilos utility-first
- **React Router** - Navegación
- **Axios** - Cliente HTTP

### Infraestructura
- **Vercel** - Hosting frontend
- **Render** - Hosting backend y base de datos
- **Git/GitHub** - Control de versiones

--------------------------------------------------------------------------------------------------------------
## Características Principales

### Gestión de Miembros
- Registro rápido de nuevos miembros con suscripción incluida
- Perfil completo con datos personales y contacto de emergencia
- Historial de asistencias y pagos
- Búsqueda y filtros avanzados

### Planes y Suscripciones
- Gestión de planes (Visita, Mensual, Bimestral, Trimestral, Semestral, Anual)
- Control de suscripciones activas, vencidas y canceladas
- Alertas automáticas de vencimiento
- Renovaciones y cambios de plan

### Control de Asistencias
- Sistema de check-in y check-out
- Registro automático de fecha y hora
- Historial completo por miembro
- Visualización de miembros actualmente en el gimnasio

### Dashboard y Reportes
- Métricas en tiempo real
- Gráficos de asistencias semanales
- Reportes de ingresos por período
- Análisis de planes más vendidos
- Alertas de suscripciones por vencer

### Sistema de Usuarios
- Autenticación con JWT
- Roles: Administrador y Empleado
- Permisos diferenciados por rol
- Gestión de sesiones seguras

### Esquema de Base de Datos
**Tablas principales:**
- `members` - Información de miembros
- `plans` - Planes de membresía
- `subscriptions` - Suscripciones activas/históricas
- `attendance` - Registros de asistencias
- `payment_records` - Historial de pagos
- `users` - Usuarios del sistema

## Estructura del Proyecto
gym-system/
├── backend/                 # API REST con FastAPI
│   ├── attendances/        # Módulo de asistencias
│   ├── dashboard/          # Módulo de dashboard y métricas
│   ├── members/            # Módulo de miembros
│   ├── payments/           # Módulo de pagos
│   ├── plans/              # Módulo de planes
│   ├── reports/            # Módulo de reportes
│   ├── subscriptions/      # Módulo de suscripciones
│   ├── users/              # Módulo de usuarios y autenticación
│   ├── database.py         # Configuración de base de datos
│   ├── main.py             # Punto de entrada de la aplicación
│   └── requirements.txt    # Dependencias Python
│
├── frontend/               # Aplicación React
│   ├── src/
│   │   ├── components/    # Componentes reutilizables
│   │   ├── context/       # Context API (Auth)
│   │   ├── pages/         # Páginas principales
│   │   ├── services/      # Servicios API
│   │   └── utils/         # Utilidades y helpers
│   ├── public/            # Archivos estáticos
│   └── package.json       # Dependencias Node
│
├── database/              # Respaldo de base de datos
│   └── f3manager_render_backup.sql

## Credenciales de Prueba
### Administrador
Usuario: admin
Contraseña: admin123

### Recepcionista
Usuario: recepcion
Contraseña: recepcion123