import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PlantillasService, CONFIGURACION_TABLAS } from '../../../services/plantillas';
import { ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';

import * as mammoth from 'mammoth';
import * as XLSX from 'xlsx';
import Swal from 'sweetalert2';


@Component({
  selector: 'app-lista-plantillas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './lista-plantillas.html',
  styleUrl: './lista-plantillas.scss'
})
export class ListaPlantillasComponent implements OnInit {

  plantillas = signal<any[]>([]);
  cargando = signal<boolean>(true);
  modalEditar = signal<boolean>(false);
  camposDetectados = signal<any[]>([]);
  previewHtml = signal<string>('');
  columnasPorTabla = signal<any[]>([]);
  plantillaEditando: any = null;
  valoresCampos: any = {};

  tablasDisponibles = [{ valor: 'pacientes', nombre: 'Pacientes' }, { valor: 'citas_medicas', nombre: 'Citas médicas' }, { valor: 'atenciones_medicas', nombre: 'Atenciones médicas' },
  { valor: 'signos_vitales', nombre: 'Signos vitales de la cita' }];
  camposOriginales: any[] = [];
  previewHtmlOriginal = '';

  // Paginación
  readonly itemsPorPagina = 5;
  paginaActualPlantillas = signal<number>(1);
  totalPaginasPlantillas = computed(() =>
    Math.max(1, Math.ceil(this.plantillas().length / this.itemsPorPagina))
  );
  plantillasPaginadas = computed(() => {
    const inicio = (this.paginaActualPlantillas() - 1) * this.itemsPorPagina;
    return this.plantillas().slice(inicio, inicio + this.itemsPorPagina);
  });

  irPaginaAnteriorPlantillas() {
    if (this.paginaActualPlantillas() > 1) {
      this.paginaActualPlantillas.update(p => p - 1);
    }
  }

  irPaginaSiguientePlantillas() {
    if (this.paginaActualPlantillas() < this.totalPaginasPlantillas()) {
      this.paginaActualPlantillas.update(p => p + 1);
    }
  }

  constructor(private plantillasService: PlantillasService, private cd: ChangeDetectorRef) { }

  async ngOnInit() {
    await this.cargarPlantillas();
  }

  async cargarPlantillas() {
    try {
      this.cargando.set(true);
      const data = await this.plantillasService.getPlantillas();
      this.plantillas.set(data);
      this.paginaActualPlantillas.set(1);
      this.cargando.set(false);
    } catch (error) {
      console.error(error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Ha ocurrido un error cargando las plantillas'
      });
    }
  }

  async abrirEditar(plantilla: any) {
    try {
      this.plantillaEditando = plantilla;

      this.camposOriginales = structuredClone(plantilla.contenido_json.campos || []);
      const copiaCampos = structuredClone(plantilla.contenido_json.campos || []);
      this.camposDetectados.set(copiaCampos);

      this.valoresCampos = {};

      for (const campo of copiaCampos) {
        if (campo.origen === 'bd' && campo.tabla) {
          await this.cargarColumnas(campo);
        }
      }

      const archivo = await this.plantillasService.descargarPlantilla(plantilla.archivo_url_path);
      const arrayBuffer = await archivo.arrayBuffer();
      const extension = plantilla.archivo_url_path.split('.').pop()?.toLowerCase();

      if (extension === 'docx') {
        const htmlResult = await mammoth.convertToHtml({ arrayBuffer });
        let html = htmlResult.value;

        html = html.replace(/\{([^}]+)\}/g, (_: string, campo: string) => {
          const limpio = campo.trim().toLowerCase();
          return `<span class="campo-doc" data-campo="${limpio}">{${campo}}</span>`;
        });

        this.previewHtmlOriginal = html;
      }
      else if (extension === 'xlsx' || extension === 'xls') {
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const range = XLSX.utils.decode_range(firstSheet['!ref']!);
        let ultimaFila = range.e.r;

        for (let R = range.e.r; R >= range.s.r; --R) {
          let tieneContenido = false;
          for (let C = range.s.c; C <= range.e.c; ++C) {
            const addr = XLSX.utils.encode_cell({ r: R, c: C });
            const cell = firstSheet[addr];
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
          s: { r: range.s.r, c: range.s.c },
          e: { r: ultimaFila, c: range.e.c }
        });

        let html = XLSX.utils.sheet_to_html(firstSheet);
        html = html
          .replace(/<caption>.*?<\/caption>/g, '')
          .replace(/id="[^"]*"/g, '')
          .replace(/class="[^"]*"/g, '');

        html = html.replace(/>([^<]*\{([^}]+)\}[^<]*)</g, (match, contenido, campo) => {
          const limpio = campo.trim().toLowerCase();
          const reemplazo = contenido.replace(`{${campo}}`,
            `<span class="campo-doc" data-campo="${limpio}">{${campo}}</span>`
          );
          return `>${reemplazo}<`;
        });

        this.previewHtmlOriginal = html;
      }

      this.previewHtml.set(this.previewHtmlOriginal);
      this.modalEditar.set(true);

    } catch (error) {
      console.error(error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Ha ocurrido un error cargando la vista previa'
      });
    }
  }

  async eliminarPlantilla(plantilla: any) {
    const resultado = await Swal.fire({
      title: 'Archivar plantilla?',
      text: 'Una vez archivada, la plantilla no podrá utilizarse para generar nuevos documentos. Los documentos existentes permanecerán disponibles. Para volver a usarla será necesario cargarla y configurarla nuevamente.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, archivar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      reverseButtons: true
    });

    if (!resultado.isConfirmed) {
      return;
    }

    try {
      await this.plantillasService.eliminarPlantilla(plantilla.id);

      await Swal.fire({
        title: 'Archivado!',
        text: 'La plantilla fue archivada correctamente.',
        icon: 'success',
        timer: 1800,
        showConfirmButton: false
      });

      await this.cargarPlantillas(); // Recargar la tabla
    } catch (error) {
      console.error(error);

      Swal.fire({
        title: 'Error',
        text: 'No se pudo eliminar la plantilla.',
        icon: 'error'
      });
    }

  }

  async guardarCambios() {
    try {
      await this.plantillasService.actualizarPlantilla(
        this.plantillaEditando.id,
        this.camposDetectados()
      );

      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: 'Plantilla actualizada correctamente',
        showConfirmButton: false,
        timer: 2500,
        timerProgressBar: true
      });

      this.modalEditar.set(false);
      await this.cargarPlantillas();
    } catch (error) {
      console.error(error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Ocurrió un error al actualizar la plantilla'
      });
    }
  }

  // async cargarColumnas(campo: any) {
  //   if (!campo.tabla) return;
  //   try {
  //     const columnas = await this.plantillasService.getColumnas(campo.tabla);
  //     this.columnasPorTabla = {
  //       ...this.columnasPorTabla,
  //       [campo.tabla]: columnas
  //     };
  //   } catch (error) {
  //     console.error(error);
  //   }
  // }
  async cargarColumnas(campo: any) {
    if (!campo.tabla) return;
    if (this.columnasPorTabla()[campo.tabla]) return;


    const nombreTabla = campo.tabla;
    try {
      const todasLasColumnas = await this.plantillasService.getColumnas(nombreTabla);

      const config = CONFIGURACION_TABLAS[nombreTabla];

      const columnasProcesadas = todasLasColumnas
        .filter((colNombre: string) => config.hasOwnProperty(colNombre))
        .map((colNombre: string) => ({
          id: colNombre,
          etiqueta: config[colNombre]
        }));

      this.columnasPorTabla.update(current => ({
        ...current,
        [nombreTabla]: columnasProcesadas
      }));
    } catch (error) {
      console.error("Error al procesar columnas:", error);
    }
  }

  actualizarPreview() {
    let html = this.previewHtmlOriginal;
    Object.keys(this.valoresCampos).forEach(campo => {
      const valor = this.valoresCampos[campo];
      const regex = new RegExp(`<span class="campo-doc" data-campo="${campo}">.*?<\\/span>`, 'g');

      html = html.replace(regex,
        `<span class="campo-doc" data-campo="${campo}">${valor || `{${campo}}`}</span>`
      );
    });
    this.previewHtml.set(html);
  }

  cambiarOrigen(campo: any) {
    if (campo.origen === 'libre') {
      campo.tabla = '';
      campo.columna = '';
    }
  }

  cerrarModal() {
    this.camposDetectados.set(structuredClone(this.camposOriginales));
    this.modalEditar.set(false);
  }
}