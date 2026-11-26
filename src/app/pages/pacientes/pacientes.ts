import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Observable } from 'rxjs';

import { Api } from '../../services/api';
import { apiError } from '../../services/errors';
import { formatDate, fullName, todayISO } from '../../services/format';
import { Caregiver, Patient, PatientInput } from '../../services/models';
import { Notifier } from '../../services/notifier';
import { PatientContext } from '../../services/patient-context';
import { EmptyState } from '../../shared/empty-state';
import { Icon } from '../../shared/icon';
import { revealForm } from '../../shared/scroll';
import { label } from '../../shared/labels';

const PHONE = /^\+?[0-9 ()-]{7,20}$/;

@Component({
  selector: 'app-pacientes',
  imports: [ReactiveFormsModule, RouterLink, Icon, EmptyState],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './pacientes.html',
  styleUrl: './pacientes.css',
})
export class Pacientes {
  private api = inject(Api);
  private fb = inject(FormBuilder);
  private notifier = inject(Notifier);
  protected context = inject(PatientContext);

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal('');
  readonly formError = signal('');
  readonly query = signal('');
  readonly status = signal<'todos' | 'activos' | 'inactivos'>('activos');
  /** null = closed, 0 = new patient, id = editing that patient. */
  readonly editing = signal<number | null>(null);
  readonly teamFor = signal<Patient | null>(null);
  readonly team = signal<Caregiver[]>([]);
  readonly teamError = signal('');

  protected today = todayISO();
  protected fullName = fullName;
  protected formatDate = formatDate;
  protected label = label;

  readonly visible = computed(() => {
    const term = this.query().trim().toLowerCase();
    return this.context.patients()
      .filter(p => this.status() === 'todos' || (this.status() === 'activos') === p.activo)
      .filter(p => !term || `${p.nombres} ${p.apellidos} ${p.documento}`.toLowerCase().includes(term));
  });

  readonly form = this.fb.nonNullable.group({
    nombres: ['', [Validators.required, Validators.maxLength(100)]],
    apellidos: ['', [Validators.required, Validators.maxLength(100)]],
    fecha_nacimiento: ['', [Validators.required]],
    documento: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(30), Validators.pattern(/^[A-Za-z0-9.-]+$/)]],
    telefono: ['', [Validators.pattern(PHONE)]],
    direccion: ['', [Validators.maxLength(200)]],
    contacto_emergencia: ['', [Validators.maxLength(150)]],
    telefono_emergencia: ['', [Validators.pattern(PHONE)]],
  });

  readonly teamForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    rol: ['familiar'],
  });

  constructor() {
    this.refresh();
  }

  refresh(): void {
    this.loading.set(true);
    this.error.set('');
    this.context.load(true).subscribe({
      next: () => this.loading.set(false),
      error: error => {
        this.error.set(apiError(error, 'No fue posible cargar los pacientes.'));
        this.loading.set(false);
      },
    });
  }

  invalid(name: keyof typeof this.form.controls): boolean {
    const control = this.form.controls[name];
    return control.invalid && (control.touched || control.dirty);
  }

  openNew(): void {
    this.form.reset();
    this.formError.set('');
    this.editing.set(0);
    revealForm();
  }

  openEdit(patient: Patient): void {
    this.form.reset({
      nombres: patient.nombres, apellidos: patient.apellidos, fecha_nacimiento: patient.fecha_nacimiento,
      documento: patient.documento, telefono: patient.telefono ?? '', direccion: patient.direccion ?? '',
      contacto_emergencia: patient.contacto_emergencia ?? '', telefono_emergencia: patient.telefono_emergencia ?? '',
    });
    this.formError.set('');
    this.editing.set(patient.id);
    revealForm();
  }

  close(): void {
    this.editing.set(null);
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const raw = this.form.getRawValue();
    // Empty optional fields are sent as null so the API can clear them.
    const payload: PatientInput = {
      ...raw,
      telefono: raw.telefono.trim() || null,
      direccion: raw.direccion.trim() || null,
      contacto_emergencia: raw.contacto_emergencia.trim() || null,
      telefono_emergencia: raw.telefono_emergencia.trim() || null,
    };
    const id = this.editing();
    this.saving.set(true);
    this.formError.set('');
    const request = id ? this.api.updatePatient(id, payload) : this.api.createPatient(payload);
    request.subscribe({
      next: patient => {
        this.saving.set(false);
        this.editing.set(null);
        this.notifier.success(id ? 'Datos del paciente actualizados.' : 'Paciente registrado y asignado a ti.');
        this.context.select(patient.id);
        this.refresh();
      },
      error: error => {
        this.saving.set(false);
        this.formError.set(apiError(error, 'No fue posible guardar el paciente.'));
      },
    });
  }

  toggleActive(patient: Patient): void {
    const message = patient.activo
      ? `¿Desactivar a ${fullName(patient)}? Su historial se conserva y podrás reactivarlo.`
      : `¿Reactivar a ${fullName(patient)}?`;
    if (typeof window !== 'undefined' && !window.confirm(message)) return;
    const request: Observable<unknown> = patient.activo
      ? this.api.deactivatePatient(patient.id)
      : this.api.updatePatient(patient.id, { activo: true });
    request.subscribe({
      next: () => {
        this.notifier.success(patient.activo ? 'Paciente desactivado; su historial se conserva.' : 'Paciente reactivado.');
        this.refresh();
      },
      error: error => this.notifier.error(apiError(error)),
    });
  }

  openTeam(patient: Patient): void {
    this.teamFor.set(patient);
    this.team.set([]);
    this.teamError.set('');
    this.teamForm.reset({ email: '', rol: 'familiar' });
    this.api.getCaregivers(patient.id).subscribe({
      next: team => this.team.set(team),
      error: error => this.teamError.set(apiError(error)),
    });
  }

  addCaregiver(): void {
    const patient = this.teamFor();
    if (!patient || this.teamForm.invalid) {
      this.teamForm.markAllAsTouched();
      return;
    }
    const { email, rol } = this.teamForm.getRawValue();
    this.api.assignCaregiver(patient.id, email.trim(), rol).subscribe({
      next: () => {
        this.notifier.success('Cuidador agregado al equipo.');
        this.openTeam(patient);
      },
      error: error => this.teamError.set(apiError(error)),
    });
  }

  removeCaregiver(member: Caregiver): void {
    const patient = this.teamFor();
    if (!patient) return;
    if (typeof window !== 'undefined' && !window.confirm(`¿Quitar a ${member.nombre} del equipo de cuidado?`)) return;
    this.api.removeCaregiver(patient.id, member.user_id).subscribe({
      next: () => {
        this.notifier.success('Cuidador desasignado.');
        this.openTeam(patient);
      },
      error: error => this.teamError.set(apiError(error)),
    });
  }
}
