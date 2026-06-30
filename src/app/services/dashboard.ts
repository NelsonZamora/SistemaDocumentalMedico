import { Injectable } from '@angular/core';
import { AuthService } from './auth';
@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  constructor(
    private authService: AuthService
  ) { }
  async getResumenMedico() {
    const supabase =
      this.authService.getClient();
    const medicoId =
      await this.authService.getUserId();
    const hoy =
      new Date()
        .toISOString()
        .split('T')[0];
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
    const {
      count: documentosEmitidos
    } = await supabase
      .from('documentos')
      .select('*', {
        count: 'exact',
        head: true
      })
      .eq('creado_por', medicoId);
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
  async getResumenAdmin() {

    const supabase =
      this.authService.getClient();
    const hoy =
      new Date()
        .toISOString()
        .split('T')[0];
    const {
      count: totalPacientes
    } = await supabase
      .from('pacientes')
      .select('*', {
        count: 'exact',
        head: true
      });
    const {
      count: totalDocumentos
    } = await supabase
      .from('documentos')
      .select('*', {
        count: 'exact',
        head: true
      });
    const {
      count: usuariosActivos
    } = await supabase
      .from('perfiles')
      .select('*', {
        count: 'exact',
        head: true
      })
      .eq('activo', true);
    const {
      count: citasHoy
    } = await supabase
      .from('citas_medicas')
      .select('*', {
        count: 'exact',
        head: true
      })
      .eq('fecha', hoy)
      .eq('estado', 'programada');

    return {
      totalPacientes: totalPacientes || 0,
      totalDocumentos: totalDocumentos || 0,
      usuariosActivos: usuariosActivos || 0,
      citasHoy: citasHoy || 0
    };

  }

  async getResumenAuxiliar() {

  }
}