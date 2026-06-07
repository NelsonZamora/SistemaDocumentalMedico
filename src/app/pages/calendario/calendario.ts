import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChangeDetectorRef } from '@angular/core';

import { FullCalendarModule } from '@fullcalendar/angular';

import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';

import { CalendarOptions } from '@fullcalendar/core';

import { CalendarioService } from '../../services/calendario';

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

  paciente_id = '';
  medico_id = '';

  hora_inicio = '08:00';
  hora_fin = '08:30';

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

  onDateClick(info: any) {

    this.citaSeleccionada = null;

    this.fechaSeleccionada =
      info.dateStr;

    this.mostrarModal = true;
    this.cd.detectChanges();
  }

  onEventClick(info: any) {

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

      alert('Error guardando cita');
      this.cd.detectChanges();
    }

  }

  cerrarModal() {

    this.mostrarModal = false;

    this.paciente_id = '';

    this.medico_id = '';

    this.hora_inicio = '08:00';

    this.hora_fin = '08:30';

    this.motivo = '';
    this.cd.detectChanges();
  }
}