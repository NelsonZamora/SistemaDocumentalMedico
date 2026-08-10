import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import { saveAs } from 'file-saver';
import * as mammoth from 'mammoth';
import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';

import Swal from 'sweetalert2';

import { PlantillasService } from '../../../services/plantillas';
import { PacientesService } from '../../../services/pacientes';
import { AtencionMedicaService } from '../../../services/atencion-medica';


@Component({
  selector: 'app-generar-documento',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './generar-documento.html',
  styleUrl: './generar-documento.scss'
})
export class GenerarDocumentoComponent implements OnInit {

  pacientes = signal<any[]>([]);
  plantillas = signal<any[]>([]);
  atenciones = signal<any[]>([]);

  pacienteSeleccionado = signal<any>(null);
  plantillaSeleccionada = signal<any>(null);
  atencionSeleccionada = signal<any>(null);

  camposPlantilla = signal<any[]>([]);

  previewHtml = signal<string>('');
  cargando = signal<boolean>(true);

  contextoClinico: any = null;
  valoresCampos: any = {};
  previewHtmlOriginal = '';
  tipoArchivo = '';

  constructor(
    private plantillasService: PlantillasService,
    private pacientesService: PacientesService,
    private generarDocumentoService: AtencionMedicaService
  ) { }

  async ngOnInit() {
    this.contextoClinico = history.state?.contextoClinico;
    await this.cargarDatos();
    await this.cargarContexto();
  }

  async cargarContexto() {
    const pts = this.pacientes();

    if (this.contextoClinico?.paciente_id) {
      const encontrado = pts.find(p => p.id === this.contextoClinico.paciente_id);
      this.pacienteSeleccionado.set(encontrado || null);
    }

    if (this.contextoClinico?.atencion_medica_id) {
      const dataAtenciones = await this.generarDocumentoService.getAtencionesMedicasbyId(this.contextoClinico.paciente_id);
      this.atenciones.set(dataAtenciones);
      console.log(this.atenciones())
      const encontrada = dataAtenciones.find(a => a.id === this.contextoClinico.atencion_medica_id);
      this.atencionSeleccionada.set(encontrada || null);
      console.log(this.atencionSeleccionada())
    }
  }

