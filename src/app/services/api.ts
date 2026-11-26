import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

import {
  AiStatus, Alert, CurrentUser, AlertInput, AlertLevel, AlertStatus, ApiMessage, Appointment, AppointmentInput, Caregiver, CaregiverNote,
  DashboardSummary, Evolution, Medication, Patient,
  MedicationInput, PatientDashboard, PatientInput, SavedAnalysis, SymptomInput, SymptomRecord,
} from './models';

/** Same-origin prefix; src/server.ts proxies it to API_BASE_URL. */
export const API = '/api';
export const CONSENT_VERSION = 'groq-minimized-v1';

/** IANA zone of the browser, or '' during SSR / when unavailable. */
export function browserZone(): string {
  try {
    return typeof window === 'undefined' ? '' : Intl.DateTimeFormat().resolvedOptions().timeZone ?? '';
  } catch {
    return '';
  }
}

/** Drops empty values so optional filters never reach the API as "". */
export function params(values: Record<string, string | number | boolean | null | undefined>): HttpParams {
  let result = new HttpParams();
  for (const [key, value] of Object.entries(values)) {
    if (value !== null && value !== undefined && value !== '') result = result.set(key, String(value));
  }
  return result;
}

@Injectable({ providedIn: 'root' })
export class Api {
  private http = inject(HttpClient);

  // ---------------- Account ----------------
  updateAccount(userId: number, changes: { nombre?: string; email?: string }) {
    return this.http.put<CurrentUser>(`${API}/users/${userId}`, changes);
  }

  /** Changing the password revokes every previous session on the API. */
  changePassword(userId: number, actual: string, nueva: string) {
    return this.http.put<ApiMessage>(`${API}/users/${userId}/password`, {
      password_actual: actual, password_nueva: nueva,
    });
  }

  // ---------------- Dashboard ----------------
  getPatientDashboard(patientId: number) {
    return this.http.get<PatientDashboard>(`${API}/dashboard/patients/${patientId}`);
  }

  /** Caregiver-wide indicators computed by PostgreSQL on every request. */
  getSummary() {
    return this.http.get<DashboardSummary>(`${API}/dashboard/summary`);
  }

  // ---------------- Patients ----------------
  getPatients() {
    return this.http.get<Patient[]>(`${API}/patients/`);
  }

  createPatient(patient: PatientInput) {
    return this.http.post<Patient>(`${API}/patients/`, patient);
  }

  searchPatients(filters: { q?: string; activos?: boolean | null }) {
    return this.http.get<Patient[]>(`${API}/patients/`, { params: params(filters) });
  }

  getPatient(patientId: number) {
    return this.http.get<Patient>(`${API}/patients/${patientId}`);
  }

  updatePatient(patientId: number, changes: Partial<PatientInput> & { activo?: boolean }) {
    return this.http.put<Patient>(`${API}/patients/${patientId}`, changes);
  }

  /** The API deactivates (never deletes) so the clinical history is kept. */
  deactivatePatient(patientId: number) {
    return this.http.delete<ApiMessage>(`${API}/patients/${patientId}`);
  }

  getCaregivers(patientId: number) {
    return this.http.get<Caregiver[]>(`${API}/patients/${patientId}/caregivers`);
  }

  assignCaregiver(patientId: number, email: string, rol: string) {
    return this.http.post<ApiMessage>(`${API}/patients/${patientId}/caregivers`, { email, rol });
  }

  removeCaregiver(patientId: number, userId: number) {
    return this.http.delete<ApiMessage>(`${API}/patients/${patientId}/caregivers/${userId}`);
  }

  // ---------------- Symptoms ----------------
  getPatientSymptoms(patientId: number) {
    return this.http.get<SymptomRecord[]>(`${API}/symptoms/patients/${patientId}`);
  }

  createSymptom(patientId: number, symptom: SymptomInput) {
    return this.http.post<SymptomRecord>(`${API}/symptoms/patients/${patientId}`, symptom);
  }

  updateSymptom(symptomId: number, changes: Partial<SymptomInput>) {
    return this.http.put<SymptomRecord>(`${API}/symptoms/${symptomId}`, changes);
  }

  deactivateSymptom(symptomId: number) {
    return this.http.delete<ApiMessage>(`${API}/symptoms/${symptomId}`);
  }

