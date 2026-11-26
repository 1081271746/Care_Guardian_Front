# Cambios

## 2.0.0 — 2026-11-26

### Agregado
- Sistema de diseño propio (`styles.css`), íconos SVG y layout `Shell` con navegación lateral y menú móvil.
- Panel general con indicadores reales, panel por paciente, página de cuenta y página 404.
- Edición y desactivación en todos los módulos; gestión del equipo de cuidado por correo.
- Evolución: períodos rápidos, categorías, historial paginado, estado de la IA, resúmenes guardados, impresión y enlace compartible.
- Horario de medicamentos del día, aviso “Hoy” en citas, contador de alertas en la navegación.
- Banner sin conexión, reintento único de GET ante fallos transitorios, manifiesto web y favicon SVG.

### Cambiado
- Rutas privadas con carga diferida dentro del `Shell`.
- Las pruebas usan `HttpTestingController` en lugar de respuestas fijas.

### Seguridad
- Cierre de sesión real; manejo de tokens vencidos o revocados; redirecciones solo internas.
- Cabeceras de seguridad adicionales en el servidor Node.
