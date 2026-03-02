# TT-113: Checklist de validación de seguridad y aislamiento de datos

Este documento es la **guía de ejecución** del ticket TT-113: validación de seguridad y aislamiento entre inquilinos. Sirve como runbook para pruebas de penetración ligeras, escaneos automatizados y verificación de controles OWASP ASVS Nivel 1.

**Criterios de aceptación (del plan):**

- Informe de vulnerabilidades corregidas (XSS, SQLi, IDOR).
- Verificación exitosa de que el Inquilino A no ve datos del Inquilino B.
- Cumplimiento verificado de los controles Nivel 1 de ASVS.

---

## 1. Prerrequisitos

| Requisito                   | Descripción                                                                                                                                                                                       |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Entorno**                 | Aplicación desplegada o ejecutándose en local (`npm run dev`) con HTTPS en staging/producción.                                                                                                    |
| **Dos inquilinos**          | Al menos dos `tenant_id` (UUID) distintos con datos: usuarios, cursos, matriculaciones. Pueden crearse vía seed o con `TENANT_ID_DEFAULT` y usuarios con `tenantId` distinto en Dexie/PostgreSQL. |
| **Usuarios de prueba**      | Usuario A (tenant 1) y Usuario B (tenant 2), cada uno con sesión (JWT con su `tenantId`).                                                                                                         |
| **Herramientas opcionales** | [OWASP ZAP](https://www.zaproxy.org/) (escaneo automático), [Snyk](https://snyk.io/) (dependencias y/o código).                                                                                   |

### 1.1 Comprobaciones automatizadas (TT-113)

| Acción                            | Comando                 | Descripción                                                                                                                                                                         |
| --------------------------------- | ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Auditoría de dependencias         | `npm run audit`         | Ejecuta `npm audit`; revisar vulnerabilidades High/Critical y documentar en el informe.                                                                                             |
| Tests de seguridad del middleware | `npm run test:security` | Ejecuta los tests en `src/__tests__/middleware.security.test.ts`: 401 sin token, token inválido, token sin tenantId; rutas públicas permitidas. Usa `jest.config.js` (sin ts-node). |
| Escaneo OWASP ZAP baseline        | `npm run security:zap`  | Ejecuta `scripts/run-zap-baseline.sh` contra `http://localhost:3000`. Requiere Docker y app levantada. Para otra URL: `./scripts/run-zap-baseline.sh <URL>`.                        |

---

## 2. Escaneo de vulnerabilidades

### 2.1 OWASP ZAP (automated scan)

1. **Con la app levantada** (ej. `npm run dev`), ejecutar:  
   `npm run security:zap`  
   o con URL distinta: `./scripts/run-zap-baseline.sh https://staging.tu-dominio.com`  
   (Requiere Docker. El script usa `owasp/zap2docker-stable` y `zap-baseline.py -t <URL>`.)
2. **Objetivo:** URL base por defecto `http://localhost:3000`; para staging/producción pasar la URL como argumento.
3. **Qué revisar en el informe:**
   - [ ] **XSS (Cross-Site Scripting):** Sin alertas High/Medium de tipo XSS reflejado o almacenado en rutas públicas o protegidas probadas.
   - [ ] **SQLi:** Sin inyección SQL detectada (en la app actual las queries son vía Dexie/API; si hay API con parámetros, verificar que no se pasen a SQL en crudo).
   - [ ] **Otras:** Cabeceras de seguridad (CSP, X-Frame-Options, etc.) según política; ZAP suele reportar recomendaciones.

**Nota:** Con la app en IndexedDB + Next.js, muchas rutas son estáticas o API Routes; el foco de SQLi será relevante cuando exista backend PostgreSQL con queries parametrizadas.

### 2.2 npm audit y Snyk (dependencias)

1. **npm audit (sin cuenta externa):** En la raíz del proyecto:  
   `npm run audit`  
   Revisar el resultado; para vulnerabilidades High/Critical, ejecutar `npm audit fix` si es posible o documentar excepciones.

2. **Snyk (dependencias y opcionalmente código):**  
   `npm install -g snyk && snyk test`; opcional: `snyk code test`.
3. **Acción:** Registrar vulnerabilidades High/Critical; corregir o documentar excepciones con justificación. Objetivo: informe con “vulnerabilidades corregidas o aceptadas con mitigación”.

### 2.3 Registro de hallazgos

Usar la **Plantilla de informe** (sección 5) para anotar cada hallazgo (XSS, SQLi, IDOR, dependencias) con: descripción, severidad, estado (abierto/corregido/aceptado) y evidencia.

---

## 3. Pruebas de aislamiento multi-tenant (Inquilino A vs B)

Objetivo: **El Inquilino A no debe poder ver ni modificar datos del Inquilino B.**

**📖 Guía práctica detallada**: Ver [TT113_ISOLATION_TESTING_GUIDE.md](./TT113_ISOLATION_TESTING_GUIDE.md) para scripts de ayuda y configuración rápida de datos de prueba.

### 3.1 Listados y vistas

| Prueba                     | Pasos                                                                                | Resultado esperado                   |
| -------------------------- | ------------------------------------------------------------------------------------ | ------------------------------------ |
| Listado de usuarios        | Con sesión de Usuario A (tenant 1), acceder al listado de usuarios (admin o gestor). | Solo aparecen usuarios del tenant 1. |
| Listado de cursos          | Con sesión de Usuario A, listar cursos.                                              | Solo cursos del tenant 1.            |
| Listado de matriculaciones | Con sesión de Usuario A, listar matriculaciones.                                     | Solo las del tenant 1.               |

**Comprobación:** Tener al menos un usuario y un curso en tenant 2; confirmar que no aparecen cuando la sesión es de tenant 1.

### 3.2 IDOR (acceso por ID a recursos de otro inquilino)

Con sesión de **Usuario A (tenant 1)**:

| Prueba                            | Pasos                                                                                                                                                                                                  | Resultado esperado                                                                  |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------- |
| Detalle de usuario de otro tenant | Obtener un `userId` o `courseId` que pertenezca al tenant 2 (p. ej. de una exportación o de otra sesión). Llamar a la API o abrir la URL de detalle (ej. `/dashboard/users/[id]` o `/api/users/[id]`). | **403 Forbidden** o **404**, y en ningún caso datos del usuario/curso del tenant 2. |
| Detalle de curso de otro tenant   | Misma idea con un `courseId` del tenant 2.                                                                                                                                                             | 403 o 404; no mostrar datos del curso del otro inquilino.                           |
| Modificación                      | Si existe API de actualización (ej. PATCH usuario o curso), enviar una petición con el ID de un recurso del tenant 2.                                                                                  | 403 o 404; no aplicar cambios en datos del tenant 2.                                |

**Nota:** En la arquitectura actual (Dexie en el cliente), el filtrado por tenant viene del JWT y del contexto; al pasar a PostgreSQL + RLS, las políticas deben impedir por defecto el acceso entre inquilinos. Estas pruebas validan tanto el middleware/contexto como (en el futuro) el comportamiento con RLS.

### 3.3 Token y cabeceras

| Prueba                        | Pasos                                                                                                                                                                               | Resultado esperado                                                                                                                                       |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Petición sin token            | Llamar a una ruta protegida `/api/*` sin cookie `auth-token` (o sin Authorization).                                                                                                 | **401 Unauthorized**.                                                                                                                                    |
| Token con `tenantId` alterado | Si es posible generar o modificar un JWT (solo en entorno de prueba): usar un JWT con `tenantId` del tenant 2 mientras se intenta acceder a recursos que deberían ser del tenant 1. | Comportamiento coherente: o bien el token no es válido (firma), o bien se ven solo datos del tenant del token (no mezcla).                               |
| Cabecera `X-Tenant-Id`        | Enviar `X-Tenant-Id: <uuid-tenant-2>` con sesión de tenant 1.                                                                                                                       | El servidor **no** debe usar esta cabecera para cambiar de inquilino; debe seguir el `tenantId` del JWT. (Ver ARCHITECTURE_MULTITENANT_AND_SECURITY.md.) |

---

## 4. Controles OWASP ASVS Nivel 1 (relevantes para TalentOS)

Verificación manual o por diseño. Marcar cuando se considere cumplido.

| ID / Área | Control (resumido)                                      | Cómo verificarlo en TalentOS                                                                                    |
| --------- | ------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| **V2.1**  | Contraseñas: longitud mínima, no en claro, hash seguro. | Login: contraseñas hasheadas (Argon2/bcrypt); no se almacenan en claro. Ver `src/lib/auth` y flujo de registro. |
| **V2.2**  | Sesión: gestión segura, timeout, cookie segura.         | JWT en cookie httpOnly; sesión vinculada a tenant. Ver middleware y tenant-context.                             |
| **V4.1**  | Control de acceso: verificación en cada petición.       | Middleware exige JWT + tenantId; rutas protegidas usan `getSessionFromRequest` / `requireTenant`.               |
| **V4.2**  | Negación por defecto.                                   | Rutas `/api/*` protegidas por defecto; lista blanca de rutas públicas (login, session, logout, nextauth, lti).  |
| **V5.1**  | Validación de entrada (lado servidor).                  | Validar con Zod en API Routes; no confiar en body/query sin validar. Revisar rutas que aceptan input.           |
| **V5.2**  | Salida codificada / sanitizada (XSS).                   | React escapa por defecto; revisar `dangerouslySetInnerHTML` si existe; cabeceras CSP si aplica.                 |
| **V5.4**  | Prevención de IDOR.                                     | IDs opacos (UUID v4, TT-103); acceso a recursos solo del tenant del JWT (TT-102, RLS TT-101).                   |
| **V6.1**  | Datos sensibles: no en logs.                            | Auditoría (TT-109) sin contraseñas ni tokens; logs sanitizados.                                                 |
| **V7.1**  | Criptografía: estándares y gestión de claves.           | Cifrado PII (TT-104); ENCRYPTION_SECRET desde Key Vault en prod; HTTPS/TLS documentado.                         |

Al finalizar, anotar en el informe: “Controles ASVS Nivel 1 revisados: [lista de V.x] cumplidos; [lista] con observaciones”.

---

## 5. Plantilla de informe TT-113

### 5.1 Metadatos

- **Fecha de ejecución:** ******\_\_\_******
- **Entorno:** [ ] Local [ ] Staging [ ] Producción
- **URL base:** ******\_\_\_******
- **Ejecutor:** ******\_\_\_******

### 5.2 Vulnerabilidades (XSS, SQLi, IDOR, dependencias)

| ID  | Descripción | Severidad (H/M/L) | Estado (Abierto/Corregido/Aceptado) | Evidencia / Notas |
| --- | ----------- | ----------------- | ----------------------------------- | ----------------- |
| 1   |             |                   |                                     |                   |
| 2   |             |                   |                                     |                   |

### 5.3 Aislamiento multi-tenant

| Prueba                                          | Resultado (OK / Fallo) | Notas |
| ----------------------------------------------- | ---------------------- | ----- |
| Listados: solo datos del tenant de la sesión    |                        |       |
| IDOR: acceso a usuario de otro tenant (403/404) |                        |       |
| IDOR: acceso a curso de otro tenant (403/404)   |                        |       |
| Petición sin token → 401                        |                        |       |
| No uso de X-Tenant-Id para cambiar tenant       |                        |       |

### 5.4 ASVS Nivel 1

- Controles verificados: ******\_\_\_******
- Observaciones o excepciones: ******\_\_\_******

### 5.5 Conclusión

- [ ] Criterios de aceptación de TT-113 cumplidos.
- [ ] Pendiente: (listar tareas de corrección o seguimiento).

---

_Documento asociado al ticket TT-113 del [Plan de Migración](./MIGRATION_PLAN_TICKETS.md)._
