import { Component, OnInit } from '@angular/core';
import { DatePipe, UpperCasePipe } from '@angular/common';
import { Api } from '../../services/api';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    DatePipe,
    UpperCasePipe
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard implements OnInit {

  patientData: any = null;
  loading = true;
  errorMessage = '';

  constructor(private api: Api) {}

  ngOnInit(): void {
    this.loadDashboard();
  }

  loadDashboard(): void {

    this.loading = true;
    this.errorMessage = '';

    this.api.getPatientDashboard(1).subscribe({
      
      next: (data) => {

        console.log('✅ Dashboard recibido:', data);

        this.patientData = data;

        console.log('✅ patientData asignado:', this.patientData);
        console.log('✅ loading antes:', this.loading);

        this.loading = false;

        console.log('✅ loading después:', this.loading);
      },

      error: (error) => {

        console.error('❌ Error cargando dashboard:', error);

        this.errorMessage =
          error?.error?.detail ||
          'No fue posible cargar la información del paciente.';

        this.loading = false;
      }

    });
  }
}