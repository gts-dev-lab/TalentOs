# Tickets de Producción Pendientes — TalentOS

Este documento contiene los tickets de producción y mejora continua posteriores a la migración multi-tenant. Son tareas técnicas para preparar el sistema para producción y mejorar funcionalidades existentes.

**Relación con otros documentos:**
- **Plan de migración:** [MIGRATION_PLAN_TICKETS.md](./MIGRATION_PLAN_TICKETS.md) — tickets TT-101 a TT-117 (base del sistema)
- **Estado de migración:** [MIGRATION_STATUS.md](./MIGRATION_STATUS.md) — progreso del plan base

---

## Resumen ejecutivo

| Métrica | Valor |
|---------|-------|
| **Total de tickets de producción** | 15 |
| **Prioridad crítica** | 3 |
| **Prioridad alta** | 5 |
| **Prioridad media** | 4 |
| **Prioridad baja** | 3 |
| **Story Points totales** | 89 |

---

## EPIC-PRODUCTION — Preparación para Producción

### Tickets críticos (deben completarse antes de producción)

| ID | Título | Descripción técnica concisa | Dependencias | SP | Priority | Criterios de aceptación |
|----|--------|-----------------------------|--------------|----|----------|-------------------------|
| **PROD-101** | Completar TT-113: Validación de Seguridad y Aislamiento | Ejecutar pruebas de penetración, escaneos automatizados (ZAP, Snyk) y verificación manual de aislamiento multi-tenant. | TT-101 a TT-112 | 8 | **Critical** | • Informe de vulnerabilidades corregidas (XSS, SQLi, IDOR).<br>• Verificación exitosa de aislamiento entre inquilinos.<br>• Cumplimiento de controles OWASP ASVS Nivel 1.<br>• Checklist en `TT113_SECURITY_QA_CHECKLIST.md` completado. |
| **PROD-102** | Completar TT-114: Provider PostgreSQL (~60% pendiente) | Implementar métodos restantes del provider PostgreSQL: Certificates, Forum, Notifications, Resources, Announcements, Chat, Calendar, ExternalTraining, Costs, Badges, AI, LearningPaths, PDI, Ratings, Permissions, Logs, Regulations/Compliance. | TT-101, TT-102, TT-115 | 21 | **Critical** | • Todos los métodos de `DBProvider` implementados en `postgres.ts`.<br>• Cada método ejecuta `SET app.current_tenant_id` correctamente.<br>• Paridad funcional con `dexieProvider`.<br>• Tests unitarios para cada método. |
| **PROD-103** | Completar TT-117: Tests de Integración PostgreSQL + RLS | Crear suite de tests que valide aislamiento multi-tenant con PostgreSQL real usando Docker/testcontainers. | PROD-102 | 8 | **Critical** | • Tests con PostgreSQL en Docker.<br>• Verificación de que queries sin `SET` devuelven 0 filas.<br>• Verificación de que queries con `SET` devuelven solo datos del tenant correcto.<br>• Tests de intentos de acceso cross-tenant (deben fallar). |

---

## EPIC-API — Migración y Documentación de API Routes

| ID | Título | Descripción técnica concisa | Dependencias | SP | Priority | Criterios de aceptación |
|----|--------|-----------------------------|--------------|----|----------|-------------------------|
| **PROD-104** | Envolver API Routes con withTenant | Identificar y envolver todas las rutas API que accedan a datos por tenant con `withTenant()` de `src/lib/api-with-tenant.ts`. | PROD-102 | 5 | **High** | • Todas las rutas en `src/app/api/` que usen BD están envueltas con `withTenant`.<br>• Rutas públicas (login, session, lti) excluidas correctamente.<br>• `getCurrentTenantId()` disponible en todos los handlers. |
| **PROD-105** | Documentación de API Routes | Crear documentación OpenAPI/Swagger para todas las API Routes del sistema. | PROD-104 | 5 | **High** | • Archivo `openapi.yaml` o `swagger.json` en raíz.<br>• Documentación de endpoints, parámetros, respuestas y códigos de error.<br>• Ejemplos de uso para cada endpoint.<br>• Documentación de autenticación (JWT). |

---

## EPIC-TESTING — Cobertura de Tests

