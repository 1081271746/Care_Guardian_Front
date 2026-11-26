import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Api } from '../../services/api';
import { apiError } from '../../services/errors';
import { formatDate, formatDateTime, formatRelative, formatTime, fullName } from '../../services/format';
import { PatientDashboard } from '../../services/models';
import { PatientContext } from '../../services/patient-context';
import { EmptyState } from '../../shared/empty-state';
import { Icon } from '../../shared/icon';
import { label } from '../../shared/labels';

/** Panel of one patient: /dashboard/:patientId (also linked from Pacientes). */
@Component({
  selector: 'app-paciente',
  imports: [RouterLink, Icon, EmptyState],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './paciente.html',
  styleUrl: './paciente.css',
})
export class Paciente {
  private api = inject(Api);
  private context = inject(PatientContext);

  /** Bound from the route parameter (withComponentInputBinding). */
  readonly patientId = input.required<string>();

  readonly data = signal<PatientDashboard | null>(null);
  readonly loading = signal(true);
  readonly error = signal('');

  protected name = computed(() => fullName(this.data()?.patient));
  protected label = label;
  protected formatDate = formatDate;
  protected formatDateTime = formatDateTime;
  protected formatRelative = formatRelative;
  protected formatTime = formatTime;

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    const id = Number(this.patientId());
    if (!id) {
      this.error.set('Paciente no válido.');
      this.loading.set(false);
      return;
    }
    this.context.select(id);
    this.loading.set(true);
    this.error.set('');
    this.api.getPatientDashboard(id).subscribe({
      next: data => {
        this.data.set(data);
        this.loading.set(false);
      },
      error: error => {
        this.error.set(apiError(error, 'No fue posible cargar el panel del paciente.'));
        this.loading.set(false);
      },
    });
  }
}
