import { HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { apiError } from './errors';
import { addDays, formatDate, formatRelative, formatTime, fullName, initials, localInputToISO, monthShort, todayISO } from './format';
import { Notifier } from './notifier';
import { PatientContext } from './patient-context';

describe('apiError', () => {
  it('uses the API detail text', () => {
    expect(apiError(new HttpErrorResponse({ status: 409, error: { detail: 'Ya existe' } }))).toBe('Ya existe');
  });
  it('names the field of a 422 validation error', () => {
    const error = new HttpErrorResponse({ status: 422, error: { detail: [{ loc: ['body', 'hora'], msg: 'String should match pattern' }] } });
    expect(apiError(error)).toBe('Hora: String should match pattern');
  });
  it('adds the Retry-After wait to rate-limit messages', () => {
    const error = new HttpErrorResponse({ status: 429, error: { detail: 'Demasiados intentos' },
      headers: new HttpHeaders({ 'Retry-After': '120' }) });
    expect(apiError(error)).toBe('Demasiados intentos (podrás intentarlo en 2 min).');
  });
  it('explains network failures', () => {
    expect(apiError(new HttpErrorResponse({ status: 0 }))).toContain('No hay conexión');
  });
});

describe('format helpers', () => {
  it('never shifts calendar dates by timezone', () => {
    expect(formatDate('2026-11-01')).toContain('2026');
    expect(formatDate('2026-11-01')).toMatch(/^1 /);
  });
  it('formats hours and relative times', () => {
    expect(formatTime('14:30:00')).toMatch(/2:30/);
    const now = Date.parse('2026-11-25T12:00:00Z');
    expect(formatRelative('2026-11-25T11:30:00Z', now)).toBe('hace 30 min');
    expect(formatRelative('2026-11-24T10:00:00Z', now)).toBe('ayer');
  });
  it('handles calendar arithmetic and local inputs', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(todayISO(new Date(2026, 10, 25, 23, 50))).toBe('2026-11-25');
    expect(localInputToISO('')).toBeNull();
    expect(localInputToISO('2026-11-25T08:00')).toMatch(/^2026-11-25T/);
  });
  it('builds names and initials', () => {
    expect(fullName({ nombres: 'Rosa', apellidos: 'Pérez' })).toBe('Rosa Pérez');
    expect(initials('rosa pérez gómez')).toBe('RP');
  });
});

describe('PatientContext', () => {
  beforeEach(() => localStorage.clear());

  it('loads assigned patients and selects the first active one', () => {
    const context = TestBed.inject(PatientContext);
    context.load().subscribe();
    TestBed.inject(HttpTestingController).expectOne('/api/patients/').flush([
      { id: 1, nombres: 'A', apellidos: 'Inactivo', activo: false },
      { id: 2, nombres: 'B', apellidos: 'Activo', activo: true },
    ]);
    expect(context.selectedId()).toBe(2);
    expect(localStorage.getItem('careguardian.patient')).toBe('2');
    context.reset();
    expect(context.selectedId()).toBeNull();
    expect(context.patients()).toEqual([]);
  });

  it('keeps a remembered patient only if it is still assigned', () => {
    localStorage.setItem('careguardian.patient', '99');
    const context = TestBed.inject(PatientContext);
    context.load().subscribe();
    TestBed.inject(HttpTestingController).expectOne('/api/patients/').flush([{ id: 3, nombres: 'C', apellidos: 'D', activo: true }]);
    expect(context.selectedId()).toBe(3);
  });
});

describe('Notifier', () => {
  it('keeps at most four toasts and can dismiss them', () => {
    const notifier = TestBed.inject(Notifier);
    for (let i = 0; i < 6; i++) notifier.info(`Mensaje ${i}`);
    expect(notifier.toasts().length).toBe(4);
    notifier.dismiss(notifier.toasts()[0].id);
    expect(notifier.toasts().length).toBe(3);
  });
});

describe('chip helpers', () => {
  it('builds initials only from letters and short month names', () => {
    expect(initials('Carlos (cuenta demo)')).toBe('CC');
    expect(monthShort('2026-11-27')).toMatch(/^nov/);
  });
});

describe('instants without offset', () => {
  it('treats legacy timestamps without timezone as UTC', async () => {
    const { formatDateTime } = await import('./format');
    expect(formatDateTime('2026-11-25T15:00:00')).toBe(formatDateTime('2026-11-25T15:00:00Z'));
    expect(formatDateTime(null)).toBe('—');
  });
});
