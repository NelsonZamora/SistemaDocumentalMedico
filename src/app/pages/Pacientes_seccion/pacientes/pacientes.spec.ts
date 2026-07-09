import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PacientesComponent } from './pacientes';
import { PacientesService } from '../../../services/pacientes';
import { AuthService } from '../../../services/auth';
import { AtencionMedicaService } from '../../../services/atencion-medica';
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mocks de los servicios
const mockPacientesService = {
  getPacientes: vi.fn().mockResolvedValue([]),
  getPacienteHistorial: vi.fn().mockResolvedValue([]),
  getDocumentosPaciente: vi.fn().mockResolvedValue([])
};

const mockAuthService = {
  getUserId: vi.fn().mockResolvedValue('user-123')
};

const mockAtencionMedicaService = {
  getAtencionCompletabyCitaId: vi.fn().mockResolvedValue({})
};

describe('PacientesComponent - HU-2: Historial Clínico', () => {
  let component: PacientesComponent;
  let fixture: ComponentFixture<PacientesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PacientesComponent],
      providers: [
        { provide: PacientesService, useValue: mockPacientesService },
        { provide: AuthService, useValue: mockAuthService },
        { provide: AtencionMedicaService, useValue: mockAtencionMedicaService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(PacientesComponent);
    component = fixture.componentInstance;
    
    // Configuramos localStorage para simular un médico autenticado
    Storage.prototype.getItem = vi.fn(() => 'medico');
  });

  // Prueba Unitaria 1: Buscador de pacientes
  it('debería filtrar correctamente la lista de pacientes por nombre, apellido o cédula', () => {
    // 1. Configuramos el estado inicial con dos pacientes
    const mockPacientes = [
      { id: '1', nombres: 'Juan', apellidos: 'Pérez', cedula: '0912345678' },
      { id: '2', nombres: 'María', apellidos: 'Gómez', cedula: '0987654321' }
    ];
    component.pacientesOriginales = mockPacientes;
    component.pacientes.set([...mockPacientes]);

    // 2. Simulamos la búsqueda por apellido
    component.textoBusqueda = 'Gómez';
    component.filtrar();

    // 3. Verificamos que el signal se actualizó correctamente
    expect(component.pacientes().length).toBe(1);
    expect(component.pacientes()[0].nombres).toBe('María');
  });

  // Prueba Unitaria 2: Carga del historial
  it('debería cambiar la vista y cargar el historial clínico al ejecutar mostrarHistorialVisitas()', async () => {
    // 1. Preparamos el paciente seleccionado y el historial simulado
    component.pacienteSeleccionado = { id: 'pac-1' };
    const mockHistorial = [
      { id: 'cita-1', fecha: '2026-07-20', motivo: 'Dolor de cabeza' }
    ];
    mockPacientesService.getPacienteHistorial.mockResolvedValueOnce(mockHistorial);

    // 2. Ejecutamos la función
    await component.mostrarHistorialVisitas();

    // 3. Validamos el cambio de vista y la carga de datos
    expect(component.vistaActual).toBe('historial');
    expect(mockPacientesService.getPacienteHistorial).toHaveBeenCalledWith('pac-1');
    expect(component.historialPaciente()).toEqual(mockHistorial);
  });

  // Prueba Unitaria 3: Manejo del estado vacío
  it('debería manejar correctamente un historial clínico vacío', async () => {
    component.pacienteSeleccionado = { id: 'pac-2' };
    
    // Simulamos que el paciente no tiene consultas previas
    mockPacientesService.getPacienteHistorial.mockResolvedValueOnce([]);

    await component.mostrarHistorialVisitas();

    // Verificamos que el signal recibe un arreglo vacío
    expect(component.historialPaciente().length).toBe(0);
    expect(component.vistaActual).toBe('historial');
  });
});