import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PlantillasService } from '../../services/plantillas';
import * as mammoth from 'mammoth';

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

  previewHtmlOriginal: string = ''; // 🔥 base sin modificar
  valoresCampos: any = {}; 

  constructor(private plantillasService: PlantillasService) {}

  onFileSelected(event: any) {
    this.archivo = event.target.files[0];
  }

  // 🔍 Analizar documento
  async analizarDocumento() {
    if (!this.archivo) return;

    const arrayBuffer = await this.archivo.arrayBuffer();

    // TEXTO PLANO (para detectar campos)
    const result = await mammoth.extractRawText({ arrayBuffer });
    const texto = result.value; 

    // 🔥 Detectar {campos}
    const regex = /\{([^}]+)\}/g;
    const matches = [...texto.matchAll(regex)];

    this.camposDetectados = [...new Set(matches.map(m => m[1].trim()))]
      .map(c => ({
        nombre: c.toLowerCase(),
        tipo: 'text'
      }));

    this.totalCampos = this.camposDetectados.length;

      // 🔥 PREVIEW VISUAL (HTML)
    const htmlResult = await mammoth.convertToHtml({ arrayBuffer });

    let html = htmlResult.value;

    html = html.replace(/\{([^}]+)\}/g, (_, campo) => {
      const limpio = campo.trim().toLowerCase();
      return `<span class="campo-doc" data-campo="${limpio}">{${campo}}</span>`;
    });

    this.previewHtmlOriginal = html;
    this.previewHtml = html;

    console.log("Campos:", this.camposDetectados);
  }

  // 🚀 Subir + guardar
  async subirPlantilla() {
    try { 
      if (!this.archivo) return;

      // 1. Subir archivo
      const ruta = await this.plantillasService.subirDocumento(this.archivo);

      // 2. Guardar metadata
      await this.plantillasService.guardarPlantilla({
        nombre: this.archivo.name,
        ruta_archivo: ruta,
        campos: this.camposDetectados,
        total_campos: this.totalCampos
      });

      alert("Plantilla guardada correctamente");

      // reset
      
      this.archivo = null;
      this.camposDetectados = [];
      this.totalCampos = 0;
      this.previewHtml = '';
      this.previewHtmlOriginal = '';
      this.valoresCampos = {};

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

  async guardarPlantilla() {
  try {
    if (!this.archivo) return;

    const ruta = await this.plantillasService.subirDocumento(this.archivo);

    const camposFormateados = this.camposDetectados.map(c => ({
      nombre: c,
      tipo: 'text' // luego podrás cambiar dinámicamente
    }));

    await this.plantillasService.guardarPlantilla({
      nombre: this.archivo.name,
      ruta: ruta,
      campos: camposFormateados
    });

    alert('Guardado correctamente');

  } catch (error: any) {
    alert(error.message);
  }
}
}