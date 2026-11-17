import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import { Evolucion } from './evolucion';
import { Api } from '../../services/api';

describe('Evolución conectada', () => {
  const empty = {
    totales: { sintoma: 0, nota: 0, medicamento: 0, cita: 0, alerta: 0 },
    metricas: Object.fromEntries(['nivel_dolor', 'calidad_sueno', 'temperatura'].map(k => [k, { cantidad: 0, puntos: [] }])),
    historial: [], datos_suficientes: false, nota: 'Sin registros',
  };
  function setup(evolution = of(empty)) {
    const api = {
      getPatients: vi.fn(() => of([{ id: 9, nombres: 'Prueba' }])),
      getEvolution: vi.fn(() => evolution),
      getEvolutionAnalyses: vi.fn(() => of([])),
      analyzeEvolution: vi.fn(() => of({ id: 3, resultado: { resumen: [], revisar: [], periodo: {} } })),
    };
    TestBed.configureTestingModule({ imports: [Evolucion], providers: [
      provideRouter([]), { provide: Api, useValue: api }
    ] });
    const fixture = TestBed.createComponent(Evolucion);
    fixture.detectChanges();
    return { fixture, component: fixture.componentInstance, api };
  }
  it('loads an assigned patient instead of hardcoding patient 1 and shows empty states', () => {
    const { fixture, api } = setup();
    expect(api.getEvolution).toHaveBeenCalledWith(9, '', '');
    expect(fixture.nativeElement.textContent).toContain('No hay registros');
    expect(fixture.nativeElement.textContent).toContain('No hay mediciones');
  });
  it('shows loading then a controlled API error', () => {
    const pending = new Subject<any>();
    const { fixture, component } = setup(pending);
    expect(component.loading()).toBe(true);
    pending.error({ error: { detail: 'Sin acceso' } });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Sin acceso');
    expect(component.loading()).toBe(false);
  });
  it('requires consent and enough data before calling Groq', () => {
    const { component, api } = setup();
    component.analyze();
    expect(api.analyzeEvolution).not.toHaveBeenCalled();
    component.data.set({ ...empty, datos_suficientes: true });
    component.consent = true;
    component.analyze();
    expect(api.analyzeEvolution).toHaveBeenCalledOnce();
    expect(component.consent).toBe(false);
  });
  it('keeps historical data if Groq fails', () => {
    const { component, api } = setup(of({ ...empty, datos_suficientes: true }));
    api.analyzeEvolution.mockReturnValue(throwError(() => ({ error: { detail: 'Groq ocupado' } })));
    component.consent = true;
    component.analyze();
    expect(component.aiError()).toBe('Groq ocupado');
    expect(component.data()).toBeTruthy();
    expect(component.analyzing()).toBe(false);
  });
  it('spaces irregular measurement timestamps proportionally', () => {
    const { component } = setup();
    const points = component.chartPoints([
      { fecha: '2026-01-01T00:00:00Z', valor: 0 },
      { fecha: '2026-01-02T00:00:00Z', valor: 5 },
      { fecha: '2026-01-11T00:00:00Z', valor: 10 },
    ], 'nivel_dolor');
    expect(points[1].x - points[0].x).toBeCloseTo((points[2].x - points[0].x) / 10);
    expect(points[0].y).toBe(170);
  });
});
