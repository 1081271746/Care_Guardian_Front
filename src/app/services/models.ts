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
