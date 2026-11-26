import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Api } from '../../services/api';
import { Auth } from '../../services/auth';
import { apiError } from '../../services/errors';
import { formatDate, formatRelative, formatTime } from '../../services/format';
import { DashboardSummary } from '../../services/models';
import { PatientContext } from '../../services/patient-context';
import { BarChart } from '../../shared/bar-chart';
import { EmptyState } from '../../shared/empty-state';
import { Icon } from '../../shared/icon';
import { label } from '../../shared/labels';

const ACTIVITY_ICONS: Record<string, string> = {
  sintoma: 'pulse', nota: 'note', alerta: 'bell', medicamento: 'pill', cita: 'calendar',
};

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, Icon, EmptyState, BarChart],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard {
  private api = inject(Api);
  private context = inject(PatientContext);
  protected user = inject(Auth).user;

  readonly summary = signal<DashboardSummary | null>(null);
  readonly loading = signal(true);
  readonly error = signal('');

  protected label = label;
  protected formatDate = formatDate;
  protected formatTime = formatTime;
  protected formatRelative = formatRelative;
  protected activityIcon = (kind: string) => ACTIVITY_ICONS[kind] ?? 'info';

  protected greeting = computed(() => {
    const hour = new Date().getHours();
    const name = this.user()?.nombre.split(' ')[0];
    const salute = hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches';
    return name ? `${salute}, ${name}` : salute;
  });

  /** Bars only when there is at least one real record in the window. */
  protected dailyBars = computed(() => {
    const days = this.summary()?.sintomas_por_dia ?? [];
    if (!days.some(day => day.cantidad > 0)) return [];
    return days.map(day => ({
      label: day.fecha.slice(8, 10) + '/' + day.fecha.slice(5, 7),
      value: day.cantidad,
      title: `${formatDate(day.fecha)}: ${day.cantidad} registro(s)`,
    }));
  });

  protected alertTotal = computed(() => {
    const levels = this.summary()?.alertas_por_nivel;
    return levels ? levels.alto + levels.medio + levels.bajo : 0;
  });

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set('');
    this.api.getSummary().subscribe({
      next: summary => {
        this.summary.set(summary);
        this.loading.set(false);
      },
      error: error => {
        this.error.set(apiError(error, 'No fue posible cargar el panel.'));
        this.loading.set(false);
      },
    });
  }

  /** Opening a module from the panel keeps the chosen patient selected. */
  focus(patientId: number): void {
    this.context.select(patientId);
  }
}
