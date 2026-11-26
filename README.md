# CareGuardian · Interfaz web (frontend)

Aplicación Angular (con SSR) para cuidadores de adultos mayores: pacientes,
medicamentos, citas, síntomas, notas, alertas y evolución con resúmenes de IA
(Groq) bajo consentimiento. La API está en
[Care_Guardian_Back](https://github.com/1081271746/Care_Guardian_Back).

## Acceso de demostración

| Campo | Valor |
|---|---|
| Correo | `carlos@careguardian.com` |
| Contraseña | `CareGuardian123` |

Es una **cuenta de demostración** con pacientes ficticios marcados “(demo)”.
No registres datos reales con ella: cualquiera que lea este README puede entrar.
Si la cuenta no existe en un entorno nuevo, créala desde la pestaña
**Crear cuenta** del login o con la carga de demostración del backend
(`python -m scripts.seed_demo --apply --create-account`).

> CareGuardian apoya el seguimiento; no diagnostica, no recomienda
> medicamentos y no reemplaza a un profesional de la salud.

## Contenido

1. [Arquitectura](#arquitectura)
2. [Tecnologías](#tecnologías)
3. [Estructura de carpetas](#estructura-de-carpetas)
4. [Instalación y ejecución local](#instalación-y-ejecución-local)
5. [Variables de entorno](#variables-de-entorno)
6. [Páginas y navegación](#páginas-y-navegación)
7. [Conexión con la API](#conexión-con-la-api)
8. [Evolución e IA](#evolución-e-ia)
9. [Diseño](#diseño)
10. [Pruebas](#pruebas)
11. [Despliegue en Railway](#despliegue-en-railway)
12. [Seguridad](#seguridad)

## Arquitectura

```text
Navegador ── HTTPS ──► Servidor Node (Express + Angular SSR)  ── /api/* ──► FastAPI ──► PostgreSQL
                         │                                                  │
                         ├─ /acerca      SSR por petición                    └──► Groq (solo backend)
                         ├─ /privacidad  prerenderizada (SSG)
                         ├─ /recursos    SSR con caché pública (ISR equivalente)
                         └─ resto        renderizado en el navegador (datos privados)
```

- El navegador **solo** llama a `/api/...` en el mismo origen. `src/server.ts`
  reenvía esas peticiones a `API_BASE_URL`; la URL del backend nunca llega al
  JavaScript del navegador y no hay CORS que configurar en producción.
- Las páginas privadas nunca se renderizan en el servidor: los datos clínicos
  solo existen en el navegador del cuidador autenticado.

## Tecnologías

Angular 22 (componentes standalone, signals, control flow `@if/@for`), TypeScript 6,
RxJS, Angular SSR + Express 5, CSS propio (sin framework de UI), Vitest.

## Estructura de carpetas

```text
src/
  server.ts                 servidor Node: proxy /api, cabeceras de seguridad, SSR público
  styles.css                sistema de diseño (tokens, componentes, utilidades)
  app/
    app.routes.ts           rutas; las privadas cuelgan del Shell con carga diferida
    layout/shell.*          barra lateral, perfil, cierre de sesión, menú móvil
    services/
      api.ts                todas las llamadas HTTP tipadas
      models.ts             tipos que reflejan los esquemas de la API
      auth.ts, auth.guard.ts, auth.interceptor.ts   sesión JWT
      patient-context.ts    paciente seleccionado compartido entre módulos
      errors.ts, format.ts, notifier.ts             mensajes, fechas, avisos
    shared/                 icono, gráficas, selector de paciente, estados vacíos…
    pages/                  login, dashboard, paciente, pacientes, medicamentos,
                            citas, sintomas, notas, alertas, evolucion, public
tests/                      pruebas de ejecución contra un backend real desechable
content/recursos.json       contenido público (sin datos personales)
```

## Instalación y ejecución local

Requisitos: Node 24 y npm 11; el backend corriendo (por defecto en `http://127.0.0.1:8000`).

```sh
npm ci                      # usa el package-lock.json
npm run build               # compila navegador + servidor SSR
API_BASE_URL=http://127.0.0.1:8000 PUBLIC_ORIGIN=http://localhost:4000 npm start
# abre http://localhost:4000
```

Desarrollo con recarga: `npm run dev` (usa `proxy.conf.json` para enviar `/api`
al backend local en el puerto 8000).

## Variables de entorno

| Variable | Obligatoria | Descripción |
|---|---|---|
| `API_BASE_URL` | Sí | URL del backend, solo para el servidor Node. En Railway: `http://<servicio-backend>.railway.internal:<PORT>` (red privada) o la URL pública `https://...`. Sin ella, `/api` responde 503. |
| `PUBLIC_ORIGIN` | Sí en producción | URL pública del frontend (`https://<frontend>.up.railway.app`). Se usa para validar el host y renderizar `/recursos`. |
| `NG_ALLOWED_HOSTS` | No | Hosts adicionales permitidos, separados por comas (dominio propio). `RAILWAY_PUBLIC_DOMAIN` se agrega automáticamente. |
| `PUBLIC_CACHE_TTL_SECONDS` | No | Vida de la caché de `/recursos` (300 por defecto). |
| `PUBLIC_RESOURCES_FILE` | No | Ruta del JSON público de recursos (`content/recursos.json`). |
| `PORT` | Railway | Puerto del servidor Node (4000 local). |

En el backend, `CORS_ORIGINS` debe incluir la URL pública del frontend.

## Páginas y navegación

| Ruta | Qué hace | Endpoints |
|---|---|---|
| `/login` | Iniciar sesión o crear cuenta; mensajes de sesión expirada o cerrada | `POST /auth/login`, `POST /users/` |
| `/dashboard` | Indicadores de todos tus pacientes, síntomas por día, próximas citas, alertas por nivel y actividad reciente | `GET /dashboard/summary` |
| `/dashboard/:id` | Panel de un paciente: nivel por reglas, alertas, síntomas, medicamentos, citas y notas | `GET /dashboard/patients/{id}` |
| `/pacientes` | Buscar, crear, editar, desactivar/reactivar y gestionar el equipo de cuidado | `GET/POST/PUT/DELETE /patients/…`, `/patients/{id}/caregivers` |
| `/medicamentos` | Registrar, editar, suspender y reactivar; estado vigente | `/medications/…` |
| `/citas` | Próximas e historial; confirmar, cancelar, completar, editar y eliminar | `/appointments/…` |
| `/sintomas` | Mediciones, categorías, gravedad, momento de la observación; corregir y retirar | `/symptoms/…` |
| `/notas` | Bitácora del equipo; solo el autor edita o retira | `/notes/…` |
| `/alertas` | Activas por gravedad e historial; revisar, atender, descartar, reabrir y crear manuales | `/alerts/…` |
| `/evolucion` | Período, gráficas de mediciones reales, categorías, historial y resúmenes con Groq | `/evolution/…` |
| `/cuenta` | Datos de la cuenta y cambio de contraseña | `/auth/me`, `/users/{id}` |
| `/acerca`, `/privacidad`, `/recursos` | Páginas públicas | — |

- El paciente elegido se recuerda entre módulos (`PatientContext`).
- Los pacientes inactivos se pueden consultar, pero sus formularios se deshabilitan
  (la API también lo impide).
- Rutas privadas protegidas por `authGuard`: sin sesión válida se redirige a
  `/login?volver=<ruta>` y, tras entrar, se vuelve a la página pedida.
- Si la API responde 401 (token vencido o revocado) se cierra la sesión y se
  muestra “Tu sesión expiró”.
