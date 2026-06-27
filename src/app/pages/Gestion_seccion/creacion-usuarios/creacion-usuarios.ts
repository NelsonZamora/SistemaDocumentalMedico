import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChangeDetectorRef } from '@angular/core';
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

  usuarios: any[] = [];

  nombre_completo = '';
  email = '';
  password = '';
  rol = 'medico';

  cargando = true;
  creando = false;

  constructor(
    private usuariosService: UsuariosService,
    private cd: ChangeDetectorRef
  ) {}

  async ngOnInit() {
    await this.cargarUsuarios();
  }

  async cargarUsuarios() {
    try {
      this.cargando = true;
      this.usuarios =
        await this.usuariosService
          .getUsuarios();
      this.cargando = false;
      this.cd.detectChanges();
    } catch (error) {
      console.error(error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Ha ocurrido un error cargando los usuarios'
      });
    }

  }

  async crearUsuario() {

    try {

      if (
        !this.nombre_completo ||
        !this.email ||
        !this.password
      ) {

        Swal.fire({
          icon: 'warning',
          title: 'Error',
          text: 'No fue posible cargar los usuarios'
        });

        return;
      }

      this.creando = true;

      await this.usuariosService
        .crearUsuario({

          nombre_completo:
            this.nombre_completo,

          email:
            this.email,

          password:
            this.password,

          rol:
            this.rol

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

      this.nombre_completo = '';
      this.email = '';
      this.password = '';
      this.rol = 'medico';

      await this.cargarUsuarios();
      this.creando = false;
      this.cd.detectChanges();

    } catch (error: any) {

      console.error(error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Ha ocurrido un error al crear el usuario'
      });

    }

  }

}