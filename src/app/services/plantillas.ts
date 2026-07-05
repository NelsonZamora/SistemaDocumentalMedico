import { Injectable } from '@angular/core';
import { AuthService } from './auth';

@Injectable({
  providedIn: 'root'
})
export class PlantillasService {

  private supabase;

  constructor(private auth: AuthService) {
    this.supabase = this.auth.getClient();
  }

  async subirDocumento(file: File) {
    const extension = file.name.split('.').pop()?.toLowerCase();

    const fileName = `documentos/${crypto.randomUUID()}.${extension}`;

    const { error } = await this.supabase.storage
      .from('documentos')
      .upload(fileName, file);

    if (error) throw error;

    return fileName;
  }

  async guardarPlantilla(data: any) {
    const userId = await this.auth.getUserId();
    const { error } = await this.supabase
      .from('plantillas')
      .insert([{
        nombre_plantilla: data.nombre,
        archivo_url_path: data.ruta_archivo,
        contenido_json: {
          campos: data.campos
        },
        total_campos: data.campos.length,
        creado_por: userId
      }]);

    if (error) throw error;
  }

  async getPlantillas() {
    const { data, error } = await this.supabase
      .from('plantillas')
      .select('*')
      .order('creado_at', { ascending: false });

    if (error) {
      console.error(error);
      throw error;
    }
    return data;
  }

  async getColumnas(tabla: string) {
      const { data, error } = await this.supabase
        .rpc('obtener_columnas', { tabla });

      if (error) throw error;

      return data.map((c: any) => c.columna);
  }

  async actualizarPlantilla(id: string, campos: any[]) {

    const { error } = await this.supabase
      .from('plantillas')
      .update({
        contenido_json: {
          campos
        }
      })
      .eq('id', id);

    if (error) throw error;
  }


  async guardarDocumentoGenerado(
    archivo: Blob,
    nombreArchivo: string,
    data: any
  ) {

    const userId = await this.auth.getUserId();

    const filePath =
      `documentos/${crypto.randomUUID()}-${nombreArchivo}.html`;

    const { error: uploadError } =
      await this.supabase.storage
        .from('documentos_generados')
        .upload(filePath, archivo, {
          contentType: 'text/html'
        });

    if (uploadError) throw uploadError;

    const { error: dbError } =
      await this.supabase
        .from('documentos')
        .insert([{
          paciente_id: data.paciente_id,
          plantilla_id: data.plantilla_id,
          contenido_final: data.contenido_final,
          archivo_final_path: filePath,
          creado_por: userId,
          estado: 'finalizado'
        }]);

    if (dbError) throw dbError;

    return filePath;
  }

  async descargarPlantilla(path: string) {

    const { data, error } =
      await this.supabase.storage
        .from('documentos')
        .download(path);

    if (error) throw error;

    return data;
  }

  async subirDocumentoGenerado(
    file: Blob,
    nombre: string,
    extension: string
  ) {
    const path =
      `documentos/${crypto.randomUUID()}-${nombre}.${extension}`;

    const { error } =
      await this.supabase.storage
        .from('documentos_generados')
        .upload(path, file, {
          contentType:
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        });
    if (error) throw error;
    return path;
  }

  async registrarDocumento(data: any) {
    const userId = await this.auth.getUserId();
    const { error } =
      await this.supabase
        .from('documentos')
        .insert([{
          paciente_id: data.paciente_id,
          plantilla_id: data.plantilla_id,
          contenido_final: data.contenido_final,
          archivo_final_path: data.archivo_final_path,
          creado_por: userId,
          estado: 'finalizado'
        }]);
    if (error) throw error;
  }
  
}

export const CONFIGURACION_TABLAS: Record<string, Record<string, string>> = {
  pacientes: {
    cedula: 'Cédula',
    nombres: 'Nombres',
    apellidos: 'Apellidos',
    fecha_nacimiento: 'Fecha de Nacimiento',
    telefono: 'Teléfono',
    correo: 'Correo',
    genero: 'Genero',
    antecedente_personal: 'Antecedentes Personales',
    antecedente_familiar: 'Antecedentes Familiares',
    antecedente_alergias: 'Antecedentes de Alergias'
  },
  citas_medicas: {
    motivo: 'Motivo de consulta',
    fecha: 'Fecha de la cita',
    estado: 'Estado'
  },
  atenciones_medicas: {
    motivo_consulta: 'Motivo de consulta',
    enfermedad_actual: 'Enfermedad actual',
    diagnostico: 'Diagnóstico',
    tratamiento: 'Tratamiento',
    examen_fisico: 'Examen Fisico',
    observaciones: 'Observaciones'
  },
  signos_vitales: {
    presion_arterial: 'Presion Arterial',
    frecuencia_cardiaca: 'Frecuencia Cardiaca',
    saturacion: 'Saturacion',
    temperatura: 'Temperatura',
    peso: 'Peso',
    talla: 'Talla'
  }
};