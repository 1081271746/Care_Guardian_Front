import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class Api {

  private apiUrl = '/api';

  constructor(private http: HttpClient) {}

  getEvolution(patientId: number, desde = '', hasta = '') {
    return this.http.get<any>(`${this.apiUrl}/evolution/patients/${patientId}`, {
      params: { ...(desde ? { desde } : {}), ...(hasta ? { hasta } : {}) }
    });
  }

  getEvolutionAnalyses(patientId: number) {
    return this.http.get<any[]>(`${this.apiUrl}/evolution/patients/${patientId}/analyses`);
  }

  analyzeEvolution(patientId: number, desde = '', hasta = '') {
    return this.http.post<any>(`${this.apiUrl}/evolution/patients/${patientId}/analyses`, {
      consentimiento: true, version_consentimiento: 'groq-minimized-v1',
      desde: desde || null, hasta: hasta || null
    });
  }

  // ================================
  // DASHBOARD
  // ================================

  getPatientDashboard(patientId: number) {
    return this.http.get<any>(
      `${this.apiUrl}/dashboard/patients/${patientId}`
    );
  }


  // ================================
  // PACIENTES
  // ================================

  getPatients() {
    return this.http.get<any[]>(
      `${this.apiUrl}/patients/`
    );
  }

  createPatient(patient: any) {
    return this.http.post<any>(
      `${this.apiUrl}/patients/`,
      patient
    );
  }


  // ================================
  // SÍNTOMAS
  // ================================

  getPatientSymptoms(patientId: number) {
    return this.http.get<any[]>(
      `${this.apiUrl}/symptoms/patients/${patientId}`
    );
  }

  createSymptom(patientId: number, symptom: any) {
    return this.http.post<any>(
      `${this.apiUrl}/symptoms/patients/${patientId}`,
      symptom
    );
  }


  // ================================
  // MEDICAMENTOS
  // ================================

  getPatientMedications(patientId: number) {
    return this.http.get<any[]>(
      `${this.apiUrl}/medications/patients/${patientId}`
    );
  }

  createMedication(patientId: number, medication: any) {
    return this.http.post<any>(
      `${this.apiUrl}/medications/patients/${patientId}`,
      medication
    );
  }

  // ================================
// CITAS
// ================================

getPatientAppointments(patientId: number) {
  return this.http.get<any[]>(
    `${this.apiUrl}/appointments/patients/${patientId}`
  );
}

createAppointment(patientId: number, appointment: any) {
  return this.http.post<any>(
    `${this.apiUrl}/appointments/patients/${patientId}`,
    appointment
  );
}

// ================================
// NOTAS DEL CUIDADOR
// ================================

getPatientNotes(patientId: number) {
  return this.http.get<any[]>(
    `${this.apiUrl}/notes/patients/${patientId}`
  );
}

createNote(patientId: number, note: any) {
  return this.http.post<any>(
    `${this.apiUrl}/notes/patients/${patientId}`,
    note
  );
}

// ================================
// ALERTAS
// ================================

getPatientAlerts(patientId: number) {
  return this.http.get<any[]>(
    `${this.apiUrl}/alerts/patients/${patientId}`
  );
}

updateAlert(alertId: number, alertData: any) {
  return this.http.put<any>(
    `${this.apiUrl}/alerts/${alertId}`,
    alertData
  );
}

}