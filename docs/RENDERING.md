# Rendering híbrido de CareGuardian (Angular 22)

Se conserva Angular, su router standalone, HttpClient y la interfaz existente.
La versión resuelta al instalar el manifiesto original fue 22.2.0. Se fija esa
misma versión para alinear los peers de SSR; no se migra a otro framework.

| Patrón | Rutas | Implementación |
|---|---|---|
| CSR | Login, panel, panel de paciente, pacientes, síntomas, medicamentos, citas, notas, alertas, evolución, cuenta y 404 | `RenderMode.Client` en la regla `**`; rutas privadas con carga diferida dentro del `Shell`, guards y HTTP autenticado |
| SSR | `/acerca` | `RenderMode.Server`; Angular renderiza cada petición |
| SSG | `/privacidad` | `RenderMode.Prerender`; HTML generado durante el build |
| Equivalente ISR | `/recursos` | SSR + caché de HTML pública con TTL y stale-while-revalidate en Node |

Angular documenta CSR, SSR y prerenderizado como sus modos de rendering.
**No se afirma que Angular tenga un modo ISR nativo.** La estrategia equivalente
se implementa en `src/server.ts` y `src/isr-cache.mjs`.

## Regeneración incremental

Solo una ruta fija `/recursos` es elegible. La primera solicitud genera HTML
(`X-Public-Cache: MISS`). Durante `PUBLIC_CACHE_TTL_SECONDS` reutiliza ese documento
(`HIT`). Al expirar devuelve el anterior (`STALE`) y regenera en segundo plano;
peticiones concurrentes comparten una sola regeneración. Si falla, conserva la
última versión válida, con un breve intervalo antes de otro intento.

El servidor relee `PUBLIC_RESOURCES_FILE` en cada regeneración. Un archivo JSON
público montado en volumen puede actualizarse sin recompilar. Sin volumen se usa
`content/recursos.json`; modificar el archivo del repositorio sí requiere desplegar
esa nueva imagen. El contenido admite `version` de texto e `items` con `title` y
`text`. Angular escapa el contenido. No contiene ni debe contener datos personales.

La caché es por proceso, efímera y de una entrada. Varias réplicas regeneran
independientemente; para contenido público eso puede producir unos segundos de
desfase. No requiere Redis. No hay panel público de edición ni endpoint de
invalidación abierto.

La petición interna de rendering se construye sin cookies, autorización, query ni
host del solicitante. No se guarda una respuesta con `Set-Cookie`. Todos los
HTML privados y la API llevan `private, no-store`; la caché incremental vive solo
en el servidor y no depende de cachés compartidas del navegador o CDN.

## Rendering no es hidratación

Rendering genera HTML en navegador, servidor o build. Hydration reutiliza el DOM
producido por SSR/SSG y le añade el comportamiento Angular. Se habilita
`provideClientHydration(withNoHttpTransferCache())`: no se serializan respuestas
HTTP sanitarias. Únicamente el contenido público de recursos se transfiere de
forma explícita mediante TransferState. La hidratación incremental es otra técnica,
no se usa ni se presenta como ISR.

## Cómo demostrar los patrones

Tras compilar y arrancar el servidor de producción:

```sh
curl -i http://localhost:4000/acerca
curl -i http://localhost:4000/privacidad
curl -i http://localhost:4000/evolucion
curl -i http://localhost:4000/recursos
curl -i http://localhost:4000/recursos
```

SSR y SSG contienen sus títulos en el HTML sin ejecutar JavaScript. La ruta
privada devuelve el shell CSR, sin registros. El build genera
`dist/careguardian_front/browser/privacidad/index.html`.
`X-Rendering-Mode` identifica el comportamiento.

Para probar la revalidación usar un TTL corto en **pruebas**, editar el archivo
público montado, esperar a la expiración y comparar las respuestas `STALE` y `HIT`:
la versión y `generatedAt` cambian sin ejecutar un build.

Pruebas unitarias del algoritmo: `npm run test:cache`.
Referencia oficial: https://angular.dev/guide/ssr

## Hosts y tamaño de estilos

El servidor permite únicamente localhost, 127.0.0.1, el host configurado en
`PUBLIC_ORIGIN`, `RAILWAY_PUBLIC_DOMAIN` y la lista explícita `NG_ALLOWED_HOSTS`.
No se habilitan comodines ni confianza automática en cabeceras forwarded.

El CSS original de dashboard pesa 20,70 kB minificado y ya excedía el límite
de error de 8 kB del scaffold. Se conserva sin rediseñarlo. El presupuesto de
estilos sigue activo: aviso a 8 kB y error a 24 kB. El presupuesto inicial
permanece en aviso 500 kB/error 1 MB; las advertencias no se ocultan.

## Rutas privadas y carga diferida (noviembre de 2026)

Las páginas privadas cuelgan de un componente `Shell` (navegación lateral) y se
cargan con `loadComponent`, de modo que el paquete inicial solo incluye el login,
el shell y los servicios. El HTML que el servidor envía para estas rutas es la
plantilla vacía de la aplicación: `tests/rendering-smoke.mjs` comprueba que no
contiene “Cerrar sesión” ni “Historial cronológico”, es decir, que ningún dato
o componente privado se renderiza en el servidor.
