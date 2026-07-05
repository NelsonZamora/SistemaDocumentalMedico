import { Component, signal, computed } from '@angular/core';
import { AuthService } from '../../../services/auth';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { DashboardService } from '../../../services/dashboard';
import { UsuariosService } from '../../../services/usuarios';
import { OnInit } from '@angular/core';
@Component({
  selector: 'app-dashboard',
  imports: [CommonModule],
  standalone: true,
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class DashboardComponent implements OnInit {
  constructor(
    private router: Router,
    private dashboardService: DashboardService,
    private usuarioService: UsuariosService
  ) { }

  async ngOnInit() {
    await this.getResumen();
  }

  role = signal<'admin' | 'medico' | 'auxiliar'>(
    (localStorage.getItem('userRole') as 'admin' | 'medico' | 'auxiliar') ?? 'auxiliar'
  );

  totalPacientes = signal(0);
  documentosGenerados = signal(0);
  usuariosActivos = signal(0);
  citasHoy = signal(0);
  actividadReciente = signal<any[]>([]);

  pacientesHoy = signal(0);
  documentosEmitidos = signal(0);
  proximaCita = signal<string>('Sin citas');
  pendientes = signal(0);
  pacientesRecientes = signal<any[]>([]);

  citasHoyAux = signal(0);
  pendientesAux = signal(0);
  totalCitasAux = signal(0);
  medicosActivos = signal(0);
  ultimosPacientes = signal<any[]>([]);

  dashboardConfig = computed(() => {
    switch (this.role()) {
      case 'admin':
        return {
          tarjetas: [
            { titulo: 'Pacientes', valor: this.totalPacientes(), icono: 'bi bi-people-fill' },
            { titulo: 'Documentos', valor: this.documentosGenerados(), icono: 'bi bi-file-earmark-medical' },
            { titulo: 'Usuarios', valor: this.usuariosActivos(), icono: 'bi bi-person-badge-fill' },
            { titulo: 'Citas totales de hoy', valor: this.citasHoy(), icono: 'bi bi-calendar-event' }
          ],
          accesos: [
            { titulo: 'Crear usuario', icono: 'bi bi-person-plus', accion: () => this.router.navigate(['/gestion/creacion-usuarios']) },
            { titulo: 'Subir plantilla', icono: 'bi bi-cloud-upload', accion: () => this.router.navigate(['/plantillas']) },
            { titulo: 'Gestionar usuarios', icono: 'bi bi-people-fill', accion: () => this.router.navigate(['/gestion/gestion-usuarios']) }
          ]
        };
      case 'medico':
        return {
          tarjetas: [
            { titulo: 'Pacientes Atendidos Hoy', valor: this.pacientesHoy(), icono: 'bi bi-person-heart' },
            { titulo: 'Documentos Emitidos', valor: this.documentosEmitidos(), icono: 'bi bi-file-earmark-medical' },
            { titulo: 'Pacientes Pendientes Hoy', valor: this.pendientes(), icono: 'bi bi-clock-history' },
            { titulo: 'Próxima cita', valor: this.proximaCita(), icono: 'bi bi-calendar-check' }
          ],
          accesos: [
            { titulo: 'Agenda Médica', icono: 'bi bi-calendar3', accion: () => this.router.navigate(['/calendario/calendario']) },
            { titulo: 'Atención Médica', icono: 'bi bi-heart-pulse', accion: () => this.router.navigate(['/calendario/atencion-medica']) },
            { titulo: 'Generar Documento', icono: 'bi bi-file-earmark-medical', accion: () => this.router.navigate(['/plantillas/generar']) }
          ]
        };
      default:
        return {
          tarjetas: [
            { titulo: 'Citas totales de hoy', valor: this.citasHoyAux(), icono: 'bi bi-calendar-check' },
            { titulo: 'Pacientes Atendidos Hoy', valor: this.totalCitasAux(), icono: 'bi bi-people-fill' },
            { titulo: 'Pacientes Pendientes Hoy', valor: this.pendientesAux(), icono: 'bi bi-clock-history' },
            { titulo: 'Medicos ', valor: this.medicosActivos(), icono: 'bi bi-file-earmark-text' }
          ],
          accesos: [
            { titulo: 'Registrar Paciente', icono: 'bi bi-person-plus', accion: () => this.router.navigate(['/pacientes/lista-pacientes']) },
            { titulo: 'Agenda Médica', icono: 'bi bi-calendar3', accion: () => this.router.navigate(['/calendario/calendario']) }
          ]
        };
    }
  });

  async getResumen() {
    if (this.role() === 'admin') {
      const auditoriaActividades = await this.usuarioService.obtenerAuditoria();
      const resumenAdmin = await this.dashboardService.getResumenAdmin();

      this.actividadReciente.set(auditoriaActividades);
      this.totalPacientes.set(resumenAdmin.totalPacientes || 0);
      this.documentosGenerados.set(resumenAdmin.totalDocumentos || 0);
      this.usuariosActivos.set(resumenAdmin.usuariosActivos || 0);
      this.citasHoy.set(resumenAdmin.citasHoy || 0);


    } else if (this.role() === 'medico') {
      try {
        const resumen = await this.dashboardService.getResumenMedico();

        this.pacientesHoy.set(resumen.pacientesHoy || 0);
        this.documentosEmitidos.set(resumen.documentosEmitidos || 0);
        this.pendientes.set(resumen.pendientes || 0);
        this.proximaCita.set(resumen.proximaCita.hora_inicio || "Sin citas");
        this.pacientesRecientes.set(resumen.pacientesRecientes || []);
      } catch (error) {
        console.error('Error al cargar métricas del dashboard:', error);
      }
    } else if (this.role() === 'auxiliar') {
      const resumenAuxiliar = await this.dashboardService.getResumenAuxiliar();

      this.citasHoyAux.set(resumenAuxiliar.citasHoy || 0);
      this.pendientesAux.set(resumenAuxiliar.pendientes || 0);
      this.totalCitasAux.set(resumenAuxiliar.totalCitasAux || 0);
      this.medicosActivos.set(resumenAuxiliar.medicosActivos || 0);
      this.ultimosPacientes.set(resumenAuxiliar.ultimosPacientes || []);
    }
  }

  formatearModulo(modulo: string): string {
    const codigos: { [key: string]: string } = {
      'perfiles': 'Perfiles',
      'pacientes': 'Pacientes',
      'procesos_clinicos': 'Procesos Clínicos',
      'plantillas': 'Plantillas',
      'documentos': 'Documentos',
      'historial_ediciones': 'Historial de Ediciones',
      'citas_medicas': 'Citas Médicas',
      'signos_vitales': 'Signos Vitales',
      'atenciones_medicas': 'Atenciones Médicas',
      'AUTENTICACION': 'Autenticación'
    };
    return codigos[modulo] || modulo;
  }
}
