import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Router } from '@angular/router';
import { DashboardComponent } from './dashboard';
import { DashboardService } from '../../../services/dashboard';
import { UsuariosService } from '../../../services/usuarios';

describe('DashboardComponent - HU-6: Panel de control personal (Médico)', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;
  let dashboardServiceMock: any;
  let usuariosServiceMock: any;

  beforeEach(async () => {
    Storage.prototype.getItem = vi.fn(() => 'medico');

    dashboardServiceMock = {
      getResumenMedico: vi.fn().mockResolvedValue({
        pacientesHoy: 4,
        documentosEmitidos: 2,
        pendientes: 1,
        proximaCita: { hora_inicio: '11:00' },
        pacientesRecientes: [{ id: '1', nombres: 'Juan' }]
      }),
      getResumenAdmin: vi.fn(),
      getResumenAuxiliar: vi.fn()
    };

    usuariosServiceMock = {
      obtenerAuditoria: vi.fn().mockResolvedValue([])
    };

    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        { provide: DashboardService, useValue: dashboardServiceMock },
        { provide: UsuariosService, useValue: usuariosServiceMock },
        { provide: Router, useValue: { navigate: vi.fn() } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
  });

  // Prueba Unitaria 1: configuración de tarjetas específica para el rol 'medico'
  it('debe cargar la configuración de tarjetas correspondiente al rol médico', () => {
    const config = component.dashboardConfig();
    const titulos = config.tarjetas.map(t => t.titulo);

    expect(titulos).toContain('Pacientes Atendidos Hoy');
    expect(titulos).toContain('Documentos Emitidos');
    expect(titulos).toContain('Pacientes Pendientes Hoy');
  });

  // Prueba Unitaria 2: las señales se inicializan correctamente con getResumenMedico()
  it('debe inicializar correctamente las señales con los datos de getResumenMedico()', async () => {
    await component.ngOnInit();

    expect(dashboardServiceMock.getResumenMedico).toHaveBeenCalled();
    expect(component.pacientesHoy()).toBe(4);
    expect(component.documentosEmitidos()).toBe(2);
    expect(component.pendientes()).toBe(1);
    expect(component.proximaCita()).toBe('11:00');
  });

  // Prueba Unitaria 3: manejo del estado vacío en "Últimos 5 pacientes atendidos"
  it('debe manejar adecuadamente el estado vacío cuando el médico no tiene actividad reciente', async () => {
    dashboardServiceMock.getResumenMedico.mockResolvedValueOnce({
      pacientesHoy: 0,
      documentosEmitidos: 0,
      pendientes: 0,
      proximaCita: {},
      pacientesRecientes: []
    });

    await component.ngOnInit();

    expect(component.pacientesRecientes().length).toBe(0);
    expect(component.proximaCita()).toBe('Sin citas');
  });
});

describe('DashboardComponent - HU-7: Panel de control global (Administrador)', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;
  let dashboardServiceMock: any;
  let usuariosServiceMock: any;

  const actividadRecienteMock = [
    { usuario_nombre: 'Juan Pérez', accion: 'LOGIN', modulo: 'AUTENTICACION', fecha_hora: '2026-07-08T08:00:00Z' }
  ];

  beforeEach(async () => {
    Storage.prototype.getItem = vi.fn(() => 'admin');

    dashboardServiceMock = {
      getResumenMedico: vi.fn(),
      getResumenAdmin: vi.fn().mockResolvedValue({
        totalPacientes: 120,
        totalDocumentos: 45,
        usuariosActivos: 10,
        citasHoy: 8
      }),
      getResumenAuxiliar: vi.fn()
    };

    usuariosServiceMock = {
      obtenerAuditoria: vi.fn().mockResolvedValue(actividadRecienteMock)
    };

    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        { provide: DashboardService, useValue: dashboardServiceMock },
        { provide: UsuariosService, useValue: usuariosServiceMock },
        { provide: Router, useValue: { navigate: vi.fn() } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
  });

  // Prueba Unitaria 1: configuración de tarjetas y accesos rápidos para el rol 'admin'
  it('debe cargar la configuración de tarjetas y accesos rápidos correspondiente al rol administrador', () => {
    const config = component.dashboardConfig();
    const titulos = config.tarjetas.map(t => t.titulo);
    const accesos = config.accesos.map(a => a.titulo);

    expect(titulos).toContain('Pacientes');
    expect(titulos).toContain('Usuarios');
    expect(accesos).toContain('Crear usuario');
    expect(accesos).toContain('Gestionar usuarios');
  });

  // Prueba Unitaria 2: las variables de estado global se actualizan al invocar getResumenAdmin()
  it('debe actualizar las variables de estado global al invocar getResumenAdmin()', async () => {
    await component.ngOnInit();

    expect(dashboardServiceMock.getResumenAdmin).toHaveBeenCalled();
    expect(component.totalPacientes()).toBe(120);
    expect(component.documentosGenerados()).toBe(45);
    expect(component.usuariosActivos()).toBe(10);
    expect(component.citasHoy()).toBe(8);
  });

  // Prueba Unitaria 3: la tabla de actividad reciente refleja los campos de la vista administrativa
  it('debe cargar la actividad reciente con los campos correspondientes (Usuario, Acción, Módulo, Fecha)', async () => {
    await component.ngOnInit();

    expect(usuariosServiceMock.obtenerAuditoria).toHaveBeenCalled();
    expect(component.actividadReciente()).toEqual(actividadRecienteMock);
    expect(component.formatearModulo('AUTENTICACION')).toBe('Autenticación');
  });
});