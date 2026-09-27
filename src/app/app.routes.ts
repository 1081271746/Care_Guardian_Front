import { Routes } from '@angular/router';

import { Login } from './pages/login/login';
import { Dashboard } from './pages/dashboard/dashboard';

import { Pacientes } from './pages/pacientes/pacientes';
import { Sintomas } from './pages/sintomas/sintomas';
import { Medicamentos } from './pages/medicamentos/medicamentos';
import { Citas } from './pages/citas/citas';
import { Notas } from './pages/notas/notas';
import { Alertas } from './pages/alertas/alertas';
import { Evolucion } from './pages/evolucion/evolucion';

export const routes: Routes = [

  {
    path: '',
    component: Login
  },

  {
    path: 'login',
    component: Login
  },

  {
    path: 'dashboard',
    component: Dashboard
  },

    {
    path: 'dashboard/:patientId',
    component: Dashboard

  },

  {
    path: 'pacientes',
    component: Pacientes
  },

  {
    path: 'sintomas',
    component: Sintomas
  },

  {
    path: 'medicamentos',
    component: Medicamentos
  },

  {
    path: 'citas',
    component: Citas
  },

  {
    path: 'notas',
    component: Notas
  },

  {
    path: 'alertas',
    component: Alertas
  },

  {
    path: 'evolucion',
    component: Evolucion
  },

  {
    path: '**',
    redirectTo: ''
  }

];