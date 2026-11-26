import { HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { PATIENTS } from '../../testing';
import { Evolucion } from './evolucion';

const EMPTY = {
  patient_id: 1, periodo: { desde: null, hasta: null }, zona_horaria: 'America/Bogota',
  totales: { sintoma: 0, nota: 0, medicamento: 0, cita: 0, alerta: 0 },
  metricas: Object.fromEntries(['nivel_dolor', 'calidad_sueno', 'temperatura'].map(k =>
    [k, { cantidad: 0, promedio: null, inicial: null, ultimo: null, cambio: null, puntos: [] }])),
  categorias: {}, historial: [], datos_suficientes: false,
};
const WITH_DATA = {
  ...EMPTY, datos_suficientes: true,
  totales: { ...EMPTY.totales, sintoma: 2 },
  metricas: { ...EMPTY.metricas, nivel_dolor: { cantidad: 2, promedio: 3, inicial: 2, ultimo: 4, cambio: 2,
    puntos: [{ fecha: '2026-11-01T12:00:00Z', valor: 2 }, { fecha: '2026-11-03T12:00:00Z', valor: 4 }] } },
  historial: [{ id: 'sintoma-1', tipo: 'sintoma', fecha: '2026-11-03T12:00:00Z', descripcion: 'Síntomas registrados', nivel: 'bajo' }],
};
const SAVED = { id: 7, fecha: '2026-11-25T15:00:00Z', modelo: 'openai/gpt-oss-20b', periodo: { desde: null, hasta: null },
  resultado: { resumen: ['Dolor (0–10): 2 mediciones; promedio 3.'], revisar: [], advertencia: 'No es diagnóstico.', periodo: {} } };

describe('Evolución conectada', () => {
  function setup(evolution: object = EMPTY, configured = true) {
    localStorage.clear();
    localStorage.setItem('careguardian.patient', '1');
    const fixture = TestBed.createComponent(Evolucion);
    const http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
    http.expectOne('/api/patients/').flush(PATIENTS);
    http.expectOne('/api/evolution/ai-status').flush({ configurado: configured, proveedor: 'Groq',
      modelo: configured ? 'openai/gpt-oss-20b' : null, limite_por_minuto: 10, version_consentimiento: 'groq-minimized-v1' });
    http.expectOne(r => r.url === '/api/evolution/patients/1').flush(evolution);
    http.expectOne('/api/evolution/patients/1/analyses').flush([]);
    fixture.detectChanges();
    return { fixture, component: fixture.componentInstance, http };
  }

  it('loads the selected assigned patient with the default 30-day period and shows empty states', () => {
    const { fixture, component } = setup();
    expect(component.desde() <= component.hasta()).toBe(true);
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('No hay mediciones');
    expect(text).toContain('No hay registros en este período');
  });

  it('draws charts only from returned measurements', () => {
    const { fixture } = setup(WITH_DATA);
    const charts = fixture.nativeElement.querySelectorAll('cg-line-chart');
    expect(charts.length).toBe(1);
    expect(charts[0].querySelectorAll('circle').length).toBe(2);
    expect(fixture.nativeElement.textContent).toContain('no es una tendencia clínica');
  });

  it('requires explicit consent before calling Groq and resets it afterwards', () => {
    const { component, http } = setup(WITH_DATA);
    component.analyze();
    http.expectNone(r => r.method === 'POST');
    component.consent.set(true);
    component.analyze();
    const request = http.expectOne(r => r.method === 'POST' && r.url === '/api/evolution/patients/1/analyses');
    expect(request.request.body.consentimiento).toBe(true);
    request.flush(SAVED);
    expect(component.selectedAnalysis()?.id).toBe(7);
    expect(component.consent()).toBe(false);
  });

  it('keeps historical data visible when Groq fails', () => {
    const { component, http } = setup(WITH_DATA);
    component.consent.set(true);
    component.analyze();
    http.expectOne(r => r.method === 'POST').flush({ detail: 'Groq no respondió a tiempo' }, { status: 504, statusText: 'x' });
    expect(component.aiError()).toBe('Groq no respondió a tiempo');
    expect(component.data()).toBeTruthy();
    expect(component.analyzing()).toBe(false);
  });

  it('explains that AI is unavailable instead of simulating it', () => {
    const { fixture, component } = setup(WITH_DATA, false);
    expect(fixture.nativeElement.textContent).toContain('El servicio de IA no está disponible');
    component.consent.set(true);
    expect(component.canAnalyze()).toBe(false);
  });

  it('rejects an inverted period without calling the API', () => {
    const { component, http } = setup();
    component.setRange('desde', '2026-11-20');
    component.setRange('hasta', '2026-11-01');
    component.load();
    http.expectNone(r => r.url === '/api/evolution/patients/1');
    expect(component.error()).toContain('fecha inicial');
  });

  it('shows a controlled API error', () => {
    const { component, http } = setup();
    component.load();
    http.expectOne(r => r.url === '/api/evolution/patients/1').flush({ detail: 'Sin acceso' }, { status: 403, statusText: 'x' });
    expect(component.error()).toBe('Sin acceso');
    expect(component.loading()).toBe(false);
  });

  it('filters the timeline by kind and pages long histories', () => {
    const many = { ...WITH_DATA, historial: Array.from({ length: 90 }, (_, i) => ({
      id: `nota-${i}`, tipo: i % 2 ? 'nota' : 'sintoma', fecha: '2026-11-03T12:00:00Z', descripcion: `Evento ${i}` })) };
    const { component } = setup(many);
    expect(component.shownEvents().length).toBe(40);
    component.showMore();
    expect(component.shownEvents().length).toBe(80);
    component.kindFilter.set('nota');
    expect(component.events().length).toBe(45);
  });
});

describe('Evolución con enlace compartido', () => {
  it('uses the period from the URL and keeps the URL in sync', async () => {
    const { ActivatedRoute, Router, convertToParamMap } = await import('@angular/router');
    localStorage.clear();
    TestBed.overrideProvider(ActivatedRoute, { useValue: { snapshot: { queryParamMap:
      convertToParamMap({ patientId: '1', desde: '2026-11-01', hasta: '2026-11-15' }) } } });
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    const fixture = TestBed.createComponent(Evolucion);
    const http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
    http.expectOne('/api/patients/').flush(PATIENTS);
    http.expectOne(r => r.url === '/api/evolution/patients/1' && r.params.get('desde') === '2026-11-01'
      && r.params.get('hasta') === '2026-11-15');
    expect(navigate).toHaveBeenCalledWith([], expect.objectContaining({
      queryParams: { patientId: 1, desde: '2026-11-01', hasta: '2026-11-15' } }));
  });
});
