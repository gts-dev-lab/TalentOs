# TalentOS

**Plataforma de Formación Corporativa con IA**  
LMS moderno, multi-inquilino y extensible para empresas que quieren potenciar el talento de sus equipos.

---

## ¿Qué es TalentOS?

TalentOS es un sistema de gestión del aprendizaje (LMS) empresarial que combina formación estructurada con inteligencia artificial. Las organizaciones pueden crear, gestionar y personalizar itinerarios formativos a escala, con soporte nativo para los principales estándares del sector y una experiencia de usuario moderna.

## Motivación

Las plataformas LMS tradicionales suelen ser rígidas, lentas de configurar y poco adaptables a las necesidades reales de los equipos. TalentOS nació para cambiar eso: una plataforma que cualquier empresa pueda desplegar y usar sin fricciones, con IA integrada desde el primer día para personalizar la experiencia de cada empleado.

## Características principales

**Formación estructurada** — Diseña cursos con capítulos, lecciones y materiales. Gestiona matriculaciones, seguimiento del progreso y emisión de certificaciones desde un único lugar.

**Inteligencia Artificial con Genkit** — Generación automática de contenido, tutor virtual conversacional, recomendaciones personalizadas de cursos y feedback inteligente, todo impulsado por Google Gemini.

**Multi-inquilino (SaaS)** — Una sola instancia sirve a múltiples organizaciones con aislamiento completo de datos mediante PostgreSQL RLS y contexto JWT por inquilino.

**Estándares del sector** — Compatibilidad con LTI 1.3, SCORM 2004, RGPD/ARCO y OWASP ASVS.

**Dual backend** — Dexie.js (IndexedDB) para desarrollo local y PostgreSQL para producción.

## Bajo el capó

- **Next.js 15** — Framework full-stack con App Router.
- **TypeScript** — Tipado estricto en toda la aplicación.
- **Tailwind CSS + Shadcn/ui** — Interfaz moderna y accesible.
- **Genkit (Google Gemini)** — Capa de IA para generación y personalización.
- **Dexie.js / PostgreSQL** — Persistencia local o en servidor según el entorno.
- **JWT + NextAuth** — Autenticación modular con contexto multi-inquilino.

---

## Estado actual del proyecto

**Fase 1**: 12/13 tickets completados (92%)  
**Fase 2 (PostgreSQL)**: TT-114 ~40%, TT-115 y TT-116 completados, TT-117 pendiente

> **Nota sobre los tickets**: Los identificadores TT-XXX son referencias internas de desarrollo (equivalentes a issues de GitHub/Jira). No forman parte del modelo de negocio de la aplicación ni representan funcionalidades de tickets de soporte para usuarios finales.

---

## Sistema de tickets: qué son y qué NO son

### Qué son los tickets en TalentOS

Los **tickets** son únicamente una forma de **dividir, organizar y seguir las tareas pendientes de desarrollo** de la aplicación. Documentados en `docs/MIGRATION_PLAN_TICKETS.md`.

- **Identificadores:** TT-101, TT-102, TT-103 … TT-117
- **Significado:** Tareas técnicas concretas (equivalente a issues o tickets de JIRA/GitHub)
- **Uso:** Planificar, ejecutar y verificar el progreso del desarrollo
- **Estado:** Ver tabla en `docs/MIGRATION_STATUS.md`

### Qué NO son los tickets

- **NO** es un sistema de negocio
- **NO** existen tickets de soporte, incidencias, solicitudes de usuarios ni flujos de atención
- **NO** forman parte del modelo de dominio de la aplicación
- En el código: **no existen entidades llamadas "tickets"** ni lógica de negocio asociada

### Entidades del dominio (no confundir con tickets)

Algunas entidades (Enrollment, PDI, ComplianceAudit, Course) tienen ciclos de vida con estados. **No deben confundirse con tickets ni documentarse como tales.** Son entidades de negocio independientes.

