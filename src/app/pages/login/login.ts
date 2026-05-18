import { Component } from '@angular/core';
import { AuthService } from '../../services/auth';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './login.html'
})
export class LoginComponent {

  email = '';
  password = '';
  error = '';

  constructor(
    private auth: AuthService,
    private router: Router,
    private cd: ChangeDetectorRef
  ) {}

  async onLogin() {
    this.cd.detectChanges();
    try {
      const result = await this.auth.login(this.email, this.password);
      const userId = result.user?.id;
      const profile = await this.auth.getUserProfile(userId!);

      localStorage.setItem('userRole', profile.rol);

      

      this.router.navigate(['/dashboard']);
      this.cd.detectChanges();
    } catch (err: any) {
      this.error = err.message;
    }
    this.cd.detectChanges();
  }
}