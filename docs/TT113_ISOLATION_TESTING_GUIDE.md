# Guía Práctica: Pruebas de Aislamiento Multi-Tenant (TT-113)

Esta guía te ayuda a ejecutar las pruebas manuales de aislamiento entre inquilinos requeridas para completar TT-113.

---

## 🎯 Objetivo

Verificar que **el Inquilino A no puede ver ni acceder a datos del Inquilino B**, incluso conociendo IDs de recursos del otro inquilino (prevención de IDOR).

---

## 📋 Prerrequisitos

1. **App levantada**: `npm run dev` (puerto 3000)
2. **Dos inquilinos de prueba** con datos (usuarios, cursos, matriculaciones)
3. **Dos sesiones de navegador** (o modo incógnito + normal) para simular dos usuarios de distintos inquilinos

---

## 🚀 Configuración Rápida: Crear Datos de Prueba

### Opción 1: Usar la Consola del Navegador

1. Abre la app en `http://localhost:3000`
2. Abre DevTools (F12) → Console
3. Ejecuta el siguiente código para crear dos inquilinos con datos:

```javascript
// Helper para crear datos de prueba multi-tenant
async function setupTenantIsolationTest() {
  const { db } = await import('/src/lib/db.ts');
  const { uuid } = await import('/src/lib/uuid.ts');

  // UUIDs de prueba para los dos inquilinos
  const TENANT_A = 'aaaaaaaa-1111-4aaa-aaaa-111111111111';
  const TENANT_B = 'bbbbbbbb-2222-4bbb-bbbb-222222222222';

  // Crear usuarios para Tenant A
  const userA1 = await db.addUser({
    name: 'Usuario A1',
    email: 'usuario-a1@tenant-a.test',
    password: 'password123',
    role: 'Administrador General',
    department: 'Administración',
    tenantId: TENANT_A,
  });

  const userA2 = await db.addUser({
    name: 'Usuario A2',
    email: 'usuario-a2@tenant-a.test',
    password: 'password123',
    role: 'Trabajador',
    department: 'Técnicos de Emergencias',
    tenantId: TENANT_A,
  });

  // Crear curso para Tenant A
  const courseA = await db.addCourse({
    title: 'Curso Tenant A',
    description: 'Este curso pertenece al Tenant A',
    longDescription: 'Descripción larga del curso del Tenant A',
    instructor: 'Instructor A',
    duration: '2 horas',
    modality: 'Online',
    image: '',
    aiHint: '',
    modules: [{ id: uuid(), title: 'Módulo A1', duration: '30 min', content: 'Contenido A1' }],
    status: 'published',
    tenantId: TENANT_A,
  });

  // Crear usuarios para Tenant B
  const userB1 = await db.addUser({
    name: 'Usuario B1',
    email: 'usuario-b1@tenant-b.test',
    password: 'password123',
    role: 'Administrador General',
    department: 'Administración',
    tenantId: TENANT_B,
  });

  const userB2 = await db.addUser({
    name: 'Usuario B2',
    email: 'usuario-b2@tenant-b.test',
    password: 'password123',
    role: 'Trabajador',
    department: 'Teleoperadores',
    tenantId: TENANT_B,
  });

  // Crear curso para Tenant B
  const courseB = await db.addCourse({
    title: 'Curso Tenant B',
    description: 'Este curso pertenece al Tenant B',
    longDescription: 'Descripción larga del curso del Tenant B',
    instructor: 'Instructor B',
    duration: '3 horas',
    modality: 'Presencial',
    image: '',
    aiHint: '',
    modules: [{ id: uuid(), title: 'Módulo B1', duration: '45 min', content: 'Contenido B1' }],
    status: 'published',
    tenantId: TENANT_B,
  });

  console.log('✅ Datos de prueba creados:');
  console.log('Tenant A:', { userA1: userA1.id, userA2: userA2.id, courseA: courseA.id });
  console.log('Tenant B:', { userB1: userB1.id, userB2: userB2.id, courseB: courseB.id });
  console.log('\nCredenciales Tenant A:');
  console.log('  - usuario-a1@tenant-a.test / password123');
  console.log('  - usuario-a2@tenant-a.test / password123');
  console.log('\nCredenciales Tenant B:');
  console.log('  - usuario-b1@tenant-b.test / password123');
  console.log('  - usuario-b2@tenant-b.test / password123');

  return { TENANT_A, TENANT_B, userA1, userA2, courseA, userB1, userB2, courseB };
}

// Ejecutar
setupTenantIsolationTest().catch(console.error);
```

**Nota**: Si los imports no funcionan directamente en la consola, puedes crear los usuarios manualmente desde la UI de administración, asegurándote de asignar `tenantId` distintos.

### Opción 2: Modificar Datos Seed

Edita `src/lib/data.ts` o `src/lib/db-providers/dexie.ts` para añadir usuarios con `tenantId` distintos en los datos iniciales.

---

## ✅ Checklist de Pruebas

### 1. Pruebas de Listados (Inquilino A no ve datos de Inquilino B)

| Prueba                         | Pasos                                                                                                    | Resultado Esperado                                                                      | ✅/❌ |
| ------------------------------ | -------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- | ----- |
| **Listado de usuarios**        | 1. Login como `usuario-a1@tenant-a.test`<br>2. Ir a `/dashboard/users`<br>3. Verificar usuarios visibles | Solo aparecen `Usuario A1` y `Usuario A2`. **NO** aparece `Usuario B1` ni `Usuario B2`. |       |
| **Listado de cursos**          | 1. Con sesión de Tenant A<br>2. Ir a `/dashboard/courses`<br>3. Verificar cursos visibles                | Solo aparece `Curso Tenant A`. **NO** aparece `Curso Tenant B`.                         |       |
| **Listado de matriculaciones** | 1. Con sesión de Tenant A<br>2. Ir a `/dashboard/enrollments`<br>3. Verificar matriculaciones            | Solo aparecen matriculaciones de usuarios del Tenant A.                                 |       |

