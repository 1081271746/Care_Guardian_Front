import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { Api } from '../../services/api';
import { apiError } from '../../services/errors';
import { formatDateTime, formatRelative } from '../../services/format';
import { Alert, AlertLevel, AlertStatus } from '../../services/models';
import { Notifier } from '../../services/notifier';
import { PatientContext } from '../../services/patient-context';
import { EmptyState } from '../../shared/empty-state';
import { Icon } from '../../shared/icon';
import { RecordText } from '../../shared/record-text';
import { label } from '../../shared/labels';
import { PatientPicker } from '../../shared/patient-picker';

const LEVEL_ORDER: Record<AlertLevel, number> = { alto: 0, medio: 1, bajo: 2 };

@Component({
  selector: 'app-alertas',
  imports: [ReactiveFormsModule, Icon, EmptyState, PatientPicker, RecordText],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './alertas.html',
  styleUrl: './alertas.css',
})
export class Alertas {
  private api = inject(Api);
  private fb = inject(FormBuilder);
  private notifier = inject(Notifier);
  protected context = inject(PatientContext);

  readonly alerts = signal<Alert[]>([]);
  readonly loading = signal(false);
  readonly error = signal('');
  readonly formError = signal('');
  readonly creating = signal(false);
  readonly view = signal<'activas' | 'historial'>('activas');
  readonly level = signal<AlertLevel | ''>('');
  /** Alert being updated: its buttons are disabled to avoid double submissions. */
  readonly busy = signal<number | null>(null);

  protected label = label;
  protected formatDateTime = formatDateTime;
  protected formatRelative = formatRelative;

  /** Active: most severe first; history: newest first. */
  readonly visible = computed(() => {
    const list = this.alerts().filter(a => (this.view() === 'activas') === a.activa);
    return this.view() === 'activas'
      ? list.slice().sort((a, b) => LEVEL_ORDER[a.nivel] - LEVEL_ORDER[b.nivel] || b.fecha_registro.localeCompare(a.fecha_registro))
      : list;
  });
  readonly activeCount = computed(() => this.alerts().filter(a => a.activa).length);

  readonly form = this.fb.nonNullable.group({
    titulo: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(150)]],
    mensaje: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(5000)]],
    nivel: ['medio' as AlertLevel],
  });

  constructor() {
    this.context.load().subscribe({ next: () => this.load(), error: e => this.error.set(apiError(e)) });
  }

  load(): void {
    const id = this.context.selectedId();
    if (!id) return;
    this.loading.set(true);
    this.error.set('');
    this.api.getAlertHistory(id, this.level()).subscribe({
      next: list => { this.alerts.set(list); this.loading.set(false); },
      error: error => { this.error.set(apiError(error, 'No fue posible cargar las alertas.')); this.loading.set(false); },
    });
  }

  setStatus(alert: Alert, estado: AlertStatus): void {
    if (this.busy()) return;
    this.busy.set(alert.id);
    this.api.setAlertStatus(alert.id, estado).subscribe({
      next: () => {
        this.busy.set(null);
        this.notifier.success(`Alerta marcada como ${label(estado).toLowerCase()}.`);
        this.load();
      },
      error: error => { this.busy.set(null); this.notifier.error(apiError(error)); },
    });
  }

  create(): void {
    const patientId = this.context.selectedId();
    if (!patientId) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.formError.set('');
    this.api.createAlert(patientId, this.form.getRawValue()).subscribe({
      next: () => {
        this.creating.set(false);
        this.form.reset({ titulo: '', mensaje: '', nivel: 'medio' });
        this.notifier.success('Alerta creada para el equipo.');
        this.view.set('activas');
        this.load();
      },
      error: error => this.formError.set(apiError(error, 'No fue posible crear la alerta.')),
    });
  }

  source(alert: Alert): string {
    if (alert.origen === 'manual') return 'Creada por el equipo';
    if (alert.symptom_id) return 'Generada por un registro de síntomas';
    if (alert.note_id) return 'Generada por una nota del cuidador';
    return 'Generada por el análisis del historial';
  }
}
