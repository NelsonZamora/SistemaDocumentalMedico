import { Component, signal } from '@angular/core';
import { AuthService } from '../../../services/auth';
import { Router } from '@angular/router';
import { DashboardService } from '../../../services/dashboard';
import { OnInit } from '@angular/core';
import { ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-dashboard',
  imports: [],
  standalone: true,
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class DashboardComponent implements OnInit{
  constructor(
    private auth: AuthService,
    private router: Router,
    private dashboardService: DashboardService
  ) {}

  pacientesHoy = signal<number>(0);
  documentosEmitidos = signal<number>(0);
  pendientes = signal<number>(0);
  proximaCita = signal<any>(null);
  pacientesRecientes = signal<any[]>([]);
  
  role = localStorage.getItem('userRole');

  async ngOnInit() {
    await this.cargarDashboard();
  }

  async logout() {
    await this.auth.logout();
    this.router.navigate(['/']);
  }

  async cargarDashboard() {
    try {
      const resumen = await this.dashboardService.obtenerResumen();

      this.pacientesHoy.set(resumen.pacientesHoy || 0);
      this.documentosEmitidos.set(resumen.documentosEmitidos || 0);
      this.pendientes.set(resumen.pendientes || 0);
      this.proximaCita.set(resumen.proximaCita || null);
      this.pacientesRecientes.set(resumen.pacientesRecientes || []);
    } catch (error) {
      console.error('Error al cargar métricas del dashboard:', error);
    }
  }
}
