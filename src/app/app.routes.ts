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
import { authGuard } from './services/auth.guard';
import { PublicPage } from './pages/public/public';

export const routes: Routes = [

  { path: 'acerca', component: PublicPage, data: { mode: 'SSR' } },
  { path: 'privacidad', component: PublicPage, data: { mode: 'SSG' } },
  { path: 'recursos', component: PublicPage, data: { mode: 'ISR equivalente' } },
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
    canActivate: [authGuard],
    component: Dashboard
  },

    {
    path: 'dashboard/:patientId',
    canActivate: [authGuard],
    component: Dashboard

  },

  {
    path: 'pacientes',
    canActivate: [authGuard],
    component: Pacientes
  },

  {
    path: 'sintomas',
    canActivate: [authGuard],
    component: Sintomas
  },

  {
    path: 'medicamentos',
    canActivate: [authGuard],
    component: Medicamentos
  },

  {
    path: 'citas',
    canActivate: [authGuard],
    component: Citas
  },

  {
    path: 'notas',
    canActivate: [authGuard],
    component: Notas
  },

  {
    path: 'alertas',
    canActivate: [authGuard],
    component: Alertas
  },

  {
    path: 'evolucion',
    canActivate: [authGuard],
    component: Evolucion
  },

  {
    path: '**',
    redirectTo: ''
  }

];