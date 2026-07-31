import { Injectable } from '@angular/core';
import { AuthService } from './auth';

@Injectable({
  providedIn: 'root'
})
export class CalendarioService {

  private supabase;

  constructor(private auth: AuthService) {
    this.supabase = this.auth.getClient();
  }

  async getCitas() {
    const { data, error } =
      await this.supabase
        .from('citas_medicas')
        .select(`
        *,
        pacientes(nombres,apellidos),
        perfiles(nombre_completo)
      `);

    if (error) throw error;

    return data;
  }

  async crearCita(cita: any) {
    const { error } =
      await this.supabase
        .from('citas_medicas')
        .insert([cita]);

    if (error) throw error;
  }

  async actualizarCita(id: string, datos: any) {
    const { error } =
      await this.supabase
        .from('citas_medicas')
        .update(datos)
        .eq('id', id);

    if (error) throw error;
  }

  async cancelarCita(id: string) {
    const { error } =
      await this.supabase
        .from('citas_medicas')
        .update({ estado: 'cancelada' })
        .eq('id', id);

    if (error) throw error;
  }

  async getPacientes() {
    const { data, error } =
      await this.supabase
        .from('pacientes')
        .select('*')
        .order('apellidos');

    if (error) throw error;

    return data;
  }

  async getMedicos() {
    const { data, error } =
      await this.supabase
        .from('perfiles')
        .select('*')
        .eq('rol', 'medico');

    if (error) throw error;

    return data;
  }

  async getSignosVitales(citaId: string) {
    const { data, error } =
      await this.supabase
        .from('signos_vitales')
        .select('*')
        .eq('cita_id', citaId)
        .maybeSingle();

    if (error) throw error;

    return data;
  }

  async guardarSignosVitales(datos: any) {
    const existente =
      await this.getSignosVitales(datos.cita_id);

    if (existente) {

      const { error } =
        await this.supabase
          .from('signos_vitales')
          .update(datos)
          .eq('cita_id', datos.cita_id);

      if (error) throw error;

    } else {

      const { error } =
        await this.supabase
          .from('signos_vitales')
          .insert([datos]);

      if (error) throw error;
    }
  }
}