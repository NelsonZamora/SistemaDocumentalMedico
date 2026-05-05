import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login';
import { DashboardComponent } from './pages/dashboard/dashboard';
import { authGuard } from './guards/auth-guard';
import { guestGuard } from './guards/guest-guard';

export const routes: Routes = [
  { path: '', component: LoginComponent, canActivate: [guestGuard]},
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
      }
    ]
  }
];