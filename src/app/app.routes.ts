import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login';
import { DashboardComponent } from './pages/dashboard/dashboard';
import { authGuard } from './guards/auth-guard';
import { guestGuard } from './guards/guest-guard';
import { adminGuard } from './guards/admin-guard';

export const routes: Routes = [

  {
    path: '',
    component: LoginComponent,
    canActivate: [guestGuard]
  },

  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./layout/main-layout/main-layout')
        .then(m => m.MainLayoutComponent),

    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./pages/dashboard/dashboard')
            .then(m => m.DashboardComponent)
      },

      {
        path: 'pacientes/lista-pacientes',
        loadComponent: () =>
          import('./pages/pacientes/pacientes')
            .then(m => m.PacientesComponent)
      },

      {
        path: 'calendario/atencion-medica',
        loadComponent: () =>
          import('./pages/atencion-medica/atencion-medica')
            .then(m => m.AtencionMedicaComponent)
      },

      {
        path: 'calendario/calendario',
        loadComponent: () =>
          import('./pages/calendario/calendario')
            .then(m => m.CalendarioComponent)
      },

      {
        path: 'plantillas',
        loadComponent: () =>
          import('./pages/Plantillas_seccion/plantillas/plantillas')
            .then(m => m.PlantillasComponent)
      },

      {
        path: 'plantillas/lista',
        loadComponent: () =>
          import('./pages/Plantillas_seccion/lista-plantillas/lista-plantillas')
            .then(m => m.ListaPlantillasComponent)
      },
      
      {
        path: 'plantillas/generar',
        loadComponent: () =>
          import('./pages/Plantillas_seccion/generar-documento/generar-documento')
            .then(m => m.GenerarDocumentoComponent)
      },

      {
        path: 'gestion/creacion-usuarios',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./pages/Administrador_seccion/creacion-usuarios/creacion-usuarios')
            .then(m => m.CreacionUsuariosComponent)
      },

      {
        path: 'gestion/gestion-usuarios',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./pages/Administrador_seccion/gestion-usuarios/gestion-usuarios')
            .then(m => m.GestionUsuariosComponent)
      },

      {
        path: '**',
        redirectTo: '/dashboard'
      }
    ]
  }
];