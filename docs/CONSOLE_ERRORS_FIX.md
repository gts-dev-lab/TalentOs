# Corrección de Errores de Consola

## Uncaught SyntaxError en `_next/static/chunks/app/error.js`

**Causa:** Caché de compilación de Next.js corrupto o desactualizado.

**Solución:**

```bash
# 1. Detener el servidor (Ctrl+C)

# 2. Borrar caché de Next.js
rm -rf .next

# 3. Reiniciar en desarrollo
npm run dev
```

Si persiste, limpieza completa:

```bash
rm -rf .next node_modules/.cache
npm run dev
```

---

## Meta `apple-mobile-web-app-capable` deprecated

**Estado:** Corregido. Se añadió `<meta name="mobile-web-app-capable" content="yes">` y se mantiene el de Apple para compatibilidad con iOS.

---

## Fuente preloaded pero no usada

**Estado:** Corregido. Se eliminó la carga duplicada de Inter desde Google Fonts; la app usa solo `next/font` (Inter), que ya optimiza la carga.

---

## runtime.lastError / message channel closed

**Causa:** Extensiones del navegador (gestores de contraseñas, traductores, etc.) que inyectan scripts y usan canales de mensajes.

**Qué hemos hecho:** El registro del Service Worker de la PWA se retrasa 1 segundo para no coincidir con el arranque de las extensiones.

**Si siguen saliendo:** Son de las extensiones, no de TalentOS. Puedes:

- Probar en ventana de incógnito (menos extensiones)
- Desactivar extensiones una a una para localizar cuál lo provoca
- Ignorarlas; no afectan al funcionamiento de la app

---

## Resumen de cambios en código

1. **layout.tsx:** Meta `mobile-web-app-capable`, eliminados preconnect y link a Google Fonts (solo next/font).
2. **pwa-register.tsx:** Registro del SW retrasado 1 s.
3. **error.tsx:** Uso de `String(error?.message ?? 'Unknown error')` y `break-all` para evitar contenido que pueda romper el chunk.
