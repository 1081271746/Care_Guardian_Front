import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, map, of, tap } from 'rxjs';

import { Api } from './api';
import { Patient } from './models';

const KEY = 'careguardian.patient';

function storage(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}

/**
 * The patient the caregiver is working with, shared by every module so
 * switching from Síntomas to Evolución keeps the same person selected.
 * The list always comes from GET /patients/ (only assigned patients).
 */
@Injectable({ providedIn: 'root' })
export class PatientContext {
  private api = inject(Api);

  readonly patients = signal<Patient[]>([]);
  readonly loaded = signal(false);
  readonly selectedId = signal<number | null>(Number(storage()?.getItem(KEY)) || null);
  readonly selected = computed(() => this.patients().find(p => p.id === this.selectedId()) ?? null);
  readonly activePatients = computed(() => this.patients().filter(p => p.activo));

  /** Loads assigned patients (cached unless forced) and keeps a valid selection. */
  load(force = false): Observable<Patient[]> {
    if (this.loaded() && !force) return of(this.patients());
    return this.api.getPatients().pipe(
      tap(patients => {
        this.patients.set(patients);
        this.loaded.set(true);
        if (!patients.some(p => p.id === this.selectedId())) {
          this.select(patients.find(p => p.activo)?.id ?? patients[0]?.id ?? null);
        }
      }),
      map(() => this.patients()),
    );
  }

  select(id: number | null): void {
    this.selectedId.set(id);
    if (id) storage()?.setItem(KEY, String(id));
    else storage()?.removeItem(KEY);
  }

  /** Called on logout so the next caregiver never sees the previous selection. */
  reset(): void {
    this.patients.set([]);
    this.loaded.set(false);
    this.select(null);
  }
}
