import { ChangeDetectionStrategy, Component, DestroyRef, HostListener, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';

import { Auth } from '../services/auth';
import { initials } from '../services/format';
import { PatientContext } from '../services/patient-context';
import { Icon } from '../shared/icon';

export const NAVIGATION = [
  { path: '/dashboard', label: 'Panel', icon: 'home' },
  { path: '/pacientes', label: 'Pacientes', icon: 'users' },
  { path: '/medicamentos', label: 'Medicamentos', icon: 'pill' },
  { path: '/citas', label: 'Citas', icon: 'calendar' },
  { path: '/sintomas', label: 'Síntomas', icon: 'pulse' },
  { path: '/notas', label: 'Notas', icon: 'note' },
  { path: '/alertas', label: 'Alertas', icon: 'bell' },
  { path: '/evolucion', label: 'Evolución', icon: 'chart' },
];

/** Layout for every private page: sidebar navigation, profile and logout. */
@Component({
  selector: 'cg-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './shell.html',
  styleUrl: './shell.css',
})
export class Shell {
  private auth = inject(Auth);
  private router = inject(Router);
  private context = inject(PatientContext);

  protected nav = NAVIGATION;
  protected user = this.auth.user;
  protected menuOpen = signal(false);
  protected initials = initials;

  constructor() {
    this.auth.loadUser()?.subscribe({ error: () => {} });
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      takeUntilDestroyed(inject(DestroyRef)),
    ).subscribe(() => this.menuOpen.set(false));
  }

  /** Escape closes the mobile menu, as expected from a drawer. */
  @HostListener('document:keydown.escape')
  protected closeMenu(): void {
    this.menuOpen.set(false);
  }

  protected logout(): void {
    this.auth.logout();
    this.context.reset();
    this.router.navigate(['/login'], { queryParams: { sesion: 'cerrada' } });
  }
}
