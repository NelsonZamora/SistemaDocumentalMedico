import { Component, signal, NgZone } from '@angular/core';
import { AuthService } from '../../services/auth';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class LoginComponent {

  error = signal<string>('');
  cargando = signal<boolean>(false);

  intentoLogin = signal(false);

  email = '';
  password = '';

  constructor(
    private auth: AuthService,
    private router: Router,
    private zone: NgZone
  ) { }

  async onLogin(form: any) {

    this.intentoLogin.set(true);

    if (form.invalid) {
      return;
    }

    try {

      this.error.set('');
      this.cargando.set(true);
      const result = await this.auth.login(this.email, this.password);
      const userId = result.user?.id;
      const profile = await this.auth.getUserProfile(userId!);

      localStorage.setItem('userRole', profile.rol);
      localStorage.setItem('userName', profile.nombre_completo);

      this.zone.run(() => {
        this.router.navigate(['/dashboard']);
      });
    } catch (err: any) {
      this.error.set(err.message || 'Error al iniciar sesión');
      this.cargando.set(false);
    }
  }
}