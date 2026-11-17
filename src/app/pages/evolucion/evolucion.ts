import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin, Subscription } from 'rxjs';
import { Api } from '../../services/api';

@Component({
  selector: 'app-evolucion',
  imports: [DatePipe, DecimalPipe, FormsModule, RouterLink],
  templateUrl: './evolucion.html',
  styleUrl: './evolucion.css',
})
export class Evolucion implements OnInit {
  private api = inject(Api);
  private route = inject(ActivatedRoute);
  private destroyRef = inject(DestroyRef);
  private loadRequest?: Subscription;
  private aiRequest?: Subscription;
  patients = signal<any[]>([]);
  data = signal<any>(null);
  analyses = signal<any[]>([]);
  loading = signal(false);
  analyzing = signal(false);
  error = signal('');
  aiError = signal('');
  patientId: number | null = null;
  desde = '';
  hasta = '';
  consent = false;
  eventLimit = 50;
  readonly indicators = [
    { key: 'nivel_dolor', label: 'Dolor', unit: '/10' },
    { key: 'calidad_sueno', label: 'Calidad del sueño', unit: '/10' },
    { key: 'temperatura', label: 'Temperatura', unit: ' °C' },
  ];

  ngOnInit() {
    this.loading.set(true);
    this.api.getPatients().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: patients => {
        this.patients.set(patients);
        const requested = Number(this.route.snapshot.queryParamMap.get('patientId'));
        this.patientId = patients.some(p => p.id === requested) ? requested : patients[0]?.id ?? null;
        this.load();
      },
      error: () => { this.loading.set(false); this.error.set('No fue posible cargar tus pacientes.'); }
    });
  }

  load() {
    this.loadRequest?.unsubscribe();
    this.aiRequest?.unsubscribe();
    this.analyzing.set(false);
    this.data.set(null);
    this.analyses.set([]);
    this.error.set('');
    this.aiError.set('');
    this.consent = false;
    this.eventLimit = 50;
    if (!this.patientId) { this.loading.set(false); return; }
    if (this.desde && this.hasta && this.desde > this.hasta) {
      this.loading.set(false); this.error.set('Revisa el período seleccionado.'); return;
    }
    this.loading.set(true);
    this.loadRequest = forkJoin({
      evolution: this.api.getEvolution(this.patientId, this.desde, this.hasta),
      analyses: this.api.getEvolutionAnalyses(this.patientId),
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: result => {
        this.data.set(result.evolution); this.analyses.set(result.analyses); this.loading.set(false);
      },
      error: err => {
        this.loading.set(false);
        this.error.set(typeof err.error?.detail === 'string' ? err.error.detail : 'No se pudo cargar la evolución.');
      }
    });
  }

  analyze() {
    if (!this.consent || !this.patientId || this.analyzing() || !this.data()?.datos_suficientes) return;
    this.analyzing.set(true); this.aiError.set('');
    const period = this.data().periodo ?? { desde: this.desde, hasta: this.hasta };
    this.aiRequest = this.api.analyzeEvolution(this.patientId, period.desde || '', period.hasta || '')
      .pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: result => {
          this.analyses.update(list => [result, ...list]); this.analyzing.set(false); this.consent = false;
        },
        error: err => {
          this.aiError.set(typeof err.error?.detail === 'string' ? err.error.detail : 'El análisis IA no está disponible.');
          this.analyzing.set(false);
        }
      });
  }

  // Real elapsed-time spacing; no interpolation of missing measurements.
  chartPoints(points: { fecha: string; valor: number }[], key: string) {
    const times = points.map(p => new Date(p.fecha).getTime());
    const values = points.map(p => p.valor);
    const minY = key === 'temperatura' ? Math.min(...values) - 0.5 : 0;
    const maxY = key === 'temperatura' ? Math.max(...values) + 0.5 : 10;
    const span = (times.at(-1)! - times[0]) || 1;
    return points.map((p, i) => ({
      x: 52 + ((times[i] - times[0]) / span) * 640,
      y: 170 - ((p.valor - minY) / (maxY - minY)) * 145,
      ...p,
    }));
  }

  line(points: { x: number; y: number }[]) {
    return points.map(p => `${p.x},${p.y}`).join(' ');
  }
}
