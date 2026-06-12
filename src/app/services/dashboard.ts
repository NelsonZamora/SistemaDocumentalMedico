import { Injectable } from '@angular/core';
import { AuthService } from './auth';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {

  constructor(
    private authService: AuthService
  ) {}

  async obtenerResumen() {

    const supabase =
      this.authService.getClient();

    const medicoId =
      await this.authService.getUserId();

    const hoy =
      new Date()
        .toISOString()
        .split('T')[0];

    // Pacientes atendidos hoy

    const {
      count: pacientesHoy
    } = await supabase
      .from('citas_medicas')
      .select('*', {
        count: 'exact',
        head: true
      })
      .eq('medico_id', medicoId)
      .eq('fecha', hoy)
      .eq('estado', 'atendida');

    // Documentos emitidos

    const {
      count: documentosEmitidos
    } = await supabase
      .from('documentos')
      .select('*', {
        count: 'exact',
        head: true
      })
      .eq('creado_por', medicoId);

    // Pendientes

    const {
      count: pendientes
    } = await supabase
      .from('citas_medicas')
      .select('*', {
        count: 'exact',
        head: true
      })
      .eq('medico_id', medicoId)
      .eq('fecha', hoy)
      .eq('estado', 'programada');

    // Próxima cita

    const horaActual =
      new Date()
        .toTimeString()
        .substring(0, 5);

    const {
      data: proximaCita
    } = await supabase
      .from('citas_medicas')
      .select(`
        *,
        pacientes(
          nombres,
          apellidos
        )
      `)
      .eq('medico_id', medicoId)
      .eq('fecha', hoy)
      .eq('estado', 'programada')
      .gt('hora_inicio', horaActual)
      .order('hora_inicio')
      .limit(1)
      .maybeSingle();

    // Pacientes recientes

    const {
      data: pacientesRecientes
    } = await supabase
      .from('citas_medicas')
      .select(`
        *,
        pacientes(
          nombres,
          apellidos
        )
      `)
      .eq('medico_id', medicoId)
      .or(
        `fecha.lt.${hoy},and(fecha.eq.${hoy},hora_inicio.lt.${horaActual})`
      )
      .order('fecha', {
        ascending: false
      })
      .order('hora_inicio', {
        ascending: false
      })
      .limit(5);

    return {

      pacientesHoy:
        pacientesHoy || 0,

      documentosEmitidos:
        documentosEmitidos || 0,

      pendientes:
        pendientes || 0,

      proximaCita,

      pacientesRecientes:
        pacientesRecientes || []

    };
  }
}