import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PlantillasService } from '../../../services/plantillas';
import * as mammoth from 'mammoth';
import * as XLSX from 'xlsx';
import { ChangeDetectorRef } from '@angular/core';


@Component({
  selector: 'app-plantillas',
  standalone: true,
  imports: [CommonModule,FormsModule],
  templateUrl: './plantillas.html',
  styleUrl: './plantillas.scss',
})
export class PlantillasComponent {

  archivo: File | null = null;
  camposDetectados: any[] = [];
  totalCampos = 0;
  nombreDocumento = '';
  previewHtml: string = '';

  columnasPorTabla: any = {};
  tablasDisponibles = ['pacientes'];

  previewHtmlOriginal: string = '';
  valoresCampos: any = {}; 

  constructor(private plantillasService: PlantillasService, private cd: ChangeDetectorRef) {}

  onFileSelected(event: any) {
    this.archivo = event.target.files[0];
  }

  async analizarDocumento() {
    if (!this.archivo) return;

    const extension = this.archivo.name.split('.').pop()?.toLowerCase();
    const arrayBuffer = await this.archivo.arrayBuffer();

    // let texto = '';
    // let html = '';

      // =========================
      // WORD
      // =========================
      if (extension === 'docx') {

        const result = await mammoth.extractRawText({ arrayBuffer });
        const texto = result.value;

        const regex = /\{([^}]+)\}/g;
        const matches = [...texto.matchAll(regex)];

        this.camposDetectados = [...new Set(matches.map(m => m[1].trim()))]
          .map(c => ({
            nombre: c.toLowerCase(),
            tipo: 'text',
            origen: 'libre',
            tabla: '',
            columna: ''
          }));

        this.totalCampos = this.camposDetectados.length;

        const htmlResult = await mammoth.convertToHtml({ arrayBuffer });

        let html = htmlResult.value;

        html = html.replace(/\{([^}]+)\}/g, (_, campo) => {

          const limpio = campo.trim().toLowerCase();

          return `
            <span class="campo-doc" data-campo="${limpio}">
              {${campo}}
            </span>
          `;
        });

        this.previewHtmlOriginal = html;
        this.previewHtml = html;
      }
      // =========================
      // EXCEL
      // =========================
      else if (extension === 'xlsx' || extension === 'xls') {

        const workbook = XLSX.read(arrayBuffer, {
          type: 'array'
        });

        const firstSheet =
          workbook.Sheets[workbook.SheetNames[0]];

        // =========================
        // EXTRAER CAMPOS
        // =========================

        const sheetJson = XLSX.utils.sheet_to_json(
          firstSheet,
          { header: 1 }
        );

        const regex = /\{([^}]+)\}/g;

        const campos = new Set<string>();

        sheetJson.forEach((row: any) => {

          row.forEach((cell: any) => {

            if (!cell) return;

            const texto = String(cell);

            const matches = [...texto.matchAll(regex)];

            matches.forEach(m => {
              campos.add(
                m[1].trim().toLowerCase()
              );
            });
          });
        });

        this.camposDetectados = [...campos].map(c => ({
          nombre: c,
          tipo: 'text',
          origen: 'libre',
          tabla: '',
          columna: ''
        }));

        this.totalCampos =
          this.camposDetectados.length;

        // =========================
        // HTML REAL DE EXCEL
        // =========================

        const range = XLSX.utils.decode_range(firstSheet['!ref']!);

          // Buscar última fila con contenido real
          let ultimaFila = range.e.r;

          for (let R = range.e.r; R >= range.s.r; --R) {

            let tieneContenido = false;

            for (let C = range.s.c; C <= range.e.c; ++C) {

              const cellAddress =
                XLSX.utils.encode_cell({ r: R, c: C });

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

          // Crear rango limpio
          const nuevoRango = {
            s: { r: range.s.r, c: range.s.c },
            e: { r: ultimaFila, c: range.e.c }
          };

          firstSheet['!ref'] =
            XLSX.utils.encode_range(nuevoRango);

          // Generar HTML limpio
          let html = XLSX.utils.sheet_to_html(firstSheet);

        // Eliminar basura de SheetJS

        html = html
          .replace(/<caption>.*?<\/caption>/g, '')
          .replace(/id="[^"]*"/g, '')
          .replace(/class="[^"]*"/g, '');

        // Reemplazar campos

        html = html.replace(
          /\{([^}]+)\}/g,
          (_: string, campo: string) => {

            const limpio =
              campo.trim().toLowerCase();

            return `
              <span
                class="campo-doc"
                data-campo="${limpio}"
              >
                {${campo}}
              </span>
            `;
          }
        );

        this.previewHtmlOriginal = html;
        this.previewHtml = html;
      }

    this.cd.detectChanges();
}

  async subirPlantilla() {
    try { 
      if (!this.archivo) return;
      const exten = this.archivo.name.split('.').pop()?.toLowerCase();
      // const ruta = await this.plantillasService.subirDocumento(this.archivo, exten);
      const ruta = await this.plantillasService.subirDocumento(this.archivo);

      await this.plantillasService.guardarPlantilla({
        nombre: this.archivo.name,
        ruta_archivo: ruta,
        campos: this.camposDetectados,
        total_campos: this.totalCampos
      });

      alert("Plantilla guardada correctamente");
      
      this.archivo = null;
      this.camposDetectados = [];
      this.totalCampos = 0;
      this.previewHtml = '';
      this.previewHtmlOriginal = '';
      this.valoresCampos = {};
      this.cd.detectChanges();
    } catch (error: any) {
      alert(error.message);
    }
  }

  actualizarPreview() {
    let html = this.previewHtmlOriginal;

    Object.keys(this.valoresCampos).forEach(campo => {
      const valor = this.valoresCampos[campo];

      const regex = new RegExp(
        `<span class="campo-doc" data-campo="${campo}">.*?<\\/span>`,
        'g'
      );

      html = html.replace(
        regex,
        `<span class="campo-doc" data-campo="${campo}">
          ${valor || `{${campo}}`}
        </span>`
      );
    });

    this.previewHtml = html;
  }

  async cargarColumnas(campo: any) {
    if (!campo.tabla) return;

    if (this.columnasPorTabla[campo.tabla]) return;

    try {
      const columnas = await this.plantillasService.getColumnas(campo.tabla);
      this.columnasPorTabla[campo.tabla] = columnas;
    } catch (error) {
      console.error(error);
    }
  }
  
}