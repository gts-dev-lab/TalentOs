# Resumen de la Aplicación: TalentOS

Este documento proporciona una visión general de la arquitectura, funcionalidades y el flujo de desarrollo de TalentOS.

---

## 1. Arquitectura y Filosofía

TalentOS está construida sobre dos pilares fundamentales que garantizan una experiencia de usuario moderna, rápida y adaptable.

### A. Offline-First con Dexie.js (Base de Datos Principal)

La aplicación prioriza la disponibilidad y la velocidad utilizando **Dexie.js**, una capa sobre IndexedDB, como su **base de datos principal en el navegador**.

- **Rendimiento Instantáneo:** Todas las operaciones (leer, escribir, actualizar) se realizan localmente, eliminando la latencia de la red.
- **Disponibilidad sin Conexión:** Los usuarios pueden continuar aprendiendo, completando módulos y participando en foros incluso sin conexión a internet.
- **Persistencia de Datos:** Todos los datos generados se guardan de forma segura en el navegador del usuario.

### B. Backend Persistente y Sincronización con Supabase

Aunque la aplicación funciona de manera autónoma en el cliente, necesita un punto central para la persistencia de datos a largo plazo, copias de seguridad y la colaboración entre diferentes dispositivos.

- **Supabase como Backend:** Se utiliza una base de datos PostgreSQL gestionada por Supabase como el backend remoto.
- **Sincronización Manual:** Desde el panel de `Ajustes`, un administrador puede iniciar un proceso de sincronización. Este proceso identifica los datos locales que no han sido subidos (marcados con `isSynced: false`) y los envía a las tablas correspondientes en Supabase.

### C. Inteligencia Artificial como Núcleo con Genkit

La IA no es un complemento, sino una parte integral de la plataforma, impulsada por **Genkit** y los modelos de **Google Gemini**.

- **Flujos de IA Modulares:** Cada funcionalidad de IA (generar cursos, crear tests, etc.) está encapsulada en su propio "flujo" de Genkit en el backend (`src/ai/flows`).
- **Configuración Flexible:** Los administradores pueden activar o desactivar funcionalidades de IA específicas y gestionar las claves API desde el panel de `Ajustes`.

---

## 2. Desglose de Funcionalidades

### Gestión de Usuarios y Permisos

- **Roles y Departamentos:** Sistema de roles (Trabajador, Formador, etc.) y departamentos que define la estructura organizativa.
- **Flujo de Aprobación:** Los usuarios que se registran con roles de gestión requieren la aprobación manual de un `Administrador General` para activarse.
- **Gestión de Permisos:** El administrador puede definir qué secciones del menú lateral son visibles para cada rol, personalizando la experiencia de navegación.
- **Importación Masiva:** Permite añadir usuarios en bloque subiendo un archivo CSV.

### Gestión de Cursos

- **Creación Manual:** Un formulario completo para crear cursos desde cero, definiendo título, descripciones, módulos, duración, etc.
- **Generador con IA:** Una herramienta que, a partir de un simple tema (ej. "Manejo de hemorragias"), genera una estructura de curso completa, incluyendo módulos y objetivos.
- **Importación SCORM:** Permite subir un paquete SCORM (.zip) para crear un curso compatible, con un visor integrado.
- **Gestión de Recursos:** Una biblioteca centralizada para subir documentos (PDFs, vídeos) que pueden ser asociados a múltiples cursos.

### Experiencia de Aprendizaje

- **Progreso del Curso:** Los usuarios pueden marcar módulos como completados, y su progreso se refleja en una barra de estado.
- **Tutor Virtual IA:** Un chat en la página del curso donde los alumnos pueden hacer preguntas sobre el contenido y recibir respuestas instantáneas de la IA.
- **Foros de Discusión:** Cada curso tiene su propio foro para que los participantes puedan debatir, hacer preguntas y colaborar.
- **Calendario de Formación:** Un calendario global donde se registran eventos como clases en directo, talleres o fechas de entrega.
- **Sistema de Valoraciones:** Al completar un curso, los alumnos pueden valorar tanto el contenido como al instructor, proporcionando feedback valioso.

