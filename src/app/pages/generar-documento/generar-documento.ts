import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChangeDetectorRef } from '@angular/core';

import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import { saveAs } from 'file-saver';
import * as mammoth from 'mammoth';
import * as XLSX from 'xlsx';

import { PlantillasService } from '../../services/plantillas';
import { PacientesService } from '../../services/pacientes';

@Component({
  selector: 'app-generar-documento',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './generar-documento.html',
  styleUrl: './generar-documento.scss'
})
export class GenerarDocumentoComponent implements OnInit {

  pacientes: any[] = [];
  plantillas: any[] = [];

  pacienteSeleccionado: any = null;
  plantillaSeleccionada: any = null;

  camposPlantilla: any[] = [];

  valoresCampos: any = {};

  previewHtml = '';
  previewHtmlOriginal = '';
  tipoArchivo = '';

  cargando = true;

  constructor(
    private plantillasService: PlantillasService,
    private pacientesService: PacientesService,
    private cd: ChangeDetectorRef
  ) {}

  async ngOnInit() {

    await this.cargarDatos();

  }

  async cargarDatos() {

    try {


      this.pacientes =
        await this.pacientesService.getPacientes();

      this.plantillas =
        await this.plantillasService.getPlantillas();

      this.cargando = false;
      this.cd.detectChanges();

    } catch (error) {

      console.error(error);

      alert('Error cargando información');

    }
  }

  async seleccionarPlantilla() {
    this.cd.detectChanges();

    
    if (
      !this.plantillaSeleccionada ||
      !this.pacienteSeleccionado
    ) return;

    try {

      this.camposPlantilla =
        structuredClone(
          this.plantillaSeleccionada
            .contenido_json.campos || []
        );

      const archivo =
        await this.plantillasService
          .descargarPlantilla(
            this.plantillaSeleccionada
              .archivo_url_path
          );

      const arrayBuffer =
        await archivo.arrayBuffer();

      // =========================
      // DETECTAR TIPO
      // =========================

      const extension =
        this.plantillaSeleccionada
          .archivo_url_path
          .split('.')
          .pop()
          ?.toLowerCase();

      this.tipoArchivo = extension || '';

      // =========================
      // WORD
      // =========================

      if (extension === 'docx') {

        const htmlResult =
          await mammoth.convertToHtml({
            arrayBuffer
          });

        let html = htmlResult.value;

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
      }

      // =========================
      // EXCEL
      // =========================

      else if (
        extension === 'xlsx' ||
        extension === 'xls'
      ) {

        const workbook = XLSX.read(
          arrayBuffer,
          { type: 'array' }
        );

        const firstSheet =
          workbook.Sheets[
            workbook.SheetNames[0]
          ];

        // Limpiar filas vacías
        const range = XLSX.utils.decode_range(
          firstSheet['!ref']!
        );

        let ultimaFila = range.e.r;

        for (
          let R = range.e.r;
          R >= range.s.r;
          --R
        ) {

          let tieneContenido = false;

          for (
            let C = range.s.c;
            C <= range.e.c;
            ++C
          ) {

            const cellAddress =
              XLSX.utils.encode_cell({
                r: R,
                c: C
              });

            const cell =
              firstSheet[cellAddress];

            if (
              cell &&
              cell.v !== undefined &&
              cell.v !== ''
            ) {

              tieneContenido = true;
              break;
            }
          }

          if (tieneContenido) {
            ultimaFila = R;
            break;
          }
        }

        firstSheet['!ref'] =
          XLSX.utils.encode_range({
            s: range.s,
            e: {
              r: ultimaFila,
              c: range.e.c
            }
          });

        let html =
          XLSX.utils.sheet_to_html(
            firstSheet
          );

        html = html
          .replace(
            /<caption>.*?<\/caption>/g,
            ''
          )
          .replace(/id="[^"]*"/g, '')
          .replace(/class="[^"]*"/g, '');

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
      }

      // =========================
      // CARGAR DATOS
      // =========================

      this.valoresCampos = {};

      for (const campo of this.camposPlantilla) {

        if (campo.origen === 'bd') {

          this.valoresCampos[campo.nombre] =
            this.pacienteSeleccionado[
              campo.columna
            ] || '';
        }

        else {

          this.valoresCampos[campo.nombre] =
            '';
        }
      }

      this.actualizarPreview();

      this.cd.detectChanges();

    } catch (error) {

      console.error(error);

      alert(
        'Error cargando plantilla'
      );
    }
  }

