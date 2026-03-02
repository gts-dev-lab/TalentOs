# Requisitos Funcionales y Técnicos (Replicación)

Este documento resume las funcionalidades y requisitos técnicos necesarios para replicar TalentOS en otra plataforma o stack tecnológico.

---

## 1. Alcance del Producto

- Plataforma LMS corporativa con enfoque offline-first.
- Soporte de experiencia tipo app (PWA).
- Capacidad de operar sin backend (modo local) y sincronizar posteriormente.

---

## 2. Módulos Funcionales

### 2.1 Autenticación y Usuarios

- Login local con usuarios de prueba.
- Registro de usuarios.
- Roles, departamentos y jerarquías.
- Aprobación manual de usuarios con roles de gestión.
- Permisos por rol (visibilidad de secciones).
- Importación masiva de usuarios por CSV.

### 2.2 Gestión de Cursos y Contenidos

- CRUD completo de cursos.
- Creación manual de cursos con módulos, objetivos, duración.
- Generador de cursos con IA.
- Importación de paquetes SCORM (.zip).
- Visor SCORM integrado.
- Biblioteca de recursos (PDF, video, etc.).
- Asociación de recursos a múltiples cursos.

### 2.3 Experiencia de Aprendizaje

- Progreso por módulos con estado de completado.
- Vista de curso con detalle y módulos.
- Tutor virtual con IA contextual al curso.
- Foro por curso (hilos y respuestas).
- Valoraciones al finalizar curso.
- Calendario global de formación (eventos).

### 2.4 Gamificación

- Puntos XP por actividad.
- Insignias por logros.
- Ranking global (leaderboard).

### 2.5 Planes de Carrera

- Rutas de aprendizaje por rol.
- Secuenciación obligatoria de cursos.
- Seguimiento del avance del plan.

### 2.6 Analíticas y Reportes

- Dashboard con métricas de formación.
- Informe de cumplimiento de cursos obligatorios.
- Análisis de costes por curso/categoría/mes.
- Exportación de informes a PDF/CSV.

### 2.7 Administración y Configuración

- Gestión de costes de formación (categorías y registros).
- Configuración de proveedor de IA.
- Gestión de credenciales API.
- Panel de sincronización manual con backend.

### 2.8 Comunicación y Notificaciones

- Chat interno entre usuarios con jerarquía.
- Canales públicos creados por administradores.
- Sistema de anuncios.
- Notificaciones por email/WhatsApp/push (si se configuran).

---

## 3. Requisitos Técnicos

### 3.1 Frontend

- Framework SPA/SSR (ej. Next.js).
- UI con componentes reutilizables.
- Gestión de estado para auth, cursos, progreso, notificaciones.
- Modo PWA con caché y manifest.

### 3.2 Base de Datos Local (Offline-First)

- Base local (IndexedDB/Dexie o equivalente).
- Esquemas para: usuarios, cursos, módulos, progreso, foros, mensajes, eventos, costes, gamificación.
- Estrategia de reconciliación para sincronización posterior.

### 3.3 Backend Remoto (Opcional pero Recomendado)

- Base de datos central (PostgreSQL o equivalente).
- API para sincronización manual y persistencia.
- Autenticación remota opcional.
- Soporte para cargas masivas (CSV, SCORM).

### 3.4 IA (Opcional)

- Proveedor de IA (Gemini, OpenAI, etc.).
- Flujos de generación de curso y tests.
- Configuración dinámica de features.

### 3.5 Notificaciones (Opcional)

- Email transaccional.
- WhatsApp (Twilio u otro).
- Push web (FCM u otro).

---

## 4. Requisitos de Seguridad y Acceso

- Roles y permisos por sección.
- Restricción de acciones críticas a administradores.
- Uso seguro de claves privadas (solo en backend).

---

## 5. Criterios de Éxito para Replicación

- Puede operar 100% offline y sincronizar luego.
- Cubre todos los módulos funcionales descritos.
- Soporta configuración por rol y por organización.
- Soporta escalado de contenidos y usuarios.
