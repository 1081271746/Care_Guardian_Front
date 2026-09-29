import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Api } from '../../services/api';

@Component({
  selector: 'app-alertas',
  standalone: true,
  imports: [
    DatePipe
  ],
  templateUrl: './alertas.html',
  styleUrl: './alertas.css'
})
export class Alertas implements OnInit {

  // ==========================================
  // CONFIGURACIÓN DEL PACIENTE
  // ==========================================

  patientId = 1;

  // ==========================================
  // DATOS
  // ==========================================

  alerts: any[] = [];

  loading = true;
  updating = false;

  errorMessage = '';
  successMessage = '';

  // ==========================================
  // CONSTRUCTOR
  // ==========================================

  constructor(
    private api: Api,
    private cdr: ChangeDetectorRef
  ) {}

  // ==========================================
  // INICIALIZACIÓN
  // ==========================================

  ngOnInit(): void {
    this.loadAlerts();
  }

  // ==========================================
  // CARGAR ALERTAS
  // ==========================================

  loadAlerts(): void {
    this.loading = true;
    this.errorMessage = '';

    this.api.getPatientAlerts(this.patientId).subscribe({
      next: (data) => {

        this.alerts = data;

        this.loading = false;

        this.cdr.detectChanges();
      },

      error: (error) => {

        console.error('Error cargando alertas:', error);

        this.errorMessage =
          error?.error?.detail ||
          'No fue posible cargar las alertas del paciente.';

        this.loading = false;

        this.cdr.detectChanges();
      }
    });
  }

  // ==========================================
  // MARCAR ALERTA COMO ATENDIDA
  // ==========================================

  markAsAttended(alert: any): void {

    if (this.updating) {
      return;
    }

    this.updating = true;
    this.errorMessage = '';
    this.successMessage = '';

    const alertData = {
      estado: 'atendida',
      activa: false
    };

    this.api.updateAlert(
      alert.id,
      alertData
    ).subscribe({

      next: (updatedAlert) => {

        console.log(
          'Alerta actualizada:',
          updatedAlert
        );

        this.updating = false;

        this.successMessage =
          'Alerta marcada como atendida correctamente.';

        this.loadAlerts();

        this.cdr.detectChanges();
      },

      error: (error) => {

        console.error(
          'Error actualizando alerta:',
          error
        );

        this.errorMessage =
          error?.error?.detail ||
          'No fue posible actualizar la alerta.';

        this.updating = false;

        this.cdr.detectChanges();
      }
    });
  }

  // ==========================================
  // CLASE SEGÚN NIVEL DE ALERTA
  // ==========================================

  getAlertClass(nivel: string): string {

    switch (nivel?.toLowerCase()) {

      case 'alto':
        return 'alert-high';

      case 'medio':
        return 'alert-medium';

      case 'bajo':
        return 'alert-low';

      default:
        return 'alert-medium';
    }
  }

  // ==========================================
  // ETIQUETA DEL NIVEL
  // ==========================================

  getLevelLabel(nivel: string): string {

    switch (nivel?.toLowerCase()) {

      case 'alto':
        return 'Alto';

      case 'medio':
        return 'Medio';

      case 'bajo':
        return 'Bajo';

      default:
        return 'Sin clasificar';
    }
  }

  // ==========================================
  // ETIQUETA DEL ESTADO
  // ==========================================

  getStatusLabel(estado: string): string {

    switch (estado?.toLowerCase()) {

      case 'pendiente':
        return 'Pendiente';

      case 'atendida':
        return 'Atendida';

      case 'resuelta':
        return 'Resuelta';

      case 'descartada':
        return 'Descartada';

      default:
        return estado || 'Pendiente';
    }
  }

  // ==========================================
  // TEXTO DEL ORIGEN
  // ==========================================

  getOriginLabel(origen: string): string {

    switch (origen?.toLowerCase()) {

      case 'sistema':
        return 'Sistema';

      case 'analisis_nota':
        return 'Análisis de nota';

      case 'analisis_sintomas':
        return 'Análisis de síntomas';

      case 'manual':
        return 'Registro manual';

      default:
        return origen || 'Sistema';
    }
  }

  // ==========================================
  // CONTADORES
  // ==========================================

  getHighAlerts(): number {
    return this.alerts.filter(
      alert => alert.nivel?.toLowerCase() === 'alto'
    ).length;
  }

  getMediumAlerts(): number {
    return this.alerts.filter(
      alert => alert.nivel?.toLowerCase() === 'medio'
    ).length;
  }

  getLowAlerts(): number {
    return this.alerts.filter(
      alert => alert.nivel?.toLowerCase() === 'bajo'
    ).length;
  }
}