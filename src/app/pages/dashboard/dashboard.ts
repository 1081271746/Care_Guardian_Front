import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { DatePipe, UpperCasePipe } from '@angular/common';
import { Api } from '../../services/api';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
  DatePipe,
  UpperCasePipe,
  RouterLink,
  RouterLinkActive
],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard implements OnInit {

  patientData: any = null;
  loading = true;
  errorMessage = '';
  today = new Date();

  constructor(
  private api: Api,
  private cdr: ChangeDetectorRef
) {}

  ngOnInit(): void {
    this.loadDashboard();
  }

  loadDashboard(): void {

    this.loading = true;
    this.errorMessage = '';

    this.api.getPatientDashboard(1).subscribe({

      next: (data) => {

      console.log('========== DASHBOARD ==========');
      console.log('DATOS COMPLETOS:', data);
      console.log('CLAVES DEL OBJETO:', Object.keys(data));
      console.log('PACIENTE:', data?.patient);
      console.log('SINTOMAS:', data?.symptoms);
      console.log('MEDICAMENTOS:', data?.medications);
      console.log('ALERTAS:', data?.alerts);
      console.log('================================');

        this.patientData = data;

        this.loading = false;

        this.cdr.detectChanges();
      },

      error: (error) => {

        console.error('Error cargando dashboard:', error);

        this.errorMessage =
          error?.error?.detail ||
          'No fue posible cargar la información del paciente.';

        this.loading = false;
      }

    });
  }
}