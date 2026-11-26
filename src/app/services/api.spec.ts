import { HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { Api, params } from './api';

describe('Api', () => {
  let api: Api;
  let http: HttpTestingController;

  beforeEach(() => {
    api = TestBed.inject(Api);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('omits empty filters from query strings', () => {
    expect(params({ desde: '', hasta: null, nivel: 'alto', activos: false }).toString()).toBe('nivel=alto&activos=false');
  });

  it('uses the backend routes for every module', () => {
    api.getSummary().subscribe();
    api.searchPatients({ q: 'rosa', activos: true }).subscribe();
    api.updateMedication(4, { dosis: '2' }).subscribe();
    api.suspendMedication(4).subscribe();
    api.getUpcomingAppointments(1).subscribe();
    api.updateSymptom(5, { nivel_dolor: 3 }).subscribe();
    api.updateNote(6, 'Texto').subscribe();
    api.getAlertHistory(1, 'alto').subscribe();
    api.setAlertStatus(7, 'atendida').subscribe();
    api.assignCaregiver(1, 'b@x.org', 'familiar').subscribe();
    api.getAiStatus().subscribe();

    http.expectOne('/api/dashboard/summary');
    http.expectOne('/api/patients/?q=rosa&activos=true');
    expect(http.expectOne(r => r.url === '/api/medications/4' && r.method === 'PUT')).toBeTruthy();
    expect(http.expectOne(r => r.url === '/api/medications/4' && r.method === 'DELETE')).toBeTruthy();
    http.expectOne('/api/appointments/patients/1?proximas=true');
    expect(http.expectOne('/api/symptoms/5').request.body).toEqual({ nivel_dolor: 3 });
    expect(http.expectOne('/api/notes/6').request.body).toEqual({ contenido: 'Texto' });
    http.expectOne('/api/alerts/patients/1?incluir_cerradas=true&nivel=alto');
    expect(http.expectOne('/api/alerts/7').request.body).toEqual({ estado: 'atendida' });
    expect(http.expectOne('/api/patients/1/caregivers').request.body).toEqual({ email: 'b@x.org', rol: 'familiar' });
    http.expectOne('/api/evolution/ai-status');
  });

  it('sends explicit consent and the period when requesting an AI summary', () => {
    api.analyzeEvolution(3, '2026-11-01', '', 'America/Bogota').subscribe();
    const request = http.expectOne('/api/evolution/patients/3/analyses');
    expect(request.request.body).toEqual({
      consentimiento: true, version_consentimiento: 'groq-minimized-v1',
      desde: '2026-11-01', hasta: null, zona: 'America/Bogota',
    });
  });

  it('passes the period and timezone to the evolution endpoint', () => {
    api.getEvolution(3, '2026-11-01', '2026-11-30', 'America/Bogota').subscribe();
    http.expectOne('/api/evolution/patients/3?desde=2026-11-01&hasta=2026-11-30&zona=America/Bogota');
  });
});
