import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

import {
  Alert, ApiMessage, Appointment, AppointmentInput, Caregiver, CaregiverNote, Evolution, Medication, Patient,
  MedicationInput, PatientDashboard, PatientInput, SavedAnalysis, SymptomInput, SymptomRecord,
} from './models';

/** Same-origin prefix; src/server.ts proxies it to API_BASE_URL. */
export const API = '/api';

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

  // ---------------- Dashboard ----------------
  getPatientDashboard(patientId: number) {
    return this.http.get<PatientDashboard>(`${API}/dashboard/patients/${patientId}`);
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

  // ---------------- Alerts ----------------
  getPatientAlerts(patientId: number) {
    return this.http.get<Alert[]>(`${API}/alerts/patients/${patientId}`);
  }

  updateAlert(alertId: number, alertData: object) {
    return this.http.put<Alert>(`${API}/alerts/${alertId}`, alertData);
  }

  // ---------------- Evolution ----------------
  getEvolution(patientId: number, desde = '', hasta = '') {
    return this.http.get<Evolution>(`${API}/evolution/patients/${patientId}`, {
      params: params({ desde, hasta }),
    });
  }

  getEvolutionAnalyses(patientId: number) {
    return this.http.get<SavedAnalysis[]>(`${API}/evolution/patients/${patientId}/analyses`);
  }

  analyzeEvolution(patientId: number, desde = '', hasta = '') {
    return this.http.post<SavedAnalysis>(`${API}/evolution/patients/${patientId}/analyses`, {
      consentimiento: true, version_consentimiento: 'groq-minimized-v1',
      desde: desde || null, hasta: hasta || null,
    });
  }
}

