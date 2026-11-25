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
