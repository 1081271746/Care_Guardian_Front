import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Api } from '../../services/api';

@Component({
  selector: 'app-sintomas',
  standalone: true,
  imports: [
    FormsModule,
    DatePipe
  ],
  templateUrl: './sintomas.html',
  styleUrl: './sintomas.css'
})
export class Sintomas implements OnInit {

  patientId = 0;

  symptoms: any[] = [];

  loading = true;
  saving = false;

  errorMessage = '';
  successMessage = '';

  showForm = false;

  newSymptom = {
    calidad_sueno: null,
    estado_animo: '',
    apetito: '',
    nivel_dolor: null,
    temperatura: null,
    observaciones: '',
    nivel_gravedad: 'bajo'
  };

  constructor(
    private api: Api,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {

    this.api.getPatients().subscribe({
      next: patients => {
        const requested = Number(this.route.snapshot.queryParamMap.get('patientId'));
        this.patientId = patients.find(p => p.id === requested)?.id ?? patients[0]?.id ?? 0;
        if (this.patientId) this.loadSymptoms();
        else { this.loading = false; this.errorMessage = 'No tienes pacientes asignados.'; this.cdr.detectChanges(); }
      },
      error: () => { this.loading = false; this.errorMessage = 'No fue posible cargar tus pacientes.'; this.cdr.detectChanges(); }
    });
  }

  loadSymptoms(): void {

    this.loading = true;
    this.errorMessage = '';

    this.api.getPatientSymptoms(this.patientId).subscribe({

      next: (data) => {


        this.symptoms = data;

        this.loading = false;

        this.cdr.detectChanges();

      },

      error: (error) => {


        this.errorMessage =
          error?.error?.detail ||
          'No fue posible cargar los registros de síntomas.';

        this.loading = false;

        this.cdr.detectChanges();
      }

    });
  }

  openForm(): void {

    this.showForm = true;

    this.errorMessage = '';
    this.successMessage = '';

    this.cdr.detectChanges();
  }

  closeForm(): void {

    this.showForm = false;

    this.resetForm();

    this.cdr.detectChanges();
  }

  createSymptom(): void {

    this.errorMessage = '';
    this.successMessage = '';

    this.saving = true;

    const symptomData = {
      calidad_sueno:
        this.newSymptom.calidad_sueno !== null
          ? Number(this.newSymptom.calidad_sueno)
          : null,

      estado_animo:
        this.newSymptom.estado_animo || null,

      apetito:
        this.newSymptom.apetito || null,

      nivel_dolor:
        this.newSymptom.nivel_dolor !== null
          ? Number(this.newSymptom.nivel_dolor)
          : null,

      temperatura:
        this.newSymptom.temperatura !== null
          ? Number(this.newSymptom.temperatura)
          : null,

      observaciones:
        this.newSymptom.observaciones || null,

      nivel_gravedad:
        this.newSymptom.nivel_gravedad
    };


    this.api.createSymptom(
      this.patientId,
      symptomData
    ).subscribe({

      next: (response) => {


        this.saving = false;

        this.successMessage =
          'Registro de síntomas guardado correctamente.';

        this.showForm = false;

        this.resetForm();

        this.loadSymptoms();

        this.cdr.detectChanges();
      },

      error: (error) => {


        this.errorMessage =
          error?.error?.detail ||
          'No fue posible guardar el registro.';

        this.saving = false;

        this.cdr.detectChanges();
      }

    });
  }

  resetForm(): void {

    this.newSymptom = {

      calidad_sueno: null,

      estado_animo: '',

      apetito: '',

      nivel_dolor: null,

      temperatura: null,

      observaciones: '',

      nivel_gravedad: 'bajo'

    };
  }

  getSeverityClass(nivel: string): string {

    switch (nivel?.toLowerCase()) {

      case 'alto':
      case 'grave':
        return 'severity-high';

      case 'medio':
      case 'moderado':
        return 'severity-medium';

      default:
        return 'severity-low';
    }
  }

  getSeverityLabel(nivel: string): string {

    switch (nivel?.toLowerCase()) {

      case 'alto':
      case 'grave':
        return 'Alto';

      case 'medio':
      case 'moderado':
        return 'Medio';

      default:
        return 'Bajo';
    }
  }
}