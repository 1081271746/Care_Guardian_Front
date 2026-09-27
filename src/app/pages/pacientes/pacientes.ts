import { Component, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Api } from '../../services/api';

@Component({
  selector: 'app-pacientes',
  standalone: true,
  imports: [
    DatePipe
  ],
  templateUrl: './pacientes.html',
  styleUrl: './pacientes.css'
})
export class Pacientes implements OnInit {

  patients: any[] = [];
  loading = true;
  errorMessage = '';

  constructor(private api: Api) {}

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

  console.log('================================');

},

      error: (error) => {

        console.error('Error cargando pacientes:', error);

        this.errorMessage =
          error?.error?.detail ||
          'No fue posible cargar los pacientes.';

        this.loading = false;

      }

    });

  }

}