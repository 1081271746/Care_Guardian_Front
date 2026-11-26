# Auditoría del frontend — noviembre de 2026

## Estado inicial (`main`)

- Angular 22 con SSR, proxy `/api` en `src/server.ts` y 18 pruebas que pasaban.
- Cada página repetía su propia barra lateral; no existía un layout común.
- `styles.css` estaba vacío: cada página tenía estilos propios e inconsistentes.

## Problemas detectados y corrección

| # | Prioridad | Problema | Corrección |
|---|---|---|---|
| 1 | Alta | No había botón para **cerrar sesión**. | Shell con perfil y “Cerrar sesión” que borra token, perfil y paciente seleccionado. |
| 2 | Alta | Un token vencido seguía pareciendo válido; los 401 dejaban la página rota. | Guard comprueba `exp`; el interceptor cierra la sesión ante 401 y el login explica “Tu sesión expiró”. |
| 3 | Alta | El panel solo mostraba un paciente; no había indicadores globales. | Panel general desde `GET /dashboard/summary` y panel por paciente en `/dashboard/:id`. |
| 4 | Alta | Pacientes, medicamentos, citas, síntomas y notas solo permitían crear y listar. | Edición, suspensión/desactivación, estados de citas, corrección de síntomas, edición de notas por su autor y gestión del equipo de cuidado. |
| 5 | Alta | Las pruebas usaban un interceptor global que devolvía datos fijos. | `HttpTestingController` en todas las pruebas; cada petición se verifica. |
| 6 | Media | Controles visibles sin función en el login (recordar, olvidé contraseña, etc.). | Login rehecho: solo controles funcionales, registro real y alternar visibilidad de la contraseña. |
| 7 | Media | Llamadas tipadas como `any`; nombres de campos sin verificar. | `models.ts` refleja los esquemas de la API; `api.ts` totalmente tipado. |
| 8 | Media | Fechas de calendario desplazadas por zona horaria y horas sin formato. | `format.ts` separa fechas de calendario e instantes UTC; Evolución envía la zona del navegador. |
| 9 | Media | Errores de la API mostrados como “Error” genérico. | `errors.ts` usa `detail`, nombra el campo en 422 y explica red caída y límites 429. |
| 10 | Media | El paciente elegido se perdía al cambiar de módulo. | `PatientContext` compartido y recordado. |
| 11 | Media | Evolución sin períodos rápidos, sin estado de la IA ni historial de resúmenes navegable. | Períodos, `GET /evolution/ai-status`, consentimiento por solicitud, resúmenes guardados y enlace compartible. |
| 12 | Baja | Sin página 404 (todo redirigía al login). | Página “No encontramos esa página”. |
| 13 | Baja | Sin cabeceras `X-Frame-Options`/`Referrer-Policy`; el proxy no distinguía timeouts. | Cabeceras de seguridad y `504` ante tiempo agotado. |
| 14 | Baja | El build fallaba sin internet por el *inlining* de fuentes. | Fuentes cargadas en tiempo de ejecución (`fonts.inline: false`). |

## Verificación

Ver [`VERIFICACION.md`](VERIFICACION.md).
