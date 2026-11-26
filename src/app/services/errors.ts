import { HttpErrorResponse } from '@angular/common/http';

const FIELD_NAMES: Record<string, string> = {
  nombres: 'Nombres', apellidos: 'Apellidos', documento: 'Documento', fecha_nacimiento: 'Fecha de nacimiento',
  telefono: 'Teléfono', telefono_emergencia: 'Teléfono de emergencia', nombre: 'Nombre', dosis: 'Dosis',
  frecuencia: 'Frecuencia', hora: 'Hora', fecha_inicio: 'Fecha de inicio', fecha_fin: 'Fecha de finalización',
  titulo: 'Título', especialidad: 'Especialidad', profesional: 'Profesional', fecha: 'Fecha', estado: 'Estado',
  contenido: 'Contenido', mensaje: 'Mensaje', nivel_dolor: 'Dolor', calidad_sueno: 'Sueño',
  temperatura: 'Temperatura', fecha_registro: 'Fecha del registro', email: 'Correo', password: 'Contraseña',
};

/**
 * Turns any API/network error into one readable Spanish sentence.
 * FastAPI returns either {detail: "text"} or {detail: [{loc, msg}, ...]} (422).
 */
export function apiError(error: unknown, fallback = 'No fue posible completar la acción.'): string {
  if (!(error instanceof HttpErrorResponse)) {
    const detail = (error as { error?: { detail?: unknown } })?.error?.detail;
    return typeof detail === 'string' ? detail : fallback;
  }
  if (error.status === 0) return 'No hay conexión con el servidor. Revisa tu internet e inténtalo de nuevo.';
  const detail = error.error?.detail;
  const retry = Number(error.headers?.get('Retry-After'));
  if (error.status === 429 && typeof detail === 'string' && retry > 0) {
    return `${detail} (podrás intentarlo en ${retry < 60 ? `${retry} s` : `${Math.ceil(retry / 60)} min`}).`;
  }
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail) && detail.length) {
    const first = detail[0] ?? {};
    const field = Array.isArray(first.loc) ? String(first.loc[first.loc.length - 1]) : '';
    const message = String(first.msg ?? '').replace(/^Value error, /, '');
    return field && FIELD_NAMES[field] ? `${FIELD_NAMES[field]}: ${message}` : message || fallback;
  }
  if (error.status === 429) return 'Demasiadas solicitudes seguidas. Espera un momento e inténtalo otra vez.';
  if (error.status >= 500) return 'El servidor no está disponible en este momento. Inténtalo de nuevo en unos minutos.';
  return fallback;
}
