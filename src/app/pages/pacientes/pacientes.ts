import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Api } from '../../services/api';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-pacientes',
  standalone: true,
  imports: [
    DatePipe,
    RouterLink
  ],
  templateUrl: './pacientes.html',
  styleUrl: './pacientes.css'
})
export class Pacientes implements OnInit {

  patients: any[] = [];
  loading = true;
  errorMessage = '';

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

      }

    });

  }

}