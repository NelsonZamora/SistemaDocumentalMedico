import { Injectable } from '@angular/core';
import { AuthService } from './auth';

@Injectable({
  providedIn: 'root'
})
export class AtencionMedicaService {

  private supabase;

  constructor(
    private auth: AuthService
  ) {

    this.supabase =
      this.auth.getClient();

  }

  async getPendientes() {

    const hoy =
      new Date()
      .toISOString()
      .split('T')[0];

    const { data, error } =
      await this.supabase
      .from('citas_medicas')
      .select(`
        *,
        pacientes(
          nombres,
          apellidos
        )
      `)
      .eq('fecha', hoy)
      .in(
        'estado',
        ['programada','en_espera']
      )
      .order(
        'hora_inicio'
      );

    if (error) throw error;

    return data;
  }

  async getSignos( citaId: string ) {

    const { data } =
      await this.supabase
      .from(
        'signos_vitales'
      )
      .select('*')
      .eq(
        'cita_id',
        citaId
      )
      .single();

    return data;

  }

  async getAtencionCompleta(
    atencionId: string
  ) {

    const { data, error } =
      await this.supabase
        .from('atenciones_medicas')
        .select(`
          *,
          citas_medicas (
            *,
            pacientes (*),
            perfiles (*)
          ),
          signos_vitales (*)
        `)
        .eq('id', atencionId)
        .single();

    if (error) throw error;

    return data;
  }

  async getAtencionesMedicasbyId(pacienteId: string) {
    const { data, error } = await this.supabase
      .from('atenciones_medicas')
      .select(`
        *,
        citas_medicas(
          *,
          pacientes(*),
          perfiles(*)
        ),
        signos_vitales(*)
      `)
      .eq('paciente_id', pacienteId);

    if (error) throw error;

    return data;
  }

  async getAtencionesMedicas() {
    const { data, error } = await this.supabase
      .from('atenciones_medicas')
      .select(`
        *,
        citas_medicas(
          *,
          pacientes(*),
          perfiles(*)
        ),
        signos_vitales(*)
      `)

    if (error) throw error;

    return data;
  }

  async guardarAtencion(
    atencion: any
  ) {

    const { data, error } =
      await this.supabase
      .from(
        'atenciones_medicas'
      )
      .insert([atencion])
      .select()
      .single();

    if (error) throw error;

    await this.supabase
      .from('citas_medicas')
      .update({

        estado: 'atendida',

        fecha_atencion:
          new Date()
          .toISOString()

      })
      .eq(
        'id',
        atencion.cita_id
      );
      return data;
  }

}