Si en el futuro se añade un sistema de tickets de negocio (soporte, incidencias, etc.), se tratará como una funcionalidad nueva e independiente.

---

## Despliegue en producción

### Hosting gestionado

La forma más sencilla de ejecutar TalentOS en producción es usando un proveedor de hosting con soporte para aplicaciones Next.js (Vercel, Railway, Render, etc.).

### Self-hosting

**Paso 1: Clona el repositorio**

```bash
git clone https://github.com/tu-org/talentos.git
cd talentos
```

**Paso 2: Configura las variables de entorno**

```bash
cp .env.example .env.local
```

Edita `.env.local` con tus valores:

```env
DB_PROVIDER=postgres
DATABASE_URL=postgresql://user:password@host:5432/talentos
JWT_SECRET=tu-secreto-de-produccion
TENANT_ID_DEFAULT=uuid-del-tenant-por-defecto
ENCRYPTION_SECRET=clave-de-cifrado-minimo-32-bytes
```

**Paso 3: Instala dependencias y compila**

```bash
npm install
npm run build
npm start
```

La aplicación estará disponible en el puerto 3000.

---

## Entorno de desarrollo

**Paso 1: Clona el repositorio e instala dependencias**

```bash
git clone https://github.com/tu-org/talentos.git
cd talentos
npm install
```

**Paso 2: Configura las variables de entorno para desarrollo**

```bash
cp .env.example .env.local
```

En desarrollo puedes usar Dexie (IndexedDB) sin necesidad de PostgreSQL:

```env
DB_PROVIDER=dexie
JWT_SECRET=secreto-desarrollo
TENANT_ID_DEFAULT=00000000-0000-0000-0000-000000000001
ENCRYPTION_SECRET=clave-desarrollo-minimo-32-bytes-aqui
```

**Paso 3: Inicia el servidor de desarrollo**

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

---

## Variables de entorno

| Variable            | Descripción                          | Requerida             |
| ------------------- | ------------------------------------ | --------------------- |
| `DB_PROVIDER`       | Motor de datos: `dexie` o `postgres` | No (default: `dexie`) |
| `DATABASE_URL`      | URL de conexión PostgreSQL           | Solo con `postgres`   |
| `JWT_SECRET`        | Clave de firma para tokens JWT       | Sí                    |
| `TENANT_ID_DEFAULT` | UUID del inquilino por defecto       | Sí                    |
| `ENCRYPTION_SECRET` | Clave de cifrado PII (≥32 bytes)     | Sí                    |

---

## Documentación técnica

| Documento                                                                      | Descripción                                   |
| ------------------------------------------------------------------------------ | --------------------------------------------- |
| [Arquitectura del sistema](./README_ARCHITECTURE.md)                           | Diagramas y decisiones de diseño              |
| [Guía de desarrollo](./README_DEV.md)                                          | Convenciones y mejores prácticas              |
| [Seguridad y multi-inquilino](./docs/ARCHITECTURE_MULTITENANT_AND_SECURITY.md) | Implementación de seguridad                   |
| [Plan de migración](./docs/MIGRATION_PLAN_TICKETS.md)                          | Tickets y roadmap de desarrollo               |
| [Estado de migración](./docs/MIGRATION_STATUS.md)                              | Progreso actual del proyecto                  |
| [Deuda técnica](./docs/TECH_DEBT.md)                                           | Issues de código y arquitectura identificados |

---

## Seguridad y cumplimiento

TalentOS está diseñado con seguridad desde el primer nivel:

- **OWASP ASVS** para verificación de seguridad de aplicaciones.
- **RGPD / ARCO** para gestión de derechos sobre datos personales.
- **RLS (Row Level Security)** para aislamiento estricto por inquilino en PostgreSQL.
- **Cifrado de PII** — datos personales cifrados en reposo.

---

## Comunidad y soporte

- [Abre un issue](https://github.com/tu-org/talentos/issues) para reportar bugs o proponer mejoras.
- [Discusiones](https://github.com/tu-org/talentos/discussions) para preguntas y feedback.
