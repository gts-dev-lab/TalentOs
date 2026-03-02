# Guía de Pruebas Funcionales - TalentOS

**Fecha**: 24 de enero de 2026  
**Versión**: 1.0  
**Estado**: ✅ Servidor funcionando, listo para pruebas

---

## 🎯 Objetivo

Esta guía te llevará paso a paso por todas las funcionalidades principales de TalentOS para verificar que todo funciona correctamente.

---

## ⚙️ Pre-requisitos

✅ **Completado**:

- [x] Servidor Next.js corriendo en http://localhost:3000
- [x] .env.local configurado con JWT_SECRET, NEXTAUTH_URL, NEXTAUTH_SECRET
- [x] Menú hamburguesa implementado
- [x] Errores de compilación corregidos
- [x] NextAuth + Authentik SSO (opcional): ver `docs/AUTHENTIK_SETUP.md`

---

## 📋 Plan de Pruebas

### FASE 1: Autenticación y Navegación (15 min)

#### 1.1 Login y Dashboard Principal

```
URL: http://localhost:3000
```

**Pasos:**

1. Abre http://localhost:3000 en el navegador
2. Deberías ver la página de login
3. Opción A – **Cuentas de prueba**: haz clic en **Elena Vargas** (o cualquier usuario); se rellenan email y contraseña. Pulsa "Iniciar Sesión".
4. Opción B – **Manual**: Email `elena.vargas@example.com`, Password `password123`, luego "Iniciar Sesión"

**Resultado esperado:**

- ✅ Redirección a `/dashboard`
- ✅ Ver panel principal con estadísticas
- ✅ Sidebar visible con menú de navegación
- ✅ Avatar y nombre de usuario en header

**Puntos a verificar:**

- [ ] Dashboard carga sin errores
- [ ] Estadísticas se muestran correctamente
- [ ] No hay errores rojos en consola (F12)

---

#### 1.2 Menú Hamburguesa

**Pasos:**

1. Click en el ícono ☰ (esquina superior izquierda)
2. Observa la animación del sidebar

**Resultado esperado:**

- ✅ Sidebar se colapsa/expande suavemente
- ✅ En desktop: sidebar se reduce a solo íconos (72px)
- ✅ En móvil: sidebar se oculta completamente
- ✅ Transición suave de 300ms

**Puntos a verificar:**

- [ ] Animación funciona correctamente
- [ ] Íconos permanecen visibles cuando colapsado
- [ ] Tooltips aparecen al pasar sobre íconos
- [ ] No hay saltos o glitches visuales

---

#### 1.3 Navegación General

**Pasos:**

1. Click en cada ítem del sidebar:
   - Dashboard
   - Cursos
   - Mis Cursos
   - Usuarios (si eres admin)
   - Chat
   - Calendario
   - Análisis
   - Configuración

**Resultado esperado:**

- ✅ Cada página carga correctamente
- ✅ URL cambia en el navegador
- ✅ Título del header se actualiza

**Puntos a verificar:**

- [ ] Todas las rutas funcionan
- [ ] No hay páginas en blanco
- [ ] No hay errores 404

---

### FASE 2: Gestión de Cursos (20 min)

#### 2.1 Listado de Cursos

```
URL: http://localhost:3000/dashboard/courses
```

**Pasos:**

1. Navega a "Cursos"
2. Observa el catálogo de cursos

**Resultado esperado:**

- ✅ Grid de cursos (4 columnas en desktop)
- ✅ Cards con imagen, título, descripción
- ✅ Paginación funcionando (12 cursos por página)
- ✅ Filtros por modalidad (Online, Presencial, Mixta)
- ✅ Barra de búsqueda funcional

**Pruebas específicas:**

```
Búsqueda:
1. Escribe "JavaScript" en la búsqueda
2. Presiona Enter
3. Deberías ver solo cursos relacionados con JavaScript

Filtros:
1. Click en "Filtrar"
2. Desmarca "Online"
3. Solo se muestran cursos Presenciales/Mixtos

Paginación:
1. Si hay más de 12 cursos, verás números de página
2. Click en página 2
3. La página hace scroll al inicio automáticamente
```

**Puntos a verificar:**

- [ ] Cursos cargan correctamente
- [ ] Búsqueda funciona en tiempo real
- [ ] Filtros se aplican correctamente
- [ ] Paginación cambia el contenido
- [ ] Contador "Mostrando X - Y de Z" correcto

---

#### 2.2 Crear Nuevo Curso (Solo Admin)

**Pasos:**

