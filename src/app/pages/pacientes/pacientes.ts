import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Api } from '../../services/api';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-pacientes',
  standalone: true,
  imports: [
    DatePipe,
    RouterLink,
    FormsModule
  ],
  templateUrl: './pacientes.html',
  styleUrl: './pacientes.css'
})
export class Pacientes implements OnInit {

  patients: any[] = [];
  loading = true;
  errorMessage = '';

  // Control del formulario
  showForm = false;
  creatingPatient = false;
  formError = '';

  // Datos del nuevo paciente
  newPatient = {
    nombres: '',
    apellidos: '',
    fecha_nacimiento: '',
    documento: '',
    telefono: '',
    direccion: '',
    contacto_emergencia: '',
    telefono_emergencia: ''
  };

  constructor(
    private api: Api,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadPatients();
  }

  loadPatients(): void {

    this.loading = true;
    this.errorMessage = '';

    this.api.getPatients().subscribe({

      next: (data) => {

        console.log('========== PACIENTES ==========');
        console.log('PACIENTES:', data);
        console.log('TOTAL:', data.length);

        this.patients = data;

        console.log('ANTES DE CAMBIAR LOADING:', this.loading);

        this.loading = false;

        console.log('DESPUÉS DE CAMBIAR LOADING:', this.loading);
        console.log('PACIENTES GUARDADOS:', this.patients);

        this.cdr.detectChanges();

        console.log('================================');

      },

      error: (error) => {

        console.error('Error cargando pacientes:', error);

        this.errorMessage =
          error?.error?.detail ||
          'No fue posible cargar los pacientes.';

        this.loading = false;

        this.cdr.detectChanges();

      }

    });

  }

  openPatientForm(): void {

    this.showForm = true;
    this.formError = '';

    this.cdr.detectChanges();

  }

  closePatientForm(): void {

    this.showForm = false;
    this.formError = '';

    this.resetForm();

    this.cdr.detectChanges();

  }

  createPatient(): void {

    this.formError = '';

    if (
      !this.newPatient.nombres ||
      !this.newPatient.apellidos ||
      !this.newPatient.fecha_nacimiento ||
      !this.newPatient.documento
    ) {

      this.formError =
        'Completa los campos obligatorios antes de continuar.';

      this.cdr.detectChanges();

      return;
    }

    this.creatingPatient = true;

    this.api.createPatient(this.newPatient).subscribe({

      next: (patient) => {

        console.log('Paciente creado:', patient);

        this.creatingPatient = false;
        this.showForm = false;

        this.resetForm();

        this.loadPatients();

        this.cdr.detectChanges();

      },

      error: (error) => {

        console.error('Error creando paciente:', error);

        this.formError =
          error?.error?.detail ||
          'No fue posible registrar el paciente.';

        this.creatingPatient = false;

        this.cdr.detectChanges();

      }

    });

  }

  resetForm(): void {

    this.newPatient = {
      nombres: '',
      apellidos: '',
      fecha_nacimiento: '',
      documento: '',
      telefono: '',
      direccion: '',
      contacto_emergencia: '',
      telefono_emergencia: ''
    };

  }

}