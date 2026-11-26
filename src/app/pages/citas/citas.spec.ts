import { addDays, todayISO } from '../../services/format';
import { createWithPatients } from '../../testing';
import { Citas } from './citas';

const TODAY = todayISO();
const VISIT = { id: 3, patient_id: 1, titulo: 'Control (demo)', especialidad: 'General', profesional: 'Dra. Demo',
  fecha: addDays(TODAY, 2), hora: '09:30:00', lugar: null, estado: 'pendiente', notas: null, fecha_registro: '' };

describe('Citas', () => {
  it('separates upcoming visits from history', () => {
    const { fixture, component, http } = createWithPatients(Citas);
    http.expectOne('/api/appointments/patients/1').flush([
      { ...VISIT, id: 1, fecha: addDays(TODAY, -5), estado: 'completada' }, VISIT,
    ]);
    fixture.detectChanges();
    expect(component.upcoming().map(v => v.id)).toEqual([3]);
    expect(component.past().map(v => v.id)).toEqual([1]);
    expect(fixture.nativeElement.textContent).toContain('Control (demo)');
  });

  it('highlights visits scheduled for today', () => {
    const { fixture, http } = createWithPatients(Citas);
    http.expectOne('/api/appointments/patients/1').flush([{ ...VISIT, fecha: TODAY }]);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.today')?.textContent).toContain('Hoy');
  });

  it('does not submit a pending visit in the past', () => {
    const { component, http } = createWithPatients(Citas);
    http.expectOne('/api/appointments/patients/1').flush([]);
    component.openNew();
    component.form.patchValue({ titulo: 'X', especialidad: 'Y', profesional: 'Z', fecha: addDays(TODAY, -1) });
    component.save();
    http.expectNone(r => r.method === 'POST');
    expect(component.pastPending()).toBe(true);
  });

  it('confirms a visit through PUT with only the status', () => {
    const { component, http } = createWithPatients(Citas);
    http.expectOne('/api/appointments/patients/1').flush([VISIT]);
    component.setStatus(VISIT as never, 'confirmada');
    const request = http.expectOne('/api/appointments/3');
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual({ estado: 'confirmada' });
  });

  it('shows the API reason when saving fails', () => {
    const { fixture, component, http } = createWithPatients(Citas);
    http.expectOne('/api/appointments/patients/1').flush([]);
    component.openNew();
    component.form.patchValue({ titulo: 'X', especialidad: 'Y', profesional: 'Z' });
    component.save();
    http.expectOne(r => r.method === 'POST').flush({ detail: 'Paciente inactivo' }, { status: 400, statusText: 'x' });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Paciente inactivo');
  });

  it('deletes a past visit after confirmation', () => {
    const { component, http } = createWithPatients(Citas);
    const old = { ...VISIT, id: 8, fecha: addDays(TODAY, -10), estado: 'completada' };
    http.expectOne('/api/appointments/patients/1').flush([old]);
    component.remove(old as never);
    expect(http.expectOne('/api/appointments/8').request.method).toBe('DELETE');
  });
});
