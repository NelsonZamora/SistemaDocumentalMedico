import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AtencionMedicaService } from '../../../services/atencion-medica';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';


@Component({
  selector: 'app-atencion-medica',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
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

  constructor(
    private atencionMedicaService: AtencionMedicaService,
    private router: Router
  ) {}

  async ngOnInit() {
    await this.cargarPendientes();
  }

  async cargarPendientes() {
    const pendientes = await this.atencionMedicaService.getPendientes();
    this.citasPendientes.set(pendientes);
  }

  async seleccionarCita(cita: any) {
    this.citaSeleccionada.set(cita);
    
    const signosData = await this.atencionMedicaService.getSignos(cita.id);
    this.signos.set(signosData);

  }

  async guardarAtencion() {

    const citaActual = this.citaSeleccionada();
    const signosActual = this.signos();

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