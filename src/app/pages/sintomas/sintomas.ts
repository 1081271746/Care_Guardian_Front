import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { Api } from '../../services/api';
import { apiError } from '../../services/errors';
import { formatDateTime, localInputToISO, nowLocalInput } from '../../services/format';
import { Severity, SymptomInput, SymptomRecord } from '../../services/models';
import { Notifier } from '../../services/notifier';
import { PatientContext } from '../../services/patient-context';
import { EmptyState } from '../../shared/empty-state';
import { Icon } from '../../shared/icon';
import { revealForm } from '../../shared/scroll';
import { RecordText } from '../../shared/record-text';
import { label } from '../../shared/labels';
import { PatientPicker } from '../../shared/patient-picker';

/** Categories recognised by the API rules and the Evolución summaries. */
export const MOODS = ['tranquilo', 'estable', 'alegre', 'regular', 'triste', 'ansioso', 'irritable', 'confundido', 'decaído'];
export const APPETITES = ['bueno', 'normal', 'regular', 'bajo', 'muy bajo', 'aumentado'];

const scale = [Validators.min(0), Validators.max(10)];

export const PAGE_SIZE = 50;

@Component({
  selector: 'app-sintomas',
  imports: [ReactiveFormsModule, RouterLink, Icon, EmptyState, PatientPicker, RecordText],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './sintomas.html',
  styleUrl: './sintomas.css',
})
export class Sintomas {
  private api = inject(Api);
  private fb = inject(FormBuilder);
  private notifier = inject(Notifier);
  protected context = inject(PatientContext);

  readonly records = signal<SymptomRecord[]>([]);
  readonly loading = signal(false);
  readonly hasMore = signal(false);
  readonly saving = signal(false);
  readonly error = signal('');
  readonly formError = signal('');
  /** null = create mode; id = correcting that record. */
  readonly editing = signal<number | null>(null);
  readonly maxMoment = nowLocalInput();

  protected moods = MOODS;
  protected appetites = APPETITES;
  protected label = label;
  protected formatDateTime = formatDateTime;
  protected severities: Severity[] = ['bajo', 'moderado', 'grave'];

  readonly form = this.fb.group({
    nivel_dolor: this.fb.control<number | null>(null, scale),
    calidad_sueno: this.fb.control<number | null>(null, scale),
    temperatura: this.fb.control<number | null>(null, [Validators.min(30), Validators.max(45)]),
    estado_animo: this.fb.nonNullable.control(''),
    apetito: this.fb.nonNullable.control(''),
    observaciones: this.fb.nonNullable.control('', [Validators.maxLength(5000)]),
    nivel_gravedad: this.fb.nonNullable.control<Severity>('bajo'),
    momento: this.fb.nonNullable.control(''),
  });

  constructor() {
    this.context.load().subscribe({ next: () => this.load(), error: e => this.error.set(apiError(e)) });
  }

  load(): void {
    const id = this.context.selectedId();
    if (!id) return;
    this.loading.set(true);
    this.error.set('');
    this.api.getPatientSymptoms(id, PAGE_SIZE, 0).subscribe({
      next: list => { this.records.set(list); this.hasMore.set(list.length === PAGE_SIZE); this.loading.set(false); },
      error: error => { this.error.set(apiError(error, 'No fue posible cargar el historial.')); this.loading.set(false); },
    });
  }

  /** Next page of older records (the API returns newest first). */
  loadMore(): void {
    const id = this.context.selectedId();
    if (!id || this.loading()) return;
    this.loading.set(true);
    this.api.getPatientSymptoms(id, PAGE_SIZE, this.records().length).subscribe({
      next: list => {
        this.records.update(current => [...current, ...list]);
        this.hasMore.set(list.length === PAGE_SIZE);
        this.loading.set(false);
      },
      error: error => { this.error.set(apiError(error)); this.loading.set(false); },
    });
  }

  invalid(name: keyof typeof this.form.controls): boolean {
    const control = this.form.controls[name];
    return control.invalid && (control.touched || control.dirty);
  }

  /** The API rejects a record without any measurement or observation. */
  isEmpty(): boolean {
    const v = this.form.getRawValue();
    return v.nivel_dolor === null && v.calidad_sueno === null && v.temperatura === null &&
      !v.estado_animo && !v.apetito && !v.observaciones.trim();
  }

  futureMoment(): boolean {
    const iso = localInputToISO(this.form.controls.momento.value);
    return !!iso && Date.parse(iso) > Date.now();
  }

  reset(): void {
    this.form.reset({ nivel_gravedad: 'bajo', estado_animo: '', apetito: '', observaciones: '', momento: '' });
    this.editing.set(null);
    this.formError.set('');
  }

  edit(record: SymptomRecord): void {
    this.form.reset({
      nivel_dolor: record.nivel_dolor, calidad_sueno: record.calidad_sueno, temperatura: record.temperatura,
      estado_animo: record.estado_animo ?? '', apetito: record.apetito ?? '',
      observaciones: record.observaciones ?? '', nivel_gravedad: record.nivel_gravedad, momento: '',
    });
    this.editing.set(record.id);
    this.formError.set('');
    revealForm();
  }

  save(): void {
    const patientId = this.context.selectedId();
    if (!patientId) return;
    if (this.form.invalid || this.isEmpty() || this.futureMoment()) {
      this.form.markAllAsTouched();
      if (this.isEmpty()) this.formError.set('Registra al menos una medición u observación.');
      return;
    }
    const v = this.form.getRawValue();
    const payload: SymptomInput = {
      nivel_dolor: v.nivel_dolor, calidad_sueno: v.calidad_sueno, temperatura: v.temperatura,
      estado_animo: v.estado_animo || null, apetito: v.apetito || null,
      observaciones: v.observaciones.trim() || null, nivel_gravedad: v.nivel_gravedad,
    };
    const id = this.editing();
    if (!id && v.momento) payload.fecha_registro = localInputToISO(v.momento);
    this.saving.set(true);
    this.formError.set('');
    const request = id ? this.api.updateSymptom(id, payload) : this.api.createSymptom(patientId, payload);
    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.notifier.success(id ? 'Registro corregido.' : 'Síntomas registrados. Si hay riesgo se creó una alerta.');
        this.reset();
        this.load();
      },
      error: error => { this.saving.set(false); this.formError.set(apiError(error, 'No fue posible guardar el registro.')); },
    });
  }

  remove(record: SymptomRecord): void {
    if (typeof window !== 'undefined' && !window.confirm('¿Retirar este registro del historial?')) return;
    this.api.deactivateSymptom(record.id).subscribe({
      next: () => { this.notifier.success('Registro retirado del historial.'); this.load(); },
      error: error => this.notifier.error(apiError(error)),
    });
  }
}
