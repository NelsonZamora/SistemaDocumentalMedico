import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UsuariosService } from '../../../services/usuarios';
import { ChangeDetectorRef } from '@angular/core';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-gestion-usuarios',
  imports: [ CommonModule, FormsModule],
  templateUrl: './gestion-usuarios.html',
  styleUrl: './gestion-usuarios.scss',
})
export class GestionUsuariosComponent
implements OnInit {

  usuarios: any[] = [];
  menuAbierto: string | null = null;
  cargando = true;
  usuarioSeleccionado: any = null;
  mostrarModalAcciones = false;

  constructor(
    private usuariosService: UsuariosService,
    private cd: ChangeDetectorRef
  ) {}

  async ngOnInit() {

    await this.cargarUsuarios();
    this.cd.detectChanges();

  }

  abrirAcciones(usuario: any) {
    this.usuarioSeleccionado = usuario;
    this.mostrarModalAcciones = true;
  }

  cerrarModalAcciones() {
    this.mostrarModalAcciones = false;
    this.usuarioSeleccionado = null;
  }

  async resetearPassword(
    usuario: any
  ) {

    const result =
      await Swal.fire({

        title: 'Resetear contraseña',

        text:
          `Nueva contraseña para ${usuario.nombre_completo}`,

        input: 'password',

        inputLabel:
          'Nueva contraseña',

        inputPlaceholder:
          'Ingrese la nueva contraseña',

        showCancelButton: true,

        confirmButtonText:
          'Actualizar',

        cancelButtonText:
          'Cancelar',

        inputValidator: (
          value
        ) => {

          if (!value) {
            return 'Debe ingresar una contraseña';
          }

          if (value.length < 6) {
            return 'La contraseña debe tener al menos 6 caracteres';
          }

          return null;

        }

      });

    if (!result.isConfirmed) {
      return;
    }

    try {

      await this.usuariosService
        .resetearPassword(
          usuario.id,
          result.value
        );

      await Swal.fire({
        icon: 'success',
        title: 'Contraseña actualizada',
        text:
          'La contraseña fue modificada correctamente.'
      });

    } catch (error) {

      console.error(error);

      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text:
          'No se pudo actualizar la contraseña.'
      });

    }

  }

  async cerrarSesiones(
    usuario: any
  ) {

    await Swal.fire({

        title:
          'Deshabilitado',

        text:
          `Deshabilitado`,

        icon: 'warning',

        showCancelButton: true,

        confirmButtonText:
          'Sí, cerrar',

        cancelButtonText:
          'Cancelar'

        });

    // const resultado =
    //   await Swal.fire({

    //     title:
    //       'Cerrar sesiones',

    //     text:
    //       `¿Desea cerrar todas las sesiones activas de ${usuario.nombre_completo}?`,

    //     icon: 'warning',

    //     showCancelButton: true,

    //     confirmButtonText:
    //       'Sí, cerrar',

    //     cancelButtonText:
    //       'Cancelar'
    //   });

    // if (!resultado.isConfirmed)
    //   return;

    // try {
    //   console.log(usuario.id);

    //   await this.usuariosService
    //     .cerrarSesiones(
    //       usuario.id
    //     );

    //   await Swal.fire({

    //     icon: 'success',

    //     title:
    //       'Sesiones cerradas',

    //     text:
    //       'Todas las sesiones activas fueron finalizadas.'

    //   });

    // } catch (error) {

    //   console.error(error);

    //   await Swal.fire({

    //     icon: 'error',

    //     title:
    //       'Error',

    //     text:
    //       'No fue posible cerrar las sesiones.'

    //   });

    // }

  }

  toggleMenu(id: string) {

    this.menuAbierto =
      this.menuAbierto === id
        ? null
        : id;

  }

  async cargarUsuarios() {

    this.cargando = true;

    this.usuarios =
      await this.usuariosService
      .getUsuarios();

    this.cargando = false;
  }

  async cambiarEstado(
    usuario: any
  ) {

    await this.usuariosService
      .cambiarEstado(
        usuario.id,
        usuario.activo
      );

  }

  async bloquearUsuario(
    usuario: any
  ) {
    usuario.activo = false;
    this.cerrarModalAcciones();
    this.cd.detectChanges();
    await this.usuariosService
      .cambiarEstado(
        usuario.id,
        usuario.activo
      );
      
  }

  async activarUsuario(
    usuario: any
  ) {
    usuario.activo = true;
    this.cerrarModalAcciones();
    this.cd.detectChanges();
    await this.usuariosService
      .cambiarEstado(
        usuario.id,
        usuario.activo
      );
      
  }

  async cambiarRol(
    usuario: any
  ) {
    console.log(1);
    await this.usuariosService
      .cambiarRol(
        usuario.id,
        usuario.rol
      );
      this.cd.detectChanges();
      console.log(2);
  }

}