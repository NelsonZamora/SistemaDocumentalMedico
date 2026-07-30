import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PacientesService } from '../../../services/pacientes';
import { AuthService } from '../../../services/auth';
import Swal from 'sweetalert2';
import { ValidadorInputDirective } from '../../../utils/directives/validador-input';
import { AtencionMedicaService } from '../../../services/atencion-medica';
import * as mammoth from 'mammoth';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { PlantillasService } from '../../../services/plantillas';

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

  mostrarModalPreviewDocumento = signal<boolean>(false);
  previewDocumentoHtml = signal<string>('');
  cargandoPreviewDocumento = signal<boolean>(false);
  documentoSeleccionado = signal<any>(null);

  pestanaActivaEditar: string = 'personal';
  textoBusqueda: string = '';
  pestanaActiva = 'personal';
  antecedentes_personales = '';
  antecedentes_familiares = '';
  antecedentes_alergias = '';
  role = localStorage.getItem('userRole');

  pacienteSeleccionado: any = null;
  aceptaProteccionDatos = false;

  seccionActiva: string = 'datos';
  vistaActual: 'datos' | 'documentos' | 'historial' = 'datos';


  form: any = {};
  archivo: File | null = null;

  // Paginación
  readonly itemsPorPagina = 5;
  paginaActualPacientes = signal<number>(1);
  totalPaginasPacientes = computed(() =>
    Math.max(1, Math.ceil(this.pacientes().length / this.itemsPorPagina))
  );
  pacientesPaginados = computed(() => {
    const inicio = (this.paginaActualPacientes() - 1) * this.itemsPorPagina;
    return this.pacientes().slice(inicio, inicio + this.itemsPorPagina);
  });

  irPaginaAnteriorPacientes() {
    if (this.paginaActualPacientes() > 1) {
      this.paginaActualPacientes.update(p => p - 1);
    }
  }

  irPaginaSiguientePacientes() {
    if (this.paginaActualPacientes() < this.totalPaginasPacientes()) {
      this.paginaActualPacientes.update(p => p + 1);
    }
  }

  paginaActualDocumentos = signal<number>(1);
  totalPaginasDocumentos = computed(() =>
    Math.max(1, Math.ceil(this.documentosPaciente().length / this.itemsPorPagina))
  );
  documentosPaginados = computed(() => {
    const inicio = (this.paginaActualDocumentos() - 1) * this.itemsPorPagina;
    return this.documentosPaciente().slice(inicio, inicio + this.itemsPorPagina);
  });

  irPaginaAnteriorDocumentos() {
    if (this.paginaActualDocumentos() > 1) {
      this.paginaActualDocumentos.update(p => p - 1);
    }
  }

  irPaginaSiguienteDocumentos() {
    if (this.paginaActualDocumentos() < this.totalPaginasDocumentos()) {
      this.paginaActualDocumentos.update(p => p + 1);
    }
  }

  paginaActualHistorial = signal<number>(1);
  totalPaginasHistorial = computed(() =>
    Math.max(1, Math.ceil(this.historialPaciente().length / this.itemsPorPagina))
  );
  historialPaginado = computed(() => {
    const inicio = (this.paginaActualHistorial() - 1) * this.itemsPorPagina;
    return this.historialPaciente().slice(inicio, inicio + this.itemsPorPagina);
  });

  irPaginaAnteriorHistorial() {
    if (this.paginaActualHistorial() > 1) {
      this.paginaActualHistorial.update(p => p - 1);
    }
  }

  irPaginaSiguienteHistorial() {
    if (this.paginaActualHistorial() < this.totalPaginasHistorial()) {
      this.paginaActualHistorial.update(p => p + 1);
    }
  }

  constructor(
    private pacientesService: PacientesService,
    private authService: AuthService,
    private atencionMedicaService: AtencionMedicaService,
    private plantillasService: PlantillasService
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
    console.log(this.citaHistorialSeleccionada())
    const citaId = cita.id
    console.log(citaId)
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
    this.pestanaActivaEditar = 'personal';
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
    if (!this.validarCamposPaciente()) {   // ← usa la función del punto 11, corta el flujo con la advertencia Swal
      return;
    }

    if (!(await this.confirmarContactoEnBlanco())) {
      return;
    }

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
    this.pestanaActivaEditar = 'personal';
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
          foto_perfil: urlFoto,
          antecedente_personal: this.pacienteSeleccionado.antecedente_personal,
          antecedente_familiar: this.pacienteSeleccionado.antecedente_familiar,
          antecedente_alergias: this.pacienteSeleccionado.antecedente_alergias
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

      if (data && data.length > 0) {
        for (let p of data) {
          if (p.foto_perfil) {
            p.foto_url = await this.pacientesService.getFotoUrl(p.foto_perfil);
          }
        }

        this.pacientesOriginales = data;
        this.pacientes.set(data);
        this.paginaActualPacientes.set(1);

        if (this.textoBusqueda) {
          this.filtrar();
        }

        this.tablaPaciente.set(true);
      } else {
        this.pacientesOriginales = [];
        this.tablaPaciente.set(false);
      }


    } catch (error) {
      console.error(error);
    }

    this.cargando.set(false);
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
      this.paginaActualPacientes.set(1);
    }
  }

  async verDocumentosPaciente() {
    this.vistaActual = 'documentos';

    this.documentosPaciente.set([]);
    const idPaciente = this.pacienteSeleccionado.id;

    const docs = await this.pacientesService.getDocumentosPaciente(idPaciente);
    this.documentosPaciente.set(docs);
    this.paginaActualDocumentos.set(1);
  }

  async confirmarContactoEnBlanco(): Promise<boolean> {
    const faltantes: string[] = [];
    if (!this.form.correo?.trim()) faltantes.push('correo electrónico');
    if (!this.form.telefono?.trim()) faltantes.push('teléfono');

    if (faltantes.length === 0) return true;

    const confirmacion = await Swal.fire({
      icon: 'question',
      title: 'Datos de contacto incompletos',
      text: `Está a punto de registrar al paciente sin ${faltantes.join(' ni ')}. ¿Desea continuar de todas formas?`,
      showCancelButton: true,
      confirmButtonText: 'Sí, guardar así',
      cancelButtonText: 'Cancelar'
    });

    return confirmacion.isConfirmed;
  }

  async verDocumento(documento: any) {
    if (!documento.plantillas?.archivo_url_path) return;

    this.documentoSeleccionado.set(documento);
    this.previewDocumentoHtml.set('');
    this.mostrarModalPreviewDocumento.set(true);
    this.cargandoPreviewDocumento.set(true);

    try {
      const rutaPlantilla = documento.plantillas.archivo_url_path;
      const archivo = await this.plantillasService.descargarPlantilla(rutaPlantilla);
      const arrayBuffer = await archivo.arrayBuffer();
      const extension = rutaPlantilla.split('.').pop()?.toLowerCase();

      let html = '';

      if (extension === 'docx') {
        const htmlResult = await mammoth.convertToHtml({ arrayBuffer });
        html = htmlResult.value;
      } else if (extension === 'xlsx' || extension === 'xls') {
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const range = XLSX.utils.decode_range(firstSheet['!ref']!);
        let ultimaFila = range.e.r;

        for (let R = range.e.r; R >= range.s.r; --R) {
          let tieneContenido = false;
          for (let C = range.s.c; C <= range.e.c; ++C) {
            const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
            const cell = firstSheet[cellAddress];
            if (cell && cell.v !== undefined && cell.v !== '') {
              tieneContenido = true;
              break;
            }
          }
          if (tieneContenido) {
            ultimaFila = R;
            break;
          }
        }

        firstSheet['!ref'] = XLSX.utils.encode_range({
          s: range.s,
          e: { r: ultimaFila, c: range.e.c }
        });
        html = XLSX.utils.sheet_to_html(firstSheet)
          .replace(/<caption>.*?<\/caption>/g, '')
          .replace(/id="[^"]*"/g, '')
          .replace(/class="[^"]*"/g, '')
          .replace(/\sdata-v="[^"]*"/g, '')
          .replace(/\sdata-t="[^"]*"/g, '');
      } else {
        html = '<p class="text-muted text-center py-4">Vista previa no disponible para este tipo de archivo.</p>';
      }

      // // Envuelve cada {marcador} en un span "campo-doc", igual que en Generar Documento
      // html = html.replace(/\{([^}]+)\}/g, (_: string, campo: string) => {
      //   const limpio = campo.trim().toLowerCase();
      //   return `<span class="campo-doc" data-campo="${limpio}">{${campo}}</span>`;
      // });

      // // Reemplaza el contenido de cada span con el valor ya guardado en contenido_final
      // const valores = documento.contenido_final || {};
      // for (const campo of Object.keys(valores)) {
      //   const regex = new RegExp(`\\{\\s*${campo}\\s*\\}`, 'gi');
      //   html = html.replace(regex, valores[campo] || '');
      // }

      const valores = documento.contenido_final || {};
      html = html.replace(/\{([^}]+)\}/g, (match: string, campoRaw: string) => {
        const limpio = campoRaw.trim().toLowerCase();
        const valor = valores[limpio];
        const contenido = (valor !== undefined && valor !== null && valor !== '') ? valor : match;
        return `<span class="campo-doc" data-campo="${limpio}">${contenido}</span>`;
      });
      console.log(html)
      this.previewDocumentoHtml.set(html);
    } catch (error) {
      console.error(error);
      this.cerrarModalPreviewDocumento();
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo cargar la vista previa del documento.'
      });
    }

    this.cargandoPreviewDocumento.set(false);
  }

  async descargarDocumentoLocal() {
    const documento = this.documentoSeleccionado();
    if (!documento?.archivo_final_path) return;

    try {
      const archivo = await this.pacientesService.descargarDocumentoGenerado(documento.archivo_final_path);
      const nombreBase = (documento.plantillas?.nombre_plantilla || 'documento').replace(/\.[^/.]+$/, '');
      const extension = documento.archivo_final_path.split('.').pop();
      saveAs(archivo, `${nombreBase}.${extension}`);
    } catch (error) {
      console.error(error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo descargar el documento.'
      });
    }
  }

  cerrarModalPreviewDocumento() {
    this.mostrarModalPreviewDocumento.set(false);
    this.previewDocumentoHtml.set('');
    this.documentoSeleccionado.set(null);
  }

  validarCamposPaciente(): boolean {
    const errores: string[] = [];

    if (!this.form.cedula?.trim() || this.form.cedula.trim().length !== 10) {
      errores.push('La cédula debe tener 10 dígitos.');
    }
    if (!this.form.nombres?.trim()) {
      errores.push('El nombre es obligatorio.');
    }
    if (!this.form.apellidos?.trim()) {
      errores.push('El apellido es obligatorio.');
    }
    if (!this.form.fecha_nacimiento) {
      errores.push('La fecha de nacimiento es obligatoria.');
    } else if (new Date(this.form.fecha_nacimiento) > new Date()) {
      errores.push('La fecha de nacimiento no puede ser una fecha futura.');
    }
    if (!this.form.genero) {
      errores.push('Debe seleccionar un género.');
    }
    if (this.form.correo?.trim() && !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(this.form.correo.trim())) {
      errores.push('El formato del correo electrónico no es válido.');
    }
    if (this.form.telefono?.trim() && this.form.telefono.trim().length !== 10) {
      errores.push('El teléfono debe tener 10 dígitos.');
    }

    if (errores.length > 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Revise los campos del formulario',
        html: errores.map(e => `• ${e}`).join('<br>')
      });
      return false;
    }

    return true;
  }

  async mostrarHistorialVisitas() {
    this.vistaActual = 'historial';

    this.historialPaciente.set([]);
    this.historialPaciente.set(await this.pacientesService.getPacienteHistorial(this.pacienteSeleccionado.id));
    this.paginaActualHistorial.set(1);
  }

  mostrarDatosPaciente() {
    this.vistaActual = 'datos';
  }

}