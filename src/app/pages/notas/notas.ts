import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { Api } from '../../services/api';
import { Auth } from '../../services/auth';
import { apiError } from '../../services/errors';
import { formatDateTime, formatRelative, localInputToISO, nowLocalInput } from '../../services/format';
import { CaregiverNote } from '../../services/models';
import { Notifier } from '../../services/notifier';
import { PatientContext } from '../../services/patient-context';
import { EmptyState } from '../../shared/empty-state';
import { Icon } from '../../shared/icon';
import { RecordText } from '../../shared/record-text';
import { PatientPicker } from '../../shared/patient-picker';

export const PAGE_SIZE = 50;

@Component({
  selector: 'app-notas',
  imports: [ReactiveFormsModule, Icon, EmptyState, PatientPicker, RecordText],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './notas.html',
  styleUrl: './notas.css',
})
export class Notas {
  private api = inject(Api);
  private fb = inject(FormBuilder);
  private notifier = inject(Notifier);
  private auth = inject(Auth);
  protected context = inject(PatientContext);
  protected user = this.auth.user;

  readonly notes = signal<CaregiverNote[]>([]);
  readonly loading = signal(false);
  readonly hasMore = signal(false);
  readonly saving = signal(false);
  readonly error = signal('');
  readonly formError = signal('');
  readonly editing = signal<number | null>(null);
  readonly editText = signal('');
  readonly maxMoment = nowLocalInput();

  protected formatDateTime = formatDateTime;
  protected formatRelative = formatRelative;

  readonly form = this.fb.nonNullable.group({
    contenido: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(5000)]],
    momento: [''],
  });

  constructor() {
    this.auth.loadUser()?.subscribe({ error: () => {} });
    this.context.load().subscribe({ next: () => this.load(), error: e => this.error.set(apiError(e)) });
  }

  load(): void {
    const id = this.context.selectedId();
    if (!id) return;
    this.loading.set(true);
    this.error.set('');
    this.api.getPatientNotes(id, PAGE_SIZE, 0).subscribe({
      next: list => { this.notes.set(list); this.hasMore.set(list.length === PAGE_SIZE); this.loading.set(false); },
      error: error => { this.error.set(apiError(error, 'No fue posible cargar el historial.')); this.loading.set(false); },
    });
  }

  /** Next page of older records (the API returns newest first). */
  loadMore(): void {
    const id = this.context.selectedId();
    if (!id || this.loading()) return;
    this.loading.set(true);
    this.api.getPatientNotes(id, PAGE_SIZE, this.notes().length).subscribe({
      next: list => {
        this.notes.update(current => [...current, ...list]);
        this.hasMore.set(list.length === PAGE_SIZE);
        this.loading.set(false);
      },
      error: error => { this.error.set(apiError(error)); this.loading.set(false); },
    });
  }

  /** Only the author can edit or remove a note (enforced by the API too). */
  isMine(note: CaregiverNote): boolean {
    return note.caregiver_id === this.user()?.id;
  }

  save(): void {
    const patientId = this.context.selectedId();
    if (!patientId) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { contenido, momento } = this.form.getRawValue();
    const fecha = localInputToISO(momento);
    if (fecha && Date.parse(fecha) > Date.now()) {
      this.formError.set('La fecha de la observación no puede ser futura.');
      return;
    }
    this.saving.set(true);
    this.formError.set('');
    this.api.createNote(patientId, { contenido: contenido.trim(), ...(fecha ? { fecha_registro: fecha } : {}) }).subscribe({
      next: () => {
        this.saving.set(false);
        this.form.reset();
        this.notifier.success('Nota guardada.');
        this.load();
      },
      error: error => { this.saving.set(false); this.formError.set(apiError(error, 'No fue posible guardar la nota.')); },
    });
  }

  startEdit(note: CaregiverNote): void {
    this.editing.set(note.id);
    this.editText.set(note.contenido);
  }

  saveEdit(note: CaregiverNote): void {
    const text = this.editText().trim();
    if (text.length < 5) {
      this.notifier.error('La nota debe tener al menos 5 caracteres.');
      return;
    }
    this.api.updateNote(note.id, text).subscribe({
      next: () => { this.editing.set(null); this.notifier.success('Nota actualizada.'); this.load(); },
      error: error => this.notifier.error(apiError(error)),
    });
  }

  remove(note: CaregiverNote): void {
    if (typeof window !== 'undefined' && !window.confirm('¿Retirar esta nota del historial?')) return;
    this.api.deactivateNote(note.id).subscribe({
      next: () => { this.notifier.success('Nota retirada.'); this.load(); },
      error: error => this.notifier.error(apiError(error)),
    });
  }
}
