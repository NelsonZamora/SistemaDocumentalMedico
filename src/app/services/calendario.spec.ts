import { TestBed } from '@angular/core/testing';
import { CalendarioService } from './calendario';
import { AuthService } from './auth';
import { describe, it, expect, beforeEach, vi } from 'vitest';

// 1. Creamos un mock encadenable para simular el cliente de Supabase
const mockSupabase = {
  from: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  maybeSingle: vi.fn().mockReturnThis(),
};

// 2. Creamos un mock de AuthService que devuelva nuestro Supabase simulado
const mockAuthService = {
  getClient: vi.fn().mockReturnValue(mockSupabase)
};

describe('CalendarioService', () => {
  let service: CalendarioService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        CalendarioService,
        { provide: AuthService, useValue: mockAuthService }
      ]
    });
    service = TestBed.inject(CalendarioService);
    
    // Limpiamos el historial de los mocks antes de cada prueba
    vi.clearAllMocks();
  });

  it('debería crearse correctamente el servicio', () => {
    expect(service).toBeTruthy();
  });

  // --- Pruebas de Lectura (GET) ---

  it('debería obtener las citas médicas correctamente (getCitas)', async () => {
    // Simulamos la respuesta exitosa de Supabase
    const mockData = [{ id: '1', fecha: '2026-07-20', estado: 'programada' }];
    mockSupabase.select.mockResolvedValueOnce({ data: mockData, error: null });

    const resultado = await service.getCitas();

    // Verificamos que se llamó a la tabla correcta y al método select
    expect(mockSupabase.from).toHaveBeenCalledWith('citas_medicas');
    expect(mockSupabase.select).toHaveBeenCalled();
    // Comprobamos que el servicio retorna la data simulada
    expect(resultado).toEqual(mockData);
  });

  it('debería lanzar un error si getCitas falla', async () => {
    // Simulamos un error en la base de datos
    const mockError = new Error('Error de conexión a Supabase');
    mockSupabase.select.mockResolvedValueOnce({ data: null, error: mockError });

    // Verificamos que el servicio propague la excepción
    await expect(service.getCitas()).rejects.toThrow('Error de conexión a Supabase');
  });

  // --- Pruebas de Escritura (INSERT / UPDATE) ---

  it('debería crear una nueva cita médica (crearCita)', async () => {
    const nuevaCita = { paciente_id: 'pac-1', medico_id: 'med-1', fecha: '2026-07-20' };
    
    // En las inserciones, Supabase suele devolver un error null si es exitoso
    mockSupabase.insert.mockResolvedValueOnce({ error: null });

    // La función no retorna nada, por lo que esperamos que se resuelva (resolves) sin errores
    await expect(service.crearCita(nuevaCita)).resolves.toBeUndefined();
    
    // Verificamos la construcción correcta de la consulta
    expect(mockSupabase.from).toHaveBeenCalledWith('citas_medicas');
    expect(mockSupabase.insert).toHaveBeenCalledWith([nuevaCita]);
  });

  it('debería actualizar una cita existente (actualizarCita)', async () => {
    const idCita = 'cita-123';
    const datosActualizar = { estado: 'atendida' };
    
    mockSupabase.eq.mockResolvedValueOnce({ error: null });

    await expect(service.actualizarCita(idCita, datosActualizar)).resolves.toBeUndefined();
    
    // Validamos el encadenamiento correcto: from -> update -> eq
    expect(mockSupabase.from).toHaveBeenCalledWith('citas_medicas');
    expect(mockSupabase.update).toHaveBeenCalledWith(datosActualizar);
    expect(mockSupabase.eq).toHaveBeenCalledWith('id', idCita);
  });
});