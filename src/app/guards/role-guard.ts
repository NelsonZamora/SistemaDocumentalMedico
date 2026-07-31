import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth';

export function roleGuard(rolesPermitidos: string[]): CanActivateFn {
  return async () => {
    const auth = inject(AuthService);
    const router = inject(Router);

    try {
      const userId = await auth.getUserId();
      if (!userId) {
        router.navigate(['/dashboard']);
        return false;
      }

      const perfil = await auth.getUserProfile(userId);

      if (!rolesPermitidos.includes(perfil.rol)) {
        router.navigate(['/dashboard']);
        return false;
      }

      return true;
    } catch (error) {
      router.navigate(['/dashboard']);
      return false;
    }
  };
}