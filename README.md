# 🏥 Sistema de Gestión - Clínica de Estética

## 📋 Descripción
Sistema integral de gestión para clínica de estética con funcionalidades de:
- Gestión de pacientes y historiales médicos
- Sistema de citas y calendario
- Facturación y presupuestos
- Comparador de imágenes antes/después
- Gestión de tratamientos y personal

## 🛠️ Stack Tecnológico
- **Frontend:** Electron + React + TypeScript + Material-UI
- **Backend:** NestJS + GraphQL + Prisma
- **Base de Datos:** PostgreSQL + Redis
- **Almacenamiento:** MinIO (S3 compatible)

## 🚀 Instalación

### Requisitos previos
- Node.js 20+
- Docker y Docker Compose
- Git

### Pasos de instalación
1. Clonar el repositorio
2. Instalar dependencias: `npm run install:all`
3. Configurar variables de entorno: `cp .env.example .env`
4. Iniciar servicios Docker: `docker-compose up -d`
5. Ejecutar migraciones: `npm run db:migrate`
6. Iniciar aplicación: `npm run dev`

## 📖 Documentación
Ver carpeta `/docs` para documentación completa.

## 📄 Licencia
Privado - Todos los derechos reservados
