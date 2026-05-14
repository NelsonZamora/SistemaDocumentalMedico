import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PlantillasService } from '../../services/plantillas';
import { ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';

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
      alert('Error cargando plantillas');
    }
  }

  async abrirEditar(plantilla: any) {

    this.plantillaEditando = plantilla;
    this.camposOriginales = structuredClone(
      plantilla.contenido_json.campos || []
    );
    this.camposDetectados = structuredClone(
      plantilla.contenido_json.campos || []
    );
    this.previewHtml =
      plantilla.preview_html || '';
    this.previewHtmlOriginal =
      plantilla.preview_html || '';
    for (const campo of this.camposDetectados) {
      if (
        campo.origen === 'bd' &&
        campo.tabla
      ) {
        await this.cargarColumnas(campo);
      }
    }
    this.modalEditar = true;
    this.cd.detectChanges();
  }

  async guardarCambios() {
    try {
      await this.plantillasService.actualizarPlantilla(
        this.plantillaEditando.id,
        this.camposDetectados
      );
      alert('Plantilla actualizada');
      this.modalEditar = false;
      await this.cargarPlantillas();
    } catch (error) {
      console.error(error);
      alert('Error actualizando');
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
  }

}