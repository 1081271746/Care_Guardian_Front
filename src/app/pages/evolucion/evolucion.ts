import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Subscription, forkJoin } from 'rxjs';

import { Api } from '../../services/api';
import { apiError } from '../../services/errors';
import { addDays, formatDate, formatDateTime, todayISO } from '../../services/format';
import { AiStatus, EventKind, Evolution, MetricKey, SavedAnalysis } from '../../services/models';
import { PatientContext } from '../../services/patient-context';
import { EmptyState } from '../../shared/empty-state';
import { Icon } from '../../shared/icon';
import { RecordText } from '../../shared/record-text';
import { METRIC_LABELS, label } from '../../shared/labels';
import { LineChart } from '../../shared/line-chart';
import { PatientPicker } from '../../shared/patient-picker';

export const PRESETS = [
  { id: '7', label: '7 días', days: 7 },
  { id: '30', label: '30 días', days: 30 },
  { id: '90', label: '90 días', days: 90 },
  { id: 'todo', label: 'Todo', days: 0 },
] as const;

const EVENT_ICONS: Record<EventKind, string> = {
  sintoma: 'pulse', nota: 'note', medicamento: 'pill', cita: 'calendar', alerta: 'bell',
};
const PAGE = 40;

@Component({
  selector: 'app-evolucion',
  imports: [RouterLink, Icon, EmptyState, LineChart, PatientPicker, RecordText],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './evolucion.html',
  styleUrl: './evolucion.css',
})
export class Evolucion {
  private api = inject(Api);
  private destroyRef = inject(DestroyRef);
  private route = inject(ActivatedRoute);
  protected context = inject(PatientContext);
  private loadRequest?: Subscription;
  private aiRequest?: Subscription;

  readonly data = signal<Evolution | null>(null);
  readonly analyses = signal<SavedAnalysis[]>([]);
  readonly selectedAnalysis = signal<SavedAnalysis | null>(null);
  readonly aiStatus = signal<AiStatus | null>(null);
  readonly loading = signal(false);
  readonly analyzing = signal(false);
  readonly error = signal('');
  readonly aiError = signal('');
  readonly preset = signal<string>('30');
  readonly desde = signal(addDays(todayISO(), -29));
  readonly hasta = signal(todayISO());
  readonly consent = signal(false);
  readonly kindFilter = signal<EventKind | ''>('');
  readonly eventLimit = signal(PAGE);

  protected presets = PRESETS;
  protected label = label;
  protected formatDate = formatDate;
  protected formatDateTime = formatDateTime;
  protected eventIcon = (kind: EventKind) => EVENT_ICONS[kind] ?? 'info';
  protected metrics: { key: MetricKey; title: string; unit: string; min: number; max: number; color: string }[] = [
    { key: 'nivel_dolor', ...METRIC_LABELS.nivel_dolor, color: 'var(--cg-series-2)' },
    { key: 'calidad_sueno', ...METRIC_LABELS.calidad_sueno, color: 'var(--cg-series-3)' },
    { key: 'temperatura', ...METRIC_LABELS.temperatura, color: 'var(--cg-series-1)' },
  ];
  protected kinds: EventKind[] = ['sintoma', 'nota', 'alerta', 'cita', 'medicamento'];

  readonly events = computed(() => {
    const all = this.data()?.historial ?? [];
    const kind = this.kindFilter();
    return kind ? all.filter(event => event.tipo === kind) : all;
  });
  readonly shownEvents = computed(() => this.events().slice(0, this.eventLimit()));
  readonly periodInvalid = computed(() => !!this.desde() && !!this.hasta() && this.desde() > this.hasta());
  readonly categoryGroups = computed(() => {
    const categories = this.data()?.categorias ?? {};
    return [
      { key: 'nivel_gravedad', title: 'Gravedad' },
      { key: 'estado_animo', title: 'Estado de ánimo' },
      { key: 'apetito', title: 'Apetito' },
    ].map(group => ({ ...group, values: Object.entries(categories[group.key] ?? {}) }))
      .filter(group => group.values.length);
  });
  readonly canAnalyze = computed(() =>
    !!this.aiStatus()?.configurado && !!this.data()?.datos_suficientes && this.consent() && !this.analyzing());

  constructor() {
    const requested = Number(this.route.snapshot.queryParamMap.get('patientId'));
    this.context.load().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: patients => {
        if (requested && patients.some(p => p.id === requested)) this.context.select(requested);
        this.load();
      },
      error: error => this.error.set(apiError(error, 'No fue posible cargar tus pacientes.')),
    });
    this.api.getAiStatus().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: status => this.aiStatus.set(status),
      error: () => this.aiStatus.set(null),
    });
  }

  choosePreset(id: string): void {
    const preset = PRESETS.find(p => p.id === id);
    if (!preset) return;
    this.preset.set(id);
    this.hasta.set(preset.days ? todayISO() : '');
    this.desde.set(preset.days ? addDays(todayISO(), -(preset.days - 1)) : '');
    this.load();
  }

  setRange(field: 'desde' | 'hasta', value: string): void {
    this.preset.set('personalizado');
    (field === 'desde' ? this.desde : this.hasta).set(value);
  }

  load(): void {
    this.loadRequest?.unsubscribe();
    this.aiRequest?.unsubscribe();
    this.analyzing.set(false);
    this.consent.set(false);
    this.error.set('');
    this.aiError.set('');
    this.eventLimit.set(PAGE);
    const patientId = this.context.selectedId();
    if (!patientId) {
      this.data.set(null);
      return;
    }
    if (this.periodInvalid()) {
      this.error.set('La fecha inicial debe ser anterior o igual a la final.');
      return;
    }
    this.loading.set(true);
    this.loadRequest = forkJoin({
      evolution: this.api.getEvolution(patientId, this.desde(), this.hasta()),
      analyses: this.api.getEvolutionAnalyses(patientId),
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: ({ evolution, analyses }) => {
        this.data.set(evolution);
        this.analyses.set(analyses);
        this.selectedAnalysis.set(analyses[0] ?? null);
        this.loading.set(false);
      },
      error: error => {
        this.data.set(null);
        this.analyses.set([]);
        this.selectedAnalysis.set(null);
        this.error.set(apiError(error, 'No se pudo cargar la evolución.'));
        this.loading.set(false);
      },
    });
  }

  /** Real call to Groq through the backend; requires explicit consent each time. */
  analyze(): void {
    const patientId = this.context.selectedId();
    if (!patientId || !this.consent() || this.analyzing() || !this.data()?.datos_suficientes) return;
    this.analyzing.set(true);
    this.aiError.set('');
    this.aiRequest = this.api.analyzeEvolution(patientId, this.desde(), this.hasta())
      .pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: saved => {
          this.analyses.update(list => [saved, ...list]);
          this.selectedAnalysis.set(saved);
          this.analyzing.set(false);
          this.consent.set(false);
        },
        error: error => {
          this.aiError.set(apiError(error, 'El análisis con IA no está disponible en este momento.'));
          this.analyzing.set(false);
        },
      });
  }

  /** Prints the current period (charts, figures and saved summary) for an appointment. */
  print(): void {
    this.eventLimit.set(this.events().length);
    if (typeof window !== 'undefined') setTimeout(() => window.print());
  }

  showMore(): void {
    this.eventLimit.update(limit => limit + PAGE);
  }

  metric(key: MetricKey) {
    return this.data()?.metricas[key];
  }
}
