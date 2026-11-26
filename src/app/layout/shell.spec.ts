import { HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';

import { PatientContext } from '../services/patient-context';
import { NAVIGATION, Shell } from './shell';

describe('Shell', () => {
  function setup() {
    localStorage.setItem('access_token', 'abc');
    const fixture = TestBed.createComponent(Shell);
    fixture.detectChanges();
    const http = TestBed.inject(HttpTestingController);
    http.expectOne('/api/auth/me').flush({ id: 1, nombre: 'Carlos Demo', email: 'carlos@x.org', rol: 'cuidador',
      activo: true, fecha_creacion: '', pacientes_asignados: 2 });
    fixture.detectChanges();
    return { fixture, http };
  }

  it('links every care module and shows the signed-in caregiver', () => {
    const { fixture } = setup();
    const links = [...fixture.nativeElement.querySelectorAll('nav a')].map((a: HTMLAnchorElement) => a.getAttribute('href'));
    expect(links).toEqual(NAVIGATION.map(item => item.path));
    expect(fixture.nativeElement.textContent).toContain('Carlos Demo');
    expect(fixture.nativeElement.querySelector('.avatar').textContent.trim()).toBe('CD');
  });

  it('logs out: clears token and patient selection, then goes to login', () => {
    const { fixture } = setup();
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    TestBed.inject(PatientContext).select(5);
    (fixture.nativeElement.querySelector('.logout') as HTMLButtonElement).click();
    expect(localStorage.getItem('access_token')).toBeNull();
    expect(TestBed.inject(PatientContext).selectedId()).toBeNull();
    expect(navigate).toHaveBeenCalledWith(['/login'], { queryParams: { sesion: 'cerrada' } });
  });

  it('opens and closes the mobile menu', () => {
    const { fixture } = setup();
    const toggle = fixture.nativeElement.querySelector('.topbar button') as HTMLButtonElement;
    toggle.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.sidebar').classList).toContain('open');
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
  });
});

describe('Shell keyboard', () => {
  it('closes the mobile menu with Escape', () => {
    localStorage.setItem('access_token', 'abc');
    const fixture = TestBed.createComponent(Shell);
    fixture.detectChanges();
    TestBed.inject(HttpTestingController).expectOne('/api/auth/me').flush({ id: 1, nombre: 'A', email: 'a@x.org' });
    (fixture.nativeElement.querySelector('.topbar button') as HTMLButtonElement).click();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.sidebar').classList).not.toContain('open');
  });
});
