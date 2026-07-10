import { TestBed } from '@angular/core/testing';
import { CanActivateFn, Router } from '@angular/router';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { adminGuard } from './admin-guard';
import { AuthService } from '../services/auth';

describe('adminGuard - HU-4: Restricción de acceso a la vista de auditoría', () => {
  const executeGuard: CanActivateFn = (...guardParameters) =>
    TestBed.runInInjectionContext(() => adminGuard(...guardParameters));

  let authServiceMock: any;
  let routerMock: any;

  beforeEach(() => {
    authServiceMock = {
      getUserId: vi.fn(),
      getUserProfile: vi.fn()
    };

    routerMock = {
      navigate: vi.fn()
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authServiceMock },
        { provide: Router, useValue: routerMock }
      ]
    });
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });

  // Prueba Unitaria 3: un usuario con rol 'medico' o 'auxiliar' es redirigido y no puede acceder
  it('debe redirigir al dashboard y denegar el acceso si el rol autenticado es "medico"', async () => {
    authServiceMock.getUserId.mockResolvedValue('user-1');
    authServiceMock.getUserProfile.mockResolvedValue({ rol: 'medico' });

    const resultado = await executeGuard({} as any, {} as any);

    expect(resultado).toBe(false);
    expect(routerMock.navigate).toHaveBeenCalledWith(['/dashboard']);
  });

  it('debe redirigir al dashboard y denegar el acceso si el rol autenticado es "auxiliar"', async () => {
    authServiceMock.getUserId.mockResolvedValue('user-2');
    authServiceMock.getUserProfile.mockResolvedValue({ rol: 'auxiliar' });

    const resultado = await executeGuard({} as any, {} as any);

    expect(resultado).toBe(false);
    expect(routerMock.navigate).toHaveBeenCalledWith(['/dashboard']);
  });

  it('debe permitir el acceso únicamente cuando el rol autenticado es "admin"', async () => {
    authServiceMock.getUserId.mockResolvedValue('user-3');
    authServiceMock.getUserProfile.mockResolvedValue({ rol: 'admin' });

    const resultado = await executeGuard({} as any, {} as any);

    expect(resultado).toBe(true);
    expect(routerMock.navigate).not.toHaveBeenCalled();
  });
});