import { inject } from '@angular/core';

import {
  CanActivateFn,
  Router
} from '@angular/router';

import { AuthService } from '../services/auth';

export const adminGuard: CanActivateFn =
  async () => {

    const auth = inject(AuthService);
    const router = inject(Router);

    try {
      const userId =
        await auth.getUserId();
      if (!userId) {
        router.navigate(['/dashboard']);
        return false;
      }

      const perfil =
        await auth.getUserProfile(userId);
      if (perfil.rol !== 'admin') {
        router.navigate(['/dashboard']);
        return false;
      }

      return true;

    } catch (error) {
      router.navigate(['/dashboard']);
      return false;
    }

};