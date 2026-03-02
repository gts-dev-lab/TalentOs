# Guía de Despliegue

Esta aplicación es un proyecto estándar de Next.js y puede ser desplegada en cualquier plataforma que soporte Node.js. A continuación, se detallan los pasos para desplegar en Vercel (la opción recomendada) y en un servidor Node.js genérico.

**Importante:** El archivo `apphosting.yaml` es específico para Firebase App Hosting y puede ser eliminado si despliegas en otra plataforma.

---

## 1. Configuración de Variables de Entorno

Antes de desplegar, necesitas configurar las variables de entorno. Estas son claves secretas y configuraciones que no deben guardarse en el código. En tu plataforma de hosting (Vercel, Netlify, etc.), busca una sección de "Environment Variables" en la configuración de tu proyecto y añade las siguientes:

### Variables de Supabase (Obligatorio para Sincronización)

Tu aplicación necesita conectarse a tu base de Supabase para la sincronización de datos y la autenticación.

- `NEXT_PUBLIC_SUPABASE_URL`: La URL de tu proyecto Supabase.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: La clave anónima (public) de tu proyecto.
- `SUPABASE_SERVICE_ROLE_KEY`: Tu clave de 'service_role'. **Es secreta y nunca debe ser expuesta en el lado del cliente.** Se usa en el servidor para la sincronización.

### Configuración del Proveedor de Autenticación (Opcional, por defecto Dexie)

La aplicación está preparada para usar diferentes sistemas de autenticación.

- `NEXT_PUBLIC_AUTH_PROVIDER`: Define qué sistema usar. Opciones: `dexie`, `supabase`.
  - `dexie`: Usa el sistema de login local (por defecto).
  - `supabase`: Usa Supabase Auth.

---

### Variables de IA (Obligatorio para funciones de IA)

Para que las funcionalidades de Inteligencia Artificial funcionen, debes proporcionar al menos una clave API.

- `GOOGLE_API_KEY`: Tu clave API de Google AI Studio para usar Gemini.

---

### Variables de Notificaciones (Opcional)

Si deseas que el envío de notificaciones por email o WhatsApp funcione, configura estas variables.

- `RESEND_API_KEY`: Tu clave API de Resend para el envío de correos transaccionales.
- `TWILIO_ACCOUNT_SID`: El SID de tu cuenta de Twilio.
- `TWILIO_AUTH_TOKEN`: El token de autenticación de tu cuenta de Twilio.
- `TWILIO_WHATSAPP_FROM`: Tu número de teléfono de WhatsApp de Twilio (formato: `+14155238886`).
- `TWILIO_WHATSAPP_TO_TEST`: Un número de teléfono para pruebas (formato: `+34123456789`).
- `NEXT_PUBLIC_FIREBASE_VAPID_KEY`: La clave VAPID de Cloud Messaging para notificaciones push.
- `FIREBASE_CLIENT_EMAIL`: Email de la cuenta de servicio (para notificaciones del servidor).
- `FIREBASE_PRIVATE_KEY`: Clave privada de la cuenta de servicio (para notificaciones del servidor).

---

## 2. Requisito de HTTPS (SSL) para PWA

Esta aplicación es una **Progressive Web App (PWA)**, lo que significa que los usuarios pueden "instalarla" en sus dispositivos para tener una experiencia similar a una app nativa.

Para que las funcionalidades de PWA (como el aviso de instalación o el funcionamiento offline) se activen, **es obligatorio que la aplicación se sirva a través de una conexión segura (HTTPS)**.

- Plataformas como **Vercel** gestionan esto automáticamente.
- Si despliegas en tu **propio servidor**, deberás configurar un certificado SSL (se recomienda usar Let's Encrypt).

---

## 3. Despliegue en Vercel (Recomendado)

Vercel son los creadores de Next.js, por lo que el despliegue es increíblemente sencillo.

1.  **Sube tu código a un repositorio Git** (GitHub, GitLab, Bitbucket).
2.  **Regístrate en Vercel** usando tu cuenta de Git.
3.  **Importa tu proyecto**: En el dashboard de Vercel, haz clic en "Add New... -> Project" y selecciona el repositorio de tu aplicación.
4.  **Configura el Proyecto**: Vercel detectará automáticamente que es un proyecto de Next.js y preconfigurará todo por ti.
    - Ve a la sección "Environment Variables" y añade todas las variables mencionadas en el paso 1.
    - Vercel proporciona automáticamente un certificado SSL, cumpliendo con el requisito de HTTPS para la PWA.
5.  **Despliega**: Haz clic en el botón "Deploy". Vercel construirá y desplegará tu aplicación.

Cada vez que hagas `git push` a tu rama principal, Vercel redesplegará automáticamente los cambios.
