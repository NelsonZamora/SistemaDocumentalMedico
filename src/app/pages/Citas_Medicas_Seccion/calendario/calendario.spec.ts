import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { describe, it, expect, beforeEach, beforeAll, vi, afterEach } from 'vitest';
import { CalendarioComponent } from './calendario';
import { CalendarioService } from '../../../services/calendario';
import Swal from 'sweetalert2';

import { FullCalendarModule } from '@fullcalendar/angular';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'full-calendar',
  standalone: true,
  template: '<div class="mock-calendar">Calendario Simulado</div>'
})
class MockFullCalendarComponent {
  @Input() options: any;
}

describe('CalendarioComponent', () => {
  let component: CalendarioComponent;
  let fixture: ComponentFixture<CalendarioComponent>;
  let calendarioServiceMock: any;

  beforeAll(() => {
    global.ResizeObserver = class {
      observe() { }
      unobserve() { }
      disconnect() { }
    } as any;
  });

  beforeEach(async () => {
    calendarioServiceMock = {
      getPacientes: vi.fn().mockResolvedValue([{ id: '1', nombres: 'Juan', apellidos: 'Perez', cedula: '123' }]),
      getMedicos: vi.fn().mockResolvedValue([{ id: '2', nombre_completo: 'Dra. Smith' }]),
      getCitas: vi.fn().mockResolvedValue([
        { id: '10', fecha: '2026-10-10', hora_inicio: '10:00', hora_fin: '10:30', pacientes: { nombres: 'Juan', apellidos: 'Perez' } }
      ]),
      crearCita: vi.fn().mockResolvedValue({}),
      actualizarCita: vi.fn().mockResolvedValue({}),
      getSignosVitales: vi.fn().mockResolvedValue(null),
      guardarSignosVitales: vi.fn().mockResolvedValue({})
    };

    vi.spyOn(Swal, 'fire').mockResolvedValue(true as any);

    await TestBed.configureTestingModule({
      imports: [CalendarioComponent],
      providers: [
        { provide: CalendarioService, useValue: calendarioServiceMock }
      ]
    })
      .overrideComponent(CalendarioComponent, {
        remove: { imports: [FullCalendarModule] },
        add: { imports: [MockFullCalendarComponent] }
      })
      .compileComponents();

    fixture = TestBed.createComponent(CalendarioComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('debe inicializarse y cargar catálogos y citas', async () => {
    await component.ngOnInit();

    expect(component.pacientes().length).toBe(1);
    expect(component.medicos().length).toBe(1);

    const eventosCalendario = component.calendarOptions().events as any[];
    expect(eventosCalendario.length).toBe(1);
    expect(eventosCalendario[0].title).toBe('Juan Perez');
  });

  describe('Filtros (Computed Signals)', () => {
    it('debe filtrar pacientes correctamente por nombre', async () => {
      await component.ngOnInit();

      component.textoBusquedaPaciente.set('juan');

      const filtrados = component.pacientesFiltrados();
      expect(filtrados.length).toBe(1);
      expect(filtrados[0].nombres).toBe('Juan');
    });

    it('debe retornar lista vacía si el paciente no coincide', async () => {
      await component.ngOnInit();

      component.textoBusquedaPaciente.set('xyz');
      expect(component.pacientesFiltrados().length).toBe(0);
    });
  });

  describe('Interacciones y Lógica de Negocio', () => {
    it('debe limpiar los campos al hacer click en el calendario (onDateClick)', () => {
      component.textoBusquedaPaciente.set('Texto previo');

      component.onDateClick({ dateStr: '2026-12-01' });

      expect(component.fechaSeleccionada).toBe('2026-12-01');
      expect(component.mostrarModal()).toBe(true);
      expect(component.textoBusquedaPaciente()).toBe('');
    });

    it('no debe permitir guardar una cita con fecha y hora en el pasado', async () => {
      component.fechaSeleccionada = '2000-01-01';
      component.hora_inicio = '10:00';
      component.paciente_id = '1';
      component.medico_id = '2';

      await component.guardarCita();

      expect(calendarioServiceMock.crearCita).not.toHaveBeenCalled();

      expect(Swal.fire).toHaveBeenCalledWith(expect.objectContaining({
        icon: 'error',
        title: 'Fecha inválida'
      }));
    });

    it('debe llamar a crearCita si la validación pasa y no hay cita seleccionada', async () => {
      const fechaFutura = new Date();
      fechaFutura.setDate(fechaFutura.getDate() + 5);

      component.fechaSeleccionada = fechaFutura.toISOString().split('T')[0];
      component.hora_inicio = '10:00';
      component.hora_fin = '10:30';
      component.paciente_id = '1';
      component.medico_id = '2';

      component.citaSeleccionada.set(null);

      await component.guardarCita();

      expect(calendarioServiceMock.crearCita).toHaveBeenCalled();
      expect(component.mostrarModal()).toBe(false);
      expect(Swal.fire).toHaveBeenCalledWith(expect.objectContaining({
        icon: 'success'
      }));
    });
  });
});

describe('CalendarioComponent - HU-9: Agendamiento de citas', () => {
  let component: CalendarioComponent;
  let fixture: ComponentFixture<CalendarioComponent>;
  let calendarioServiceMock: any;

  beforeAll(() => {
    global.ResizeObserver = class {
      observe() { }
      unobserve() { }
      disconnect() { }
    } as any;
  });

  beforeEach(async () => {
    calendarioServiceMock = {
      getPacientes: vi.fn().mockResolvedValue([
        { id: '1', nombres: 'Juan', apellidos: 'Perez', cedula: '123' },
        { id: '2', nombres: 'Ana', apellidos: 'Torres', cedula: '456' }
      ]),
      getMedicos: vi.fn().mockResolvedValue([{ id: '2', nombre_completo: 'Dra. Smith' }]),
      getCitas: vi.fn().mockResolvedValue([]),
      crearCita: vi.fn().mockResolvedValue({}),
      actualizarCita: vi.fn().mockResolvedValue({})
    };

    vi.spyOn(Swal, 'fire').mockResolvedValue(true as any);

    await TestBed.configureTestingModule({
      imports: [CalendarioComponent],
      providers: [{ provide: CalendarioService, useValue: calendarioServiceMock }]
    })
      .overrideComponent(CalendarioComponent, {
        remove: { imports: [FullCalendarModule] },
        add: { imports: [MockFullCalendarComponent] }
      })
      .compileComponents();

    fixture = TestBed.createComponent(CalendarioComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('debe filtrar dinámicamente la lista de pacientes en el buscador mientras se escribe', async () => {
    await component.ngOnInit();

    component.buscarPaciente('ana');

    expect(component.textoBusquedaPaciente()).toBe('ana');
    expect(component.pacientesFiltrados().length).toBe(1);
    expect(component.pacientesFiltrados()[0].nombres).toBe('Ana');
  });

  it('debe bloquear la creación y emitir un error si la cita es en una fecha/hora anterior a la actual', async () => {
    await component.ngOnInit();

    component.fechaSeleccionada = '2000-01-01';
    component.hora_inicio = '08:00';
    component.paciente_id = '1';
    component.medico_id = '2';
    component.citaSeleccionada.set(null);

    await component.guardarCita();

    expect(calendarioServiceMock.crearCita).not.toHaveBeenCalled();
    expect(Swal.fire).toHaveBeenCalledWith(expect.objectContaining({ icon: 'error' }));
  });

  it('debe cerrar el modal, limpiar los campos y recargar la lista de eventos tras guardar exitosamente', async () => {
    await component.ngOnInit();

    const fechaFutura = new Date();
    fechaFutura.setDate(fechaFutura.getDate() + 3);

    component.mostrarModal.set(true);
    component.fechaSeleccionada = fechaFutura.toISOString().split('T')[0];
    component.hora_inicio = '09:00';
    component.hora_fin = '09:30';
    component.paciente_id = '1';
    component.medico_id = '2';
    component.motivo = 'Control';
    component.citaSeleccionada.set(null);

    await component.guardarCita();

    expect(component.mostrarModal()).toBe(false);
    expect(component.paciente_id).toBe('');
    expect(component.medico_id).toBe('');
    expect(calendarioServiceMock.getCitas).toHaveBeenCalledTimes(2);
  });
});

describe('CalendarioComponent - HU-10: Cancelación y reprogramación de citas', () => {
  let component: CalendarioComponent;
  let fixture: ComponentFixture<CalendarioComponent>;
  let calendarioServiceMock: any;

  beforeAll(() => {
    global.ResizeObserver = class {
      observe() { }
      unobserve() { }
      disconnect() { }
    } as any;
  });

  beforeEach(async () => {
    calendarioServiceMock = {
      getPacientes: vi.fn().mockResolvedValue([{ id: '1', nombres: 'Juan', apellidos: 'Perez', cedula: '123' }]),
      getMedicos: vi.fn().mockResolvedValue([{ id: '2', nombre_completo: 'Dra. Smith' }]),
      getCitas: vi.fn().mockResolvedValue([]),
      crearCita: vi.fn().mockResolvedValue({}),
      actualizarCita: vi.fn().mockResolvedValue({})
    };

    vi.spyOn(Swal, 'fire').mockResolvedValue(true as any);

    await TestBed.configureTestingModule({
      imports: [CalendarioComponent],
      providers: [{ provide: CalendarioService, useValue: calendarioServiceMock }]
    })
      .overrideComponent(CalendarioComponent, {
        remove: { imports: [FullCalendarModule] },
        add: { imports: [MockFullCalendarComponent] }
      })
      .compileComponents();

    fixture = TestBed.createComponent(CalendarioComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('debe poblar el formulario correctamente al hacer click en un evento existente (onEventClick)', async () => {
    await component.ngOnInit();

    const eventoMock = {
      event: {
        extendedProps: {
          id: 'cita-5',
          fecha: '2026-08-15',
          paciente_id: '1',
          medico_id: '2',
          hora_inicio: '11:00',
          hora_fin: '11:30',
          motivo: 'Chequeo general'
        }
      }
    };

    component.onEventClick(eventoMock);

    expect(component.fechaSeleccionada).toBe('2026-08-15');
    expect(component.paciente_id).toBe('1');
    expect(component.medico_id).toBe('2');
    expect(component.hora_inicio).toBe('11:00');
    expect(component.hora_fin).toBe('11:30');
    expect(component.motivo).toBe('Chequeo general');
    expect(component.citaSeleccionada()).toEqual(eventoMock.event.extendedProps);
    expect(component.mostrarModal()).toBe(true);
  });

  it('debe invocar actualizarCita en lugar de crearCita cuando existe una citaActual cargada', async () => {
    await component.ngOnInit();

    const fechaFutura = new Date();
    fechaFutura.setDate(fechaFutura.getDate() + 2);

    component.citaSeleccionada.set({ id: 'cita-5' });
    component.fechaSeleccionada = fechaFutura.toISOString().split('T')[0];
    component.hora_inicio = '10:00';
    component.hora_fin = '10:30';
    component.paciente_id = '1';
    component.medico_id = '2';

    await component.guardarCita();

    expect(calendarioServiceMock.actualizarCita).toHaveBeenCalledWith('cita-5', expect.any(Object));
    expect(calendarioServiceMock.crearCita).not.toHaveBeenCalled();
  });

  it('debe restringir la hora mínima seleccionable cuando la fecha elegida es el día de hoy', () => {
    const hoy = new Date().toISOString().split('T')[0];
    component.fechaSeleccionada = hoy;

    expect(component.horaMinima).not.toBe('00:00');

    component.fechaSeleccionada = '2099-01-01';
    expect(component.horaMinima).toBe('00:00');
  });
});