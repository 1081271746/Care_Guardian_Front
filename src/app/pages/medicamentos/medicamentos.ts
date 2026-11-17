import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Api } from '../../services/api';

@Component({
  selector: 'app-medicamentos',
  standalone: true,
  imports: [
    FormsModule
  ],
  templateUrl: './medicamentos.html',
  styleUrl: './medicamentos.css'
})
export class Medicamentos implements OnInit {

  patientId = 0;
  private route = inject(ActivatedRoute);

  medications: any[] = [];

  loading = true;
  saving = false;

  errorMessage = '';
  successMessage = '';

  showForm = false;

newMedication = {
  nombre: '',
  dosis: '',
  frecuencia: '',
  hora: '',
  fecha_inicio: '',
  indicaciones: ''
};

  constructor(
    private api: Api,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.api.getPatients().subscribe({
      next: patients => {
        const requested = Number(this.route.snapshot.queryParamMap.get('patientId'));
        this.patientId = patients.find(p => p.id === requested)?.id ?? patients[0]?.id ?? 0;
        if (this.patientId) this.loadMedications();
        else { this.loading = false; this.errorMessage = 'No tienes pacientes asignados.'; this.cdr.detectChanges(); }
      },
      error: () => { this.loading = false; this.errorMessage = 'No fue posible cargar tus pacientes.'; this.cdr.detectChanges(); }
    });
  }

  loadMedications(): void {

    this.loading = true;
    this.errorMessage = '';

    this.api.getPatientMedications(this.patientId).subscribe({

      next: (data) => {


        this.medications = data;

        this.loading = false;

        this.cdr.detectChanges();

      },

      error: (error) => {


        this.errorMessage =
          error?.error?.detail ||
          'No fue posible cargar los medicamentos.';

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

  createMedication(): void {

    this.errorMessage = '';
    this.successMessage = '';

    if (
      !this.newMedication.nombre ||
      !this.newMedication.dosis ||
      !this.newMedication.frecuencia ||
      !this.newMedication.hora ||
      !this.newMedication.fecha_inicio
    ) {

      this.errorMessage =
        'Completa los campos obligatorios antes de continuar.';

      this.cdr.detectChanges();

      return;
    }

    this.saving = true;

const medicationData = {
  nombre: this.newMedication.nombre,
  dosis: this.newMedication.dosis,
  frecuencia: this.newMedication.frecuencia,
  hora: this.newMedication.hora,
  fecha_inicio: this.newMedication.fecha_inicio,
  indicaciones:
    this.newMedication.indicaciones || null
};


    this.api.createMedication(
      this.patientId,
      medicationData
    ).subscribe({

      next: (response) => {


        this.saving = false;

        this.successMessage =
          'Medicamento registrado correctamente.';

        this.showForm = false;

        this.resetForm();

        this.loadMedications();

        this.cdr.detectChanges();
      },

      error: (error) => {

  const detail = error?.error?.detail;

  if (Array.isArray(detail)) {
    this.errorMessage = detail
      .map((item: any) => {
        if (typeof item === 'string') {
          return item;
        }

        return item?.msg || 'Error de validación.';
      })
      .join(' | ');
  } else if (typeof detail === 'string') {
    this.errorMessage = detail;
  } else if (detail) {
    this.errorMessage = JSON.stringify(detail);
  } else {
    this.errorMessage =
      'No fue posible registrar el medicamento.';
  }

  this.saving = false;
  this.cdr.detectChanges();
}

    });
  }

  resetForm(): void {

this.newMedication = {
  nombre: '',
  dosis: '',
  frecuencia: '',
  hora: '',
  fecha_inicio: '',
  indicaciones: ''
};

  }

}