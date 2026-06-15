import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AtencionMedicaService } from '../../../services/atencion-medica';
import { ChangeDetectorRef } from '@angular/core';
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
export class AtencionMedicaComponent
implements OnInit {

  citasPendientes: any[] = [];

  citaSeleccionada: any = null;

  signos: any = null;

  sintomas = '';
  enfermedad_actual = '';
  examen_fisico = '';
  diagnostico = '';
  tratamiento = '';
  observaciones = '';
  cita_id = '';
  atencion_id = '';

  constructor(
    private atencionMedicaService: AtencionMedicaService,
    private router: Router,
    private cd: ChangeDetectorRef
  ) {}

  async ngOnInit() {

    await this.cargarPendientes();
    this.cd.detectChanges();
  }

  async cargarPendientes() {

    this.citasPendientes =
      await this.atencionMedicaService
      .getPendientes();

  }

  async seleccionarCita(cita: any) {

    this.citaSeleccionada = cita;
    this.signos =
      await this.atencionMedicaService
      .getSignos(cita.id);

    this.cd.detectChanges();
  }

  async guardarAtencion() {

    const nuevaAtencion = await this.atencionMedicaService
      .guardarAtencion({

        cita_id:
          this.citaSeleccionada.id,

        paciente_id:
          this.citaSeleccionada.paciente_id,

        medico_id:
          this.citaSeleccionada.medico_id,

        sintomas:
          this.sintomas,

        enfermedad_actual:
          this.enfermedad_actual,

        examen_fisico:
          this.examen_fisico,

        diagnostico:
          this.diagnostico,

        tratamiento:
          this.tratamiento,

        observaciones:
          this.observaciones,

        signos_vitales_id:
          this.signos.id

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
    this.cd.detectChanges();
  }

  irAGenerarDocumento() {

  this.router.navigate(
    ['plantillas/generar'],
    {
      state: {
        contextoClinico: {
          paciente_id: this.citaSeleccionada.paciente_id,
          medico_id: this.citaSeleccionada.medico_id,
          atencion_medica_id: this.atencion_id,
          signos_vitales_id: this.signos?.id
        }
      }
    }
  );

}

}