import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AtencionMedicaService } from './atencion-medica';
import { AuthService } from './auth';

const mockAuthService = {
  getClient: vi.fn(() => ({
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis()
  }))
};

describe('AtencionMedica', () => {
  let service: AtencionMedicaService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AtencionMedicaService,
        { provide: AuthService, useValue: mockAuthService }
      ]
    });
    service = TestBed.inject(AtencionMedicaService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});