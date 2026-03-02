# Technical Debt Tracker - TalentOS

> _"Deja el código un poco mejor de como lo encontraste"_ — Regla del Boy Scout

**Fecha del último informe**: 2 de marzo de 2025  
**Total deuda registrada**: 8 ítems  
**Puntuación total acumulada**: 121 puntos  
**Deuda crítica (puntuación ≥ 15)**: 3 ítems

---

## Taxonomía y sistema de puntuación

| Tipo                 | Descripción                     | Peso en cálculo |
| -------------------- | ------------------------------- | --------------- |
| **Arquitectural**    | Decisiones de diseño limitantes | Impacto × 3     |
| **De código**        | Código difícil de mantener      | Urgencia × 2    |
| **De tests**         | Cobertura insuficiente          | Facilidad × 1   |
| **De documentación** | Código sin documentar           | -               |
| **De dependencias**  | Librerías obsoletas             | -               |
| **De configuración** | Infraestructura no mantenible   | -               |

**Fórmula de puntuación**: `PUNTUACIÓN = (Impacto × 3) + (Urgencia × 2) + (Facilidad × 1)`  
_(Impacto, Urgencia, Facilidad: escala 1-5, donde 5 es máximo)_

---

## Ítems de deuda técnica

### 1. 🔴 Monolitos de base de datos (Arquitectural)

- **Ubicación**: `src/lib/db-providers/dexie.ts` (2089 líneas), `postgres.ts` (3208 líneas)
- **Descripción**: Implementaciones masivas que violan el principio de responsabilidad única. Un solo archivo maneja 80+ métodos de acceso a datos.
- **Impacto**: 5 (Alto) — Dificulta mantenimiento, testing y evolución del sistema.
- **Urgencia**: 4 (Alta) — Bloquea refactorizaciones futuras y aumenta riesgo de bugs.
- **Facilidad**: 3 (Media) — Requiere diseño de módulos pero es mecánico.
- **Puntuación**: `(5×3) + (4×2) + (3×1) = 15 + 8 + 3 = 26`
- **Estado**: 🔴 Pendiente
- **Acción recomendada**: Dividir por entidades del dominio (users/, courses/, enrollments/, etc.) siguiendo patrón Repository.

### 2. 🟠 Inconsistencias de tipos en PostgreSQL (De código)

- **Ubicación**: `src/lib/db-providers/postgres.ts` (3208 líneas)
- **Descripción**: Múltiples errores TypeScript (200+) por mapeo incorrecto entre esquema SQL y tipos TypeScript.
- **Impacto**: 4 (Alto) — Compromete seguridad de tipos y confiabilidad en producción.
- **Urgencia**: 3 (Media) — No bloquea desarrollo pero genera warnings constantes.
- **Facilidad**: 2 (Baja) — Requiere revisar cada query y ajustar mapeos.
- **Puntuación**: `(4×3) + (3×2) + (2×1) = 12 + 6 + 2 = 20`
- **Estado**: 🔴 Pendiente
- **Acción recomendada**: Crear funciones helper de mapeo tipo-safe y corregir queries una por una.

### 3. 🟡 Falta de tests automatizados (De tests)

- **Ubicación**: Proyecto completo
- **Descripción**: Cobertura de tests insuficiente para un sistema empresarial crítico.
- **Impacto**: 4 (Alto) — Incrementa riesgo de regresiones en producción.
- **Urgencia**: 2 (Baja) — El sistema funciona pero sin garantías.
- **Facilidad**: 4 (Alta) — Configurar Jest/Testing Library ya está preparado.
- **Puntuación**: `(4×3) + (2×2) + (4×1) = 12 + 4 + 4 = 20`
- **Estado**: 🟡 Pendiente
- **Acción recomendada**: Implementar tests unitarios para componentes críticos (auth, db-providers) y tests de integración para flujos principales.

### 4. 🟡 Patrones de transacción inconsistentes (De código)

- **Ubicación**: `src/lib/db-providers/dexie.ts` (múltiples métodos)
- **Descripción**: Uso inconsistente de transacciones Dexie: algunas usan spread operator `...dbInstance.tables`, otras listan tablas manualmente.
- **Impacto**: 3 (Medio) — Puede causar problemas de concurrencia o bloqueos.
- **Urgencia**: 3 (Media) — No crítico pero debe estandarizarse.
- **Facilidad**: 4 (Alta) — Refactorizar a patrón uniforme.
- **Puntuación**: `(3×3) + (3×2) + (4×1) = 9 + 6 + 4 = 19`
- **Estado**: 🟡 Pendiente
- **Acción recomendada**: Crear helper `transaction()` que maneje consistentemente arrays de tablas.

### 5. 🔵 Métodos helper internos expuestos (De código)

