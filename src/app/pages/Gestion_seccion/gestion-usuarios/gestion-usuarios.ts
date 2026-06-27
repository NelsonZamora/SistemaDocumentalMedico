import { Component, OnInit, signal } from '@angular/core';
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

  usuarios = signal<any[]>([]);
  cargando = signal<boolean>(true);
  usuarioSeleccionado = signal<any>(null);
  mostrarModalAcciones = signal<boolean>(false);
  
  menuAbierto: string | null = null;

  constructor(
    private usuariosService: UsuariosService
  ) {}

  async ngOnInit() {
    await this.cargarUsuarios();
  }

  abrirAcciones(usuario: any) {
    this.usuarioSeleccionado.set(usuario);
    this.mostrarModalAcciones.set(true);
  }

  cerrarModalAcciones() {
    this.mostrarModalAcciones.set(false);
    this.usuarioSeleccionado.set(null);
  }

  async resetearPassword(usuario: any) {
    const result = await Swal.fire({
      title: 'Resetear contraseña',
      text: `Nueva contraseña para ${usuario.nombre_completo}`,
      input: 'password',
      inputLabel: 'Nueva contraseña',
      inputPlaceholder: 'Ingrese la nueva contraseña',
      showCancelButton: true,
      confirmButtonText: 'Actualizar',
      cancelButtonText: 'Cancelar',
      inputValidator: (value) => {
        if (!value) return 'Debe ingresar una contraseña';
        if (value.length < 6) return 'La contraseña debe tener al menos 6 caracteres';
        return null;
      }
    });

    if (!result.isConfirmed) return;

    try {
      await this.usuariosService.resetearPassword(usuario.id, result.value);
      await Swal.fire({
        icon: 'success',
        title: 'Contraseña actualizada',
        text: 'La contraseña fue modificada correctamente.'
      });
    } catch (error) {
      console.error(error);
      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo actualizar la contraseña.'
      });
    }
  }

  toggleMenu(id: string) {
    this.menuAbierto = this.menuAbierto === id ? null : id;
  }

  async cargarUsuarios() {

    this.cargando.set(true);
    const lista = await this.usuariosService.getUsuarios();
    this.usuarios.set(lista);

    this.cargando.set(false);
  }

  async cambiarEstado(usuario: any) {
    await this.usuariosService.cambiarEstado(usuario.id, usuario.activo);
  }

  async bloquearUsuario(usuario: any) {
    usuario.activo = false;
    this.cerrarModalAcciones();
    await this.usuariosService.cambiarEstado(usuario.id, usuario.activo);
  }

  async activarUsuario(usuario: any) {
    usuario.activo = true;
    this.cerrarModalAcciones();
    await this.usuariosService.cambiarEstado(usuario.id, usuario.activo);
  }

  async cambiarRol(usuario: any) {
    await this.usuariosService.cambiarRol(usuario.id, usuario.rol);
  }

}