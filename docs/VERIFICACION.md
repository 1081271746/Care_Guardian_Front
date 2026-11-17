# Verificación de la entrega

## Resultado observado

- Instalación de dependencias y resolución compatible de Angular 22.2.0.
- Comprobación de tipos TypeScript de aplicación y pruebas: sin errores.
- Compilador Angular (`ngc --noEmit`): tipos y plantillas sin errores.
- Suite Angular/Vitest: 13 archivos, 18 pruebas aprobadas.
- Suite de caché Node: 2 pruebas aprobadas (deduplicación, expiración, recuperación).
- `git diff --check`: sin errores.

Los tests existentes se conservan. Se proporcionan dependencias HTTP/router de
prueba que faltaban en los smoke tests generados y se corrige una aserción obsoleta
que buscaba el título inicial del scaffold, inexistente en la aplicación original.
Se agregan pruebas de evolución para carga, errores, autorización explícita,
selección del paciente y separación temporal de los puntos.

## Validación todavía pendiente

El build de producción completo con SSR se intentó varias veces y fue detenido
por memoria del entorno, incluso al limitar workers y heap. No se considera
aprobado. No debe confundirse `ngc --noEmit` con un build de producción.

`tests/rendering-smoke.mjs` verifica HTML SSR/SSG/CSR, cabeceras privadas y proxy de
API. Con `RESOURCE_TEST_FILE` permite comprobar regeneración real sin rebuild.
Este script todavía no se ha ejecutado porque depende del build SSR completo.
Debe ejecutarse contra un servidor local de prueba, nunca contra datos sanitarios
de producción. El backend de prueba debe escuchar en `API_BASE_URL`.

El workflow de GitHub Actions incluido ejecuta tests y build en un runner con más
memoria. Publicarlo requiere que la conexión GitHub tenga permiso `workflow`.
No se ha probado un despliegue Railway ni una llamada real a Groq.

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
