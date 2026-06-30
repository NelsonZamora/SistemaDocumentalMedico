import { Injectable } from '@angular/core';
import { AuthService } from './auth';

@Injectable({
  providedIn: 'root'
})
export class UsuariosService {

  private supabase;


  constructor(
    private auth: AuthService
  ) { this.supabase = this.auth.getClient(); }

  async crearUsuario(data: any) {
    const {
      data: response,
      error
    } =
      await this.supabase.functions.invoke(
        'crear-usuario',
        { body: data }
      );

    if (error) {
      throw error;
    }

    return response;
  }

  async getUsuarios() {
    const {
      data,
      error
    } =
      await this.supabase
        .from('perfiles')
        .select('*')
      ;
    if (error) {
      throw error;
    }
    return data;
  }

  async cambiarEstado(
    id: string,
    activo: boolean
  ) {

    const { error } =
      await this.supabase
        .from('perfiles')
        .update({
          activo
        })
        .eq('id', id);

    if (error) throw error;
  }

  async cambiarRol(
    id: string,
    rol: string
  ) {

    const { error } =
      await this.supabase
        .from('perfiles')
        .update({
          rol
        })
        .eq('id', id);

    if (error) throw error;
  }

  async resetearPassword(
    userId: string,
    password: string
  ) {

    const { data, error } =
      await this.supabase.functions.invoke(
        'admin-reset-password',
        {
          body: {
            userId,
            password
          }
        }
      );

    if (error) throw error;

    return data;
  }


  async isBlocked(): Promise<boolean> {

    const {
      data: { user }
    } = await this.supabase.auth.getUser();

    if (!user) return false;

    const { data, error } = await this.supabase
      .from('perfiles')
      .select('activo')
      .eq('id', user.id)
      .maybeSingle();

    if (error) {
      console.error(error);
      return false;
    }

    return data?.activo ?? false;
  }

  async obtenerAuditoriaById(usuarioId: string) {

    const { data, error } = await this.supabase
      .from('auditoria')
      .select('*')
      .order('fecha_hora', { ascending: false })
      .eq('usuario_id', usuarioId);

    if (error) throw error;

    return data ?? [];

  }

    async obtenerAuditoria() {

    const { data, error } = await this.supabase
      .from('auditoria')
      .select('*')
      .order('fecha_hora', { ascending: false })
      .limit(5);

    if (error) throw error;

    return data ?? [];

  }
}