# Configuración LTI 1.3 (TT-105)

TalentOS actúa como **herramienta (Tool)** en el flujo LTI 1.3. La plataforma (Canvas, Moodle, etc.) redirige al usuario a nuestra URL de login OIDC y, tras la autenticación, envía un `id_token` a nuestro callback. Verificamos el token con el JWKS de la plataforma y creamos una sesión local.

## Variables de entorno

| Variable                             | Descripción                                                                                                           |
| ------------------------------------ | --------------------------------------------------------------------------------------------------------------------- |
| `LTI_ISSUER`                         | Issuer de la plataforma (ej. `https://canvas.instructure.com`) — debe coincidir con el `iss` que envía la plataforma. |
| `LTI_AUTH_REQUEST_URL`               | URL del endpoint de autorización de la plataforma (donde redirigimos al usuario).                                     |
| `LTI_JWKS_URI`                       | URL del JWKS de la plataforma para verificar el `id_token`.                                                           |
| `LTI_CLIENT_ID`                      | (Opcional) Client ID que la plataforma asigna a esta herramienta; se valida contra el claim `aud` del token.          |
| `LTI_TENANT_ID`                      | (Opcional) UUID del inquilino para usuarios que entran por LTI. Por defecto se usa `TENANT_ID_DEFAULT`.               |
| `JWT_SECRET`                         | Requerido para firmar el `state` (≥32 caracteres).                                                                    |
| `NEXT_PUBLIC_APP_URL` o `VERCEL_URL` | Base URL de la app para construir `redirect_uri` y login URL.                                                         |

## URLs a registrar en la plataforma

- **Login initiation (OIDC):** `https://<tu-dominio>/api/lti/oidc/login`
- **Redirect URI (callback):** `https://<tu-dominio>/api/lti/oidc/callback`

La plataforma enviará al usuario a la URL de login con query params `iss`, `login_hint`, `target_link_uri`, `client_id`, etc. Tras el callback, el usuario queda con sesión TalentOS y se redirige a `target_link_uri`.

## Ejemplo (Canvas)

- `LTI_ISSUER`: `https://canvas.instructure.com` (o la URL de tu instancia).
- `LTI_AUTH_REQUEST_URL`: suele ser `https://<instancia>/api/lti/authorize_redirect`.
- `LTI_JWKS_URI`: `https://<instancia>/api/lti/security/jwks`.

Consulta la documentación de tu LMS para obtener las URLs exactas y el Client ID (Developer Key).

## TT-106: Resource Link Launch

Tras el callback OIDC, si el `id_token` incluye el claim `resource_link.id`, TalentOS busca un mapeo a curso local y redirige a la página del curso.

### Mapeo resource_link_id → courseId

Variable de entorno **`LTI_RESOURCE_LINK_MAP`**: JSON con pares `resource_link_id` → `courseId` (UUID o id del curso en TalentOS).

Ejemplo:

```bash
LTI_RESOURCE_LINK_MAP='{"abc123":"course_uuid_o_id_local","link_456":"course_2"}'
```

Si hay mapeo, la redirección tras el login va a `/dashboard/courses/[courseId]`. Si no hay mapeo, se usa `target_link_uri` enviado por la plataforma.
