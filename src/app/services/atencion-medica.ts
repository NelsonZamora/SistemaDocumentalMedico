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

    const hoy2 =
      new Date()
        .toISOString()
        .split('T')[0];

    const fecha = new Date();
    const hoy = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`;
    const { data, error } =
      await this.supabase
        .from('citas_medicas')
        .select(`
        *,
        pacientes(
          nombres,
          apellidos
        ),
        signos_vitales(
          id
        )
      `)
        .eq('fecha', hoy)
        .in(
          'estado',
          ['programada', 'en_espera']
        )
        .order(
          'hora_inicio'
        );

    if (error) throw error;

    return data;
  }

  async getSignos(citaId: string) {

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

  async guardarSignosVitales(datos: any) {

    const { data: existente } =
      await this.supabase
        .from('signos_vitales')
        .select('id')
        .eq('cita_id', datos.cita_id)
        .maybeSingle();

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

  async getAtencionCompletabyCitaId(
    citaId: string
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
        .eq('cita_id', citaId)
        .maybeSingle();

    if (error) {
      console.error('Error en la base de datos:', error);
      throw error;
    }

    if (!data) {
      return {
        mensaje: 'No hay registro de la consulta médica',
        encontrado: false
      };
    }

    return {
      ...data,
      encontrado: true
    };
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

    const fecha = new Date();

    const hoy =
      `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`;
    await this.supabase
      .from('citas_medicas')
      .update({

        estado: 'atendida',

        fecha_atencion: hoy
      })
      .eq(
        'id',
        atencion.cita_id
      );
    return data;
  }

}