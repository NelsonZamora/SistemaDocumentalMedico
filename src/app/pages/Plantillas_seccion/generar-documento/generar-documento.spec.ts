import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GenerarDocumento } from './generar-documento';

describe('GenerarDocumento', () => {
  let component: GenerarDocumento;
  let fixture: ComponentFixture<GenerarDocumento>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GenerarDocumento],
    }).compileComponents();

    fixture = TestBed.createComponent(GenerarDocumento);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
