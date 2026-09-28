import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { Api } from '../../services/api';

@Component({
  selector: 'app-citas',
  standalone: true,
  imports: [
    FormsModule,
    DatePipe
  ],
  templateUrl: './citas.html',
  styleUrl: './citas.css'
})
export class Citas implements OnInit {

  patientId = 1;

  appointments: any[] = [];

  loading = true;
  saving = false;

  errorMessage = '';
  successMessage = '';

  showForm = false;

  newAppointment = {
    titulo: '',
    especialidad: '',
    profesional: '',
    fecha: '',
    hora: '',
    lugar: '',
    estado: 'pendiente',
    notas: ''
  };

  constructor(
    private api: Api,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadAppointments();
  }

  loadAppointments(): void {
    this.loading = true;
    this.errorMessage = '';

    this.api.getPatientAppointments(this.patientId).subscribe({
      next: (data) => {
        this.appointments = data;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error cargando citas:', error);

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
        } else {
          this.errorMessage =
            'No fue posible cargar las citas.';
        }

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

  createAppointment(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (
      !this.newAppointment.titulo ||
      !this.newAppointment.especialidad ||
      !this.newAppointment.profesional ||
      !this.newAppointment.fecha ||
      !this.newAppointment.hora
    ) {
      this.errorMessage =
        'Completa los campos obligatorios antes de continuar.';
      this.cdr.detectChanges();
      return;
    }

    this.saving = true;

    const appointmentData = {
      titulo: this.newAppointment.titulo,
      especialidad: this.newAppointment.especialidad,
      profesional: this.newAppointment.profesional,
      fecha: this.newAppointment.fecha,
      hora: this.newAppointment.hora,
      lugar: this.newAppointment.lugar || null,
      estado: this.newAppointment.estado,
      notas: this.newAppointment.notas || null
    };

    this.api.createAppointment(
      this.patientId,
      appointmentData
    ).subscribe({
      next: (response) => {
        this.saving = false;
        this.successMessage =
          'Cita registrada correctamente.';
        this.showForm = false;
        this.resetForm();
        this.loadAppointments();
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error registrando cita:', error);

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
        } else {
          this.errorMessage =
            'No fue posible registrar la cita.';
        }

        this.saving = false;
        this.cdr.detectChanges();
      }
    });
  }

  resetForm(): void {
    this.newAppointment = {
      titulo: '',
      especialidad: '',
      profesional: '',
      fecha: '',
      hora: '',
      lugar: '',
      estado: 'pendiente',
      notas: ''
    };
  }

  getStatusClass(estado: string): string {
    switch (estado?.toLowerCase()) {
      case 'confirmada':
        return 'status-confirmed';

      case 'cancelada':
        return 'status-cancelled';

      case 'completada':
        return 'status-completed';

      default:
        return 'status-pending';
    }
  }

  getStatusLabel(estado: string): string {
    switch (estado?.toLowerCase()) {
      case 'confirmada':
        return 'Confirmada';

      case 'cancelada':
        return 'Cancelada';

      case 'completada':
        return 'Completada';

      default:
        return 'Pendiente';
    }
  }

  formatTime(hora: string): string {
    if (!hora) {
      return '';
    }

    return hora.substring(0, 5);
  }
}