### Gamificación

- **Puntos de Experiencia (XP):** Los usuarios ganan puntos al completar módulos, publicar en foros o finalizar cursos.
- **Insignias por Logros:** Se otorgan insignias automáticamente al alcanzar hitos (ej. "Completa tu primer curso", "100% en un test").
- **Clasificación General (Leaderboard):** Una tabla que muestra a los usuarios con más puntos, fomentando una competencia sana.

### Planes de Carrera

- **Rutas Guiadas:** Los administradores pueden crear "Planes de Carrera" que consisten en una secuencia ordenada de cursos asignados a un rol específico.
- **Seguimiento Automático:** El panel principal del usuario muestra su progreso en el plan de carrera asignado, indicando cuál es el siguiente curso a realizar de forma secuencial.

### Análisis y Reportes

- **Dashboard de Analíticas:** Una vista centralizada para los gestores con tres pestañas:
  1.  **Resumen de Formación:** Métricas sobre la tasa de finalización, progreso por rol y departamento, y actividad mensual.
  2.  **Cumplimiento:** Un informe que detalla qué usuarios han completado los cursos obligatorios para su rol.
  3.  **Análisis de Costes:** Visualización de gastos por categoría, por mes y por curso, con filtros dinámicos.
- **Exportación de Datos:** Los informes clave se pueden exportar a PDF o CSV.

### Administración y Configuración

- **Gestión de Costes:** Una sección dedicada para que los administradores registren y categoricen todos los gastos relacionados con la formación (honorarios, materiales, licencias, etc.).
- **Gestión de APIs y Sincronización:** Panel para configurar las credenciales de servicios externos e iniciar la sincronización manual con Supabase.
- **Configuración de IA:** Permite seleccionar el proveedor de IA (ej. Gemini) y activar o desactivar funcionalidades específicas.
- **Gestión de Notificaciones:** Sistema integrado que envía notificaciones por Email, WhatsApp o Push (si están configuradas) para eventos clave como aprobaciones o anuncios.
- **Chat Interno:** Un sistema de mensajería directa entre usuarios de la plataforma, respetando la jerarquía (un trabajador solo puede iniciar chats con roles de gestión). Los administradores pueden crear nuevos canales públicos.

---

## 3. Flujo de Desarrollo Sugerido (Cómo llegamos aquí)

Este proyecto se construyó de forma iterativa, añadiendo capas de funcionalidad. Replicarlo seguiría un camino similar:

1.  **Fase 1: La Base (Scaffolding):**
    - Iniciar un proyecto Next.js con TypeScript y Tailwind CSS.
    - Configurar Shadcn/ui para los componentes visuales.
    - Implementar Dexie.js (`db.ts`) con los esquemas de datos iniciales (Usuarios, Cursos).
    - Crear el sistema de autenticación local y el layout principal del dashboard.

2.  **Fase 2: Funcionalidades CRUD Básicas:**
    - Construir las páginas para listar, crear, editar y eliminar **Usuarios** y **Cursos**.
    - Implementar el sistema de **Inscripciones** y la lógica de progreso del usuario.

3.  **Fase 3: Integración de la Inteligencia Artificial:**
    - Configurar Genkit.
    - Crear los primeros flujos de IA, como el **Generador de Cursos** y el **Generador de Tests**, y construir las interfaces para interactuar con ellos.

4.  **Fase 4: Módulos de Gestión y Visualización:**
    - Desarrollar el **Dashboard de Analíticas** utilizando `recharts`.
    - Crear los módulos de **Gestión de Costes** y **Gestión de Permisos por Rol**.

5.  **Fase 5: Mejora de la Experiencia de Usuario:**
    - Implementar la **Gamificación** (puntos, insignias, clasificación).
    - Añadir el **Chat Interno**, los **Foros** y el **Calendario**.
    - Configurar el servicio de notificaciones para automatizar las comunicaciones.

6.  **Fase 6: Sincronización y Estabilización:**
    - Implementar la lógica de sincronización con Supabase.
    - Refactorizar el código para asegurar que la estructura de archivos sea coherente.
    - Crear la documentación final (`README`, guías, etc.).
