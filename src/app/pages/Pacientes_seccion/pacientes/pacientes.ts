import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PacientesService } from '../../../services/pacientes';
import { AuthService } from '../../../services/auth';
import { ChangeDetectorRef } from '@angular/core';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-pacientes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './pacientes.html'
})
export class PacientesComponent implements OnInit {

  pacientes: any[] = [];
  mostrarModal = false;
  cargando = false;
  tablaPaciente = false;
  mostrarModalExito = false;

  pestanaActiva = 'personal';
  antecedentes_personales = '';
  antecedentes_familiares = '';
  antecedentes_alergias = '';
  
  pacienteSeleccionado: any = null;
  mostrarModalVer = false;
  mostrarModalEditar = false;
  aceptaProteccionDatos = false;

  seccionActiva: string = 'datos';
  documentosPaciente: any[] = [];
  historialPaciente: any[] = [];
  vistaActual: 'datos' | 'documentos' | 'historial' = 'datos';


  form: any = {};
  archivo: File | null = null;

  constructor(
    private pacientesService: PacientesService,
    private authService: AuthService,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.cargarPacientes();
  }

  abrirModal() {
    this.mostrarModal = true;
  }

  cerrarModal() {
    this.pestanaActiva = 'personal';
    this.mostrarModal = false;
    this.form = {};
    this.archivo = null;
  }

  onFileSelected(event: any) {
    const file = event.target.files?.[0];

    if (!file) return;

    const MAX_SIZE = 1024 * 1024; // 1 MB

    if (file.size > MAX_SIZE) {

      Swal.fire({
        icon: 'warning',
        title: 'Imagen demasiado grande',
        text: 'La imagen no debe superar 1 MB.'
      });

      event.target.value = '';
      return;

    }

    if (
      file.type !== 'image/jpeg' &&
      file.type !== 'image/png'
    ) {

      Swal.fire({
        icon: 'error',
        title: 'Formato no válido',
        text: 'Solo se permiten imágenes JPG o PNG.'
      });

      event.target.value = '';
      return;

    }

    this.archivo = file;

  }

  cerrarModalExito() {
    this.mostrarModalExito = false;
  }

  cerrarModalVer() {
    this.mostrarModalVer = false;
    this.pestanaActiva = 'personal';
  }

  cerrarModalEditar() {
    this.mostrarModalEditar = false;
  }

  // calcularEdad(fecha: string): number {
  //   if (!fecha) return 0;
  //   const hoy = new Date();
  //   const cumple = new Date(fecha);
  //   let edad = hoy.getFullYear() - cumple.getFullYear();
  //   const m = hoy.getMonth() - cumple.getMonth();
  //   if (m < 0 || (m === 0 && hoy.getDate() < cumple.getDate())) {
  //     edad--;
  //   }
  //   return edad;
  // }
  calcularEdad(fecha: string) {
    if (!fecha) {

      return {
        anios: 0,
        meses: 0,
        dias: 0
      };

    }

    const nacimiento = new Date(fecha);
    const hoy = new Date();

    let anios =
      hoy.getFullYear() -
      nacimiento.getFullYear();

    let meses =
      hoy.getMonth() -
      nacimiento.getMonth();

    let dias =
      hoy.getDate() -
      nacimiento.getDate();

    if (dias < 0) {

      meses--;

      const ultimoDiaMesAnterior =
        new Date(
          hoy.getFullYear(),
          hoy.getMonth(),
          0
        ).getDate();

      dias += ultimoDiaMesAnterior;

    }

    if (meses < 0) {

      anios--;
      meses += 12;

    }

    return {
      anios,
      meses,
      dias
    };

  }

