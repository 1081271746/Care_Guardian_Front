# Verificación de la entrega

## Noviembre de 2026 (rama `mejoras/auditoria-produccion`)

Ejecutado localmente sobre el código de esta rama:

| Comprobación | Resultado |
|---|---|
| `npm ci` con el lockfile existente | Aprobado |
| `npm run typecheck` (app y pruebas) | Sin errores |
| `ng test` (Vitest) | 19 archivos, 96 pruebas aprobadas, 0 fallidas |
| `npm run test:cache` | 2 pruebas aprobadas |
| `ng build` producción (SSR + prerender de `/privacidad`) | Aprobado, sin advertencias; paquete inicial 406 kB (109 kB transferidos) |
| `tests/runtime-smoke.mjs` con el backend de la rama | Aprobado: registro, login, 201 en creaciones, estadísticas reales, consentimiento, IA no configurada (503), resumen del panel, PUT/DELETE por el proxy, 401 sin token, SSR/SSG/ISR y caché |
| Recorrido visual con Chrome (escritorio 1440 px y móvil 390 px) contra FastAPI + PostgreSQL 16 con la carga de demostración | Todas las páginas cargan datos reales; sin errores de consola salvo las fuentes de Google bloqueadas por el entorno sin internet |

No verificado aquí: llamada real a Groq (no había clave en el entorno) y
despliegue en Railway.

## Entrega anterior

## Resultado observado

- Instalación de dependencias y resolución compatible de Angular 22.2.0.
- Comprobación de tipos TypeScript de aplicación y pruebas: sin errores.
- Compilador Angular (`ngc --noEmit`): tipos y plantillas sin errores.
- Suite Angular/Vitest: 13 archivos, 18 pruebas aprobadas.
- Suite de caché Node: 2 pruebas aprobadas (deduplicación, expiración, recuperación).
- Build de producción SSR/SSG aprobado en GitHub Actions.
- Comprobación física de `browser/privacidad/index.html`: aprobada.
- Prueba del servidor Node con FastAPI real y SQLite desechable: aprobada.
- HTML SSR, SSG y shell privado CSR; proxy, cabeceras y caché pública: aprobados.
- Cambio de versión pública y regeneración tras TTL sin reconstruir: aprobado.
- Registro/login JWT, autoasignación, síntomas 0 y 6 con promedio 3, consentimiento
  rechazado y error controlado por ausencia de Groq: aprobados a través del proxy.
- `git diff --check`: sin errores.

Los tests existentes se conservan. Se proporcionan dependencias HTTP/router de
prueba que faltaban en los smoke tests generados y se corrige una aserción obsoleta
que buscaba el título inicial del scaffold, inexistente en la aplicación original.
Se agregan pruebas de evolución para carga, errores, autorización explícita,
selección del paciente y separación temporal de los puntos.

## Ejecución reproducible y límites

El build de producción completo con SSR se intentó varias veces y fue detenido
por memoria del entorno de conversación. Se trasladó la verificación al runner
de GitHub Actions, donde pasó con optimización, prerender y presupuestos activos.
Evidencia del código de runtime: [ejecución aprobada](https://github.com/1081271746/Care_Guardian_Front/actions/runs/44190131696).

`tests/rendering-smoke.mjs` verifica HTML SSR/SSG/CSR, cabeceras privadas y proxy de
API. Con `RESOURCE_TEST_FILE` permite comprobar regeneración real sin rebuild.
Fue ejecutado por `tests/runtime-smoke.mjs`, que inicia Node y FastAPI, genera
su base SQLite y secretos temporales sin imprimirlos, y limpia procesos/archivos.
No utiliza ni consulta pacientes reales. El workflow fija un commit completo del
backend para que la prueba sea reproducible.

El workflow de GitHub Actions incluido ejecuta tests y build en un runner con más
memoria. El permiso `workflow` se autorizó y la rama quedó publicada. El lockfile
conserva versiones e integridades, pero omite URLs de registros que solo existen
dentro de Replit; `npm ci` se validó desde un runner externo.
No se ha probado un despliegue Railway ni una llamada real a Groq. Se conservan
advertencias de tamaño del bundle inicial y del CSS heredado; ver RENDERING.md.

## Archivos por área

| Área | Ubicación |
|---|---|
| Evolución conectada | `src/app/pages/evolucion/`, `src/app/services/api.ts` |
| Autenticación y selección | `src/app/services/auth*`, `src/app/app.routes.ts`, páginas de seguimiento y dashboard |
| Rendering | `src/app/app.config*`, `src/app/app.routes.server.ts`, `src/main.server.ts`, `src/server.ts`, `src/isr-cache*`, `src/app/pages/public/` |
| Contenido público | `content/recursos.json` |
| Pruebas | `src/test-providers.ts`, `src/app/**/*.spec.ts`, `tests/`, `.github/workflows/tests.yml` |
| Producción | `Dockerfile`, `.dockerignore`, `railway.toml`, `.env.example`, `angular.json`, `package*.json`, `tsconfig.app.json` |

No hay linter configurado. Se retiraron logs de datos personales de las páginas
existentes. No se reescribe el diseño general, no se cambia de framework y no se
insertan datos ficticios para simular evolución.

## Listado completo de archivos nuevos o modificados

```text
.dockerignore
.env.example
.github/workflows/tests.yml
.gitignore
Dockerfile
README.md
angular.json
content/recursos.json
docs/RENDERING.md
docs/VERIFICACION.md
package-lock.json
package.json
proxy.conf.json
railway.toml
src/app/app.config.server.ts
src/app/app.config.ts
src/app/app.routes.server.ts
src/app/app.routes.ts
src/app/app.spec.ts
src/app/pages/alertas/alertas.ts
src/app/pages/citas/citas.ts
src/app/pages/dashboard/dashboard.html
src/app/pages/dashboard/dashboard.ts
src/app/pages/evolucion/evolucion.behavior.spec.ts
src/app/pages/evolucion/evolucion.css
src/app/pages/evolucion/evolucion.html
src/app/pages/evolucion/evolucion.ts
src/app/pages/medicamentos/medicamentos.ts
src/app/pages/notas/notas.ts
src/app/pages/pacientes/pacientes.ts
src/app/pages/public/public.ts
src/app/pages/sintomas/sintomas.ts
src/app/services/api.ts
src/app/services/auth.guard.ts
src/app/services/auth.interceptor.ts
src/app/services/auth.ts
src/index.html
src/isr-cache.d.mts
src/isr-cache.mjs
src/main.server.ts
src/server.ts
src/test-providers.ts
tests/isr-cache.test.mjs
tests/rendering-smoke.mjs
tests/runtime-smoke.mjs
tsconfig.app.json
```