- **Ubicación**: `src/lib/db-providers/types.ts` (líneas 369-371)
- **Descripción**: Métodos `_checkAndAwardModuleBadges` y `_handleCourseCompletion` están en interfaz pública pero son internos.
- **Impacto**: 2 (Bajo) — Contamina API pero no rompe funcionalidad.
- **Urgencia**: 2 (Baja) — Issue de diseño.
- **Facilidad**: 5 (Muy alta) — Solo mover a implementación interna.
- **Puntuación**: `(2×3) + (2×2) + (5×1) = 6 + 4 + 5 = 15`
- **Estado**: 🔵 Pendiente
- **Acción recomendada**: Mover a ámbito privado en implementaciones, mantener opcionales en interfaz.

### 6. 🔵 Convenciones de nomenclatura inconsistentes (De código)

- **Ubicación**: Varios archivos
- **Descripción**: Mezcla de español/inglés en nombres de variables, métodos y comentarios.
- **Impacto**: 2 (Bajo) — Dificulta lectura pero no funcionalidad.
- **Urgencia**: 1 (Muy baja) — Issue cosmético.
- **Facilidad**: 3 (Media) — Requiere revisión manual.
- **Puntuación**: `(2×3) + (1×2) + (3×1) = 6 + 2 + 3 = 11`
- **Estado**: 🔵 Pendiente
- **Acción recomendada**: Establecer guía de estilo (ya existe `STYLE_GUIDE.md`) y aplicar gradualmente.

### 7. 🟣 Documentación desactualizada (De documentación)

- **Ubicación**: `docs/`, READMEs
- **Descripción**: Documentación no sincronizada con implementación actual (ej. PostgreSQL vs Dexie).
- **Impacto**: 3 (Medio) — Confunde a nuevos desarrolladores.
- **Urgencia**: 2 (Baja) — No afecta runtime.
- **Facilidad**: 4 (Alta) — Actualizar basándose en código.
- **Puntuación**: `(3×3) + (2×2) + (4×1) = 9 + 4 + 4 = 17`
- **Estado**: 🟣 Pendiente
- **Acción recomendada**: Revisar y actualizar documentos clave (`README_ARCHITECTURE.md`, guías de setup).

### 8. 🟣 Configuración de build no optimizada (De configuración)

- **Ubicación**: `package.json`, `next.config.js`
- **Descripción**: Scripts de build/test podrían optimizarse para desarrollo local y CI/CD.
- **Impacto**: 2 (Bajo) — Afecta experiencia de desarrollo.
- **Urgencia**: 1 (Muy baja) — Funciona actualmente.
- **Facilidad**: 4 (Alta) — Ajustes configuración.
- **Puntuación**: `(2×3) + (1×2) + (4×1) = 6 + 2 + 4 = 12`
- **Estado**: 🟣 Pendiente
- **Acción recomendada**: Agregar scripts para análisis de bundle, profiling y checks de seguridad.

---

## Resumen por prioridad

| Prioridad         | Puntuación | Cantidad | Ítems                                                 |
| ----------------- | ---------- | -------- | ----------------------------------------------------- |
| **Crítica** (≥20) | 66         | 3        | Monolitos DB, Inconsistencias PostgreSQL, Falta tests |
| **Alta** (15-19)  | 66         | 3        | Transacciones, Documentación, Helpers expuestos       |
| **Media** (10-14) | 23         | 2        | Nomenclatura, Configuración build                     |

---

## Plan de reducción de deuda

### Sprint 1 (Crítico)

1. **Refactorizar monolitos DB** (26 pts) — Dividir `dexie.ts` en módulos por entidad
2. **Corregir tipos PostgreSQL** (20 pts) — Arreglar 10-20 errores TypeScript más graves

### Sprint 2 (Alto)

3. **Establecer tests base** (20 pts) — Configurar suite y agregar tests para auth
4. **Unificar transacciones** (19 pts) — Crear helper `transaction()` uniforme

### Sprint 3 (Medio/Bajo)

5. **Actualizar documentación** (17 pts) — Sincronizar docs con código
6. **Internalizar helpers** (15 pts) — Mover métodos privados
7. **Optimizar configuración** (12 pts) — Mejorar scripts y checks
8. **Estandarizar nombres** (11 pts) — Aplicar guía de estilo

---

## Registro de cambios

| Fecha      | Ítem             | Cambio                                | Responsable |
| ---------- | ---------------- | ------------------------------------- | ----------- |
| 2025-03-02 | Todos            | Creación inicial del tracker          | opencode    |
| 2025-03-02 | PostgreSQL types | Identificados 200+ errores TypeScript | opencode    |
| 2025-03-02 | Dexie monolith   | Revisado archivo de 2089 líneas       | opencode    |

---

## Métricas de progreso

- **Deuda total inicial**: 121 puntos
- **Deuda resuelta**: 0 puntos (0%)
- **Deuda pendiente**: 121 puntos (100%)
- **Tendencia**: 📈 Aumentando (nuevos ítems identificados)

> **Nota**: Esta deuda técnica se priorizará junto con el backlog de funcionalidades. La regla del Boy Scout sugiere resolver al menos 1-2 ítems por sprint mientras se desarrollan nuevas features.
