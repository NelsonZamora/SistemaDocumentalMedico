import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PacientesService } from '../../../services/pacientes';
import { AuthService } from '../../../services/auth';
import Swal from 'sweetalert2';
import { ValidadorInputDirective } from '../../../utils/directives/validador-input';
import { AtencionMedicaService } from '../../../services/atencion-medica';

@Component({
  selector: 'app-pacientes',
  standalone: true,
  imports: [CommonModule, FormsModule, ValidadorInputDirective],
  templateUrl: './pacientes.html',
  styleUrl: './pacientes.scss',
})
export class PacientesComponent implements OnInit {

  pacientesOriginales: any[] = [];
  pacientes = signal<any[]>([]);
  documentosPaciente = signal<any[]>([]);
  historialPaciente = signal<any[]>([]);

  cargando = signal<boolean>(false);
  tablaPaciente = signal<boolean>(false);

  mostrarModal = signal<boolean>(false);
  mostrarModalVer = signal<boolean>(false);
  mostrarModalEditar = signal<boolean>(false);
  mostrarModalDetalleHistorial = signal<boolean>(false);
  citaHistorialSeleccionada = signal<any>(null);

  signosHistorial = signal<any>(null);
  atencionmedicaHistorial = signal<any>(null);


  textoBusqueda: string = '';
  pestanaActiva = 'personal';
  antecedentes_personales = '';
  antecedentes_familiares = '';
  antecedentes_alergias = '';

  pacienteSeleccionado: any = null;
  aceptaProteccionDatos = false;

  seccionActiva: string = 'datos';
  vistaActual: 'datos' | 'documentos' | 'historial' = 'datos';


  form: any = {};
  archivo: File | null = null;

  constructor(
    private pacientesService: PacientesService,
    private authService: AuthService,
    private atencionMedicaService: AtencionMedicaService
  ) { }

  ngOnInit() {
    this.cargarPacientes();
  }

  abrirModal() {
    this.mostrarModal.set(true);
  }

  cerrarModal() {
    this.pestanaActiva = 'personal';
    this.mostrarModal.set(false);
    this.form = {};
    this.archivo = null;
  }

  onFileSelected(event: any) {
    const file = event.target.files?.[0];

    if (!file) return;

    const MAX_SIZE = 1024 * 1024;

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


  async verDetallesCitaHistorial(cita: any) {
    this.citaHistorialSeleccionada.set(cita);

    const citaId = cita.id
    const dataSignos = await this.atencionMedicaService.getAtencionCompletabyCitaId(citaId)

    console.log(dataSignos)

    if (dataSignos && dataSignos.encontrado === false) {
      await Swal.fire({
        icon: 'info',
        title: 'Sin registro clínico',
        text: dataSignos.mensaje,
        confirmButtonColor: '#2BB7C9'
      });
      return;
    }
    this.signosHistorial.set(dataSignos.signos_vitales);
    this.atencionmedicaHistorial.set(dataSignos);
    console.log(this.atencionmedicaHistorial())

    this.mostrarModalDetalleHistorial.set(true);
  }

  cerrarModalDetalleHistorial() {
    this.mostrarModalDetalleHistorial.set(false);
    this.citaHistorialSeleccionada.set(null);
    this.signosHistorial.set(null);
    this.atencionmedicaHistorial.set(null);
  }

  cerrarModalVer() {
    this.mostrarModalVer.set(false);
    this.pestanaActiva = 'personal';
  }

  cerrarModalEditar() {
    this.mostrarModalEditar.set(false);
  }

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

    this.mostrarModalVer.set(true);
  }

  async editarPaciente(p: any) {
    this.pacienteSeleccionado = { ...p };

    if (p.foto_perfil) {
      this.pacienteSeleccionado.foto_url = await this.pacientesService.getFotoUrl(p.foto_perfil);
    }

    this.mostrarModalEditar.set(true);
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

      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: 'Exito en la actualizacion',
        text: 'Los datos del paciente han sido actualizados correctamente',
        showConfirmButton: false,
        timer: 2500,
        timerProgressBar: true
      });

      this.cerrarModalEditar();
      this.cargarPacientes();

    } catch (error: any) {
      Swal.fire({
        icon: "error",
        title: "Error en la actualizacion",
        text: "Ha ocurrido un error al intentar actualizar los datos del paciente"
      });
    }
  }


  async cargarPacientes() {
    this.tablaPaciente.set(false);
    this.cargando.set(true);
    this.pacientes.set([]);

    try {
      const data = await this.pacientesService.getPacientes();

      for (let p of data) {
        if (p.foto_perfil) {
          p.foto_url = await this.pacientesService.getFotoUrl(p.foto_perfil);
        }
      }

      this.pacientesOriginales = data;

      this.pacientes.set(data);

      if (this.textoBusqueda) {
        this.filtrar();
      }

    } catch (error) {
      console.error(error);
    }

    this.cargando.set(false);
    this.tablaPaciente.set(true);
  }

  filtrar() {
    const busqueda = this.textoBusqueda.toLowerCase().trim();

    if (!busqueda) {
      this.pacientes.set([...this.pacientesOriginales]);
    } else {
      const filtrados = this.pacientesOriginales.filter(p =>
        p.nombres?.toLowerCase().includes(busqueda) ||
        p.apellidos?.toLowerCase().includes(busqueda) ||
        p.cedula?.includes(busqueda)
      );
      this.pacientes.set(filtrados);
    }
  }

  async verDocumentosPaciente() {
    this.vistaActual = 'documentos';

    this.documentosPaciente.set([]);
    const idPaciente = this.pacienteSeleccionado.id;

    const docs = await this.pacientesService.getDocumentosPaciente(idPaciente);
    this.documentosPaciente.set(docs);
  }

  async mostrarHistorialVisitas() {
    this.vistaActual = 'historial';

    this.historialPaciente.set([]);
    this.historialPaciente.set(await this.pacientesService.getPacienteHistorial(this.pacienteSeleccionado.id));
  }

  mostrarDatosPaciente() {
    this.vistaActual = 'datos';
  }

}