import { TestBed } from '@angular/core/testing';

import { Auth } from '../../services/auth';
import { createWithPatients } from '../../testing';
import { Notas } from './notas';

const MINE = { id: 1, patient_id: 1, caregiver_id: 1, contenido: 'Caminó en el patio', fecha_registro: '2026-11-25T14:00:00Z', activo: true, autor_nombre: 'Carlos' };
const OTHER = { ...MINE, id: 2, caregiver_id: 2, contenido: 'Almorzó completo', autor_nombre: 'Laura' };

describe('Notas', () => {
  function setup() {
    TestBed.inject(Auth).user.set({ id: 1, nombre: 'Carlos', email: 'c@x.org', rol: 'cuidador', activo: true, fecha_creacion: '', pacientes_asignados: 1 });
    const result = createWithPatients(Notas);
    result.http.expectOne(r => r.url === '/api/notes/patients/1' && r.method === 'GET').flush([MINE, OTHER]);
    result.fixture.detectChanges();
    return result;
  }

  it('shows the team feed and only lets the author edit', () => {
    const { fixture } = setup();
    const notes = fixture.nativeElement.querySelectorAll('.note');
    expect(notes.length).toBe(2);
    expect(notes[0].textContent).toContain('Editar');
    expect(notes[1].textContent).not.toContain('Editar');
  });

  it('validates minimum length before saving', () => {
    const { component, http } = setup();
    component.form.setValue({ contenido: 'hey', momento: '' });
    component.save();
    http.expectNone(r => r.method === 'POST');
  });

  it('creates a note and reloads the feed', () => {
    const { component, http } = setup();
    component.form.setValue({ contenido: '  Durmió bien toda la noche  ', momento: '' });
    component.save();
    const request = http.expectOne(r => r.method === 'POST' && r.url === '/api/notes/patients/1');
    expect(request.request.body).toEqual({ contenido: 'Durmió bien toda la noche' });
    request.flush(MINE);
    http.expectOne(r => r.url === '/api/notes/patients/1' && r.method === 'GET').flush([MINE]);
  });

  it('edits through PUT /notes/{id}', () => {
    const { component, http } = setup();
    component.startEdit(MINE as never);
    component.editText.set('Texto corregido');
    component.saveEdit(MINE as never);
    expect(http.expectOne('/api/notes/1').request.body).toEqual({ contenido: 'Texto corregido' });
  });
});
