import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { ValidadorInputDirective } from '../../../utils/directives/validador-input';

import { FullCalendarModule } from '@fullcalendar/angular';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { CalendarOptions } from '@fullcalendar/core';
import timeGridPlugin from '@fullcalendar/timegrid';

import { CalendarioService } from '../../../services/calendario';

@Component({
  selector: 'app-calendario',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ValidadorInputDirective,
    FullCalendarModule
  ],
  templateUrl: './calendario.html',
  styleUrl: './calendario.scss'
})
export class CalendarioComponent implements OnInit {

  pacientes = signal<any[]>([]);
  medicos = signal<any[]>([]);
  citaSeleccionada = signal<any>(null);

  mostrarModal = signal<boolean>(false);
  pestanaActiva = signal<'cita' | 'signos'>('cita');

  fechaSeleccionada = '';
  presion_arterial = '';
  frecuencia_cardiaca: number | null = null;
  saturacion: number | null = null;
  temperatura: number | null = null;
  peso: number | null = null;
  talla: number | null = null;
  observaciones_signos = '';
  paciente_id = '';
  medico_id = '';
  hora_inicio = '';
  hora_fin = '';
  fechaMinima = '';
  motivo = '';

  calendarOptions = signal<CalendarOptions>({
    plugins: [dayGridPlugin, interactionPlugin, timeGridPlugin],
    initialView: 'dayGridMonth',
    locale: 'es',
    height: 'auto',
    fixedWeekCount: false,
    dayMaxEvents: true,
    selectable: true,
    editable: false,
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek,timeGridDay'
    },
    eventTimeFormat: {
      hour: '2-digit',
      minute: '2-digit',
      meridiem: false
    },
    buttonText: {
      today: 'Hoy',
      month: 'Mes',
      week: 'Semana',
      day: 'Día'
    },
    dateClick: this.onDateClick.bind(this),
    eventClick: this.onEventClick.bind(this),
    events: []
  });

  constructor(
    private calendarioService: CalendarioService
  ) { }

  async ngOnInit() {

    await this.cargarCatalogos();

    await this.cargarCitas();
  }

  async cargarCatalogos() {
    const pts = await this.calendarioService.getPacientes();
    const mds = await this.calendarioService.getMedicos();

    this.pacientes.set(pts);
    this.medicos.set(mds);
  }

  async cargarCitas() {
    const citas = await this.calendarioService.getCitas();

    const eventosMapeados = citas.map(cita => ({
      id: cita.id,
      title: `${cita.pacientes.nombres} ${cita.pacientes.apellidos}`,
      start: `${cita.fecha}T${cita.hora_inicio}`,
      end: `${cita.fecha}T${cita.hora_fin}`,
      extendedProps: cita
    }));

    this.calendarOptions.update(options => ({
      ...options,
      events: eventosMapeados
    }));
  }

  async abrirSignosVitales() {
    const citaActual = this.citaSeleccionada();
    if (!citaActual) return;

    const signos = await this.calendarioService.getSignosVitales(citaActual.id);

    this.presion_arterial = signos?.presion_arterial || '';
    this.frecuencia_cardiaca = signos?.frecuencia_cardiaca || null;
    this.saturacion = signos?.saturacion || null;
    this.temperatura = signos?.temperatura || null;
    this.peso = signos?.peso || null;
    this.talla = signos?.talla || null;
    this.observaciones_signos = signos?.observaciones || '';

    this.pestanaActiva.set('signos');
  }

  onDateClick(info: any) {
    this.pestanaActiva.set('cita');
    this.citaSeleccionada.set(null);

    this.fechaSeleccionada = info.dateStr;
    this.mostrarModal.set(true);
  }

  abrirNuevaCita() {
    const ahora = new Date();
    this.fechaSeleccionada = ahora.toISOString().split('T')[0];
    this.hora_inicio = ahora.toTimeString().substring(0, 5);

    const fin = new Date();
    fin.setMinutes(fin.getMinutes() + 30);
    this.hora_fin = fin.toTimeString().substring(0, 5);

    this.mostrarModal.set(true);
  }

  get horaMinima(): string {
    const hoy = new Date().toISOString().split('T')[0];
    if (this.fechaSeleccionada === hoy) {
      return new Date().toTimeString().substring(0, 5);
    }
    return '00:00';
  }

  async guardarSignosVitales() {
    const citaActual = this.citaSeleccionada();

    await this.calendarioService.guardarSignosVitales({
      cita_id: citaActual.id,
      presion_arterial: this.presion_arterial,
      frecuencia_cardiaca: this.frecuencia_cardiaca,
      saturacion: this.saturacion,
      temperatura: this.temperatura,
      peso: this.peso,
      talla: this.talla,
      observaciones: this.observaciones_signos
    });

    this.pestanaActiva.set('cita');
    this.citaSeleccionada.set(null);
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'success',
      title: 'Signos Vitales guardados',
      showConfirmButton: false,
      timer: 2500,
      timerProgressBar: true
    });
  }

  onEventClick(info: any) {
    this.pestanaActiva.set('cita');

    const extendedProps = info.event.extendedProps;
    this.citaSeleccionada.set(extendedProps);

    this.fechaSeleccionada = extendedProps.fecha;
    this.paciente_id = extendedProps.paciente_id;
    this.medico_id = extendedProps.medico_id;
    this.hora_inicio = extendedProps.hora_inicio;
    this.hora_fin = extendedProps.hora_fin;
    this.motivo = extendedProps.motivo || '';

    this.mostrarModal.set(true);
  }

  async guardarCita() {
    try {
      const cita = {
        paciente_id: this.paciente_id,
        medico_id: this.medico_id,
        fecha: this.fechaSeleccionada,
        hora_inicio: this.hora_inicio,
        hora_fin: this.hora_fin,
        motivo: this.motivo,
        estado: 'programada'
      };

      const ahora = new Date();
      const fechaHoraCita = new Date(`${this.fechaSeleccionada}T${this.hora_inicio}`);

      if (fechaHoraCita < ahora) {
        Swal.fire({
          icon: 'error',
          title: 'Fecha inválida',
          text: 'No puede registrar citas medicas en fechas u horas previas a la actual.'
        });
        return;
      }

      const citaActual = this.citaSeleccionada();

      if (citaActual) {
        await this.calendarioService.actualizarCita(citaActual.id, cita);
      } else {
        await this.calendarioService.crearCita(cita);
      }

      this.cerrarModal();
      await this.cargarCitas();
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: 'Exito en crear la cita medica',
        text: 'La cita medica a sido creada y agendada exitosamente',
        showConfirmButton: false,
        timer: 2500,
        timerProgressBar: true
      });
    } catch (error) {
      console.error(error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Ha ocurrido un error guardando la cita'
      });
    }
  }

  cerrarModal() {
    this.mostrarModal.set(false);
    this.pestanaActiva.set('cita');
    this.paciente_id = '';
    this.medico_id = '';
    this.motivo = '';
  }
}