| ID | Título | Descripción técnica concisa | Dependencias | SP | Priority | Criterios de aceptación |
|----|--------|-----------------------------|--------------|----|----------|-------------------------|
| **PROD-106** | Tests Unitarios de Componentes UI | Crear tests para componentes críticos usando React Testing Library. | — | 8 | **High** | • Tests para componentes en `src/components/`.<br>• Cobertura mínima del 70% en componentes críticos.<br>• Tests de interacción de usuario (clicks, formularios).<br>• Tests de renderizado condicional. |
| **PROD-107** | Tests de Integración de Flujos de Negocio | Crear tests end-to-end para flujos críticos: registro, login, matriculación, progreso de curso, certificación. | PROD-103 | 13 | **High** | • Tests E2E con Playwright o Cypress.<br>• Flujos completos de usuario simulados.<br>• Tests con datos de múltiples tenants.<br>• Verificación de aislamiento en flujos. |
| **PROD-108** | Tests de Carga y Rendimiento | Ejecutar pruebas de carga para identificar cuellos de botella y límites de escalabilidad. | PROD-103 | 8 | **Medium** | • Tests con herramientas como k6 o Artillery.<br>• Simulación de 100+ usuarios concurrentes.<br>• Identificación de queries lentas.<br>• Informe de métricas de rendimiento. |

---

## EPIC-BUSINESS — Mejoras de Funcionalidades de Negocio

| ID | Título | Descripción técnica concisa | Dependencias | SP | Priority | Criterios de aceptación |
|----|--------|-----------------------------|--------------|----|----------|-------------------------|
| **PROD-109** | Documentar y Validar Transiciones de Estados de Enrollment | Crear diagrama de estados y validaciones para transiciones permitidas de Enrollment (pending → approved → active → completed, etc.). | — | 3 | **Medium** | • Diagrama de estados en documentación.<br>• Validación en código de transiciones no permitidas.<br>• Tests de transiciones válidas e inválidas.<br>• Documentación en `README_ARCHITECTURE.md`. |
| **PROD-110** | Automatizaciones para PDI (Notificaciones y Recordatorios) | Implementar sistema de notificaciones automáticas cuando un PDI cambia de estado o se acerca una fecha límite de milestone. | — | 5 | **Medium** | • Job/cron que revisa PDIs activos.<br>• Notificaciones a empleado y manager en cambios de estado.<br>• Recordatorios 7 días antes de vencimiento de milestones.<br>• Configuración de frecuencia de notificaciones. |
| **PROD-111** | Dashboard de Vencimientos de Compliance | Crear vista de alertas y vencimientos próximos de cumplimiento normativo para gestores. | — | 5 | **Medium** | • Vista en `/dashboard/compliance` con alertas.<br>• Filtros por regulación, departamento, rol.<br>• Indicadores visuales (rojo: vencido, amarillo: próximo).<br>• Exportación de reporte de vencimientos. |

---

## EPIC-DEVOPS — Infraestructura y Deployment

| ID | Título | Descripción técnica concisa | Dependencias | SP | Priority | Criterios de aceptación |
|----|--------|-----------------------------|--------------|----|----------|-------------------------|
| **PROD-112** | Configuración de Entornos (Dev, Staging, Prod) | Crear configuraciones separadas y documentadas para cada entorno con variables de entorno específicas. | — | 3 | **High** | • Archivos `.env.development`, `.env.staging`, `.env.production`.<br>• Documentación de variables requeridas por entorno.<br>• Scripts de validación de configuración.<br>• Secrets management documentado (Key Vault). |
| **PROD-113** | CI/CD Pipeline | Configurar pipeline de integración y despliegue continuo con GitHub Actions o similar. | PROD-106, PROD-107 | 8 | **High** | • Pipeline que ejecuta tests en cada PR.<br>• Build y deploy automático a staging en merge a `develop`.<br>• Deploy a producción manual con aprobación.<br>• Notificaciones de fallos en pipeline. |
| **PROD-114** | Monitoreo y Logging en Producción | Implementar sistema de monitoreo (métricas, logs, alertas) usando herramientas como Sentry, DataDog o similar. | — | 5 | **Medium** | • Integración con Sentry para errores de frontend/backend.<br>• Logs estructurados con niveles (DEBUG, INFO, WARN, ERROR).<br>• Alertas configuradas para errores críticos.<br>• Dashboard de métricas (uptime, latencia, errores). |

---