  actualizarPreview() {

    let html = this.previewHtmlOriginal;

    for (const campo of this.camposPlantilla) {

      const nombreCampo =
        campo.nombre.trim();

      const valor =
        this.valoresCampos[nombreCampo] || '';

      const regex = new RegExp(
        `\\{\\s*${nombreCampo}\\s*\\}`,
        'gi'
      );

      html = html.replace(
        regex,
        valor || `{${nombreCampo}}`
      );

    }

    this.previewHtml = html;

    this.cd.detectChanges();
  }

  async generarDocumento() {

    try {

      const archivo =
        await this.plantillasService
          .descargarPlantilla(
            this.plantillaSeleccionada
              .archivo_url_path
          );

      const arrayBuffer =
        await archivo.arrayBuffer();

      const extension =
        this.tipoArchivo;

      const nombreArchivo =
        `documento-${Date.now()}`;

      // =========================
      // WORD
      // =========================

      if (extension === 'docx') {

        const zip =
          new PizZip(arrayBuffer);

        const doc =
          new Docxtemplater(zip, {

            paragraphLoop: true,
            linebreaks: true,

            parser(tag: string) {

              const limpio = tag
                .trim()
                .toLowerCase()
                .replace(/\s+/g, '_');

              return {

                get(scope: any) {

                  return scope[limpio];

                }

              };

            }

          });

        const datosRender: any = {};

        Object.keys(this.valoresCampos)
          .forEach(key => {

            const keyNormalizada = key
              .trim()
              .toLowerCase()
              .replace(/\s+/g, '_');

            datosRender[keyNormalizada] =
              this.valoresCampos[key];

          });

        doc.render(datosRender);

        const output =
          doc.getZip().generate({

            type: 'blob',

            mimeType:
              'application/vnd.openxmlformats-officedocument.wordprocessingml.document'

          });

        const ruta =
          await this.plantillasService
            .subirDocumentoGenerado(
              output,
              nombreArchivo,
              'docx'
            );

        await this.plantillasService
          .registrarDocumento({

            paciente_id:
              this.pacienteSeleccionado.id,

            plantilla_id:
              this.plantillaSeleccionada.id,

            contenido_final:
              this.valoresCampos,

            archivo_final_path:
              ruta
          });

        saveAs(
          output,
          `${nombreArchivo}.docx`
        );
      }

      // =========================
      // EXCEL
      // =========================

      else if (
        extension === 'xlsx' ||
        extension === 'xls'
      ) {

        const workbook =
          XLSX.read(arrayBuffer, {
            type: 'array'
          });

        const sheet =
          workbook.Sheets[
            workbook.SheetNames[0]
          ];

        Object.keys(sheet).forEach(
          cellKey => {

            if (
              cellKey.startsWith('!')
            ) return;

            const cell = sheet[cellKey];

            if (
              typeof cell.v === 'string'
            ) {

              Object.keys(
                this.valoresCampos
              ).forEach(campo => {

                const valor =
                  this.valoresCampos[campo];

                const regex =
                  new RegExp(
                    `\\{\\s*${campo}\\s*\\}`,
                    'gi'
                  );

                cell.v =
                  cell.v.replace(
                    regex,
                    valor || ''
                  );
              });
            }
          }
        );

        const output =
          XLSX.write(
            workbook,
            {
              bookType: 'xlsx',
              type: 'array'
            }
          );

        const blob =
          new Blob(
            [output],
            {
              type:
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            }
          );

        const ruta =
          await this.plantillasService
            .subirDocumentoGenerado(
              blob,
              nombreArchivo,
              'xlsx'
            );

        await this.plantillasService
          .registrarDocumento({

            paciente_id:
              this.pacienteSeleccionado.id,

            plantilla_id:
              this.plantillaSeleccionada.id,

            contenido_final:
              this.valoresCampos,

            archivo_final_path:
              ruta
          });

        saveAs(
          blob,
          `${nombreArchivo}.xlsx`
        );
      }

      alert(
        'Documento generado correctamente'
      );

    } catch (error) {

      console.error(error);

      alert(
        'Error generando documento'
      );
    }
  }

}