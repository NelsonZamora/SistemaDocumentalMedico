import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth';

export const authGuard: CanActivateFn = async () => {

  const auth = inject(AuthService);
  const router = inject(Router);

  const { data } = await auth.getClient().auth.getSession();

  if (data.session) {
    return true;
  } else {
    router.navigate(['/']);
    return false;
  }
};  