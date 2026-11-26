import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { Api } from '../../services/api';
import { Auth } from '../../services/auth';
import { apiError } from '../../services/errors';
import { formatDate } from '../../services/format';
import { Notifier } from '../../services/notifier';
import { PatientContext } from '../../services/patient-context';
import { Icon } from '../../shared/icon';

const PASSWORD_RULE = /^(?=.*[A-Za-zÁÉÍÓÚáéíóúÑñ])(?=.*\d).{8,128}$/;

@Component({
  selector: 'app-cuenta',
  imports: [ReactiveFormsModule, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './cuenta.html',
  styleUrl: './cuenta.css',
})
export class Cuenta {
  private api = inject(Api);
  private auth = inject(Auth);
  private fb = inject(FormBuilder);
  private notifier = inject(Notifier);
  private router = inject(Router);
  private context = inject(PatientContext);

  protected user = this.auth.user;
  protected formatDate = formatDate;
  readonly profileError = signal('');
  readonly passwordError = signal('');
  readonly savingProfile = signal(false);
  readonly savingPassword = signal(false);

  readonly profile = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    email: ['', [Validators.required, Validators.email]],
  });

  readonly password = this.fb.nonNullable.group({
    actual: ['', [Validators.required]],
    nueva: ['', [Validators.required, Validators.pattern(PASSWORD_RULE)]],
    confirmacion: ['', [Validators.required]],
  });

  constructor() {
    this.auth.loadUser(true)?.subscribe({ error: error => this.profileError.set(apiError(error)) });
    effect(() => {
      const user = this.user();
      if (user && this.profile.pristine) this.profile.reset({ nombre: user.nombre, email: user.email });
    });
  }

  saveProfile(): void {
    const user = this.user();
    if (!user) return;
    if (this.profile.invalid) {
      this.profile.markAllAsTouched();
      return;
    }
    const { nombre, email } = this.profile.getRawValue();
    this.savingProfile.set(true);
    this.profileError.set('');
    this.api.updateAccount(user.id, { nombre: nombre.trim(), email: email.trim() }).subscribe({
      next: updated => {
        this.savingProfile.set(false);
        this.auth.user.set({ ...user, ...updated });
        this.profile.markAsPristine();
        this.notifier.success('Datos de la cuenta actualizados.');
      },
      error: error => { this.savingProfile.set(false); this.profileError.set(apiError(error)); },
    });
  }

  mismatch(): boolean {
    const { nueva, confirmacion } = this.password.getRawValue();
    return !!confirmacion && nueva !== confirmacion;
  }

  changePassword(): void {
    const user = this.user();
    if (!user) return;
    if (this.password.invalid || this.mismatch()) {
      this.password.markAllAsTouched();
      return;
    }
    const { actual, nueva } = this.password.getRawValue();
    this.savingPassword.set(true);
    this.passwordError.set('');
    this.api.changePassword(user.id, actual, nueva).subscribe({
      next: () => {
        // The API revoked every token, including this one: sign in again.
        this.savingPassword.set(false);
        this.auth.logout();
        this.context.reset();
        this.notifier.success('Contraseña actualizada. Inicia sesión con la nueva contraseña.');
        this.router.navigate(['/login']);
      },
      error: error => { this.savingPassword.set(false); this.passwordError.set(apiError(error)); },
    });
  }
}
