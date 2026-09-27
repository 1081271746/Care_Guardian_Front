import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { DatePipe, UpperCasePipe } from '@angular/common';
import { Api } from '../../services/api';
import {
  ActivatedRoute,
  RouterLink,
  RouterLinkActive
} from '@angular/router';

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
    private cdr: ChangeDetectorRef,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.loadDashboard();
  }

  loadDashboard(): void {

    this.loading = true;
    this.errorMessage = '';

    const patientIdParam =
      this.route.snapshot.paramMap.get('patientId');

    const patientId = patientIdParam
      ? Number(patientIdParam)
      : 1;

    console.log('ID DEL PACIENTE:', patientId);

    this.api.getPatientDashboard(patientId).subscribe({

      next: (data) => {

        console.log('========== DASHBOARD ==========');
        console.log('DATOS COMPLETOS:', data);
        console.log('CLAVES DEL OBJETO:', Object.keys(data));
        console.log('PACIENTE:', data?.patient);
        console.log('SINTOMAS:', data?.symptoms);
        console.log('MEDICAMENTOS:', data?.medications);
        console.log('ALERTAS:', data?.active_alerts);
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

        this.cdr.detectChanges();
      }

    });
  }
}