1. Click en "Crear Curso" (botón azul)
2. Rellena el formulario:
   - **Título**: "Curso de Prueba"
   - **Descripción**: "Este es un curso de prueba"
   - **Modalidad**: Online
   - **Duración**: 20 horas
   - **Estado**: Publicado
3. Añade un módulo:
   - **Título**: "Introducción"
   - **Tipo**: Vídeo
   - **Duración**: 30 minutos
4. Click en "Crear Curso"

**Resultado esperado:**

- ✅ Curso creado exitosamente
- ✅ Redirección al listado de cursos
- ✅ Nuevo curso aparece en el catálogo
- ✅ Toast notification de éxito

**Puntos a verificar:**

- [ ] Formulario valida campos requeridos
- [ ] Se pueden añadir múltiples módulos
- [ ] Curso aparece en el listado
- [ ] Datos se guardan correctamente

---

#### 2.3 Ver Detalle de Curso

**Pasos:**

1. Click en cualquier curso del catálogo
2. Revisa la página de detalle

**Resultado esperado:**

- ✅ Información completa del curso
- ✅ Lista de módulos
- ✅ Botón "Inscribirme" o "Continuar" (según estado)
- ✅ Progreso visible si ya estás inscrito
- ✅ Instructor y categoría mostrados

**Puntos a verificar:**

- [ ] Toda la información se muestra correctamente
- [ ] Botones de acción visibles
- [ ] Descripción formateada correctamente
- [ ] Módulos listados en orden

---

### FASE 3: PDI - Planes de Desarrollo Individual (15 min)

#### 3.1 Acceder a PDI

```
URL: http://localhost:3000/dashboard/pdi
```

**Pasos:**

1. Navega a "PDI" en el sidebar
2. Observa el listado de planes

**Resultado esperado:**

- ✅ Listado de PDIs existentes (si hay)
- ✅ Filtros por estado (Draft, Active, Completed)
- ✅ Botón "Crear PDI" visible (si eres manager/admin)

**Puntos a verificar:**

- [ ] Página carga sin errores
- [ ] PDIs se muestran en formato tabla/cards
- [ ] Estados se visualizan con badges de colores

---

#### 3.2 Crear Nuevo PDI (Manager/Admin)

**Pasos:**

1. Click en "Crear PDI"
2. Rellena el formulario:
   - **Usuario**: Selecciona un usuario
   - **Título**: "Plan de Desarrollo 2026"
   - **Objetivo**: "Mejorar habilidades técnicas"
   - **Fecha inicio**: Hoy
   - **Fecha fin**: +6 meses
3. Añade un objetivo:
   - **Descripción**: "Aprender React"
   - **Criterios de éxito**: "Completar 3 cursos"
   - **Fecha límite**: +3 meses
4. Asigna cursos relacionados
5. Click en "Crear PDI"

**Resultado esperado:**

- ✅ PDI creado exitosamente
- ✅ Aparece en el listado con estado "Draft"
- ✅ Usuario asignado puede verlo

**Puntos a verificar:**

- [ ] Formulario valida campos requeridos
- [ ] Se pueden añadir múltiples objetivos
- [ ] Cursos se asignan correctamente
- [ ] PDI aparece en el listado

---

#### 3.3 Ver Detalle y Editar PDI

**Pasos:**

1. Click en un PDI existente
2. Revisa los tabs:
   - Resumen
   - Objetivos
   - Cursos
   - Hitos
   - Revisiones
3. Click en "Editar"
4. Cambia el estado a "Active"
5. Guarda cambios

**Resultado esperado:**

- ✅ Toda la información del PDI visible
- ✅ Tabs funcionan correctamente
- ✅ Edición actualiza los datos
- ✅ Estado cambia visualmente

**Puntos a verificar:**

- [ ] Navegación entre tabs funciona
- [ ] Datos se cargan en cada tab
- [ ] Edición persiste los cambios
- [ ] Estado se actualiza en el listado

---

### FASE 4: Compliance y Normativas (15 min)

#### 4.1 Acceder a Compliance

```
URL: http://localhost:3000/dashboard/compliance
```

**Pasos:**

1. Navega a "Compliance" en el sidebar
2. Observa el dashboard de cumplimiento

**Resultado esperado:**

- ✅ Dashboard con métricas de cumplimiento
- ✅ Gráficos de estado (compliant, expirado, pendiente)
- ✅ Tabla de normativas
- ✅ Filtros por tipo y estado

**Puntos a verificar:**

- [ ] Dashboard carga correctamente
- [ ] Métricas se calculan correctamente
- [ ] Tabla de normativas visible
- [ ] Gráficos se renderizan

---

#### 4.2 Crear Nueva Normativa

**Pasos:**

