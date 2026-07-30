import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth';
import { UsuariosService } from '../services/usuarios';
import Swal from 'sweetalert2';

export const authGuard: CanActivateFn = async () => {

  const auth = inject(AuthService);
  const router = inject(Router);
  const usuarios = inject(UsuariosService);

  const { data } = await auth.getClient().auth.getSession();

  if (!data.session) {
    router.navigate(['/']);
    return false;
  }

  const activo = await usuarios.isBlocked();

  if (!activo) {
    await auth.logout();
    await Swal.fire({
      icon: 'warning',
      title: 'Sesión finalizada',
      text: 'Su sesión ha sido cerrada por la administración. Comuníquese con el administrador del sistema.'
    });
    router.navigate(['/']);
    return false;
  }
  
  return true;
};  