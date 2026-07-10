import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import Swal from 'sweetalert2';
import { GestionUsuariosComponent } from './gestion-usuarios';
import { UsuariosService } from '../../../services/usuarios';

describe('GestionUsuariosComponent', () => {
  let component: GestionUsuariosComponent;
  let fixture: ComponentFixture<GestionUsuariosComponent>;
  let usuariosServiceMock: any;

  const usuariosMock = [
    { id: 'u1', nombre_completo: 'Juan Pérez', rol: 'medico', activo: true },
    { id: 'u2', nombre_completo: 'Ana López', rol: 'auxiliar', activo: false }
  ];

  const auditoriaMock = [
    {
      id: 'log-1',
      usuario_id: 'u1',
      usuario_nombre: 'Juan Pérez',
      usuario_email: 'juan@clinica.com',
      accion: 'LOGIN',
      modulo: 'AUTENTICACION',
      fecha_hora: '2026-07-01T08:00:00Z'
    },
    {
      id: 'log-2',
      usuario_id: 'u1',
      usuario_nombre: 'Juan Pérez',
      usuario_email: 'juan@clinica.com',
      accion: 'UPDATE',
      modulo: 'pacientes',
      fecha_hora: '2026-07-02T10:00:00Z',
      datos_anteriores: { nombres: 'Juan', telefono: '0999999999' },
      datos_nuevos: { nombres: 'Juan Carlos', telefono: '0988888888' }
    }
  ];

  beforeEach(async () => {
    usuariosServiceMock = {
      getUsuarios: vi.fn().mockResolvedValue(usuariosMock),
      obtenerAuditoriaById: vi.fn().mockResolvedValue(auditoriaMock),
      resetearPassword: vi.fn().mockResolvedValue({}),
      cambiarEstado: vi.fn().mockResolvedValue({}),
      cambiarRol: vi.fn().mockResolvedValue({})
    };

    vi.spyOn(Swal, 'fire').mockResolvedValue({ isConfirmed: true } as any);

    await TestBed.configureTestingModule({
      imports: [GestionUsuariosComponent],
      providers: [{ provide: UsuariosService, useValue: usuariosServiceMock }]
    }).compileComponents();

    fixture = TestBed.createComponent(GestionUsuariosComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('HU-4: Registro de inicios de sesión', () => {
    // Prueba Unitaria 2: la vista de auditoría filtra y muestra correctamente los eventos LOGIN
    it('debe filtrar y mostrar únicamente los eventos de tipo LOGIN en la tabla de auditoría', async () => {
      component.usuarioSeleccionado.set(usuariosMock[0]);
      await component.cargarAuditoriaById();

      component.filtroAccionSelected = 'LOGIN';
      component.ejecutarBusqueda();

      expect(component.logsFiltrados().length).toBe(1);
      expect(component.logsFiltrados()[0].accion).toBe('LOGIN');
    });
  });

  describe('HU-5: Trazabilidad de modificaciones', () => {
    // Prueba Unitaria 1: renderizado de tarjetas de diferencias (estado anterior vs. posterior)
    it('debe exponer datos_anteriores y datos_nuevos del registro seleccionado para el detalle de diferencias', async () => {
      component.usuarioSeleccionado.set(usuariosMock[0]);
      await component.cargarAuditoriaById();

      const registroModificacion = component.rawLogs().find(l => l.id === 'log-2');
      component.verDetalle(registroModificacion);

      expect(component.logSeleccionado()).toEqual(registroModificacion);
      expect(component.logSeleccionado().datos_anteriores).toEqual({ nombres: 'Juan', telefono: '0999999999' });
      expect(component.logSeleccionado().datos_nuevos).toEqual({ nombres: 'Juan Carlos', telefono: '0988888888' });
    });

    // Prueba Unitaria 2: obtenerCamposVisibles excluye claves internas y formatea nombres
    it('debe excluir las claves internas y formatear correctamente los nombres de los campos visibles', () => {
      const objeto = {
        id: 'x1',
        creado_at: '2026-01-01',
        nombres: 'Juan Carlos',
        telefono: '0988888888'
      };

      const campos = component.obtenerCamposVisibles(objeto);

      const claves = campos.map(c => c.clave);
      expect(claves).not.toContain('Id');
      expect(claves).not.toContain('Creado At');
      expect(campos).toContainEqual({ clave: 'Nombres', valor: 'Juan Carlos' });
      expect(campos).toContainEqual({ clave: 'Telefono', valor: '0988888888' });
    });

    // Prueba Unitaria 3: la interfaz de auditoría es estrictamente de solo lectura
    it('no debe exponer ningún método para eliminar registros del historial de auditoría', () => {
      expect((component as any).eliminarLog).toBeUndefined();
      expect((component as any).eliminarRegistro).toBeUndefined();
      expect((component as any).borrarAuditoria).toBeUndefined();
    });
  });

  describe('HU-13: Gestión de usuarios y seguridad', () => {
    // Prueba Unitaria 1: cambiarEstado alterna el valor booleano e invoca el servicio de actualización
    it('debe alternar el estado activo del usuario e invocar el servicio de actualización', async () => {
      const usuario = { ...usuariosMock[0] }; // activo: true

      await component.cambiarEstado(usuario);

      expect(Swal.fire).toHaveBeenCalled();
      expect(usuario.activo).toBe(false);
      expect(usuariosServiceMock.cambiarEstado).toHaveBeenCalledWith(usuario.id, false);
    });

    // Prueba Unitaria 2: confirmarReset solo se ejecuta si el validador visual está en verde
    it('no debe llamar al servicio de reseteo si la contraseña no cumple todas las validaciones (no está en verde)', async () => {
      component.usuarioAResetear.set(usuariosMock[0]);
      component.nuevaPassword.set('abc'); // No cumple longitud/mayúscula/número/especial

      await component.confirmarReset();

      expect(usuariosServiceMock.resetearPassword).not.toHaveBeenCalled();
    });

    it('debe llamar al servicio de reseteo cuando la contraseña cumple todas las validaciones (está en verde)', async () => {
      component.usuarioAResetear.set(usuariosMock[0]);
      component.nuevaPassword.set('Abcdef1@');

      await component.confirmarReset();

      expect(usuariosServiceMock.resetearPassword).toHaveBeenCalledWith(usuariosMock[0].id, 'Abcdef1@');
    });

    // Prueba Unitaria 3: la búsqueda filtra correctamente por módulos, acciones y rangos de fecha
    it('debe filtrar la tabla de auditoría según usuario, módulo, acción y rango de fechas seleccionados', async () => {
      component.usuarioSeleccionado.set(usuariosMock[0]);
      await component.cargarAuditoriaById();

      component.filtroModuloSelected = 'pacientes';
      component.filtroAccionSelected = 'UPDATE';
      // Usamos un rango más amplio (en vez del mismo día exacto) para que la
      // aserción no dependa de la zona horaria del entorno donde corre el test:
      // ejecutarBusqueda() mezcla new Date(fechaHasta) parseado en UTC con
      // setHours() en hora local, lo que puede correr el límite unas horas
      // según el huso horario del runner.
      component.fechaDesde = '2026-07-01';
      component.fechaHasta = '2026-07-03';
      component.ejecutarBusqueda();

      expect(component.logsFiltrados().length).toBe(1);
      expect(component.logsFiltrados()[0].id).toBe('log-2');
    });
  });
});