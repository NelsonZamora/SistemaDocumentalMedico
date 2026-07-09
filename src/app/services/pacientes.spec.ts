import { TestBed } from '@angular/core/testing';
import { PacientesService } from './pacientes';
import { AuthService } from './auth';
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock encadenable de Supabase
const mockSupabase = {
  from: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis()
};

const mockAuthService = {
  getClient: vi.fn().mockReturnValue(mockSupabase)
};

describe('PacientesService - HU-2: Consultas Históricas', () => {
  let service: PacientesService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        PacientesService,
        { provide: AuthService, useValue: mockAuthService }
      ]
    });
    service = TestBed.inject(PacientesService);
    vi.clearAllMocks();
  });

  it('debería crearse correctamente el servicio', () => {
    expect(service).toBeTruthy();
  });

  // Prueba Unitaria 1: Obtener historial
  it('debería obtener el historial de visitas de un paciente (getPacienteHistorial)', async () => {
    const pacienteId = 'pac-123';
    const mockHistorial = [{ id: 'cita-1', fecha: '2026-07-20' }];
    
    // Simulamos la respuesta exitosa
    mockSupabase.eq.mockResolvedValueOnce({ data: mockHistorial, error: null });

    const resultado = await service.getPacienteHistorial(pacienteId);

    // Verificamos que se consultó la tabla correcta con las relaciones necesarias
    expect(mockSupabase.from).toHaveBeenCalledWith('citas_medicas');
    expect(mockSupabase.select).toHaveBeenCalledWith('*,perfiles(nombre_completo)');
    expect(mockSupabase.eq).toHaveBeenCalledWith('paciente_id', pacienteId);
    expect(resultado).toEqual(mockHistorial);
  });

  // Prueba Unitaria 2: Obtener documentos
  it('debería obtener los documentos clínicos de un paciente ordenados por fecha (getDocumentosPaciente)', async () => {
    const pacienteId = 'pac-123';
    const mockDocumentos = [{ id: 'doc-1', estado: 'finalizado' }];
    
    mockSupabase.order.mockResolvedValueOnce({ data: mockDocumentos, error: null });

    const resultado = await service.getDocumentosPaciente(pacienteId);

    // Verificamos la construcción de la query
    expect(mockSupabase.from).toHaveBeenCalledWith('documentos');
    expect(mockSupabase.select).toHaveBeenCalled();
    expect(mockSupabase.eq).toHaveBeenCalledWith('paciente_id', pacienteId);
    expect(mockSupabase.order).toHaveBeenCalledWith('creado_at', { ascending: false });
    expect(resultado).toEqual(mockDocumentos);
  });

  // Prueba Unitaria 3: Manejo de errores
  it('debería propagar el error si falla la consulta del historial', async () => {
    const pacienteId = 'pac-error';
    const mockError = new Error('Error de conexión con Supabase');
    
    // Simulamos un fallo en la base de dato
    mockSupabase.eq.mockResolvedValueOnce({ data: null, error: mockError });

    // Verificamos que el servicio atrape y propague la excepción correctamente
    await expect(service.getPacienteHistorial(pacienteId)).rejects.toThrow('Error de conexión con Supabase');
  });
});