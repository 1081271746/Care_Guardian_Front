import { HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';

import { Cuenta } from './cuenta';

const ME = { id: 4, nombre: 'Carlos', email: 'carlos@x.org', rol: 'cuidador', activo: true,
  fecha_creacion: '2026-11-01T10:00:00Z', pacientes_asignados: 6 };

describe('Cuenta', () => {
  function setup() {
    localStorage.setItem('access_token', 'abc');
    const fixture = TestBed.createComponent(Cuenta);
    const http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
    http.expectOne('/api/auth/me').flush(ME);
    fixture.detectChanges();
    return { fixture, component: fixture.componentInstance, http };
  }

  it('prefills the profile from /auth/me', () => {
    const { fixture, component } = setup();
    expect(component.profile.getRawValue()).toEqual({ nombre: 'Carlos', email: 'carlos@x.org' });
    expect(fixture.nativeElement.textContent).toContain('6 paciente(s)');
  });

  it('saves profile changes and reports duplicate e-mails', () => {
    const { fixture, component, http } = setup();
    component.profile.patchValue({ email: 'otra@x.org' });
    component.profile.markAsDirty();
    component.saveProfile();
    http.expectOne('/api/users/4').flush({ detail: 'Ya existe una cuenta con ese correo' }, { status: 409, statusText: 'x' });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Ya existe una cuenta con ese correo');
  });

  it('checks confirmation and signs out after changing the password', () => {
    const { component, http } = setup();
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    component.password.setValue({ actual: 'Vieja2026', nueva: 'Nueva2027', confirmacion: 'Otra2027' });
    component.changePassword();
    http.expectNone('/api/users/4/password');
    component.password.patchValue({ confirmacion: 'Nueva2027' });
    component.changePassword();
    const request = http.expectOne('/api/users/4/password');
    expect(request.request.body).toEqual({ password_actual: 'Vieja2026', password_nueva: 'Nueva2027' });
    request.flush({ mensaje: 'ok' });
    expect(localStorage.getItem('access_token')).toBeNull();
    expect(navigate).toHaveBeenCalledWith(['/login']);
  });
});
