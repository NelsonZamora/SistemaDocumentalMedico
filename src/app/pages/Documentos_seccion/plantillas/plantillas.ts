import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PlantillasService, CONFIGURACION_TABLAS } from '../../../services/plantillas';
import * as mammoth from 'mammoth';
import * as XLSX from 'xlsx';
import { ChangeDetectorRef } from '@angular/core';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-plantillas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './plantillas.html',
  styleUrl: './plantillas.scss',
})
export class PlantillasComponent {

  camposDetectados = signal<any[]>([]);
  totalCampos = signal<number>(0);
  previewHtml = signal<string>('');
  columnasPorTabla = signal<any[]>([]);

  archivo: File | null = null;
  nombreDocumento = '';

  tablasDisponibles = [{ valor: 'pacientes', nombre: 'Pacientes' }, { valor: 'citas_medicas', nombre: 'Citas médicas' }, { valor: 'atenciones_medicas', nombre: 'Atenciones médicas' },
    { valor: 'signos_vitales', nombre: 'Signos vitales de la cita'}];
  previewHtmlOriginal: string = '';
  valoresCampos: any = {};

  constructor(private plantillasService: PlantillasService) { }

  onFileSelected(event: any) {
    this.archivo = event.target.files[0];
  }

  async analizarDocumento() {
    if (!this.archivo) return;

    const extension = this.archivo.name.split('.').pop()?.toLowerCase();
    const arrayBuffer = await this.archivo.arrayBuffer();

    if (extension === 'docx') {
      const result = await mammoth.extractRawText({ arrayBuffer });
      const texto = result.value;

      const regex = /\{([^}]+)\}/g;
      const matches = [...texto.matchAll(regex)];

      const listadoCampos = [...new Set(matches.map(m => m[1].trim()))].map(c => ({
        nombre: c.toLowerCase(),
        tipo: 'text',
        origen: 'libre',
        tabla: '',
        columna: ''
      }));

      this.camposDetectados.set(listadoCampos);
      this.totalCampos.set(listadoCampos.length);

      const htmlResult = await mammoth.convertToHtml({ arrayBuffer });
      let html = htmlResult.value;

      html = html.replace(/\{([^}]+)\}/g, (_, campo) => {
        const limpio = campo.trim().toLowerCase();
        return `<span class="campo-doc" data-campo="${limpio}">{${campo}}</span>`;
      });

      this.previewHtmlOriginal = html;
      this.previewHtml.set(html);
    }
    else if (extension === 'xlsx' || extension === 'xls') {
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];

      const sheetJson = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
      const regex = /\{([^}]+)\}/g;
      const campos = new Set<string>();

      sheetJson.forEach((row: any) => {
        row.forEach((cell: any) => {
          if (!cell) return;
          const texto = String(cell);
          const matches = [...texto.matchAll(regex)];
          matches.forEach(m => {
            campos.add(m[1].trim().toLowerCase());
          });
        });
      });

      const listadoExcel = [...campos].map(c => ({
        nombre: c,
        tipo: 'text',
        origen: 'libre',
        tabla: '',
        columna: ''
      }));

      this.camposDetectados.set(listadoExcel);
      this.totalCampos.set(listadoExcel.length);

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

      const nuevoRango = {
        s: { r: range.s.r, c: range.s.c },
        e: { r: ultimaFila, c: range.e.c }
      };

      firstSheet['!ref'] = XLSX.utils.encode_range(nuevoRango);
      let html = XLSX.utils.sheet_to_html(firstSheet);

      html = html
        .replace(/<caption>.*?<\/caption>/g, '')
        .replace(/id="[^"]*"/g, '')
        .replace(/class="[^"]*"/g, '');

      html = html.replace(/\{([^}]+)\}/g, (_: string, campo: string) => {
        const limpio = campo.trim().toLowerCase();
        return `<span class="campo-doc" data-campo="${limpio}">{${campo}}</span>`;
      });

      this.previewHtmlOriginal = html;
      this.previewHtml.set(html);
    }
  }

  async subirPlantilla() {
    try {
      if (!this.archivo) return;
      const ruta = await this.plantillasService.subirDocumento(this.archivo);

      await this.plantillasService.guardarPlantilla({
        nombre: this.archivo.name,
        ruta_archivo: ruta,
        campos: this.camposDetectados(),
        total_campos: this.totalCampos()
      });

      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: 'Plantilla guardada correctamente',
        showConfirmButton: false,
        timer: 2500,
        timerProgressBar: true
      });


      this.archivo = null;
      this.camposDetectados.set([]);
      this.totalCampos.set(0);
      this.previewHtml.set('');
      this.previewHtmlOriginal = '';
      this.valoresCampos = {};
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

}