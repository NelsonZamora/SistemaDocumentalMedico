import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AtencionMedicaService } from '../../../services/atencion-medica';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { ValidadorInputDirective } from '../../../utils/directives/validador-input';


@Component({
  selector: 'app-atencion-medica',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ValidadorInputDirective
  ],
  templateUrl: './atencion-medica.html',
  styleUrl: './atencion-medica.scss'
})
export class AtencionMedicaComponent implements OnInit {

  citasPendientes = signal<any[]>([]);
  citaSeleccionada = signal<any>(null);
  signos = signal<any>(null);

  motivo_consulta = '';
  enfermedad_actual = '';
  examen_fisico = '';
  diagnostico = '';
  tratamiento = '';
  observaciones = '';
  cita_id = '';
  atencion_id = '';

  presion_arterial = '';
  frecuencia_cardiaca: number | null = null;
  saturacion: number | null = null;
  temperatura: number | null = null;
  peso: number | null = null;
  talla: number | null = null;
  observaciones_signos = '';

  constructor(
    private atencionMedicaService: AtencionMedicaService,
    private router: Router
  ) { }

  async ngOnInit() {
    await this.cargarPendientes();
  }

  async cargarPendientes() {
    const pendientes = await this.atencionMedicaService.getPendientes();
    this.citasPendientes.set(pendientes);
  }

  tieneSignosRegistrados(cita: any): boolean {
    return Array.isArray(cita.signos_vitales)
      ? cita.signos_vitales.length > 0
      : !!cita.signos_vitales;
  }

  async seleccionarCita(cita: any) {
    this.citaSeleccionada.set(cita);
    this.limpiarFormularioClinico();
    this.limpiarSignosEditables();

    const signosData = await this.atencionMedicaService.getSignos(cita.id);
    this.signos.set(signosData);

  }

  limpiarFormularioClinico() {
    this.motivo_consulta = '';
    this.enfermedad_actual = '';
    this.examen_fisico = '';
    this.diagnostico = '';
    this.tratamiento = '';
    this.observaciones = '';
  }

  limpiarSignosEditables() {
    this.presion_arterial = '';
    this.frecuencia_cardiaca = null;
    this.saturacion = null;
    this.temperatura = null;
    this.peso = null;
    this.talla = null;
    this.observaciones_signos = '';
  }

  async guardarSignosVitalesAtencion() {
    const citaActual = this.citaSeleccionada();
    if (!citaActual) return;

    try {
      await this.atencionMedicaService.guardarSignosVitales({
        cita_id: citaActual.id,
        presion_arterial: this.presion_arterial,
        frecuencia_cardiaca: this.frecuencia_cardiaca,
        saturacion: this.saturacion,
        temperatura: this.temperatura,
        peso: this.peso,
        talla: this.talla,
        observaciones: this.observaciones_signos
      });

      const signosGuardados = await this.atencionMedicaService.getSignos(citaActual.id);
      this.signos.set(signosGuardados);

      await this.cargarPendientes();

      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: 'Signos vitales registrados',
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true
      });
    } catch (error) {
      console.error(error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudieron registrar los signos vitales'
      });
    }
  }

  async guardarAtencion() {

    const citaActual = this.citaSeleccionada();
    const signosActual = this.signos();

    if (!citaActual) return;

    if (!signosActual) {
      Swal.fire({
        icon: 'warning',
        title: 'Signos vitales requeridos',
        text: 'Debe registrar los signos vitales del paciente para poder guardar la atención médica.'
      });
      return;
    }

    try {
      const nuevaAtencion = await this.atencionMedicaService.guardarAtencion({
        cita_id: citaActual.id,
        paciente_id: citaActual.paciente_id,
        medico_id: citaActual.medico_id,
        motivo_consulta: this.motivo_consulta,
        enfermedad_actual: this.enfermedad_actual,
        examen_fisico: this.examen_fisico,
        diagnostico: this.diagnostico,
        tratamiento: this.tratamiento,
        observaciones: this.observaciones,
        signos_vitales_id: signosActual.id
      });

      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: 'Atencion registrada correctamente',
        showConfirmButton: false,
        timer: 2500,
        timerProgressBar: true
      });

      this.atencion_id = nuevaAtencion.id;
      await this.cargarPendientes();
    } catch (error) {
      console.error(error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo guardar la atención médica'
      });
    }

  }

  irAGenerarDocumento() {
    const citaActual = this.citaSeleccionada();

    this.router.navigate(
      ['plantillas/generar'],
      {
        state: {
          contextoClinico: {
            paciente_id: citaActual.paciente_id,
            medico_id: citaActual.medico_id,
            atencion_medica_id: this.atencion_id,
            signos_vitales_id: this.signos()?.id
          }
        }
      }
    );
  }

}