# CareGuardian frontend

Angular 22 standalone. Se mantiene el diseño y las páginas existentes y se
completa Evolución con datos del backend FastAPI, sin historiales ficticios.

## Desarrollo

Node 24:

```sh
npm ci
npm run dev
```

En desarrollo el proxy local reenvía `/api` a FastAPI en `127.0.0.1:8000`.
Esa dirección no forma parte de la configuración de producción.

```sh
npm test -- --watch=false
npm run test:cache
npm run build
API_BASE_URL=http://127.0.0.1:8000 npm start
```

No hay linter configurado en el repositorio original. No se añade uno ni se
reformatea todo el código para este trabajo.
Resultados y comprobaciones pendientes: [VERIFICACION.md](docs/VERIFICACION.md).

## Funcionalidades conservadas y completadas

Se conservan login JWT, dashboard, pacientes, síntomas, medicamentos, citas,
notas y alertas. La ruta `/evolucion?patientId=ID` ahora carga pacientes asignados,
historial multiorigen por períodos, conteos, promedio/primera/última medición y
diferencias. Incluye gráficas con separación temporal real, tablas accesibles,
datos vacíos, carga, errores y actualización manual. Las fechas se muestran en UTC.
No se infiere adherencia a medicamentos porque el backend no registra dosis tomadas.

El análisis Groq requiere autorización explícita por solicitud, informa qué datos
se envían y distingue interpretación de hechos. Los resúmenes guardados identifican
fecha, modelo y período. No se envían secretos desde el frontend.

Se corrige la selección fija del paciente 1 en páginas de seguimiento. Los guards
son una ayuda de navegación; la protección efectiva se aplica en FastAPI.

## Rendering

CSR privado, SSR `/acerca`, SSG `/privacidad` y equivalente ISR `/recursos`.
Detalles, límites y demostración en [RENDERING.md](docs/RENDERING.md).
La hidratación no se presenta como ISR.

## Railway

Conectar este repositorio a un servicio frontend usando `Dockerfile` y
`railway.toml`. No desplegar como un simple sitio estático: hay un servidor Node
que atiende SSR, caché pública y proxy de API.

- Build: `npm ci` y `npm run build` (etapa Docker).
- Inicio: `node dist/careguardian_front/server/server.mjs`.
- Escucha `0.0.0.0` y `PORT`.
- Health: `/health`.
- `API_BASE_URL`: origen del backend, por ejemplo el servicio existente en Railway.
- `PUBLIC_ORIGIN`: origen público del frontend, sin barra final.
- `PUBLIC_CACHE_TTL_SECONDS`: TTL de `/recursos`, 300 por defecto.
- `PUBLIC_RESOURCES_FILE`: archivo público opcional montado en volumen.

El navegador siempre utiliza `/api`; el servidor Node utiliza `API_BASE_URL`.
La variable no debe apuntar al propio frontend ni incluir credenciales.
El proxy reenvía únicamente autorización y tipo de contenido; no copia cookies,
cabeceras de sesión ni cachés. Las rutas conservan recarga directa mediante el
servidor Angular. No hay WebSockets en el código existente.

Configurar `DATABASE_URL`, `SECRET_KEY`, `GROQ_API_KEY`, `GROQ_MODEL` y CORS en el
**backend**, no aquí. No crear otra base si Railway ya tiene una.

## Validación después de desplegar

1. Abrir `/health`, `/login`, `/acerca`, `/privacidad` y `/recursos`.
2. Iniciar sesión y seleccionar un paciente asignado; registrar síntomas reales.
3. Abrir Evolución desde el dashboard, filtrar y contrastar con esos registros.
4. Confirmar la autorización antes del análisis y consultar el resultado tras recargar.
5. Probar con otro usuario sin asignación y con Groq inaccesible.
6. Inspeccionar HTML y cabeceras según la guía de rendering.

Base original: `main` en `cb9bef2753c8acfc7f54ef3087f3e75085e2003e`.
No se modificaron datos de producción ni se ejecutó un despliegue remoto.