  async cargarDatos() {
    try {
      const pts = await this.pacientesService.getPacientes();
      const plts = await this.plantillasService.getPlantillas();

      this.pacientes.set(pts);
      this.plantillas.set(plts);
      this.cargando.set(false);
    } catch (error) {
      console.error(error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Ha ocurrido un error cargando la información'
      });
    }
  }

  async cargarAtenciones() {
    try {
      const dataAtenciones = await this.generarDocumentoService.getAtencionesMedicasbyId(this.pacienteSeleccionado().id);
      this.atenciones.set(dataAtenciones);
    } catch (error) {
      console.error(error);
    }
  }

  async seleccionarPaciente() {
    await this.cargarAtenciones();
    await this.seleccionarPlantilla();
  }

  async seleccionarPlantilla() {
    const plantillaActual = this.plantillaSeleccionada();
    const pacienteActual = this.pacienteSeleccionado();

    if (!plantillaActual || !pacienteActual) return;

    try {
      const copiaCampos = structuredClone(plantillaActual.contenido_json.campos || []);
      this.camposPlantilla.set(copiaCampos);

      const archivo = await this.plantillasService.descargarPlantilla(plantillaActual.archivo_url_path);
      const arrayBuffer = await archivo.arrayBuffer();

      const extension = plantillaActual.archivo_url_path.split('.').pop()?.toLowerCase();
      this.tipoArchivo = extension || '';

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

      this.valoresCampos = {};

      for (const campo of copiaCampos) {
        if (campo.origen === 'bd') {
          this.valoresCampos[campo.nombre] = pacienteActual[campo.columna] || '';
        } else {
          this.valoresCampos[campo.nombre] = '';
        }
      }

      this.actualizarPreview();
    } catch (error) {
      console.error(error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Ha ocurrido un error cargando la plantilla'
      });
    }
  }

  seleccionarAtencion() {
    if (!this.atencionSeleccionada()) return;
    this.actualizarCamposAtencion();
  }

  actualizarCamposAtencion() {
    const atencion = this.atencionSeleccionada();
    if (!atencion) return;

    const signos = atencion.signos_vitales || {};

    for (const campo of this.camposPlantilla()) {

      if (campo.origen === 'bd') {
        if (atencion[campo.columna] !== undefined && atencion[campo.columna] !== null) {
          this.valoresCampos[campo.nombre] = atencion[campo.columna];
        }
        else if (signos[campo.columna] !== undefined && signos[campo.columna] !== null) {
          this.valoresCampos[campo.nombre] = signos[campo.columna];
        }
      }

    }

    this.actualizarPreview();
  }

  actualizarPreview() {
    let html = this.previewHtmlOriginal;
    console.log(this.camposPlantilla())
    for (const campo of this.camposPlantilla()) {
      const nombreCampo = campo.nombre.trim();
      const valor = this.valoresCampos[nombreCampo] || '';
      const regex = new RegExp(`\\{\\s*${nombreCampo}\\s*\\}`, 'gi');

      html = html.replace(regex, valor || `{${nombreCampo}}`);
    }

    this.previewHtml.set(html);
  }

  async generarDocumento() {
    const plantillaActual = this.plantillaSeleccionada();
    const pacienteActual = this.pacienteSeleccionado();

    try {
      const archivo = await this.plantillasService.descargarPlantilla(plantillaActual.archivo_url_path);
      const arrayBuffer = await archivo.arrayBuffer();
      const extension = this.tipoArchivo;
      const nombreArchivo = `documento-${Date.now()}`;

      if (extension === 'docx') {
        const zip = new PizZip(arrayBuffer);
        const doc = new Docxtemplater(zip, {
          paragraphLoop: true,
          linebreaks: true,
          parser(tag: string) {
            const limpio = tag.trim().toLowerCase().replace(/\s+/g, '_');
            return { get(scope: any) { return scope[limpio]; } };
          }
        });

        const datosRender: any = {};
        Object.keys(this.valoresCampos).forEach(key => {
          const keyNormalizada = key.trim().toLowerCase().replace(/\s+/g, '_');
          datosRender[keyNormalizada] = this.valoresCampos[key];
        });

        doc.render(datosRender);
        const output = doc.getZip().generate({
          type: 'blob',
          mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        });

        const ruta = await this.plantillasService.subirDocumentoGenerado(output, nombreArchivo, 'docx');

        await this.plantillasService.registrarDocumento({
          paciente_id: pacienteActual.id,
          plantilla_id: plantillaActual.id,
          contenido_final: this.valoresCampos,
          archivo_final_path: ruta
        });

        saveAs(output, `${nombreArchivo}.docx`);
      }
      else if (extension === 'xlsx' || extension === 'xls') {
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(arrayBuffer);

        workbook.worksheets.forEach(sheet => {
          sheet.eachRow(row => {
            row.eachCell(cell => {
              if (typeof cell.value === 'string') {
                let texto = cell.value;
                Object.keys(this.valoresCampos).forEach(campo => {
                  const valor = this.valoresCampos[campo] || '';
                  const regex = new RegExp(`\\{\\s*${campo}\\s*\\}`, 'gi');
                  texto = texto.replace(regex, valor);
                });
                cell.value = texto;
              }
            });
          });
        });

        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });

        const ruta = await this.plantillasService.subirDocumentoGenerado(blob, nombreArchivo, 'xlsx');

        await this.plantillasService.registrarDocumento({
          paciente_id: pacienteActual.id,
          plantilla_id: plantillaActual.id,
          contenido_final: this.valoresCampos,
          archivo_final_path: ruta
        });

        saveAs(blob, `${nombreArchivo}.xlsx`);
      }

      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: 'Se ha generado el documento correctamente',
        showConfirmButton: false,
        timer: 2500,
        timerProgressBar: true
      });
      this.limpiarFormulario();
    } catch (error) {
      console.error(error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Ha ocurrido un error generando el documento'
      });
    }
  }

  limpiarFormulario() {
    this.pacienteSeleccionado.set(null);
    this.plantillaSeleccionada.set(null);
    this.atencionSeleccionada.set(null);
    this.atenciones.set([]);
    this.camposPlantilla.set([]);
    this.previewHtml.set('');
    this.previewHtmlOriginal = '';
    this.valoresCampos = {};
    this.tipoArchivo = '';
  }
}