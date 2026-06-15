import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChangeDetectorRef } from '@angular/core';
import Swal from 'sweetalert2';

import { FullCalendarModule } from '@fullcalendar/angular';

import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';

import { CalendarOptions } from '@fullcalendar/core';

import { CalendarioService } from '../../../services/calendario';

@Component({
  selector: 'app-calendario',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    FullCalendarModule
  ],
  templateUrl: './calendario.html',
  styleUrl: './calendario.scss'
})
export class CalendarioComponent implements OnInit {

  pacientes: any[] = [];
  medicos: any[] = [];

  mostrarModal = false;

  fechaSeleccionada = '';
  pestanaActiva: 'cita' | 'signos' = 'cita';
  mostrarModalSignos = false;

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

  citaSeleccionada: any = null;

  calendarOptions: CalendarOptions = {

    plugins: [dayGridPlugin, interactionPlugin],

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

  };

  constructor(
    private calendarioService: CalendarioService,
    private cd: ChangeDetectorRef
  ) {}

  async ngOnInit() {

    await this.cargarCatalogos();

    await this.cargarCitas();
    this.cd.detectChanges();
  }

  async cargarCatalogos() {

    this.pacientes =
      await this.calendarioService.getPacientes();

    this.medicos =
      await this.calendarioService.getMedicos();
    this.cd.detectChanges();
  }

  async cargarCitas() {

    const citas =
      await this.calendarioService.getCitas();

    this.calendarOptions.events =
      citas.map(cita => ({

        id: cita.id,

        title:
          `${cita.pacientes.nombres} ${cita.pacientes.apellidos}`,

        start:
          `${cita.fecha}T${cita.hora_inicio}`,

        end:
          `${cita.fecha}T${cita.hora_fin}`,

        extendedProps: cita

      }));
      this.cd.detectChanges();
  }

  async abrirSignosVitales() {

    const signos =
      await this.calendarioService
        .getSignosVitales(
          this.citaSeleccionada.id
        );

    this.presion_arterial =
      signos?.presion_arterial || '';

    this.frecuencia_cardiaca =
      signos?.frecuencia_cardiaca || null;

    this.saturacion =
      signos?.saturacion || null;

    this.temperatura =
      signos?.temperatura || null;

    this.peso =
      signos?.peso || null;

    this.talla =
      signos?.talla || null;

    this.observaciones_signos =
      signos?.observaciones || '';

    this.pestanaActiva = 'signos';

    this.cd.detectChanges();
  }

  onDateClick(info: any) {

    this.pestanaActiva = 'cita';

    this.citaSeleccionada = null;

    this.fechaSeleccionada =
      info.dateStr;

    this.mostrarModal = true;
    this.cd.detectChanges();
  }

  abrirNuevaCita() {

    const ahora = new Date();

    this.fechaSeleccionada =
      ahora.toISOString().split('T')[0];

    this.hora_inicio =
      ahora.toTimeString().substring(0,5);

    const fin = new Date();
    fin.setMinutes(fin.getMinutes() + 30);

    this.hora_fin =
      fin.toTimeString().substring(0,5);

    this.mostrarModal = true;

  }

  get horaMinima(): string {

  const hoy =
    new Date()
    .toISOString()
    .split('T')[0];

  if (
    this.fechaSeleccionada === hoy
  ) {

    return new Date()
      .toTimeString()
      .substring(0, 5);

  }

  return '00:00';

}

  async guardarSignosVitales() {
    await this.calendarioService
      .guardarSignosVitales({

        cita_id:
          this.citaSeleccionada.id,

        presion_arterial:
          this.presion_arterial,

        frecuencia_cardiaca:
          this.frecuencia_cardiaca,

        saturacion:
          this.saturacion,

        temperatura:
          this.temperatura,

        peso:
          this.peso,

        talla:
          this.talla,

        observaciones:
          this.observaciones_signos
      });

    this.pestanaActiva = 'cita';

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

    this.pestanaActiva = 'cita';

    this.citaSeleccionada =
      info.event.extendedProps;

    this.fechaSeleccionada =
      this.citaSeleccionada.fecha;

    this.paciente_id =
      this.citaSeleccionada.paciente_id;

    this.medico_id =
      this.citaSeleccionada.medico_id;

    this.hora_inicio =
      this.citaSeleccionada.hora_inicio;

    this.hora_fin =
      this.citaSeleccionada.hora_fin;

    this.motivo =
      this.citaSeleccionada.motivo || '';

    this.mostrarModal = true;
    this.cd.detectChanges();
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

      const fechaHoraCita =
        new Date(
          `${this.fechaSeleccionada}T${this.hora_inicio}`
        );

      if (fechaHoraCita < ahora) {

        Swal.fire({
          icon: 'error',
          title: 'Fecha inválida',
          text: 'No puede registrar citas medicas en fechas u horas previas a la actual.'
        });

        return;

      }

      if (this.citaSeleccionada) {

        await this.calendarioService.actualizarCita(
          this.citaSeleccionada.id,
          cita
        );

      } else {

        await this.calendarioService.crearCita(cita);

      }

      this.cerrarModal();

      await this.cargarCitas();
      this.cd.detectChanges();
    } catch (error) {

      console.error(error);

      Swal.fire({
                  icon: 'error',
                  title: 'Error',
                  text: 'Ha ocurrido un error guardando la cita'
                });
      this.cd.detectChanges();
    }

  }

  cerrarModal() {

    this.mostrarModal = false;

    this.pestanaActiva = 'cita';

    this.paciente_id = '';

    this.medico_id = '';

    this.motivo = '';
    this.cd.detectChanges();
  }
}