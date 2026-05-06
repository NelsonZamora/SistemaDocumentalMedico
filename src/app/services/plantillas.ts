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

  // 📤 Subir documento
  async subirDocumento(file: File) {
    const fileName = `documentos/${crypto.randomUUID()}.docx`;

    const { error } = await this.supabase.storage
      .from('documentos')
      .upload(fileName, file);

    if (error) throw error;

    return fileName;
  }

  // 💾 Guardar metadata
  async guardarPlantilla(data: any) {
  const userId = await this.auth.getUserId();

  const { error } = await this.supabase
    .from('plantillas')
    .insert([{
      nombre_plantilla: data.nombre,
      archivo_url_path: data.ruta,
      contenido_json: {
        campos: data.campos
      },
      total_campos: data.campos.length,
      creado_por: userId
    }]);

  if (error) throw error;
}

  // 📥 Obtener plantillas
  async getPlantillas() {
    const { data, error } = await this.supabase
      .from('plantillas')
      .select('*');

    if (error) throw error;
    return data;
  }

  
}