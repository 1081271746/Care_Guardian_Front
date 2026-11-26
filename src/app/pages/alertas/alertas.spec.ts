import { createWithPatients } from '../../testing';
import { Alertas } from './alertas';

const BASE = { patient_id: 1, symptom_id: null, note_id: null, tipo: 'manual', mensaje: 'Detalle', origen: 'manual',
  fecha_registro: '2026-11-25T10:00:00Z' };
const ALERTS = [
  { ...BASE, id: 1, nivel: 'medio', titulo: 'Media', estado: 'pendiente', activa: true },
  { ...BASE, id: 2, nivel: 'alto', titulo: 'Alta', estado: 'pendiente', activa: true, origen: 'sistema', symptom_id: 4 },
  { ...BASE, id: 3, nivel: 'bajo', titulo: 'Cerrada', estado: 'atendida', activa: false },
];

describe('Alertas', () => {
  it('loads full history and orders active alerts by severity', () => {
    const { component, http } = createWithPatients(Alertas);
    http.expectOne('/api/alerts/patients/1?incluir_cerradas=true').flush(ALERTS);
    expect(component.visible().map(a => a.id)).toEqual([2, 1]);
    expect(component.source(ALERTS[1] as never)).toContain('síntomas');
    component.view.set('historial');
    expect(component.visible().map(a => a.id)).toEqual([3]);
  });

  it('marks an alert as attended through the API', () => {
    const { component, http } = createWithPatients(Alertas);
    http.expectOne('/api/alerts/patients/1?incluir_cerradas=true').flush(ALERTS);
    component.setStatus(ALERTS[0] as never, 'atendida');
    expect(http.expectOne('/api/alerts/1').request.body).toEqual({ estado: 'atendida' });
  });

  it('shows the duplicate warning returned by the API', () => {
    const { fixture, component, http } = createWithPatients(Alertas);
    http.expectOne('/api/alerts/patients/1?incluir_cerradas=true').flush([]);
    component.creating.set(true);
    component.form.setValue({ titulo: 'Caída', mensaje: 'Se cayó en el baño', nivel: 'alto' });
    component.create();
    http.expectOne(r => r.method === 'POST').flush(
      { detail: 'Ya existe una alerta activa con ese título en las últimas 24 horas' }, { status: 409, statusText: 'x' });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('últimas 24 horas');
  });

  it('filters by level on the server', () => {
    const { component, http } = createWithPatients(Alertas);
    http.expectOne('/api/alerts/patients/1?incluir_cerradas=true').flush([]);
    component.level.set('alto');
    component.load();
    http.expectOne('/api/alerts/patients/1?incluir_cerradas=true&nivel=alto').flush([]);
  });
});
