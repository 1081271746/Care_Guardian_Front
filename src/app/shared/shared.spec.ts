import { TestBed } from '@angular/core/testing';

import { BarChart } from './bar-chart';
import { EmptyState } from './empty-state';
import { Icon } from './icon';
import { label } from './labels';

describe('shared UI', () => {
  it('renders known icons and falls back for unknown names', () => {
    const fixture = TestBed.createComponent(Icon);
    fixture.componentRef.setInput('name', 'pill');
    fixture.detectChanges();
    const known = fixture.nativeElement.querySelector('path').getAttribute('d');
    fixture.componentRef.setInput('name', 'no-existe');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('path').getAttribute('d')).not.toBe(known);
  });

  it('describes bars for screen readers and scales to the maximum', () => {
    const fixture = TestBed.createComponent(BarChart);
    fixture.componentRef.setInput('bars', [{ label: '01/11', value: 2 }, { label: '02/11', value: 4 }]);
    fixture.detectChanges();
    const fills = fixture.nativeElement.querySelectorAll('.fill');
    expect(fills[1].style.height).toBe('100%');
    expect(fills[0].style.height).toBe('50%');
    expect(fixture.nativeElement.querySelector('[role=img]').getAttribute('aria-label')).toContain('02/11 4');
  });

  it('shows empty-state title and text', () => {
    const fixture = TestBed.createComponent(EmptyState);
    fixture.componentRef.setInput('title', 'Nada aún');
    fixture.componentRef.setInput('text', 'Agrega el primero');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Nada aún');
    expect(fixture.nativeElement.textContent).toContain('Agrega el primero');
  });

  it('labels API values in Spanish', () => {
    expect(label('en_revision')).toBe('En revisión');
    expect(label('muy bajo')).toBe('Muy bajo');
    expect(label(null)).toBe('—');
  });
});
