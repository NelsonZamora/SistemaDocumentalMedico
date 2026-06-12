import { TestBed } from '@angular/core/testing';

import { AtencionMedica } from './atencion-medica';

describe('AtencionMedica', () => {
  let service: AtencionMedica;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AtencionMedica);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