  // ---------------- Medications ----------------
  getPatientMedications(patientId: number) {
    return this.http.get<Medication[]>(`${API}/medications/patients/${patientId}`);
  }

  createMedication(patientId: number, medication: MedicationInput) {
    return this.http.post<Medication>(`${API}/medications/patients/${patientId}`, medication);
  }

  updateMedication(medicationId: number, changes: Partial<MedicationInput> & { activo?: boolean }) {
    return this.http.put<Medication>(`${API}/medications/${medicationId}`, changes);
  }

  /** Suspends the medication (activo=false); it stays in the history. */
  suspendMedication(medicationId: number) {
    return this.http.delete<ApiMessage>(`${API}/medications/${medicationId}`);
  }

  // ---------------- Appointments ----------------
  getPatientAppointments(patientId: number) {
    return this.http.get<Appointment[]>(`${API}/appointments/patients/${patientId}`);
  }

  createAppointment(patientId: number, appointment: AppointmentInput) {
    return this.http.post<Appointment>(`${API}/appointments/patients/${patientId}`, appointment);
  }

  getUpcomingAppointments(patientId: number) {
    return this.http.get<Appointment[]>(`${API}/appointments/patients/${patientId}`, {
      params: params({ proximas: true }),
    });
  }

  updateAppointment(appointmentId: number, changes: Partial<AppointmentInput>) {
    return this.http.put<Appointment>(`${API}/appointments/${appointmentId}`, changes);
  }

  deleteAppointment(appointmentId: number) {
    return this.http.delete<ApiMessage>(`${API}/appointments/${appointmentId}`);
  }

  // ---------------- Notes ----------------
  getPatientNotes(patientId: number) {
    return this.http.get<CaregiverNote[]>(`${API}/notes/patients/${patientId}`);
  }

  createNote(patientId: number, note: object) {
    return this.http.post<CaregiverNote>(`${API}/notes/patients/${patientId}`, note);
  }

  updateNote(noteId: number, contenido: string) {
    return this.http.put<CaregiverNote>(`${API}/notes/${noteId}`, { contenido });
  }

  deactivateNote(noteId: number) {
    return this.http.delete<ApiMessage>(`${API}/notes/${noteId}`);
  }

  // ---------------- Alerts ----------------
  getPatientAlerts(patientId: number) {
    return this.http.get<Alert[]>(`${API}/alerts/patients/${patientId}`);
  }

  updateAlert(alertId: number, alertData: object) {
    return this.http.put<Alert>(`${API}/alerts/${alertId}`, alertData);
  }

  getAlertHistory(patientId: number, nivel: AlertLevel | '' = '') {
    return this.http.get<Alert[]>(`${API}/alerts/patients/${patientId}`, {
      params: params({ incluir_cerradas: true, nivel }),
    });
  }

  createAlert(patientId: number, alert: AlertInput) {
    return this.http.post<Alert>(`${API}/alerts/patients/${patientId}`, alert);
  }

  setAlertStatus(alertId: number, estado: AlertStatus) {
    return this.http.put<Alert>(`${API}/alerts/${alertId}`, { estado });
  }

  // ---------------- Evolution ----------------
  /** Period days are interpreted in the browser's timezone (falls back to the server's). */
  getEvolution(patientId: number, desde = '', hasta = '', zona = browserZone()) {
    return this.http.get<Evolution>(`${API}/evolution/patients/${patientId}`, {
      params: params({ desde, hasta, zona }),
    });
  }

  getEvolutionAnalyses(patientId: number) {
    return this.http.get<SavedAnalysis[]>(`${API}/evolution/patients/${patientId}/analyses`);
  }

  /** Only call after the caregiver ticks the consent box; the API validates it again. */
  analyzeEvolution(patientId: number, desde = '', hasta = '', zona = browserZone()) {
    return this.http.post<SavedAnalysis>(`${API}/evolution/patients/${patientId}/analyses`, {
      consentimiento: true, version_consentimiento: CONSENT_VERSION,
      desde: desde || null, hasta: hasta || null, zona: zona || null,
    });
  }

  getAnalysis(patientId: number, analysisId: number) {
    return this.http.get<SavedAnalysis>(`${API}/evolution/patients/${patientId}/analyses/${analysisId}`);
  }

  getAiStatus() {
    return this.http.get<AiStatus>(`${API}/evolution/ai-status`);
  }
}

