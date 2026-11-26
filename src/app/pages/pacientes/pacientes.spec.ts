import { HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { Pacientes } from './pacientes';

const ROSA = { id: 1, nombres: 'Rosa', apellidos: 'Demo', documento: 'D-1', fecha_nacimiento: '1945-01-01', edad: 81,
  telefono: null, direccion: null, contacto_emergencia: null, telefono_emergencia: null, activo: true, fecha_registro: '' };
const LUIS = { ...ROSA, id: 2, nombres: 'Luis', documento: 'D-2', activo: false };

describe('Pacientes', () => {
  function setup() {
    localStorage.clear();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const fixture = TestBed.createComponent(Pacientes);
    const http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
    http.expectOne('/api/patients/').flush([ROSA, LUIS]);
    fixture.detectChanges();
    return { fixture, component: fixture.componentInstance, http };
  }

  it('lists active patients from the API and filters locally', () => {
    const { fixture, component } = setup();
    expect(fixture.nativeElement.textContent).toContain('Rosa Demo');
    expect(fixture.nativeElement.textContent).not.toContain('Luis Demo');
    component.status.set('todos');
    component.query.set('d-2');
    fixture.detectChanges();
    expect(component.visible().map(p => p.id)).toEqual([2]);
  });

  it('creates a patient sending nulls for empty optional fields', () => {
    const { component, http } = setup();
    component.openNew();
    component.save();
    http.expectNone('/api/patients/');
    component.form.patchValue({ nombres: 'Ana', apellidos: 'Demo', fecha_nacimiento: '1950-02-02', documento: 'D-3' });
    component.save();
    const request = http.expectOne(r => r.method === 'POST' && r.url === '/api/patients/');
    expect(request.request.body.telefono).toBeNull();
    request.flush({ ...ROSA, id: 3 });
    http.expectOne('/api/patients/').flush([ROSA, LUIS, { ...ROSA, id: 3 }]);
    expect(component.editing()).toBeNull();
  });

  it('shows duplicate document errors inside the form', () => {
    const { fixture, component, http } = setup();
    component.openEdit(ROSA);
    component.save();
    http.expectOne('/api/patients/1').flush({ detail: 'Ya existe un paciente con ese documento' }, { status: 409, statusText: 'x' });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Ya existe un paciente con ese documento');
  });

  it('deactivates and reactivates through the API', () => {
    const { component, http } = setup();
    component.toggleActive(ROSA);
    expect(http.expectOne('/api/patients/1').request.method).toBe('DELETE');
    component.toggleActive(LUIS);
    const reactivate = http.expectOne(r => r.method === 'PUT' && r.url === '/api/patients/2');
    expect(reactivate.request.body).toEqual({ activo: true });
  });

  it('manages the care team by e-mail', () => {
    const { component, http } = setup();
    component.openTeam(ROSA);
    http.expectOne('/api/patients/1/caregivers').flush([{ user_id: 1, nombre: 'Yo', email: 'yo@x.org', rol: 'cuidador' }]);
    component.teamForm.setValue({ email: 'hija@x.org', rol: 'familiar' });
    component.addCaregiver();
    const assign = http.expectOne(r => r.method === 'POST' && r.url === '/api/patients/1/caregivers');
    expect(assign.request.body).toEqual({ email: 'hija@x.org', rol: 'familiar' });
  });
});
