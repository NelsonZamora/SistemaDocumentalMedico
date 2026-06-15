import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PlantillasService } from '../../../services/plantillas';
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

  plantillas: any[] = [];
  cargando = true;
  
  modalEditar = false;
  plantillaEditando: any = null;
  camposDetectados: any[] = [];
  previewHtml = '';
  previewHtmlOriginal = '';
  valoresCampos: any = {};
  columnasPorTabla: any = {};
  tablasDisponibles = ['pacientes'];
  camposOriginales: any[] = [];

  constructor(private plantillasService: PlantillasService, private cd: ChangeDetectorRef) {}

  async ngOnInit() {
    await this.cargarPlantillas();
  }

  async cargarPlantillas() {
    try {

      this.cargando = true;

      this.plantillas = await this.plantillasService.getPlantillas();
      this.cargando = false;
      this.cd.detectChanges();

    } catch (error) {
      console.error(error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Ha ocurrido un error cargando las plantillas'
      });
    }
  }

  // async abrirEditar(plantilla: any) {

  //   this.plantillaEditando = plantilla;
  //   this.camposOriginales = structuredClone(
  //     plantilla.contenido_json.campos || []
  //   );
  //   this.camposDetectados = structuredClone(
  //     plantilla.contenido_json.campos || []
  //   );
  //   this.previewHtml =
  //     plantilla.preview_html || '';
  //   this.previewHtmlOriginal =
  //     plantilla.preview_html || '';
  //   for (const campo of this.camposDetectados) {
  //     if (
  //       campo.origen === 'bd' &&
  //       campo.tabla
  //     ) {
  //       await this.cargarColumnas(campo);
  //     }
  //   }
  //   this.modalEditar = true;
  //   this.cd.detectChanges();
  // }

  async abrirEditar(plantilla: any) {

  try {

    this.plantillaEditando = plantilla;

    this.camposOriginales = structuredClone(
      plantilla.contenido_json.campos || []
    );

    this.camposDetectados = structuredClone(
      plantilla.contenido_json.campos || []
    );

    this.valoresCampos = {};

    // =========================
    // CARGAR COLUMNAS
    // =========================

    for (const campo of this.camposDetectados) {

      if (
        campo.origen === 'bd' &&
        campo.tabla
      ) {

        await this.cargarColumnas(campo);

      }

    }

    // =========================
    // DESCARGAR PLANTILLA
    // =========================

    const archivo =
      await this.plantillasService.descargarPlantilla(
        plantilla.archivo_url_path
      );

    const arrayBuffer =
      await archivo.arrayBuffer();

    const extension =
      plantilla.archivo_url_path
        .split('.')
        .pop()
        ?.toLowerCase();

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

      const workbook =
        XLSX.read(arrayBuffer, {
          type: 'array'
        });

      const firstSheet =
        workbook.Sheets[
          workbook.SheetNames[0]
        ];

      const range =
        XLSX.utils.decode_range(
          firstSheet['!ref']!
        );

      let ultimaFila =
        range.e.r;

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

          const addr =
            XLSX.utils.encode_cell({
              r: R,
              c: C
            });

          const cell =
            firstSheet[addr];

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

          s: {
            r: range.s.r,
            c: range.s.c
          },

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
        .replace(
          /id="[^"]*"/g,
          ''
        )
        .replace(
          /class="[^"]*"/g,
          ''
        );

      html = html.replace(
        />([^<]*\{([^}]+)\}[^<]*)</g,
        (match, contenido, campo) => {

          const limpio =
            campo.trim().toLowerCase();

          const reemplazo =
            contenido.replace(
              `{${campo}}`,
              `<span class="campo-doc" data-campo="${limpio}">
                {${campo}}
              </span>`
            );

          return `>${reemplazo}<`;
        }
      );

      this.previewHtmlOriginal =
        html;

    }

    this.previewHtml =
      this.previewHtmlOriginal;

    this.modalEditar = true;

    this.cd.detectChanges();

  } catch (error) {

    console.error(error);

    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'Ha ocurrido un error cargando la vista previa'
    });

  }

}

  async guardarCambios() {
    try {
      await this.plantillasService.actualizarPlantilla(
        this.plantillaEditando.id,
        this.camposDetectados
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
      this.modalEditar = false;
      await this.cargarPlantillas();
      this.cd.detectChanges();
    } catch (error) {
      console.error(error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Ocurrio un error al actualizar la plantilla'
      });
    }
  }

  async cargarColumnas(campo: any) {

    if (!campo.tabla) return;

    try {

      const columnas =
        await this.plantillasService.getColumnas(campo.tabla);

      this.columnasPorTabla = {
        ...this.columnasPorTabla,
        [campo.tabla]: columnas
      };
      this.cd.detectChanges();
    } catch (error) {

      console.error(error);

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
    this.cd.detectChanges();
  }

  cambiarOrigen(campo: any) {
    if (campo.origen === 'libre') {
      campo.tabla = '';
      campo.columna = '';

    }
  }

  cerrarModal() {
    this.camposDetectados = structuredClone(
      this.camposOriginales
    );
    this.modalEditar = false;
    this.cd.detectChanges();
  }

}