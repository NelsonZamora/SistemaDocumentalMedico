import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import Swal from 'sweetalert2';
import { AuthService } from './auth';

// Construimos un Promise NATIVO y le agregamos los métodos de encadenado
// (select/update/eq/single) directamente sobre él, para simular tanto flujos
// de lectura (.select().eq().single()) como de escritura (.update().eq(...)).
function makeQuery(result: any) {
  const promise: any = Promise.resolve(result);
  promise.select = vi.fn(() => promise);
  promise.update = vi.fn(() => promise);
  promise.eq = vi.fn(() => promise);
  promise.single = vi.fn(() => Promise.resolve(result));
  return promise;
}

describe('AuthService - HU-4: Registro de inicios de sesión', () => {
  let service: AuthService;
  let mockSupabase: any;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AuthService);

    mockSupabase = {
      auth: {
        signInWithPassword: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null }),
        signOut: vi.fn().mockResolvedValue({}),
        getSession: vi.fn().mockResolvedValue({ data: { session: { user: { id: 'user-1' } } } })
      },
      functions: {
        invoke: vi.fn().mockResolvedValue({ data: null, error: null })
      },
      from: vi.fn(() => makeQuery({ data: { activo: true }, error: null }))
    };

    // IMPORTANTE: en vez de mockear el módulo '@supabase/supabase-js' (frágil,
    // depende de configuración de hoisting/transform de Vitest y en este
    // proyecto terminó llamando al cliente REAL), reemplazamos directamente
    // la propiedad privada `supabase` de la instancia ya inyectada. En tiempo
    // de ejecución `private` no existe en JS, así que esto es válido y mucho
    // más confiable — es el mismo enfoque que ya usas en calendario.spec.ts
    // y pacientes.spec.ts (mockear AuthService en vez de la librería).
    (service as any).supabase = mockSupabase;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // Prueba Unitaria 1: invoca registrar-auditoria con la acción 'LOGIN' tras una autenticación exitosa
  it('debe invocar la función registrar-auditoria con la acción LOGIN tras una autenticación exitosa', async () => {
    await service.login('medico@clinica.com', 'ClaveSegura1@');

    expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'medico@clinica.com',
      password: 'ClaveSegura1@'
    });

    expect(mockSupabase.functions.invoke).toHaveBeenCalledWith(
      'registrar-auditoria',
      { body: { accion: 'LOGIN' } }
    );
  });

  it('no debe invocar registrar-auditoria si el usuario se encuentra bloqueado', async () => {
    vi.spyOn(Swal, 'fire').mockResolvedValue(true as any);

    mockSupabase.from = vi.fn(() => makeQuery({ data: { activo: false }, error: null }));

    await expect(service.login('bloqueado@clinica.com', 'ClaveSegura1@')).rejects.toThrow('Usuario bloqueado');

    expect(mockSupabase.functions.invoke).not.toHaveBeenCalledWith(
      'registrar-auditoria',
      { body: { accion: 'LOGIN' } }
    );
  });
});