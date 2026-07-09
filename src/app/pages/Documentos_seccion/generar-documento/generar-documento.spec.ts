import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GenerarDocumentoComponent } from './generar-documento';

describe('GenerarDocumento', () => {
  let component: GenerarDocumentoComponent;
  let fixture: ComponentFixture<GenerarDocumentoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GenerarDocumentoComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(GenerarDocumentoComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
