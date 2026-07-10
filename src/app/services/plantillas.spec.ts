import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PlantillasService } from './plantillas';
import { AuthService } from './auth';

// IMPORTANTE: sin este mock, TestBed construye un AuthService REAL, cuyo
// constructor llama a createClient(...) de @supabase/supabase-js con las
// credenciales de environment.ts. Eso puede dejar handles de red/realtime
// abiertos y hacer que el test (o el proceso de vitest) nunca termine.
const authServiceMock = {
  getClient: vi.fn(() => ({})),
  getUserId: vi.fn().mockResolvedValue('user-123')
};

describe('Plantillas', () => {
  let service: PlantillasService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authServiceMock }
      ]
    });
    service = TestBed.inject(PlantillasService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});