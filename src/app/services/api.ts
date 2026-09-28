import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class Api {

  private apiUrl = 'http://127.0.0.1:8000';

  constructor(private http: HttpClient) {}

  getPatientDashboard(patientId: number) {
    return this.http.get<any>(
      `${this.apiUrl}/dashboard/patients/${patientId}`
    );
  }

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

}