import { Component, OnInit } from '@angular/core';
import { Api } from '../../services/api';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [],
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
        console.log('📊 Dashboard recibido:', data);

        this.patientData = data;
        this.loading = false;
      },

      error: (error) => {
        console.error('❌ Error cargando dashboard:', error);

        this.errorMessage = 'No fue posible cargar la información del paciente.';
        this.loading = false;
      }
    });
  }
}