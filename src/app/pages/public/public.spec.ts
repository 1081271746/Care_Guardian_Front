import { TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';

import { PublicPage } from './public';

function render(mode: string) {
  TestBed.overrideProvider(ActivatedRoute, { useValue: { snapshot: { data: { mode } } } });
  const fixture = TestBed.createComponent(PublicPage);
  fixture.detectChanges();
  return fixture.nativeElement.textContent as string;
}

describe('PublicPage', () => {
  it('explains exactly what is and is not sent to Groq', () => {
    const text = render('SSG');
    expect(text).toContain('Privacidad y uso responsable de la IA');
    expect(text).toContain('No se envían nombres');
    expect(text).toContain('No diagnostica');
    expect(text).toContain('nunca muestra un resultado simulado');
  });

  it('renders the about page with a sign-in link', () => {
    expect(render('SSR')).toContain('Acompañamiento para cuidadores');
  });
});
