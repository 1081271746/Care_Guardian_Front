import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { Api } from '../../services/api';
import { apiError } from '../../services/errors';
import { addDays, formatDate, formatTime, todayISO, monthShort } from '../../services/format';
import { Appointment, AppointmentInput, AppointmentStatus } from '../../services/models';
import { Notifier } from '../../services/notifier';
import { PatientContext } from '../../services/patient-context';
import { EmptyState } from '../../shared/empty-state';
import { Icon } from '../../shared/icon';
import { RecordText } from '../../shared/record-text';
import { label } from '../../shared/labels';
import { PatientPicker } from '../../shared/patient-picker';

@Component({
  selector: 'app-citas',
  imports: [ReactiveFormsModule, Icon, EmptyState, PatientPicker, RecordText],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './citas.html',
  styleUrl: './citas.css',
})
export class Citas {
  private api = inject(Api);
  private fb = inject(FormBuilder);
  private notifier = inject(Notifier);
  protected context = inject(PatientContext);

  readonly appointments = signal<Appointment[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal('');
  readonly formError = signal('');
  readonly editing = signal<number | null>(null);
  readonly today = todayISO();

  protected label = label;
  protected formatDate = formatDate;
  protected formatTime = formatTime;
  protected monthShort = monthShort;
  protected statuses: AppointmentStatus[] = ['pendiente', 'confirmada', 'completada', 'cancelada'];

  /** Upcoming first (soonest on top), then past visits (most recent on top). */
  readonly upcoming = computed(() =>
    this.appointments().filter(a => a.fecha >= this.today && a.estado !== 'cancelada'));
  readonly past = computed(() =>
    this.appointments().filter(a => a.fecha < this.today || a.estado === 'cancelada').slice().reverse());

  readonly form = this.fb.nonNullable.group({
    titulo: ['', [Validators.required, Validators.maxLength(150)]],
    especialidad: ['', [Validators.required, Validators.maxLength(100)]],
    profesional: ['', [Validators.required, Validators.maxLength(150)]],
    fecha: [addDays(todayISO(), 1), [Validators.required]],
    hora: ['09:00', [Validators.required]],
    lugar: ['', [Validators.maxLength(200)]],
    estado: ['pendiente' as AppointmentStatus],
    notas: ['', [Validators.maxLength(500)]],
  });

  constructor() {
    this.context.load().subscribe({ next: () => this.load(), error: e => this.error.set(apiError(e)) });
  }

  load(): void {
    const id = this.context.selectedId();
    if (!id) return;
    this.loading.set(true);
    this.error.set('');
    this.api.getPatientAppointments(id).subscribe({
      next: list => { this.appointments.set(list); this.loading.set(false); },
      error: error => { this.error.set(apiError(error, 'No fue posible cargar las citas.')); this.loading.set(false); },
    });
  }

  invalid(name: keyof typeof this.form.controls): boolean {
    const control = this.form.controls[name];
    return control.invalid && (control.touched || control.dirty);
  }

  /** Mirrors the API rule: a pending visit cannot be in the past. */
  pastPending(): boolean {
    const { fecha, estado } = this.form.getRawValue();
    return estado === 'pendiente' && !!fecha && fecha < this.today;
  }

  openNew(): void {
    this.form.reset({ fecha: addDays(this.today, 1), hora: '09:00', estado: 'pendiente' });
    this.formError.set('');
    this.editing.set(0);
  }

  openEdit(visit: Appointment): void {
    this.form.reset({
      titulo: visit.titulo, especialidad: visit.especialidad, profesional: visit.profesional, fecha: visit.fecha,
      hora: visit.hora.slice(0, 5), lugar: visit.lugar ?? '', estado: visit.estado, notas: visit.notas ?? '',
    });
    this.formError.set('');
    this.editing.set(visit.id);
  }

  save(): void {
    const patientId = this.context.selectedId();
    if (!patientId) return;
    if (this.form.invalid || this.pastPending()) {
      this.form.markAllAsTouched();
      return;
    }
    const raw = this.form.getRawValue();
    const payload: AppointmentInput = { ...raw, lugar: raw.lugar.trim() || null, notas: raw.notas.trim() || null };
    const id = this.editing();
    this.saving.set(true);
    this.formError.set('');
    const request = id ? this.api.updateAppointment(id, payload) : this.api.createAppointment(patientId, payload);
    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.editing.set(null);
        this.notifier.success(id ? 'Cita actualizada.' : 'Cita programada.');
        this.load();
      },
      error: error => { this.saving.set(false); this.formError.set(apiError(error, 'No fue posible guardar la cita.')); },
    });
  }

  setStatus(visit: Appointment, estado: AppointmentStatus): void {
    this.api.updateAppointment(visit.id, { estado }).subscribe({
      next: () => { this.notifier.success(`Cita marcada como ${label(estado).toLowerCase()}.`); this.load(); },
      error: error => this.notifier.error(apiError(error)),
    });
  }

  remove(visit: Appointment): void {
    if (typeof window !== 'undefined' && !window.confirm(`¿Eliminar la cita "${visit.titulo}"?`)) return;
    this.api.deleteAppointment(visit.id).subscribe({
      next: () => { this.notifier.success('Cita eliminada.'); this.load(); },
      error: error => this.notifier.error(apiError(error)),
    });
  }
}
