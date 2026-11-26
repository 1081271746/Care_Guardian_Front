import { createWithPatients } from '../../testing';
import { Sintomas } from './sintomas';

const RECORD = { id: 9, patient_id: 1, caregiver_id: 1, calidad_sueno: 6, estado_animo: 'tranquilo', apetito: 'normal',
  nivel_dolor: 3, temperatura: 36.6, observaciones: 'Durmió la siesta', nivel_gravedad: 'bajo',
  fecha_registro: '2026-11-20T13:00:00Z', activo: true, registrado_por_nombre: 'Carlos' };

describe('Sintomas', () => {
  it('shows the stored history with who recorded it', () => {
    const { fixture, http } = createWithPatients(Sintomas);
    http.expectOne(r => r.url === '/api/symptoms/patients/1' && r.method === 'GET').flush([RECORD]);
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Durmió la siesta');
    expect(text).toContain('Carlos');
  });

  it('refuses an empty record before calling the API', () => {
    const { fixture, component, http } = createWithPatients(Sintomas);
    http.expectOne(r => r.url === '/api/symptoms/patients/1' && r.method === 'GET').flush([]);
    component.save();
    fixture.detectChanges();
    http.expectNone(r => r.method === 'POST');
    expect(fixture.nativeElement.textContent).toContain('al menos una medición');
  });

  it('sends nulls for unset values and the observation time in UTC', () => {
    const { component, http } = createWithPatients(Sintomas);
    http.expectOne(r => r.url === '/api/symptoms/patients/1' && r.method === 'GET').flush([]);
    component.form.patchValue({ nivel_dolor: 4, momento: '2026-11-20T08:00' });
    component.save();
    const request = http.expectOne(r => r.method === 'POST' && r.url === '/api/symptoms/patients/1');
    expect(request.request.body.calidad_sueno).toBeNull();
    expect(request.request.body.estado_animo).toBeNull();
    expect(request.request.body.fecha_registro).toBe(new Date('2026-11-20T08:00').toISOString());
    request.flush(RECORD, { status: 201, statusText: 'Created' });
    http.expectOne(r => r.url === '/api/symptoms/patients/1' && r.method === 'GET').flush([RECORD]);
  });

  it('rejects future observation times', () => {
    const { component, http } = createWithPatients(Sintomas);
    http.expectOne(r => r.url === '/api/symptoms/patients/1' && r.method === 'GET').flush([]);
    component.form.patchValue({ nivel_dolor: 4, momento: '2999-01-01T08:00' });
    component.save();
    http.expectNone(r => r.method === 'POST');
  });

  it('corrects an existing record with PUT', () => {
    const { component, http } = createWithPatients(Sintomas);
    http.expectOne(r => r.url === '/api/symptoms/patients/1' && r.method === 'GET').flush([RECORD]);
    component.edit(RECORD as never);
    component.form.patchValue({ nivel_dolor: 8 });
    component.save();
    const request = http.expectOne('/api/symptoms/9');
    expect(request.request.method).toBe('PUT');
    expect(request.request.body.fecha_registro).toBeUndefined();
  });

  it('keeps inactive patients read-only', () => {
    const { fixture, http } = createWithPatients(Sintomas, 2);
    http.expectOne(r => r.url === '/api/symptoms/patients/2' && r.method === 'GET').flush([RECORD]);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('form')).toBeNull();
    expect(fixture.nativeElement.textContent).not.toContain('Corregir');
  });
});

describe('Sintomas paging', () => {
  it('loads older records with an offset and stops when a page is short', () => {
    const { component, http } = createWithPatients(Sintomas);
    const page = (from: number, count: number) => Array.from({ length: count }, (_, i) => ({ ...RECORD, id: from + i }));
    http.expectOne(r => r.url === '/api/symptoms/patients/1' && r.params.get('offset') === '0').flush(page(1, 50));
    expect(component.hasMore()).toBe(true);
    component.loadMore();
    http.expectOne(r => r.params.get('offset') === '50' && r.params.get('limit') === '50').flush(page(51, 3));
    expect(component.records().length).toBe(53);
    expect(component.hasMore()).toBe(false);
  });
});
