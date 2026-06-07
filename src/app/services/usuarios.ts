import { Injectable } from '@angular/core';

import {
  createClient
} from '@supabase/supabase-js';

import { environment }
from '../../environments/environment';

import { AuthService }
from './auth';

@Injectable({
  providedIn: 'root'
})
export class UsuariosService {

  private supabase;
  private supabaseRegistro;

  constructor(
    private auth: AuthService
  ) {
    this.supabase =
      this.auth.getClient();
    this.supabaseRegistro =
      createClient(
        environment.supabaseUrl,
        environment.supabaseKey,
        {
          auth: {

            persistSession: false,

            autoRefreshToken: false,

            detectSessionInUrl: false,

            storageKey:
              `registro-${crypto.randomUUID()}`
          }
        }
      );
  }

  async crearUsuario(data: any) {
    const {
      data: authData,
      error: authError
    } =
      await this.supabaseRegistro
        .auth
        .signUp({

          email:
            data.email,
          password:
            data.password
        });
    if (authError) {
      throw authError;
    }

    const userId =
      authData.user?.id;
    if (!userId) {
      throw new Error(
        'No se pudo crear usuario'
      );
    }

    const {
      error: perfilError
    } =
      await this.supabase
        .from('perfiles')
        .insert({
          id:
            userId,

          nombre_completo:
            data.nombre_completo,
          rol:
            data.rol
        });

    if (perfilError) {
      throw perfilError;
    }
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
}