import { Component } from '@angular/core';
import { AuthService } from '../../services/auth';
import { Router } from '@angular/router';
import { DashboardService } from '../../services/dashboard';
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
    private dashboardService: DashboardService,
    private cd: ChangeDetectorRef
  ) {}

  pacientesHoy = 0;
  documentosEmitidos = 0;
  pendientes = 0;
  proximaCita: any = null;
  pacientesRecientes: any[] = [];
  
  role = localStorage.getItem('userRole');

  async ngOnInit() {

    await this.cargarDashboard();
    this.cd.detectChanges();
  }

  async logout() {
    await this.auth.logout();
    this.router.navigate(['/']);
  }

  async cargarDashboard() {

  const resumen =
    await this.dashboardService
      .obtenerResumen();
      console.log(resumen);


  this.pacientesHoy =
    resumen.pacientesHoy;

  this.documentosEmitidos =
    resumen.documentosEmitidos;

  this.pendientes =
    resumen.pendientes;

  this.proximaCita =
    resumen.proximaCita;

  this.pacientesRecientes =
    resumen.pacientesRecientes;
  this.cd.detectChanges();
}
}
