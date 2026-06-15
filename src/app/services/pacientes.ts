import { Injectable } from '@angular/core';
import { AuthService } from './auth';

@Injectable({
  providedIn: 'root'
})
export class PacientesService {

  private supabase;

  constructor(private auth: AuthService) {
    this.supabase = this.auth.getClient();
  }

  async getPacientes() {
    const { data, error } = await this.supabase
      .from('pacientes')
      .select('*');

    if (error) throw error;
    return data;
  }

  async getPacienteHistorial(pacienteId: string) {
    const { data, error } = await this.supabase
      .from('citas_medicas')
      .select('*')
      .eq('paciente_id', pacienteId);

    if (error) throw error;
    return data;
  }

  async getDocumentosPaciente(pacienteId: string) {
    const { data, error } = await this.supabase
      .from('documentos')
      .select(`
        id,
        estado,
        creado_at,
        archivo_final_path,
        plantillas (
          nombre_plantilla
        )
      `)
      .eq('paciente_id', pacienteId)
      .order('creado_at', { ascending: false });

    if (error) throw error;

    return data;
  }

  async crearPaciente(paciente: any) {

    const { data, error } = await this.supabase
      .from('pacientes')
      .insert([paciente]);
    if (error) throw error;

    return data;
  }

  async subirFoto(file: File) {
    const extension = file.name.split('.').pop();
    const fileName = `pacientes/${crypto.randomUUID()}.${extension}`;

    const { error } = await this.supabase.storage
      .from('pacientes')
      .upload(fileName, file);

    if (error) throw error;

    return fileName;
  }

  async getFotoUrl(path: string) {
    const { data, error } = await this.supabase.storage
      .from('pacientes')
      .createSignedUrl(path, 60 * 60);

    if (error) throw error;

    return data.signedUrl;

  }

  async eliminarFoto(path: string) {
    const { error } = await this.supabase.storage
      .from('pacientes')
      .remove([path]);

    if (error) throw error;
  }

    async actualizarPaciente(id: number, paciente: any) {

      const { error } = await this.supabase
        .from('pacientes')
        .update(paciente)
        .eq('id', id);

      if (error) throw error;
    }

}