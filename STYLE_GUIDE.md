# Guía de Estilo - TalentOS

Esta guía establece las convenciones de código y estilo para el proyecto TalentOS (Next.js + TypeScript + React). Sigue estas reglas para mantener consistencia y calidad en el código.

---

## Formato y Linting

### Herramientas

- **Prettier**: Formato automático
- **ESLint**: Análisis de código y reglas
- **Husky + lint-staged**: Pre-commit hooks

### Comandos

```bash
# Formatear todo el código
npm run format

# Verificar formato sin aplicar cambios
npm run format:check

# Ejecutar linting
npm run lint

# Corregir errores de linting automáticamente
npm run lint:fix

# Verificar tipos TypeScript
npm run typecheck
```

### Configuración

- Prettier: `.prettierrc`
- ESLint: `.eslintrc.json`
- Editor: `.editorconfig`

---

## Convenciones TypeScript

### Tipos e Interfaces

- Usa `interface` para objetos y props de componentes
- Usa `type` para uniones, intersecciones y tipos complejos
- Exporta tipos con `export type`
- Prefiera tipos específicos sobre `any`

```typescript
// Bien
interface UserProps {
  id: string;
  name: string;
  email: string;
}

type UserRole = 'admin' | 'student' | 'instructor';

// Evitar
const user: any = {...};
```

### Naming

- **Variables y funciones**: `camelCase`
- **Clases y tipos**: `PascalCase`
- **Constantes**: `UPPER_SNAKE_CASE`
- **Archivos**: `kebab-case` para componentes, `camelCase` para utilidades

### Importación

- Orden de imports:
  1. React y librerías de terceros
  2. Componentes internos
  3. Utilidades y tipos
  4. Estilos y assets

```typescript
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';
import type { User } from '@/lib/types';
import styles from './UserCard.module.css';
```

### Componentes React

#### Functional Components

- Usa funciones de flecha para componentes
- Tipado explícito de props
- Desestructuración de props

```typescript
interface UserCardProps {
  user: User;
  onSelect?: (userId: string) => void;
}

const UserCard: React.FC<UserCardProps> = ({ user, onSelect }) => {
  // Component logic
};
```

#### Hooks

- Prefiera hooks personalizados para lógica reutilizable
- Nombre de hooks comienzan con `use`
- Mantén hooks pequeños y enfocados

```typescript
// Bien
function useUserProfile(userId: string) {
  const [user, setUser] = useState<User | null>(null);
  // ...
}

// Evitar
function getUserData() {
  /* mixed logic */
}
```

#### Manejo de Estado

- `useState` para estado local simple
- `useReducer` para estado complejo
- Context API para estado global compartido

---

## Estructura de Archivos

### Convenciones de Nombres

```
src/
  components/           # Componentes reutilizables
    ui/                 # Componentes base (shadcn/ui)
    forms/              # Componentes de formulario
    layout/             # Componentes de layout
    feature-specific/   # Componentes específicos de feature

  app/                  # App Router de Next.js
    (auth)/             # Grupo de rutas
    dashboard/          # Rutas del dashboard
    api/                # API routes

  lib/                  # Utilidades y lógica de negocio
    utils/              # Funciones utilitarias
    hooks/              # Custom hooks
    types/              # Definiciones TypeScript
    constants/          # Constantes de la aplicación

  styles/               # Estilos globales
  public/               # Assets estáticos
```

### Naming de Archivos

- **Componentes**: `UserCard.tsx`, `user-card.tsx` (consistente)
- **Hooks**: `useUserProfile.ts`
- **Utilidades**: `format-date.ts`, `validation.ts`
- **Tipos**: `types.ts` o `user.types.ts`

---

## Prácticas de Código

### Error Handling

- Usa try/catch para operaciones asíncronas
- Maneja errores de forma elegante en la UI
- Logging apropiado (no console.log en producción)

```typescript
try {
  await fetchUser();
} catch (error) {
  console.error('Error fetching user:', error);
  setError('No se pudo cargar el usuario');
}
```

### Performance

- Memoización con `React.memo`, `useMemo`, `useCallback` cuando sea necesario
- Código splitting con `dynamic` import de Next.js
- Optimización de imágenes con `next/image`

### Seguridad

- Validación de inputs con Zod
- Sanitización de datos de usuario
- Protección de rutas con middleware
- No exponer tokens o secrets en el cliente

### Accesibilidad

- Semántica HTML apropiada
- Atributos ARIA cuando sea necesario
- Navegación por teclado
- Contraste de colores adecuado

---

## Git y Commits

### Conventional Commits

```
<tipo>(<alcance>): <descripción>

[body opcional]

[footer opcional]
```

**Tipos:**

- `feat`: Nueva funcionalidad
- `fix`: Corrección de bug
- `docs`: Documentación
- `style`: Formato (sin cambios funcionales)
- `refactor`: Refactorización
- `test`: Tests
- `chore`: Mantenimiento

**Ejemplos:**

```
feat(auth): add JWT refresh endpoint
fix(enrollment): resolve status transition bug
docs(api): update endpoint documentation
```

### Workflow

1. Crear branch descriptiva: `feature/user-authentication`
2. Commits atómicos y descriptivos
3. Pull requests con revisión de código
4. Merge a `main` después de aprobación

---

## Configuración de Desarrollo

### Variables de Entorno

- `.env.local` para desarrollo local
- `.env.production` para producción
- Nunca commitear archivos `.env` con secrets

### Docker

- Usar `docker-compose.yml` para servicios dependientes
- Imágenes optimizadas para producción

### Testing

- Jest para unit tests
- React Testing Library para componentes
- Tests E2E con Playwright/Cypress (opcional)

---

## Recursos

- [Next.js Documentation](https://nextjs.org/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [React Documentation](https://react.dev/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [shadcn/ui](https://ui.shadcn.com/)

---

**Mantén el código limpio, legible y mantenible. La consistencia es clave.**
