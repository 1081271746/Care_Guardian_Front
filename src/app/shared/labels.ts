/** Human labels for the values the API stores (keeps templates free of switches). */
export const LABELS: Record<string, string> = {
  // appointment status
  pendiente: 'Pendiente', confirmada: 'Confirmada', completada: 'Completada', cancelada: 'Cancelada',
  // alert status
  en_revision: 'En revisión', atendida: 'Atendida', descartada: 'Descartada',
  // levels
  bajo: 'Bajo', medio: 'Medio', alto: 'Alto', moderado: 'Moderado', grave: 'Grave',
  // timeline kinds
  sintoma: 'Síntomas', nota: 'Nota', medicamento: 'Medicamento', cita: 'Cita', alerta: 'Alerta',
  // caregiver roles
  cuidador: 'Cuidador', familiar: 'Familiar', profesional: 'Profesional',
  // alert origins
  manual: 'Manual', sistema: 'Automática',
};

export function label(value: string | null | undefined): string {
  if (!value) return '—';
  return LABELS[value] ?? value.charAt(0).toUpperCase() + value.slice(1).replace(/_/g, ' ');
}

export const METRIC_LABELS = {
  nivel_dolor: { title: 'Dolor', unit: '/10', min: 0, max: 10 },
  calidad_sueno: { title: 'Calidad del sueño', unit: '/10', min: 0, max: 10 },
  temperatura: { title: 'Temperatura', unit: ' °C', min: 35, max: 41 },
} as const;
