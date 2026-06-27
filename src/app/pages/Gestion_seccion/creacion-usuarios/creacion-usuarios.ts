import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';

import { UsuariosService } from '../../../services/usuarios';

@Component({
  selector: 'app-creacion-usuarios',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './creacion-usuarios.html',
  styleUrl: './creacion-usuarios.scss'
})
export class CreacionUsuariosComponent
implements OnInit {

  usuarios = signal<any[]>([]);
  cargando = signal<boolean>(true);
  creando = signal<boolean>(false);

  nombre_completo = '';
  email = '';
  password = '';
  rol = 'medico';

  constructor(
    private usuariosService: UsuariosService
  ) {}

  async ngOnInit() {
    await this.cargarUsuarios();
  }

  async cargarUsuarios() {
    try {
      this.cargando.set(true);
      const lista = await this.usuariosService.getUsuarios();
      this.usuarios.set(lista);
    } catch (error) {
      console.error(error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Ha ocurrido un error cargando los usuarios'
      });
    } finally {
      this.cargando.set(false);
    }
  }

  async crearUsuario() {
    try {
      if (!this.nombre_completo || !this.email || !this.password) {
        Swal.fire({
          icon: 'warning',
          title: 'Error',
          text: 'No fue posible cargar los usuarios'
        });
        return;
      }

      this.creando.set(true);

      await this.usuariosService.crearUsuario({
        nombre_completo: this.nombre_completo,
        email: this.email,
        password: this.password,
        rol: this.rol
      });

      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: 'Usuario creado correctamente',
        showConfirmButton: false,
        timer: 2500,
        timerProgressBar: true
      });

      // Limpieza de campos de texto del formulario
      this.nombre_completo = '';
      this.email = '';
      this.password = '';
      this.rol = 'medico';

      // Refrescamos la lista de usuarios reactivamente
      await this.cargarUsuarios();

    } catch (error: any) {
      console.error(error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Ha ocurrido un error al crear el usuario'
      });
    } finally {
      this.creando.set(false);
    }
  }

}