import { Component, signal } from '@angular/core';
import { RouterOutlet,RouterModule, Router } from '@angular/router';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, RouterModule],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.scss',
})
export class MainLayoutComponent{

  cargando = signal<boolean>(false);

  constructor(
    private auth: AuthService,
    private router: Router
  ) {}

  role = localStorage.getItem('userRole');
  nombreUsuario = signal(
  localStorage.getItem('userName') ?? ''
);


  async logout() {
    this.cargando.set(true);
    await this.auth.logout();
    this.router.navigate(['/']);
  }
}