## EPIC-DOCS — Documentación de Usuario y Operaciones

| ID | Título | Descripción técnica concisa | Dependencias | SP | Priority | Criterios de aceptación |
|----|--------|-----------------------------|--------------|----|----------|-------------------------|
| **PROD-115** | Manual de Usuario Final | Crear documentación para usuarios finales (trabajadores, formadores, gestores) sobre cómo usar la plataforma. | — | 5 | **Low** | • Guías por rol (trabajador, formador, gestor, admin).<br>• Capturas de pantalla de flujos principales.<br>• FAQs comunes.<br>• Formato accesible (PDF + web). |
| **PROD-116** | Runbook de Operaciones | Crear guía para operaciones: backup, restore, troubleshooting, escalado, mantenimiento. | PROD-112 | 3 | **Low** | • Procedimientos de backup y restore.<br>• Troubleshooting de problemas comunes.<br>• Procedimientos de escalado horizontal/vertical.<br>• Contactos de soporte y escalación. |
| **PROD-117** | Guía de Onboarding de Nuevos Inquilinos | Documentar proceso de alta de nuevos inquilinos (tenants) en el sistema SaaS. | PROD-102 | 3 | **Low** | • Script o procedimiento de creación de tenant.<br>• Checklist de configuración inicial.<br>• Asignación de usuarios admin por tenant.<br>• Verificación de aislamiento post-creación. |

---

## Estado de implementación

| Ticket | Estado | Notas |
|--------|--------|--------|
| **PROD-101** | ⏳ Pendiente | Depende de completar checklist TT-113 |
| **PROD-102** | ⏳ Pendiente | ~40% completado en TT-114 |
| **PROD-103** | ⏳ Pendiente | Requiere PROD-102 completo |
| **PROD-104** | ⏳ Pendiente | — |
| **PROD-105** | ⏳ Pendiente | — |
| **PROD-106** | ⏳ Pendiente | — |
| **PROD-107** | ⏳ Pendiente | — |
| **PROD-108** | ⏳ Pendiente | — |
| **PROD-109** | ⏳ Pendiente | — |
| **PROD-110** | ⏳ Pendiente | — |
| **PROD-111** | ⏳ Pendiente | — |
| **PROD-112** | ⏳ Pendiente | — |
| **PROD-113** | ⏳ Pendiente | — |
| **PROD-114** | ⏳ Pendiente | — |
| **PROD-115** | ⏳ Pendiente | — |
| **PROD-116** | ⏳ Pendiente | — |
| **PROD-117** | ⏳ Pendiente | — |

---

## Orden sugerido de implementación

### Fase 1: Pre-Producción (Crítico)
1. **PROD-101** (TT-113: Seguridad)
2. **PROD-102** (TT-114: Provider PostgreSQL)
3. **PROD-103** (TT-117: Tests PostgreSQL)
4. **PROD-104** (withTenant en API Routes)

### Fase 2: Preparación de Infraestructura (Alta prioridad)
5. **PROD-112** (Configuración de entornos)
6. **PROD-113** (CI/CD Pipeline)
7. **PROD-105** (Documentación API)

### Fase 3: Calidad y Testing (Alta prioridad)
8. **PROD-106** (Tests unitarios UI)
9. **PROD-107** (Tests E2E)

### Fase 4: Mejoras de Negocio (Media prioridad)
10. **PROD-109** (Transiciones Enrollment)
11. **PROD-110** (Automatizaciones PDI)
12. **PROD-111** (Dashboard Compliance)
13. **PROD-108** (Tests de carga)
14. **PROD-114** (Monitoreo)

### Fase 5: Documentación (Baja prioridad)
15. **PROD-115** (Manual de usuario)
16. **PROD-116** (Runbook operaciones)
17. **PROD-117** (Onboarding tenants)

---

## Notas importantes

1. **Tickets PROD-101, PROD-102, PROD-103** son continuación directa de TT-113, TT-114, TT-117 del plan de migración.
2. **No confundir** estos tickets de producción con funcionalidades de negocio. Son tareas técnicas de infraestructura, testing y operaciones.
3. Los tickets de mejoras de negocio (PROD-109 a PROD-111) mejoran entidades existentes (Enrollment, PDI, Compliance), no crean sistemas nuevos.
4. Antes de producción, completar al menos **Fase 1 y Fase 2**.
