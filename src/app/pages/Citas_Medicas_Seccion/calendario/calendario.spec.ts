import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
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
  @Input() options: any; // Acepta las opciones para que Angular no arroje error de binding
}

describe('CalendarioComponent', () => {
  let component: CalendarioComponent;
  let fixture: ComponentFixture<CalendarioComponent>;
  let calendarioServiceMock: any;

  // 2. Simulamos el ResizeObserver de HTML (Frecuente causante de DOMException)
  beforeAll(() => {
    global.ResizeObserver = class {
      observe() { }
      unobserve() { }
      disconnect() { }
    } as any;
  });

  beforeEach(async () => {
    // 1. Mock de los métodos del servicio
    calendarioServiceMock = {
      getPacientes: vi.fn().mockResolvedValue([{ id: '1', nombres: 'Juan', apellidos: 'Perez', cedula: '123' }]),
      getMedicos: vi.fn().mockResolvedValue([{ id: '2', nombre_completo: 'Dra. Smith' }]),
      getCitas: vi.fn().mockResolvedValue([
        { id: '10', fecha: '2026-10-10', hora_inicio: '10:00', hora_fin: '10:30', pacientes: { nombres: 'Juan', apellidos: 'Perez' } }
      ]),
      crearCita: vi.fn().mockResolvedValue({}),
      actualizarCita: vi.fn().mockResolvedValue({})
    };

    // 2. Espiar (spy) en SweetAlert para evitar popups reales durante las pruebas
    vi.spyOn(Swal, 'fire').mockResolvedValue(true as any);

    await TestBed.configureTestingModule({
      imports: [CalendarioComponent], // Es standalone
      providers: [
        { provide: CalendarioService, useValue: calendarioServiceMock }
      ]
    })
    // 3. SOBREESCRIBIMOS el componente para quitar el calendario pesado y poner el mock
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

    // Verificamos que los Signals se poblaron
    expect(component.pacientes().length).toBe(1);
    expect(component.medicos().length).toBe(1);

    // Verificamos que los eventos del calendario se mapearon correctamente
    const eventosCalendario = component.calendarOptions().events as any[];
    expect(eventosCalendario.length).toBe(1);
    expect(eventosCalendario[0].title).toBe('Juan Perez');
  });

  describe('Filtros (Computed Signals)', () => {
    it('debe filtrar pacientes correctamente por nombre', async () => {
      await component.ngOnInit();

      // Ingresamos un texto de búsqueda
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
      expect(component.textoBusquedaPaciente()).toBe(''); // Verifica que se limpió
    });

    it('no debe permitir guardar una cita con fecha y hora en el pasado', async () => {
      // Configuramos datos simulados de una fecha pasada
      component.fechaSeleccionada = '2000-01-01';
      component.hora_inicio = '10:00';
      component.paciente_id = '1';
      component.medico_id = '2';

      await component.guardarCita();

      // Verificamos que el servicio NO se llamó
      expect(calendarioServiceMock.crearCita).not.toHaveBeenCalled();

      // Verificamos que se mostró la alerta de error
      expect(Swal.fire).toHaveBeenCalledWith(expect.objectContaining({
        icon: 'error',
        title: 'Fecha inválida'
      }));
    });

    it('debe llamar a crearCita si la validación pasa y no hay cita seleccionada', async () => {
      // Configuramos una fecha en el futuro
      const fechaFutura = new Date();
      fechaFutura.setDate(fechaFutura.getDate() + 5);

      component.fechaSeleccionada = fechaFutura.toISOString().split('T')[0];
      component.hora_inicio = '10:00';
      component.hora_fin = '10:30';
      component.paciente_id = '1';
      component.medico_id = '2';

      // Aseguramos que es una cita nueva
      component.citaSeleccionada.set(null);

      await component.guardarCita();

      expect(calendarioServiceMock.crearCita).toHaveBeenCalled();
      expect(component.mostrarModal()).toBe(false); // Verifica que el modal se cerró
      expect(Swal.fire).toHaveBeenCalledWith(expect.objectContaining({
        icon: 'success'
      }));
    });
  });
});