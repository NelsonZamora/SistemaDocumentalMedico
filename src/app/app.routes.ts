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
        path: 'plantillas',
        loadComponent: () =>
          import('./pages/plantillas/plantillas')
            .then(m => m.PlantillasComponent)
      },

      {
        path: 'plantillas/lista',
        loadComponent: () =>
          import('./pages/lista-plantillas/lista-plantillas')
            .then(m => m.ListaPlantillasComponent)
      },
      
      {
        path: 'plantillas/generar',
        loadComponent: () =>
          import('./pages/generar-documento/generar-documento')
            .then(m => m.GenerarDocumentoComponent)
      },

      {
        path: 'gestion/creacion-usuarios',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./pages/creacion-usuarios/creacion-usuarios')
            .then(m => m.CreacionUsuariosComponent)
      },
      {
        path: '**',
        redirectTo: '/dashboard'
      }
    ]
  }
];