  async guardar() {
      try {
        let urlFoto = null;
   
        if (this.archivo) {
          urlFoto = await this.pacientesService.subirFoto(this.archivo);
        }

        const userId = await this.authService.getUserId();
      
        const paciente = {
          ...this.form,
          foto_perfil: urlFoto,
          creado_por: userId
        };

        await this.pacientesService.crearPaciente(paciente);
    
        this.cerrarModal();
        this.mostrarModalExito = true;
        this.cargarPacientes();
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: 'Paciente creado correctamente',
          showConfirmButton: false,
          timer: 2500,
          timerProgressBar: true
        });
    
      } catch (error: any) {
        if (error.message.includes('pacientes_cedula_key')) {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'La cedula ya se encuentra ingresada en un paciente'
          });
        } else {
          Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'error',
            title: error.message,
            showConfirmButton: false,
            timer: 4000,
            timerProgressBar: true
          });
        }
      }

      
    }

  async verPaciente(p: any) {
    this.vistaActual = 'datos'
    this.pacienteSeleccionado = { ...p };

    if (p.foto_perfil) {
      this.pacienteSeleccionado.foto_url = await this.pacientesService.getFotoUrl(p.foto_perfil);
    }

    this.mostrarModalVer = true;
    this.cd.detectChanges(); 
  }

  async editarPaciente(p: any) {
    this.pacienteSeleccionado = { ...p };

    if (p.foto_perfil) {
      this.pacienteSeleccionado.foto_url = await this.pacientesService.getFotoUrl(p.foto_perfil);
    }

    this.mostrarModalEditar = true;
    this.cd.detectChanges();
  }

    async actualizarPaciente() {
    try {
      let urlFoto = this.pacienteSeleccionado.foto_perfil;

      if (this.archivo) {
        if (this.pacienteSeleccionado.foto_perfil) {
          await this.pacientesService.eliminarFoto(
            this.pacienteSeleccionado.foto_perfil
          );
        }

        urlFoto = await this.pacientesService.subirFoto(this.archivo);
      }

      await this.pacientesService.actualizarPaciente(
        this.pacienteSeleccionado.id,
        {
          nombres: this.pacienteSeleccionado.nombres,
          apellidos: this.pacienteSeleccionado.apellidos,
          correo: this.pacienteSeleccionado.correo,
          telefono: this.pacienteSeleccionado.telefono,
          genero: this.pacienteSeleccionado.genero,
          fecha_nacimiento: this.pacienteSeleccionado.fecha_nacimiento,
          foto_perfil: urlFoto
        }
      );

      this.cerrarModalEditar();
      this.cargarPacientes();

    } catch (error: any) {
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'error',
        title: error.message,
        showConfirmButton: false,
        timer: 4000,
        timerProgressBar: true
      });
    }
  }

  pacientesOriginales: any[] = []; 
  textoBusqueda: string = ''; 

  async cargarPacientes() {
    this.cargando = true;
    try {
      const data = await this.pacientesService.getPacientes();

      for (let p of data) {
        if (p.foto_perfil) {
          p.foto_url = await this.pacientesService.getFotoUrl(p.foto_perfil);
        }
      }

      this.pacientesOriginales = data;
      this.pacientes = data;
      
      if (this.textoBusqueda) {
        this.filtrar();
      }

    } catch (error) {
      console.error(error);
    }
    this.cargando = false;
    this.tablaPaciente = true;  
    this.cd.detectChanges();
  }

  filtrar() {
    const busqueda = this.textoBusqueda.toLowerCase().trim();

    if (!busqueda) {
      this.pacientes = [...this.pacientesOriginales];
    } else {
      this.pacientes = this.pacientesOriginales.filter(p => 
        p.nombres?.toLowerCase().includes(busqueda) ||
        p.apellidos?.toLowerCase().includes(busqueda) ||
        p.cedula?.includes(busqueda)
      );
    }
  }

  async verDocumentosPaciente() {
    this.cd.detectChanges();
    this.vistaActual = 'documentos';

    this.documentosPaciente =
      await this.pacientesService.getDocumentosPaciente(
        this.pacienteSeleccionado.id
      );
      this.cd.detectChanges();
  }

  async mostrarHistorialVisitas() {
    this.cd.detectChanges();
    this.vistaActual = 'historial';

    this.historialPaciente =
      await this.pacientesService.getPacienteHistorial(
        this.pacienteSeleccionado.id
      );
      this.cd.detectChanges();
  }
  mostrarDatosPaciente() {
    this.vistaActual = 'datos';
  }

}