1. Click en "Crear Normativa"
2. Rellena el formulario:
   - **Nombre**: "ISO 27001"
   - **Tipo**: Certificación
   - **Descripción**: "Seguridad de la información"
   - **Nivel de obligación**: Obligatorio
   - **Plazo de renovación**: 365 días
3. Asigna cursos relacionados (opcional)
4. Click en "Crear"

**Resultado esperado:**

- ✅ Normativa creada exitosamente
- ✅ Aparece en la tabla del dashboard
- ✅ Usuarios pueden registrar cumplimiento

**Puntos a verificar:**

- [ ] Formulario valida correctamente
- [ ] Normativa aparece en el listado
- [ ] Tipo se muestra con badge correcto
- [ ] Fecha de creación correcta

---

#### 4.3 Registrar Cumplimiento

**Pasos:**

1. Click en una normativa existente
2. Navega a la tab "Cumplimiento"
3. Click en "Registrar Cumplimiento"
4. Selecciona usuario y fecha de obtención
5. Añade número de certificado (opcional)
6. Click en "Guardar"

**Resultado esperado:**

- ✅ Cumplimiento registrado
- ✅ Fecha de vencimiento calculada automáticamente
- ✅ Usuario aparece en la lista de cumplimiento
- ✅ Métricas del dashboard se actualizan

**Puntos a verificar:**

- [ ] Usuario puede registrar cumplimiento
- [ ] Fecha de vencimiento se calcula correctamente
- [ ] Alertas se configuran si está cerca del vencimiento
- [ ] Dashboard refleja el cambio

---

### FASE 5: Backups y Monitoreo (10 min)

#### 5.1 Acceder a Configuración

```
URL: http://localhost:3000/dashboard/settings
```

**Pasos:**

1. Navega a "Configuración"
2. Busca la sección "Backups y Mantenimiento"

**Resultado esperado:**

- ✅ Panel de backups visible
- ✅ Estadísticas de la base de datos
- ✅ Estado de salud del sistema
- ✅ Botones de acción (Exportar, Importar, Limpiar)

**Puntos a verificar:**

- [ ] Panel carga correctamente
- [ ] Estadísticas muestran números reales
- [ ] Estado de salud visible (Healthy/Warning/Critical)

---

#### 5.2 Exportar Backup

**Pasos:**

1. Click en "Exportar Backup"
2. Espera la descarga

**Resultado esperado:**

- ✅ Archivo JSON se descarga
- ✅ Nombre: `talentos-backup-YYYY-MM-DD.json`
- ✅ Contiene todas las tablas de la BD
- ✅ Datos sensibles excluidos (passwordHash)

**Pruebas adicionales:**

```
Verificar contenido del backup:
1. Abre el archivo JSON en un editor
2. Deberías ver estructura:
   {
     "version": 45,
     "exportDate": "...",
     "data": {
       "users": [...],
       "courses": [...],
       ...
     },
     "stats": {...}
   }
```

**Puntos a verificar:**

- [ ] Backup se descarga correctamente
- [ ] JSON es válido
- [ ] Contiene todas las tablas
- [ ] No contiene datos sensibles
- [ ] Tamaño razonable del archivo

---

#### 5.3 Importar Backup

**Pasos:**

1. Click en "Importar Backup"
2. Selecciona el archivo descargado anteriormente
3. Confirma la importación

**Resultado esperado:**

- ✅ Backup se importa exitosamente
- ✅ Datos se restauran correctamente
- ✅ Toast notification de éxito
- ✅ Contador de registros importados

**⚠️ ADVERTENCIA**:

```
La importación sobrescribirá datos existentes.
Solo hacer esto en un entorno de pruebas.
```

**Puntos a verificar:**

- [ ] Importación completa sin errores
- [ ] Datos se restauran correctamente
- [ ] No hay pérdida de información
- [ ] Aplicación funciona después de la importación

---

#### 5.4 Monitoreo de Base de Datos

**Pasos:**

1. Observa las métricas del sistema:
   - Actividad últimas 24h
   - Tasa de errores
   - Elementos sin sincronizar
   - Recomendaciones

**Resultado esperado:**

- ✅ Métricas actualizadas en tiempo real
- ✅ Gráficos/indicadores visuales
- ✅ Recomendaciones específicas si hay problemas
- ✅ Estado de salud con código de color

**Estados posibles:**

- 🟢 **Healthy**: Todo funciona correctamente
- 🟡 **Warning**: Advertencias menores (ej: muchos logs sin limpiar)
- 🔴 **Critical**: Problemas graves (muchos errores, BD corrupta)

**Puntos a verificar:**

- [ ] Métricas son precisas
- [ ] Estado de salud correcto
- [ ] Recomendaciones útiles
- [ ] Actualización en tiempo real

