import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Sintomas } from './sintomas';

describe('Sintomas', () => {
  let component: Sintomas;
  let fixture: ComponentFixture<Sintomas>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Sintomas],
    }).compileComponents();

    fixture = TestBed.createComponent(Sintomas);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
