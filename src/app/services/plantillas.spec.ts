import { TestBed } from '@angular/core/testing';

import { Plantillas } from './plantillas';

describe('Plantillas', () => {
  let service: Plantillas;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Plantillas);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
