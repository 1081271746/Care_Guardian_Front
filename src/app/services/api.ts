import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

import {
  Alert, Appointment, CaregiverNote, Evolution, Medication, Patient,
  PatientDashboard, PatientInput, SavedAnalysis, SymptomRecord,
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

  // ---------------- Symptoms ----------------
  getPatientSymptoms(patientId: number) {
    return this.http.get<SymptomRecord[]>(`${API}/symptoms/patients/${patientId}`);
  }

  createSymptom(patientId: number, symptom: object) {
    return this.http.post<SymptomRecord>(`${API}/symptoms/patients/${patientId}`, symptom);
  }

  // ---------------- Medications ----------------
  getPatientMedications(patientId: number) {
    return this.http.get<Medication[]>(`${API}/medications/patients/${patientId}`);
  }

  createMedication(patientId: number, medication: object) {
    return this.http.post<Medication>(`${API}/medications/patients/${patientId}`, medication);
  }

  // ---------------- Appointments ----------------
  getPatientAppointments(patientId: number) {
    return this.http.get<Appointment[]>(`${API}/appointments/patients/${patientId}`);
  }

  createAppointment(patientId: number, appointment: object) {
    return this.http.post<Appointment>(`${API}/appointments/patients/${patientId}`, appointment);
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

