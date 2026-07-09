import { TestBed } from '@angular/core/testing';

import { AtencionMedicaService } from './atencion-medica';

describe('AtencionMedica', () => {
  let service: AtencionMedicaService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AtencionMedicaService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
