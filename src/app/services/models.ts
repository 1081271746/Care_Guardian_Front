/**
 * Types that mirror the FastAPI response/request schemas
 * (Care_Guardian_Back/app/schemas). Field names are kept in Spanish exactly
 * as the API returns them so no mapping layer can drift.
 */

export interface LoginResponse {
  access_token: string;
  token_type: 'bearer';
  expires_in?: number;
}

export interface CurrentUser {
  id: number;
  nombre: string;
  email: string;
  rol: string;
  activo: boolean;
  fecha_creacion: string;
  pacientes_asignados: number;
}

export interface Patient {
  id: number;
  nombres: string;
  apellidos: string;
  fecha_nacimiento: string;
  documento: string;
  telefono: string | null;
  direccion: string | null;
  contacto_emergencia: string | null;
  telefono_emergencia: string | null;
  activo: boolean;
  fecha_registro: string;
  edad: number;
}

export type PatientInput = Omit<Patient, 'id' | 'activo' | 'fecha_registro' | 'edad'>;

export interface Caregiver {
  user_id: number;
  nombre: string;
  email: string;
  rol: 'cuidador' | 'familiar' | 'profesional' | string;
}

export interface Medication {
  id: number;
  patient_id: number;
  nombre: string;
  dosis: string;
  frecuencia: string;
  hora: string;
  fecha_inicio: string;
  fecha_fin: string | null;
  indicaciones: string | null;
  activo: boolean;
  vigente: boolean;
  fecha_registro: string;
}

export type MedicationInput = Pick<Medication,
  'nombre' | 'dosis' | 'frecuencia' | 'hora' | 'fecha_inicio' | 'fecha_fin' | 'indicaciones'>;

export type AppointmentStatus = 'pendiente' | 'confirmada' | 'completada' | 'cancelada';

export interface Appointment {
  id: number;
  patient_id: number;
  titulo: string;
  especialidad: string;
  profesional: string;
  fecha: string;
  hora: string;
  lugar: string | null;
  estado: AppointmentStatus;
  notas: string | null;
  fecha_registro: string;
}

export type AppointmentInput = Omit<Appointment, 'id' | 'patient_id' | 'fecha_registro'>;

export type Severity = 'bajo' | 'moderado' | 'grave';

export interface SymptomRecord {
  id: number;
  patient_id: number;
  caregiver_id: number;
  calidad_sueno: number | null;
  estado_animo: string | null;
  apetito: string | null;
  nivel_dolor: number | null;
  temperatura: number | null;
  observaciones: string | null;
  nivel_gravedad: Severity;
  fecha_registro: string;
  activo: boolean;
  registrado_por_nombre?: string | null;
}

export type SymptomInput = Partial<Pick<SymptomRecord,
  'calidad_sueno' | 'estado_animo' | 'apetito' | 'nivel_dolor' | 'temperatura' | 'observaciones'>> & {
  nivel_gravedad: Severity;
  fecha_registro?: string | null;
};

export interface CaregiverNote {
  id: number;
  patient_id: number;
  caregiver_id: number;
  contenido: string;
  fecha_registro: string;
  activo: boolean;
  autor_nombre?: string | null;
}

export type AlertLevel = 'bajo' | 'medio' | 'alto';
export type AlertStatus = 'pendiente' | 'en_revision' | 'atendida' | 'descartada';

export interface Alert {
  id: number;
  patient_id: number;
  symptom_id: number | null;
  note_id: number | null;
  tipo: string;
  nivel: AlertLevel;
  titulo: string;
  mensaje: string;
  estado: AlertStatus;
  origen: string;
  fecha_registro: string;
  activa: boolean;
}

export interface AlertInput {
  titulo: string;
  mensaje: string;
  nivel: AlertLevel;
}

export interface DashboardSummary {
  generado: string;
  zona_horaria: string;
  totales: {
    pacientes: number;
    pacientes_activos: number;
    medicamentos_activos: number;
    medicamentos_registrados: number;
    citas_proximas: number;
    sintomas_recientes: number;
    notas_recientes: number;
    alertas_pendientes: number;
  };
  ventanas: { citas_dias: number; recientes_dias: number };
  alertas_por_nivel: Record<AlertLevel, number>;
  sintomas_por_dia: { fecha: string; cantidad: number }[];
  proximas_citas: (Pick<Appointment, 'id' | 'patient_id' | 'titulo' | 'especialidad' | 'profesional' |
    'fecha' | 'hora' | 'lugar' | 'estado'> & { paciente: string })[];
  pacientes: { id: number; nombre: string; activo: boolean; alertas_activas: number; ultimo_registro: string | null }[];
  actividad_reciente: {
    id: string;
    tipo: 'sintoma' | 'nota' | 'alerta' | 'medicamento' | 'cita';
    patient_id: number;
    paciente: string;
    descripcion: string;
    fecha: string;
  }[];
}

export interface PatientDashboard {
  patient: Patient;
  symptoms: SymptomRecord[];
  medications: Medication[];
  upcoming_appointments: Appointment[];
  recent_notes: CaregiverNote[];
  active_alerts: Alert[];
  historical_analysis: { registros_analizados: number; score: number; nivel: AlertLevel; tendencias: string[]; recomendacion: string };
  current_risk_level: AlertLevel;
}

export type MetricKey = 'nivel_dolor' | 'calidad_sueno' | 'temperatura';
export type EventKind = 'sintoma' | 'nota' | 'medicamento' | 'cita' | 'alerta';

export interface MetricPoint { fecha: string; valor: number }

export interface MetricSummary {
  cantidad: number;
  promedio?: number;
  inicial?: number;
  reciente?: number;
  diferencia?: number;
  puntos: MetricPoint[];
}

export interface TimelineEvent {
  id: string;
  tipo: EventKind;
  fecha: string;
  descripcion: string;
  nivel?: string | null;
}

export interface Evolution {
  patient_id: number;
  periodo: { desde: string | null; hasta: string | null };
  zona_horaria?: string;
  totales: Record<EventKind, number>;
  metricas: Record<MetricKey, MetricSummary>;
  categorias?: Record<string, Record<string, number>>;
  historial: TimelineEvent[];
  hechos?: Record<string, string>;
  datos_suficientes: boolean;
  nota?: string;
}

export interface AnalysisResult {
  resumen: string[];
  revisar: string[];
  advertencia: string;
  periodo: { desde: string | null; hasta: string | null };
  metodo?: string;
}

export interface SavedAnalysis {
  id: number;
  fecha: string;
  modelo: string;
  periodo?: { desde: string | null; hasta: string | null };
  autor_id?: number;
  resultado: AnalysisResult;
}

export interface AiStatus {
  configurado: boolean;
  proveedor: string;
  modelo: string | null;
  limite_por_minuto: number;
  version_consentimiento: string;
}

export interface ApiMessage { mensaje: string }
