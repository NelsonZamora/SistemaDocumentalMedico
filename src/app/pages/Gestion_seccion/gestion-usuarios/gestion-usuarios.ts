import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UsuariosService } from '../../../services/usuarios';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-gestion-usuarios',
  imports: [CommonModule, FormsModule],
  templateUrl: './gestion-usuarios.html',
  styleUrl: './gestion-usuarios.scss',
})
export class GestionUsuariosComponent
  implements OnInit {

  usuarios = signal<any[]>([]);
  cargando = signal<boolean>(true);
  usuarioSeleccionado = signal<any>(null);
  mostrarModalAuditoria = signal<boolean>(false);

  filtroUsuario = '';
  filtroModuloSelected = 'TODOS';
  filtroAccionSelected = 'TODOS';
  fechaDesde = '';
  fechaHasta = '';
  mostrarModalReset = signal<boolean>(false); // <--- Nueva señal de control
  usuarioAResetear = signal<any>(null);
  nuevaPassword = signal<string>('');
  actualizandoPassword = signal<boolean>(false);

  rawLogs = signal<any[]>([]);

  logSeleccionado = signal<any | null>(null);
  logsFiltrados = signal<any[]>([]);

  menuAbierto: string | null = null;

  constructor(
    private usuariosService: UsuariosService
  ) { }

  async ngOnInit() {
    await this.cargarUsuarios();
  }

  abrirAcciones(usuario: any) {
    this.usuarioSeleccionado.set(usuario);
    this.cargarAuditoriaById();
    this.mostrarModalAuditoria.set(true);
  }

  // 2. Computed Signals (Se mantienen igual)
  validacionesNuevaPassword = computed(() => {
    const pass = this.nuevaPassword();
    return {
      longitud: pass.length >= 6,
      mayuscula: /[A-Z]/.test(pass),
      minuscula: /[a-z]/.test(pass),
      numero: /\d/.test(pass),
      especial: /[@/()\-_]/.test(pass)
    };
  });

  colorRecuadroNueva = computed<'rojo' | 'amarillo' | 'verde'>(() => {
    const v = this.validacionesNuevaPassword();
    const cumplidas = [v.longitud, v.mayuscula, v.minuscula, v.numero, v.especial].filter(Boolean).length;

    if (cumplidas === 0) return 'rojo';
    if (cumplidas > 0 && cumplidas < 5) return 'amarillo';
    return 'verde';
  });

  // 3. Métodos super simplificados
  abrirModalReset(usuario: any) {
    this.usuarioAResetear.set(usuario);
    this.nuevaPassword.set('');
    this.mostrarModalReset.set(true); // <--- Mostramos el modal
  }

  cerrarModalReset() {
    this.mostrarModalReset.set(false); // <--- Ocultamos el modal
    this.usuarioAResetear.set(null);
    this.nuevaPassword.set('');
  }

  async confirmarReset() {
    if (this.colorRecuadroNueva() !== 'verde' || !this.usuarioAResetear()) return;

    this.actualizandoPassword.set(true);
    try {
      await this.usuariosService.resetearPassword(this.usuarioAResetear().id, this.nuevaPassword());

      this.cerrarModalReset();

      await Swal.fire({
        icon: 'success',
        title: 'Contraseña actualizada',
        text: 'La contraseña fue modificada correctamente.',
        confirmButtonColor: '#198754'
      });
    } catch (error) {
      console.error(error);
      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo actualizar la contraseña.',
        confirmButtonColor: '#dc3545'
      });
    } finally {
      this.actualizandoPassword.set(false);
    }
  }

  formatearModulo(modulo: string): string {
    const codigos: { [key: string]: string } = {
      'perfiles': 'Perfiles',
      'pacientes': 'Pacientes',
      'procesos_clinicos': 'Procesos Clínicos',
      'plantillas': 'Plantillas',
      'documentos': 'Documentos',
      'historial_ediciones': 'Historial de Ediciones',
      'citas_medicas': 'Citas Médicas',
      'signos_vitales': 'Signos Vitales',
      'atenciones_medicas': 'Atenciones Médicas',
      'AUTENTICACION': 'Autenticación'
    };
    return codigos[modulo] || modulo;
  }

  obtenerCamposVisibles(objeto: any): { clave: string, valor: any }[] {
    if (!objeto || typeof objeto !== 'object') return [];

    const omitir = ['id', 'creado_at', 'actualizado_at', 'ultimo_acceso', 'cita_id', 'paciente_id', 'foto_perfil', 'medico_id', 'creado_por'];

    return Object.keys(objeto)
      .filter(key => !omitir.includes(key))
      .map(key => ({
        clave: this.formatearTextoClave(key),
        valor: objeto[key]
      }));
  }

  private formatearTextoClave(texto: string): string {
    return texto
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
  }

  ejecutarBusqueda() {

    const resultado = this.rawLogs().filter(log => {

      const coincideUsuario =
        !this.filtroUsuario ||
        log.usuario_nombre
          ?.toLowerCase()
          .includes(this.filtroUsuario.toLowerCase()) ||

        log.usuario_email
          ?.toLowerCase()
          .includes(this.filtroUsuario.toLowerCase());

      const coincideModulo =
        this.filtroModuloSelected === 'TODOS' ||
        log.modulo === this.filtroModuloSelected;

      const coincideAccion =
        this.filtroAccionSelected === 'TODOS' ||
        log.accion === this.filtroAccionSelected;

      let coincideFecha = true;

      if (this.fechaDesde) {

        coincideFecha =
          new Date(log.fecha_hora) >= new Date(this.fechaDesde);

      }

      if (coincideFecha && this.fechaHasta) {

        const hasta = new Date(this.fechaHasta);
        hasta.setHours(23, 59, 59, 999);

        coincideFecha =
          new Date(log.fecha_hora) <= hasta;

      }

      return (
        coincideUsuario &&
        coincideModulo &&
        coincideAccion &&
        coincideFecha
      );

    });

    this.logsFiltrados.set(resultado);

  }

  verDetalle(log: any) {
    if (this.logSeleccionado()?.id === log.id) {
      this.logSeleccionado.set(null);
    } else {
      this.logSeleccionado.set(log);
    }
  }

  async cargarAuditoriaById() {
    try {
      const auditoria = await this.usuariosService.obtenerAuditoriaById(this.usuarioSeleccionado().id);
      this.rawLogs.set(auditoria);
      this.logsFiltrados.set(auditoria);
    } catch (error) {
      console.error(error);
      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No fue posible cargar los registros de auditoría.'
      });
    }
  }

  cerrarModalAuditoria() {
    this.mostrarModalAuditoria.set(false);
    this.usuarioSeleccionado.set(null);
    this.rawLogs.set([]);
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
    const bloquear = usuario.activo;
    const confirmar = await Swal.fire({
      title: bloquear
        ? '¿Bloquear usuario?'
        : '¿Activar usuario?',
      text: bloquear
        ? 'El usuario perderá inmediatamente el acceso.'
        : 'El usuario podrá volver a ingresar al sistema.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: bloquear
        ? 'Bloquear'
        : 'Activar',
      cancelButtonText: 'Cancelar'
    });

    if (!confirmar.isConfirmed) return;

    if (bloquear) {

      await this.bloquearUsuario(usuario);

    } else {

      await this.activarUsuario(usuario);

    }

  }

  async bloquearUsuario(usuario: any) {
    usuario.activo = false;
    await this.usuariosService.cambiarEstado(usuario.id, usuario.activo);
  }

  async activarUsuario(usuario: any) {
    usuario.activo = true;
    await this.usuariosService.cambiarEstado(usuario.id, usuario.activo);
  }

  async cambiarRol(usuario: any) {
    const { value: rol } = await Swal.fire({
      title: 'Cambiar rol',
      input: 'select',
      inputOptions: {
        admin: 'Administrador',
        medico: 'Médico',
        auxiliar: 'Auxiliar'
      },
      inputValue: usuario.rol,
      showCancelButton: true,
      confirmButtonText: 'Continuar',
      cancelButtonText: 'Cancelar'
    });

    if (!rol) return;
    const confirmar = await Swal.fire({
      title: '¿Cambiar rol?',
      text: 'Los permisos del usuario cambiarán inmediatamente.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí',
      cancelButtonText: 'Cancelar'
    });

    if (!confirmar.isConfirmed) return;
    await this.usuariosService.cambiarRol(usuario.id, rol);
    usuario.rol = rol;
    Swal.fire({
      icon: 'success',
      title: 'Rol actualizado',
      timer: 1800,
      showConfirmButton: false
    });
  }
}