import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PacientesComponent } from './pacientes';
import { PacientesService } from '../../../services/pacientes';
import { AuthService } from '../../../services/auth';
import { AtencionMedicaService } from '../../../services/atencion-medica';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import Swal from 'sweetalert2';

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
    const mockPacientes = [
      { id: '1', nombres: 'Juan', apellidos: 'Pérez', cedula: '0912345678' },
      { id: '2', nombres: 'María', apellidos: 'Gómez', cedula: '0987654321' }
    ];
    component.pacientesOriginales = mockPacientes;
    component.pacientes.set([...mockPacientes]);

    component.textoBusqueda = 'Gómez';
    component.filtrar();

    expect(component.pacientes().length).toBe(1);
    expect(component.pacientes()[0].nombres).toBe('María');
  });

  // Prueba Unitaria 2: Carga del historial
  it('debería cambiar la vista y cargar el historial clínico al ejecutar mostrarHistorialVisitas()', async () => {
    component.pacienteSeleccionado = { id: 'pac-1' };
    const mockHistorial = [
      { id: 'cita-1', fecha: '2026-07-20', motivo: 'Dolor de cabeza' }
    ];
    mockPacientesService.getPacienteHistorial.mockResolvedValueOnce(mockHistorial);

    await component.mostrarHistorialVisitas();

    expect(component.vistaActual).toBe('historial');
    expect(mockPacientesService.getPacienteHistorial).toHaveBeenCalledWith('pac-1');
    expect(component.historialPaciente()).toEqual(mockHistorial);
  });

  // Prueba Unitaria 3: Manejo del estado vacío
  it('debería manejar correctamente un historial clínico vacío', async () => {
    component.pacienteSeleccionado = { id: 'pac-2' };
    mockPacientesService.getPacienteHistorial.mockResolvedValueOnce([]);

    await component.mostrarHistorialVisitas();

    expect(component.historialPaciente().length).toBe(0);
    expect(component.vistaActual).toBe('historial');
  });
});

describe('PacientesComponent - HU-3: Resumen de última visita', () => {
  let component: PacientesComponent;
  let fixture: ComponentFixture<PacientesComponent>;

  beforeEach(async () => {
    vi.clearAllMocks();

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

    Storage.prototype.getItem = vi.fn(() => 'medico');
    vi.spyOn(Swal, 'fire').mockResolvedValue(true as any);
  });

  // Prueba Unitaria 1: Extracción del último registro clínico
  it('debería extraer y asignar correctamente el último registro clínico al ejecutar verDetallesCitaHistorial()', async () => {
    const citaMock = { id: 'cita-99' };

    const dataSignosMock = {
      encontrado: true,
      diagnostico_principal: 'Hipertensión leve',
      observaciones: 'Control en 15 días',
      signos_vitales: {
        presion_arterial: '120/80',
        frecuencia_cardiaca: 78
      }
    };

    mockAtencionMedicaService.getAtencionCompletabyCitaId.mockResolvedValueOnce(dataSignosMock);

    await component.verDetallesCitaHistorial(citaMock);

    expect(mockAtencionMedicaService.getAtencionCompletabyCitaId).toHaveBeenCalledWith('cita-99');
    expect(component.citaHistorialSeleccionada()).toEqual(citaMock);
    expect(component.signosHistorial()).toEqual(dataSignosMock.signos_vitales);
    expect(component.atencionmedicaHistorial()).toEqual(dataSignosMock);
  });

  // Prueba Unitaria 2: Paciente sin historial previo
  it('debería mostrar la alerta correspondiente cuando el servicio devuelve encontrado === false', async () => {
    const citaMock = { id: 'cita-100' };

    const dataSignosMock = {
      encontrado: false,
      mensaje: 'Paciente sin historial de visitas previas'
    };

    mockAtencionMedicaService.getAtencionCompletabyCitaId.mockResolvedValueOnce(dataSignosMock);

    await component.verDetallesCitaHistorial(citaMock);

    expect(Swal.fire).toHaveBeenCalledWith(expect.objectContaining({
      icon: 'info',
      title: 'Sin registro clínico',
      text: dataSignosMock.mensaje
    }));

    // No debe abrirse el modal de detalle ni asignarse información clínica
    expect(component.mostrarModalDetalleHistorial()).toBe(false);
    expect(component.signosHistorial()).toBeNull();
  });

  // Prueba Unitaria 3: Renderizado de datos extraídos en el modal
  it('debería exponer los datos extraídos (presión arterial, frecuencia cardíaca, motivo ampliado) para el modal de detalle', async () => {
    const citaMock = { id: 'cita-101' };

    const dataSignosMock = {
      encontrado: true,
      motivo_ampliado: 'Paciente refiere dolor torácico intermitente',
      signos_vitales: {
        presion_arterial: '130/85',
        frecuencia_cardiaca: 90
      }
    };

    mockAtencionMedicaService.getAtencionCompletabyCitaId.mockResolvedValueOnce(dataSignosMock);

    await component.verDetallesCitaHistorial(citaMock);

    expect(component.mostrarModalDetalleHistorial()).toBe(true);
    expect(component.signosHistorial().presion_arterial).toBe('130/85');
    expect(component.signosHistorial().frecuencia_cardiaca).toBe(90);
    expect(component.atencionmedicaHistorial().motivo_ampliado).toBe(
      'Paciente refiere dolor torácico intermitente'
    );

    // Validamos también el correcto cierre del modal
    component.cerrarModalDetalleHistorial();
    expect(component.mostrarModalDetalleHistorial()).toBe(false);
    expect(component.signosHistorial()).toBeNull();
    expect(component.atencionmedicaHistorial()).toBeNull();
  });
});