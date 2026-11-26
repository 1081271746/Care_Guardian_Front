import { Routes } from '@angular/router';

import { Shell } from './layout/shell';
import { Login } from './pages/login/login';
import { PublicPage } from './pages/public/public';
import { authGuard, guestGuard } from './services/auth.guard';

export const routes: Routes = [
  { path: 'acerca', component: PublicPage, data: { mode: 'SSR' }, title: 'Acerca · CareGuardian' },
  { path: 'privacidad', component: PublicPage, data: { mode: 'SSG' }, title: 'Privacidad e IA · CareGuardian' },
  { path: 'recursos', component: PublicPage, data: { mode: 'ISR equivalente' }, title: 'Recursos · CareGuardian' },
  { path: 'login', component: Login, canActivate: [guestGuard], title: 'Iniciar sesión · CareGuardian' },
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  {
    // Every private module shares the navigation shell and the auth guard.
    path: '',
    component: Shell,
    canActivate: [authGuard],
    canActivateChild: [authGuard],
    children: [
      { path: 'dashboard', title: 'Panel · CareGuardian',
        loadComponent: () => import('./pages/dashboard/dashboard').then(m => m.Dashboard) },
      { path: 'dashboard/:patientId', title: 'Paciente · CareGuardian',
        loadComponent: () => import('./pages/paciente/paciente').then(m => m.Paciente) },
      { path: 'pacientes', title: 'Pacientes · CareGuardian',
        loadComponent: () => import('./pages/pacientes/pacientes').then(m => m.Pacientes) },
      { path: 'medicamentos', title: 'Medicamentos · CareGuardian',
        loadComponent: () => import('./pages/medicamentos/medicamentos').then(m => m.Medicamentos) },
      { path: 'citas', title: 'Citas · CareGuardian',
        loadComponent: () => import('./pages/citas/citas').then(m => m.Citas) },
      { path: 'sintomas', title: 'Síntomas · CareGuardian',
        loadComponent: () => import('./pages/sintomas/sintomas').then(m => m.Sintomas) },
      { path: 'notas', title: 'Notas · CareGuardian',
        loadComponent: () => import('./pages/notas/notas').then(m => m.Notas) },
      { path: 'alertas', title: 'Alertas · CareGuardian',
        loadComponent: () => import('./pages/alertas/alertas').then(m => m.Alertas) },
      { path: 'cuenta', title: 'Mi cuenta · CareGuardian',
        loadComponent: () => import('./pages/cuenta/cuenta').then(m => m.Cuenta) },
      { path: 'evolucion', title: 'Evolución · CareGuardian',
        loadComponent: () => import('./pages/evolucion/evolucion').then(m => m.Evolucion) },
    ],
  },
  { path: '**', title: 'Página no encontrada · CareGuardian',
    loadComponent: () => import('./pages/not-found/not-found').then(m => m.NotFound) },
];
