import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UsuariosService } from './usuarios';
import { AuthService } from './auth';

const mockAuthService = {
  getClient: vi.fn(() => ({
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockReturnThis(),
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) },
    functions: { invoke: vi.fn().mockResolvedValue({ data: null, error: null }) }
  }))
};

describe('Usuarios', () => {
  let service: UsuariosService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        UsuariosService,
        { provide: AuthService, useValue: mockAuthService }
      ]
    });
    service = TestBed.inject(UsuariosService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});