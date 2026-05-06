import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login';
import { DashboardComponent } from './pages/dashboard/dashboard';
import { authGuard } from './guards/auth-guard';
import { guestGuard } from './guards/guest-guard';

export const routes: Routes = [
  // 🔓 LOGIN (sin sidebar)
  {
    path: '',
    component: LoginComponent,
    canActivate: [guestGuard]
  },

  // 🔐 APP (con sidebar)
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
        path: 'pacientes',
        loadComponent: () =>
          import('./pages/pacientes/pacientes')
            .then(m => m.PacientesComponent)
      },

      {
        path: 'plantillas',
        loadComponent: () =>
          import('./pages/plantillas/plantillas')
            .then(m => m.PlantillasComponent)
      }
    ]
  }
];