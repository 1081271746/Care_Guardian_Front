import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class Api {

  private apiUrl = 'http://127.0.0.1:8000';

  constructor(private http: HttpClient) {}

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

}