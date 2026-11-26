import { createWithPatients } from '../../testing';
import { Medicamentos } from './medicamentos';

const MED = { id: 5, patient_id: 1, nombre: 'Vitamina D (demo)', dosis: '1', frecuencia: 'diaria', hora: '08:00',
  fecha_inicio: '2026-11-01', fecha_fin: null, indicaciones: null, activo: true, vigente: true, fecha_registro: '' };

describe('Medicamentos', () => {
  it('loads medications of the selected patient', () => {
    const { fixture, http } = createWithPatients(Medicamentos);
    http.expectOne('/api/medications/patients/1').flush([MED, { ...MED, id: 6, nombre: 'Suspendido', activo: false, vigente: false }]);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Vitamina D (demo)');
    expect(fixture.nativeElement.textContent).not.toContain('Suspendido');
    expect(fixture.nativeElement.textContent).toContain('Mostrar suspendidos (1)');
  });

  it('builds today\'s schedule only from medications in effect, by hour', () => {
    const { fixture, component, http } = createWithPatients(Medicamentos);
    http.expectOne('/api/medications/patients/1').flush([
      { ...MED, id: 1, nombre: 'Noche', hora: '20:00' },
      { ...MED, id: 2, nombre: 'Mañana', hora: '07:30' },
      { ...MED, id: 3, nombre: 'Futuro', vigente: false },
    ]);
    fixture.detectChanges();
    expect(component.today().map(m => m.nombre)).toEqual(['Mañana', 'Noche']);
    expect(fixture.nativeElement.textContent).toContain('Horario de hoy');
  });

  it('blocks an end date before the start date', () => {
    const { component, http } = createWithPatients(Medicamentos);
    http.expectOne('/api/medications/patients/1').flush([]);
    component.openNew();
    component.form.patchValue({ nombre: 'X', dosis: '1', frecuencia: 'diaria', fecha_inicio: '2026-11-10', fecha_fin: '2026-11-01' });
    component.save();
    http.expectNone('/api/medications/patients/1');
    expect(component.rangeInvalid()).toBe(true);
  });

  it('creates, then reloads the list', () => {
    const { component, http } = createWithPatients(Medicamentos);
    http.expectOne('/api/medications/patients/1').flush([]);
    component.openNew();
    component.form.patchValue({ nombre: 'Calcio', dosis: '1', frecuencia: 'diaria' });
    component.save();
    const create = http.expectOne(r => r.method === 'POST' && r.url === '/api/medications/patients/1');
    expect(create.request.body.fecha_fin).toBeNull();
    create.flush(MED);
    http.expectOne('/api/medications/patients/1').flush([MED]);
    expect(component.medications().length).toBe(1);
  });

  it('suspends instead of deleting', () => {
    const { component, http } = createWithPatients(Medicamentos);
    http.expectOne('/api/medications/patients/1').flush([MED]);
    component.suspend(MED);
    expect(http.expectOne('/api/medications/5').request.method).toBe('DELETE');
  });

  it('reactivates a suspended medication with PUT activo=true', () => {
    const { component, http } = createWithPatients(Medicamentos);
    http.expectOne('/api/medications/patients/1').flush([{ ...MED, activo: false, vigente: false }]);
    component.resume({ ...MED, activo: false } as never);
    const request = http.expectOne(r => r.method === 'PUT' && r.url === '/api/medications/5');
    expect(request.request.body).toEqual({ activo: true });
  });
});
