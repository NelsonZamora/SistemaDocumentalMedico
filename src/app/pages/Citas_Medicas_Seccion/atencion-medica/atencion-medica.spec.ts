import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AtencionMedicaComponent } from './atencion-medica';

describe('AtencionMedica', () => {
  let component: AtencionMedicaComponent;
  let fixture: ComponentFixture<AtencionMedicaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AtencionMedicaComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AtencionMedicaComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