---

### FASE 6: Flujo Completo End-to-End (20 min)

#### 6.1 Flujo: Crear → Inscribir → Completar → Certificar

**Paso 1: Crear curso**

```
1. Dashboard > Cursos > Crear Curso
2. Título: "Curso E2E Test"
3. Añade 2 módulos mínimo
4. Estado: Publicado
5. Guardar
```

**Paso 2: Inscribirse**

```
1. Ir al detalle del curso creado
2. Click en "Inscribirme"
3. Confirmar inscripción
4. Verificar que aparece en "Mis Cursos"
```

**Paso 3: Completar módulos**

```
1. Entrar al curso desde "Mis Cursos"
2. Marcar módulo 1 como completado
3. Marcar módulo 2 como completado
4. Progreso debe llegar a 100%
```

**Paso 4: Obtener certificado**

```
1. Al completar 100%, debería generarse certificado automáticamente
2. Ir a Dashboard > Certificados
3. Verificar que el certificado está listado
4. Descargar certificado en PDF
5. Verificar código QR y datos correctos
```

**Resultado esperado:**

- ✅ Flujo completo funciona sin interrupciones
- ✅ Progreso se trackea correctamente
- ✅ Certificado se genera automáticamente
- ✅ PDF descargable con información correcta

**Puntos a verificar:**

- [ ] Cada paso se completa exitosamente
- [ ] Datos persisten entre pasos
- [ ] Notificaciones aparecen en cada acción
- [ ] Certificado contiene datos correctos
- [ ] QR code en certificado funciona

---

## 🔍 Checklist Final

### Funcionalidades Core

- [ ] ✅ Login y autenticación JWT
- [ ] ✅ Dashboard principal con estadísticas
- [ ] ✅ Menú hamburguesa responsive
- [ ] ✅ Navegación entre secciones

### Cursos

- [ ] ✅ Listado con paginación (12/página)
- [ ] ✅ Búsqueda y filtros funcionan
- [ ] ✅ Crear nuevo curso (admin)
- [ ] ✅ Editar curso existente
- [ ] ✅ Ver detalle de curso
- [ ] ✅ Inscripción a cursos
- [ ] ✅ Tracking de progreso

### PDI

- [ ] ✅ Listado de PDIs
- [ ] ✅ Crear nuevo PDI (manager/admin)
- [ ] ✅ Ver detalle con tabs
- [ ] ✅ Editar PDI existente
- [ ] ✅ Cambiar estado del PDI
- [ ] ✅ Asignar cursos y objetivos

### Compliance

- [ ] ✅ Dashboard de cumplimiento
- [ ] ✅ Crear normativas
- [ ] ✅ Registrar cumplimiento
- [ ] ✅ Alertas de vencimiento
- [ ] ✅ Auditorías de cumplimiento

### Backups y Monitoreo

- [ ] ✅ Exportar backup completo
- [ ] ✅ Importar backup
- [ ] ✅ Ver estadísticas de BD
- [ ] ✅ Estado de salud del sistema
- [ ] ✅ Recomendaciones automáticas
- [ ] ✅ Limpieza de datos antiguos

### Otros Módulos

- [ ] ✅ Gestión de usuarios
- [ ] ✅ Chat y mensajería
- [ ] ✅ Calendario de eventos
- [ ] ✅ Análisis y reportes
- [ ] ✅ Configuración general
- [ ] ✅ Notificaciones

---

## 🐛 Reporte de Problemas

Si encuentras algún error durante las pruebas, documéntalo con:

```
📍 Ubicación: [URL o sección]
🔴 Error: [Descripción del error]
📋 Pasos para reproducir:
   1. ...
   2. ...
   3. ...
💻 Consola: [Errores de consola si hay]
📸 Screenshot: [Si es posible]
```

---

## ✅ Resultados Esperados

Al completar todas las pruebas:

- ✅ **Todas las funcionalidades core funcionan**
- ✅ **Sin errores críticos en consola**
- ✅ **Navegación fluida sin interrupciones**
- ✅ **Datos persisten correctamente en IndexedDB**
- ✅ **UI responsive en desktop y móvil**
- ✅ **Rendimiento aceptable (< 3s por página)**

---

## 📞 Siguiente Paso

Una vez completadas todas las pruebas:

1. Revisar cualquier error encontrado
2. Corregir problemas críticos
3. Documentar bugs menores para futuras mejoras
4. Preparar para despliegue en producción

---

**Última actualización**: 24 de enero de 2026  
**Tiempo estimado total**: ~90 minutos  
**Prioridad**: Alta - Crítico para validación pre-producción
