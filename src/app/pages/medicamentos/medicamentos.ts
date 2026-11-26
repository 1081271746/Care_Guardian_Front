import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { Api } from '../../services/api';
import { apiError } from '../../services/errors';
import { formatDate, formatTime, todayISO } from '../../services/format';
import { Medication, MedicationInput } from '../../services/models';
import { Notifier } from '../../services/notifier';
import { PatientContext } from '../../services/patient-context';
import { EmptyState } from '../../shared/empty-state';
import { Icon } from '../../shared/icon';
import { PatientPicker } from '../../shared/patient-picker';

@Component({
  selector: 'app-medicamentos',
  imports: [ReactiveFormsModule, Icon, EmptyState, PatientPicker],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './medicamentos.html',
  styleUrl: './medicamentos.css',
})
export class Medicamentos {
  private api = inject(Api);
  private fb = inject(FormBuilder);
  private notifier = inject(Notifier);
  protected context = inject(PatientContext);

  readonly medications = signal<Medication[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal('');
  readonly formError = signal('');
  readonly showSuspended = signal(false);
  readonly editing = signal<number | null>(null);

  protected formatDate = formatDate;
  protected formatTime = formatTime;

  readonly visible = computed(() => this.medications().filter(m => this.showSuspended() || m.activo));
  readonly suspendedCount = computed(() => this.medications().filter(m => !m.activo).length);

  readonly form = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.maxLength(100)]],
    dosis: ['', [Validators.required, Validators.maxLength(100)]],
    frecuencia: ['', [Validators.required, Validators.maxLength(100)]],
    hora: ['08:00', [Validators.required, Validators.pattern(/^([01]\d|2[0-3]):[0-5]\d$/)]],
    fecha_inicio: [todayISO(), [Validators.required]],
    fecha_fin: [''],
    indicaciones: ['', [Validators.maxLength(300)]],
  });

  constructor() {
    this.context.load().subscribe({ next: () => this.load(), error: e => this.error.set(apiError(e)) });
  }

  load(): void {
    const id = this.context.selectedId();
    if (!id) return;
    this.loading.set(true);
    this.error.set('');
    this.api.getPatientMedications(id).subscribe({
      next: list => {
        this.medications.set(list);
        this.loading.set(false);
      },
      error: error => {
        this.error.set(apiError(error, 'No fue posible cargar los medicamentos.'));
        this.loading.set(false);
      },
    });
  }

  invalid(name: keyof typeof this.form.controls): boolean {
    const control = this.form.controls[name];
    return control.invalid && (control.touched || control.dirty);
  }

  rangeInvalid(): boolean {
    const { fecha_inicio, fecha_fin } = this.form.getRawValue();
    return !!fecha_fin && fecha_fin < fecha_inicio;
  }

  openNew(): void {
    this.form.reset({ hora: '08:00', fecha_inicio: todayISO() });
    this.formError.set('');
    this.editing.set(0);
  }

  openEdit(med: Medication): void {
    this.form.reset({
      nombre: med.nombre, dosis: med.dosis, frecuencia: med.frecuencia, hora: med.hora.slice(0, 5),
      fecha_inicio: med.fecha_inicio, fecha_fin: med.fecha_fin ?? '', indicaciones: med.indicaciones ?? '',
    });
    this.formError.set('');
    this.editing.set(med.id);
  }

  save(): void {
    const patientId = this.context.selectedId();
    if (!patientId) return;
    if (this.form.invalid || this.rangeInvalid()) {
      this.form.markAllAsTouched();
      return;
    }
    const raw = this.form.getRawValue();
    const payload: MedicationInput = {
      ...raw, fecha_fin: raw.fecha_fin || null, indicaciones: raw.indicaciones.trim() || null,
    };
    const id = this.editing();
    this.saving.set(true);
    this.formError.set('');
    const request = id ? this.api.updateMedication(id, payload) : this.api.createMedication(patientId, payload);
    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.editing.set(null);
        this.notifier.success(id ? 'Medicamento actualizado.' : 'Medicamento registrado.');
        this.load();
      },
      error: error => {
        this.saving.set(false);
        this.formError.set(apiError(error, 'No fue posible guardar el medicamento.'));
      },
    });
  }

  suspend(med: Medication): void {
    if (typeof window !== 'undefined' && !window.confirm(`¿Suspender ${med.nombre}? Quedará en el historial.`)) return;
    this.api.suspendMedication(med.id).subscribe({
      next: () => { this.notifier.success('Medicamento suspendido.'); this.load(); },
      error: error => this.notifier.error(apiError(error)),
    });
  }

  resume(med: Medication): void {
    this.api.updateMedication(med.id, { activo: true }).subscribe({
      next: () => { this.notifier.success('Medicamento reactivado.'); this.load(); },
      error: error => this.notifier.error(apiError(error)),
    });
  }
}
