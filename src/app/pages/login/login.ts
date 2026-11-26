import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { switchMap } from 'rxjs';

import { Auth } from '../../services/auth';
import { apiError } from '../../services/errors';
import { PatientContext } from '../../services/patient-context';
import { Icon } from '../../shared/icon';

const PASSWORD_RULE = /^(?=.*[A-Za-zÁÉÍÓÚáéíóúÑñ])(?=.*\d).{8,128}$/;

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private auth = inject(Auth);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private context = inject(PatientContext);
  private fb = inject(FormBuilder);

  readonly mode = signal<'login' | 'register'>('login');
  readonly loading = signal(false);
  readonly error = signal('');
  readonly showPassword = signal(false);
  readonly capsLock = signal(false);
  readonly info = signal(this.initialInfo());

  readonly form = this.fb.nonNullable.group({
    nombre: [''],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  private initialInfo(): string {
    const reason = this.route.snapshot.queryParamMap.get('sesion');
    if (reason === 'expirada') return 'Tu sesión expiró. Inicia sesión nuevamente para continuar.';
    if (reason === 'cerrada') return 'Cerraste sesión correctamente.';
    return '';
  }

  /** Warns about Caps Lock, a frequent cause of failed logins for older users. */
  checkCaps(event: KeyboardEvent): void {
    this.capsLock.set(event.getModifierState?.('CapsLock') ?? false);
  }

  switchMode(mode: 'login' | 'register'): void {
    this.mode.set(mode);
    this.error.set('');
    const nombre = this.form.controls.nombre;
    const password = this.form.controls.password;
    nombre.setValidators(mode === 'register' ? [Validators.required, Validators.minLength(2)] : []);
    password.setValidators(mode === 'register'
      ? [Validators.required, Validators.pattern(PASSWORD_RULE)] : [Validators.required]);
    nombre.updateValueAndValidity();
    password.updateValueAndValidity();
  }

  invalid(control: 'nombre' | 'email' | 'password'): boolean {
    const field = this.form.controls[control];
    return field.invalid && (field.touched || field.dirty);
  }

  submit(): void {
    if (this.loading()) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { nombre, email, password } = this.form.getRawValue();
    this.loading.set(true);
    this.error.set('');
    this.info.set('');
    const login$ = this.mode() === 'register'
      ? this.auth.register(nombre, email, password).pipe(switchMap(() => this.auth.login(email, password)))
      : this.auth.login(email, password);

    login$.subscribe({
      next: () => {
        this.context.reset();
        const target = this.route.snapshot.queryParamMap.get('volver');
        // Only internal paths: never redirect to another origin.
        const safe = target && target.startsWith('/') && !target.startsWith('//') ? target : '/dashboard';
        this.router.navigateByUrl(safe);
      },
      error: error => {
        this.loading.set(false);
        this.error.set(apiError(error, 'No fue posible iniciar sesión.'));
      },
    });
  }
}
