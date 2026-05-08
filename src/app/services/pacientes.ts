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
      .createSignedUrl(path, 60 * 60); // 1 hora

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