### 2. Pruebas IDOR (Insecure Direct Object Reference)

| Prueba                                     | Pasos                                                                                                                                                                             | Resultado Esperado                                                                       | ✅/❌ |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- | ----- |
| **Acceso a usuario de otro tenant**        | 1. Con sesión de Tenant A<br>2. Obtener `userId` de `Usuario B1` (de la consola o exportación)<br>3. Intentar acceder a `/dashboard/users/[userId-B1]` o `/api/users/[userId-B1]` | **403 Forbidden** o **404 Not Found**. En ningún caso se muestran datos de `Usuario B1`. |       |
| **Acceso a curso de otro tenant**          | 1. Con sesión de Tenant A<br>2. Obtener `courseId` de `Curso Tenant B`<br>3. Intentar acceder a `/dashboard/courses/[courseId-B]` o `/api/courses/[courseId-B]`                   | **403** o **404**. No se muestran datos del curso del Tenant B.                          |       |
| **Modificación de recurso de otro tenant** | 1. Con sesión de Tenant A<br>2. Intentar actualizar un curso del Tenant B (si existe API PATCH/PUT)<br>3. Enviar petición con `courseId` del Tenant B                             | **403** o **404**. No se aplican cambios en recursos del Tenant B.                       |       |

### 3. Pruebas de Token y Middleware

| Prueba                            | Pasos                                                                                                                             | Resultado Esperado                                                                                              | ✅/❌ |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- | ----- |
| **Petición sin token**            | 1. Abrir DevTools → Network<br>2. Hacer petición a `/api/users` sin cookie `auth-token`<br>3. Verificar respuesta                 | **401 Unauthorized** con mensaje "Missing or invalid auth token".                                               |       |
| **Token con tenantId alterado**   | 1. (Solo en entorno de prueba) Modificar el JWT para cambiar `tenantId`<br>2. Intentar acceder a recursos                         | Comportamiento coherente: o el token es inválido (firma), o se ven solo datos del tenant del token (no mezcla). |       |
| **Cabecera X-Tenant-Id ignorada** | 1. Con sesión de Tenant A<br>2. Enviar petición con header `X-Tenant-Id: <tenant-B-uuid>`<br>3. Verificar que no cambia el tenant | El servidor **NO** usa esta cabecera; sigue usando el `tenantId` del JWT. Solo se ven datos del Tenant A.       |       |

---

## 🔍 Cómo Verificar el tenantId en una Sesión

En la consola del navegador (con sesión activa):

```javascript
// Ver el token JWT actual
document.cookie
  .split('; ')
  .find(row => row.startsWith('auth-token='))
  ?.split('=')[1];

// Decodificar el payload (sin verificar firma)
const token = document.cookie
  .split('; ')
  .find(row => row.startsWith('auth-token='))
  ?.split('=')[1];
if (token) {
  const payload = JSON.parse(atob(token.split('.')[1]));
  console.log('Tenant ID en token:', payload.tenantId);
  console.log('Usuario:', payload.email);
}
```

---

## 📝 Registro de Resultados

Usa la **Plantilla de informe** en `docs/TT113_SECURITY_QA_CHECKLIST.md` (sección 5) para documentar:

- ✅ Pruebas que pasaron correctamente
- ❌ Pruebas que fallaron (con detalles del error)
- 🔍 Observaciones o comportamientos inesperados

---

## 🐛 Troubleshooting

### "No veo el campo tenantId al crear usuarios"

- En la UI actual, `tenantId` puede asignarse automáticamente desde `TENANT_ID_DEFAULT` o desde el usuario logueado.
- Para pruebas manuales, puedes modificar temporalmente `src/lib/db-providers/dexie.ts` en `addUser` para aceptar `tenantId` explícito, o usar la consola del navegador como se muestra arriba.

### "Los usuarios de ambos tenants aparecen en los listados"

- Verifica que el middleware esté activo (`src/middleware.ts`).
- Verifica que el contexto de tenant (`src/lib/tenant-context.ts`) esté extrayendo correctamente el `tenantId` del JWT.
- Revisa que las queries en `getAllUsers`, `getAllCourses`, etc. filtren por `tenantId` del contexto actual.

### "Las pruebas pasan en Dexie pero fallarán en PostgreSQL"

- Correcto: en Dexie (cliente), el filtrado es responsabilidad de la aplicación.
- En PostgreSQL con RLS (TT-101), las políticas RLS filtran automáticamente. Las pruebas validadas aquí también aplican cuando se use PostgreSQL.

---

## ✅ Criterios de Aceptación (TT-113)

- [ ] **Listados**: Inquilino A solo ve sus propios datos (usuarios, cursos, matriculaciones).
- [ ] **IDOR**: Intentos de acceso a recursos de otro tenant devuelven 403/404.
- [ ] **Token**: Peticiones sin token devuelven 401.
- [ ] **Cabeceras**: `X-Tenant-Id` no puede usarse para cambiar de tenant.

---

_Guía asociada al ticket TT-113. Ver también: [TT113_SECURITY_QA_CHECKLIST.md](./TT113_SECURITY_QA_CHECKLIST.md)_
