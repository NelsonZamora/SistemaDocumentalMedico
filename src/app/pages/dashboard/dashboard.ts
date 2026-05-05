import { Component } from '@angular/core';
import { AuthService } from '../../services/auth';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  imports: [],
  standalone: true,
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class DashboardComponent {
  constructor(
    private auth: AuthService,
    private router: Router
  ) {}

  async logout() {
    await this.auth.logout();
    this.router.navigate(['/']);
  }
}
