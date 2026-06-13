import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import Swal from 'sweetalert2';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(
      environment.supabaseUrl,
      environment.supabaseKey
    );
  }

  async login(email: string, password: string) {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;

    const {
      data: perfil,
      error: perfilError
    } = await this.supabase
      .from('perfiles')
      .select('activo')
      .eq('id', data.user.id)
      .single();

    if (perfilError) throw perfilError;

    if (!perfil.activo) {

      await this.supabase.auth.signOut();

      await Swal.fire({

        icon: 'error',

        title: 'Usuario bloqueado',

        html: `
          Su cuenta se encuentra actualmente deshabilitada por un administrador.<br><br>
          Si considera que se trata de un error, comuníquese con el administrador del sistema para solicitar asistencia.
        `,

        confirmButtonText: 'Aceptar'

      });

      throw new Error(
        'Usuario bloqueado'
      );

    }

    await this.actualizarUltimoAcceso(
      data.user.id
    );

    return data;
  }

  async actualizarUltimoAcceso(
    userId: string
  ) {

    const { error } =
      await this.supabase
      .from('perfiles')
      .update({

        ultimo_acceso:
          new Date()
          .toISOString()

      })
      .eq('id', userId);

    if (error)
      console.error(
        'Error actualizando último acceso',
        error
      );

  }

  async getUserId() {
    const { data } = await this.supabase.auth.getSession();
    return data.session?.user.id;
  }

  async getUserProfile(userId: string) {
  const { data, error } = await this.supabase
    .from('perfiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) throw error;
  return data;
  }

  async logout() {
    await this.supabase.auth.signOut();
  }

  getClient() {
    return this.supabase;
  }
}