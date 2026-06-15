import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AtencionMedica } from './atencion-medica';

describe('AtencionMedica', () => {
  let component: AtencionMedica;
  let fixture: ComponentFixture<AtencionMedica>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AtencionMedica],
    }).compileComponents();

    fixture = TestBed.createComponent(AtencionMedica);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
