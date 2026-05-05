import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth';

export const guestGuard: CanActivateFn = async () => {

  const auth = inject(AuthService);
  const router = inject(Router);

  const { data } = await auth.getClient().auth.getSession();

  if (data.session) {

    router.navigate(['/dashboard']);
    return false;
  } else {
    return true;
  }
};