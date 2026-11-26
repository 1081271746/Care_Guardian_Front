import { HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { Paciente } from './paciente';

describe('Paciente', () => {
  it('loads the panel of the patient in the URL and remembers the selection', () => {
    localStorage.clear();
    const fixture = TestBed.createComponent(Paciente);
    fixture.componentRef.setInput('patientId', '7');
    fixture.detectChanges();
    TestBed.inject(HttpTestingController).expectOne('/api/dashboard/patients/7').flush({
      patient: { id: 7, nombres: 'Rosa', apellidos: 'Demo', documento: 'D1', edad: 80, activo: false },
      symptoms: [], medications: [], upcoming_appointments: [], recent_notes: [], active_alerts: [],
      historical_analysis: { registros_analizados: 0, score: 0, nivel: 'bajo', tendencias: [], recomendacion: '' },
      current_risk_level: 'bajo',
    });
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Rosa Demo');
    expect(text).toContain('80 años');
    expect(text).toContain('solo lectura');
    expect(localStorage.getItem('careguardian.patient')).toBe('7');
    const evolution = [...fixture.nativeElement.querySelectorAll('.shortcuts a')]
      .find((a: HTMLAnchorElement) => a.textContent?.includes('Evolución')) as HTMLAnchorElement;
    expect(evolution.getAttribute('href')).toBe('/evolucion?patientId=7');
  });

  it('shows forbidden access as an error', () => {
    const fixture = TestBed.createComponent(Paciente);
    fixture.componentRef.setInput('patientId', '8');
    fixture.detectChanges();
    TestBed.inject(HttpTestingController).expectOne('/api/dashboard/patients/8')
      .flush({ detail: 'No tienes acceso a este paciente' }, { status: 403, statusText: 'Forbidden' });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('No tienes acceso a este paciente');
  });
});
