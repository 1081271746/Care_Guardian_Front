import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';

import { fullName } from '../services/format';
import { PatientContext } from '../services/patient-context';

/** Patient selector bound to the shared PatientContext. */
@Component({
  selector: 'cg-patient-picker',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (context.loaded() && !context.patients().length) {
      <div class="notice notice-info">
        <span>Aún no tienes pacientes asignados. <a routerLink="/pacientes">Registra el primero</a>.</span>
      </div>
    } @else {
      <div class="field">
        <label for="patient-picker">{{ labelText() }}</label>
        <select id="patient-picker" class="select" [value]="context.selectedId() ?? ''"
                [disabled]="!context.loaded()" (change)="choose($any($event.target).value)">
          @if (!context.loaded()) { <option value="">Cargando pacientes…</option> }
          @for (patient of context.patients(); track patient.id) {
            <option [value]="patient.id" [selected]="patient.id === context.selectedId()">
              {{ name(patient) }}{{ patient.activo ? '' : ' (inactivo)' }}
            </option>
          }
        </select>
      </div>
    }`,
})
export class PatientPicker {
  protected context = inject(PatientContext);
  readonly labelText = input('Paciente');
  readonly changed = output<number>();
  protected name = fullName;

  protected choose(value: string): void {
    const id = Number(value);
    if (!id) return;
    this.context.select(id);
    this.changed.emit(id);
  }
}
