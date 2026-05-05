import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PacientesService } from '../../services/pacientes';
import { AuthService } from '../../services/auth';
import { ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-pacientes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './pacientes.html'
})
export class PacientesComponent implements OnInit {

  pacientes: any[] = [];
  mostrarModal = false;
  cargando = false;
  mostrarModalExito = false;
  
  pacienteSeleccionado: any = null;
  mostrarModalVer = false;
  mostrarModalEditar = false;


  form: any = {};
  archivo: File | null = null;

  constructor(
    private pacientesService: PacientesService,
    private authService: AuthService,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.cargarPacientes();
  }

  abrirModal() {
    this.mostrarModal = true;
  }

  cerrarModal() {
    this.mostrarModal = false;
    this.form = {};
    this.archivo = null;
  }

  onFileSelected(event: any) {
    this.archivo = event.target.files[0];
  }

  cerrarModalExito() {
    this.mostrarModalExito = false;
  }

  cerrarModalVer() {
    this.mostrarModalVer = false;
  }

  cerrarModalEditar() {
    this.mostrarModalEditar = false;
  }

  async guardar() {
      try {
        let urlFoto = null;
        console.log("1")
        if (this.archivo) {
          urlFoto = await this.pacientesService.subirFoto(this.archivo);
        }
        console.log("2")
        const userId = await this.authService.getUserId();
      
        const paciente = {
          ...this.form,
          foto_perfil: urlFoto,
          creado_por: userId
        };

        await this.pacientesService.crearPaciente(paciente);
    
        this.cerrarModal();
        this.mostrarModalExito = true;
        this.cargarPacientes();
    
      } catch (error: any) {
        if (error.message.includes('pacientes_cedula_key')) {
          alert('La cédula ya está registrada');
        } else {
          alert(error.message);
        }
      }

      
    }

  async cargarPacientes() {
    this.cargando = true;

    try {
      const data = await this.pacientesService.getPacientes();

      for (let p of data) {
        if (p.foto_perfil) {
          p.foto_url = await this.pacientesService.getFotoUrl(p.foto_perfil);
        }
      }

      this.pacientes = data;

    } catch (error) {
      console.error(error);
    }

    this.cargando = false;
    this.cd.detectChanges();
  }

async verPaciente(p: any) {
  this.pacienteSeleccionado = { ...p };

  if (p.foto_perfil) {
    this.pacienteSeleccionado.foto_url = await this.pacientesService.getFotoUrl(p.foto_perfil);
  }

  this.mostrarModalVer = true;
  this.cd.detectChanges(); 
}

async editarPaciente(p: any) {
  this.pacienteSeleccionado = { ...p };

  if (p.foto_perfil) {
    this.pacienteSeleccionado.foto_url = await this.pacientesService.getFotoUrl(p.foto_perfil);
  }

  this.mostrarModalEditar = true;
  this.cd.detectChanges();
}

  async actualizarPaciente() {
  try {
    let urlFoto = this.pacienteSeleccionado.foto_perfil;

    // 🔥 si hay nueva imagen
    if (this.archivo) {
console.log("nose")
      // 🧨 borrar anterior si existe
      if (this.pacienteSeleccionado.foto_perfil) {
        await this.pacientesService.eliminarFoto(
          this.pacienteSeleccionado.foto_perfil
        );
      }

      // subir nueva
      urlFoto = await this.pacientesService.subirFoto(this.archivo);
    }

    await this.pacientesService.actualizarPaciente(
      this.pacienteSeleccionado.id,
      {
        nombres: this.pacienteSeleccionado.nombres,
        apellidos: this.pacienteSeleccionado.apellidos,
        correo: this.pacienteSeleccionado.correo,
        telefono: this.pacienteSeleccionado.telefono,
        genero: this.pacienteSeleccionado.genero,
        fecha_nacimiento: this.pacienteSeleccionado.fecha_nacimiento,
        foto_perfil: urlFoto
      }
    );

    this.cerrarModalEditar();
    this.cargarPacientes();

  } catch (error: any) {
    alert(error.message);
  }
}
}