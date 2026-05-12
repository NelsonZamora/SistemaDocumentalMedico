import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChangeDetectorRef } from '@angular/core';

import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import { saveAs } from 'file-saver';
import * as mammoth from 'mammoth';

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

    if (
      !this.plantillaSeleccionada ||
      !this.pacienteSeleccionado
    ) return;

    try {

      // CAMPOS
      this.camposPlantilla =
        structuredClone(
          this.plantillaSeleccionada
            .contenido_json.campos || []
        );

      // DESCARGAR DOCX DESDE SUPABASE
      const archivo =
        await this.plantillasService
          .descargarPlantilla(
            this.plantillaSeleccionada
              .archivo_url_path
          );

      // ARRAY BUFFER
      const arrayBuffer =
        await archivo.arrayBuffer();

      // CONVERTIR DOCX -> HTML
      const htmlResult =
        await mammoth.convertToHtml({
          arrayBuffer
        });

      let html = htmlResult.value;

      // REEMPLAZAR CAMPOS POR SPAN
      html = html.replace(
        /\{([^}]+)\}/g,
        (_, campo) => {

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

      // LIMPIAR VALORES
      this.valoresCampos = {};

      // PRECARGAR DESDE PACIENTE
      for (const campo of this.camposPlantilla) {

        // BASE DE DATOS
        if (campo.origen === 'bd') {

          this.valoresCampos[campo.nombre] =
            this.pacienteSeleccionado[
              campo.columna
            ] || '';

        }

        // LIBRE
        else {

          this.valoresCampos[campo.nombre] = '';

        }
      }

      // ACTUALIZAR PREVIEW
      this.actualizarPreview();

      this.cd.detectChanges();

    } catch (error) {

      console.error(error);

      alert(
        'Error cargando la plantilla'
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

      // REEMPLAZAR {campo}
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

      // DESCARGAR PLANTILLA
      const archivo =
        await this.plantillasService
          .descargarPlantilla(
            this.plantillaSeleccionada.archivo_url_path
          );

      // ARRAY BUFFER
      const arrayBuffer =
        await archivo.arrayBuffer();

      // ZIP DOCX
      const zip =
        new PizZip(arrayBuffer);

      // DOCX TEMPLATE
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

      // REEMPLAZAR CAMPOS
      //doc.render(this.valoresCampos);

      const datosRender: any = {};

        Object.keys(this.valoresCampos)
          .forEach(key => {

            // NORMALIZAR KEY
            const keyNormalizada = key
              .trim()
              .toLowerCase()
              .replace(/\s+/g, '_');

            datosRender[keyNormalizada] =
              this.valoresCampos[key];

          });

        console.log(datosRender);

        // CONFIGURAR PARSER FLEXIBLE
        // doc.setOptions({
        //   parser(tag: string) {

        //     const limpio = tag
        //       .trim()
        //       .toLowerCase()
        //       .replace(/\s+/g, '_');

        //     return {
        //       get(scope: any) {
        //         return scope[limpio];
        //       }
        //     };
        //   }
        // });

        doc.render(datosRender);


      // GENERAR DOCX FINAL
      const output =
        doc.getZip().generate({
          type: 'blob',
          mimeType:
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        });

      // NOMBRE
      const nombreArchivo =
        `documento-${Date.now()}`;

      // SUBIR
      const ruta =
        await this.plantillasService
          .subirDocumentoGenerado(
            output,
            nombreArchivo
          );

      // REGISTRAR
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
      // DESCARGA OPCIONAL
      saveAs(
        output,
        `${nombreArchivo}.docx`
      );

      alert(
        'Documento generado correctamente'
      );

      // LIMPIAR FORMULARIO
      this.pacienteSeleccionado = null;

      this.plantillaSeleccionada = null;

      this.camposPlantilla = [];

      this.valoresCampos = {};

      this.previewHtml = '';

      this.previewHtmlOriginal = '';

      this.cd.detectChanges();

      
      
    } catch (error) {

      console.error(error);
      alert(
        'Error generando documento'
      );

    }
  }

}