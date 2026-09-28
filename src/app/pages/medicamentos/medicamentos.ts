import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
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

  patientId = 1;

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
    indicaciones: ''
  };

  constructor(
    private api: Api,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadMedications();
  }

  loadMedications(): void {

    this.loading = true;
    this.errorMessage = '';

    this.api.getPatientMedications(this.patientId).subscribe({

      next: (data) => {

        console.log('========== MEDICAMENTOS ==========');
        console.log('PACIENTE:', this.patientId);
        console.log('MEDICAMENTOS:', data);

        this.medications = data;

        this.loading = false;

        this.cdr.detectChanges();

        console.log('TOTAL:', this.medications.length);
        console.log('==================================');
      },

      error: (error) => {

        console.error(
          'Error cargando medicamentos:',
          error
        );

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
      !this.newMedication.hora
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

      indicaciones:
        this.newMedication.indicaciones || null

    };

    console.log(
      'Enviando medicamento:',
      medicationData
    );

    this.api.createMedication(
      this.patientId,
      medicationData
    ).subscribe({

      next: (response) => {

        console.log(
          'Medicamento registrado:',
          response
        );

        this.saving = false;

        this.successMessage =
          'Medicamento registrado correctamente.';

        this.showForm = false;

        this.resetForm();

        this.loadMedications();

        this.cdr.detectChanges();
      },

      error: (error) => {

        console.error(
          'Error registrando medicamento:',
          error
        );

        this.errorMessage =
          error?.error?.detail ||
          'No fue posible registrar el medicamento.';

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

      indicaciones: ''

    };
  }

}