import { HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { Dashboard } from './dashboard';

const SUMMARY = {
  generado: '2026-11-25T12:00:00-05:00', zona_horaria: 'America/Bogota',
  totales: { pacientes: 2, pacientes_activos: 2, medicamentos_activos: 3, medicamentos_registrados: 4,
    citas_proximas: 1, sintomas_recientes: 5, notas_recientes: 1, alertas_pendientes: 2 },
  ventanas: { citas_dias: 30, recientes_dias: 7 },
  alertas_por_nivel: { alto: 1, medio: 1, bajo: 0 },
  sintomas_por_dia: [{ fecha: '2026-11-24', cantidad: 0 }, { fecha: '2026-11-25', cantidad: 5 }],
  proximas_citas: [{ id: 1, patient_id: 1, paciente: 'Rosa Demo', titulo: 'Control', especialidad: 'General',
    profesional: 'Dra.', fecha: '2026-11-27', hora: '09:30', lugar: null, estado: 'pendiente' }],
  pacientes: [{ id: 1, nombre: 'Rosa Demo', activo: true, alertas_activas: 2, ultimo_registro: null }],
  actividad_reciente: [{ id: 'nota-1', tipo: 'nota', patient_id: 1, paciente: 'Rosa Demo',
    descripcion: 'Nota del cuidador', fecha: '2026-11-25T11:00:00Z' }],
};

describe('Dashboard', () => {
  function setup() {
    const fixture = TestBed.createComponent(Dashboard);
    fixture.detectChanges();
    return { fixture, http: TestBed.inject(HttpTestingController) };
  }

  it('renders indicators exactly as returned by /dashboard/summary', () => {
    const { fixture, http } = setup();
    http.expectOne('/api/dashboard/summary').flush(SUMMARY);
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent;
    const values = [...fixture.nativeElement.querySelectorAll('.stat-value')].map((el: Element) => el.textContent?.trim());
    expect(values).toEqual(['2', '3', '1', '5', '2']);
    expect(text).toContain('Rosa Demo');
    expect(text).toContain('Control');
    expect(text).toContain('Nota del cuidador');
  });

  it('only draws the daily chart when real records exist', () => {
    const { fixture, http } = setup();
    http.expectOne('/api/dashboard/summary').flush({
      ...SUMMARY, sintomas_por_dia: SUMMARY.sintomas_por_dia.map(d => ({ ...d, cantidad: 0 })),
    });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('cg-bar-chart')).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Sin registros en los últimos 14 días');
  });

  it('invites to register the first patient when there are none', () => {
    const { fixture, http } = setup();
    http.expectOne('/api/dashboard/summary').flush({ ...SUMMARY, totales: { ...SUMMARY.totales, pacientes: 0 }, pacientes: [] });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Todavía no tienes pacientes asignados');
  });

  it('shows an error and allows retrying', () => {
    const { fixture, http } = setup();
    http.expectOne('/api/dashboard/summary').flush({ detail: 'La base de datos no está disponible' }, { status: 503, statusText: 'x' });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('La base de datos no está disponible');
    fixture.componentInstance.load();
    http.expectOne('/api/dashboard/summary').flush(SUMMARY);
  });
});

describe('Dashboard refresh', () => {
  afterEach(() => vi.useRealTimers());

  it('reloads the summary every five minutes while visible', () => {
    vi.useFakeTimers();
    const fixture = TestBed.createComponent(Dashboard);
    const http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
    http.expectOne('/api/dashboard/summary').flush(SUMMARY);
    vi.advanceTimersByTime(5 * 60 * 1000);
    http.expectOne('/api/dashboard/summary').flush(SUMMARY);
    fixture.destroy();
    vi.advanceTimersByTime(5 * 60 * 1000);
    http.expectNone('/api/dashboard/summary');
  });
});
