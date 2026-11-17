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
    const patientId = Number(this.route.snapshot.paramMap.get('patientId'));
    if (patientId) this.loadDashboard(patientId);
    else this.api.getPatients().subscribe({
      next: patients => {
        if (patients.length) this.loadDashboard(patients[0].id);
        else { this.loading = false; this.errorMessage = 'No tienes pacientes asignados. Registra uno en Pacientes.'; this.cdr.detectChanges(); }
      },
      error: () => { this.loading = false; this.errorMessage = 'No fue posible cargar tus pacientes.'; this.cdr.detectChanges(); }
    });
  }

  loadDashboard(patientId: number): void {

    this.loading = true;
    this.errorMessage = '';


    this.api.getPatientDashboard(patientId).subscribe({

      next: (data) => {


        this.patientData = data;

        this.loading = false;

        this.cdr.detectChanges();
      },

      error: (error) => {


        this.errorMessage =
          error?.error?.detail ||
          'No fue posible cargar la información del paciente.';

        this.loading = false;

        this.cdr.detectChanges();
      }

    });
  }
}