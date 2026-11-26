import { Type } from '@angular/core';
import { HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

/** Patients fixture shared by module specs (fictional). */
export const PATIENTS = [
  { id: 1, nombres: 'Rosa', apellidos: 'Demo', documento: 'D-1', fecha_nacimiento: '1945-01-01', edad: 81,
    telefono: null, direccion: null, contacto_emergencia: null, telefono_emergencia: null, activo: true, fecha_registro: '' },
  { id: 2, nombres: 'Luis', apellidos: 'Demo', documento: 'D-2', fecha_nacimiento: '1940-01-01', edad: 86,
    telefono: null, direccion: null, contacto_emergencia: null, telefono_emergencia: null, activo: false, fecha_registro: '' },
];

/** Creates a page that first loads /patients/ through PatientContext. */
export function createWithPatients<T>(component: Type<T>, selected = 1) {
  localStorage.clear();
  localStorage.setItem('careguardian.patient', String(selected));
  if (typeof window !== 'undefined') vi.spyOn(window, 'confirm').mockReturnValue(true);
  const fixture = TestBed.createComponent(component);
  const http = TestBed.inject(HttpTestingController);
  fixture.detectChanges();
  http.expectOne('/api/patients/').flush(PATIENTS);
  fixture.detectChanges();
  return { fixture, component: fixture.componentInstance, http };
}
