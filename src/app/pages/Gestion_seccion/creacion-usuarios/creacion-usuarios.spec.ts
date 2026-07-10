import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import Swal from 'sweetalert2';
import { CreacionUsuariosComponent } from './creacion-usuarios';
import { UsuariosService } from '../../../services/usuarios';

describe('CreacionUsuariosComponent - HU-12: Aprovisionamiento de personal', () => {
  let component: CreacionUsuariosComponent;
  let fixture: ComponentFixture<CreacionUsuariosComponent>;
  let usuariosServiceMock: any;

  beforeEach(async () => {
    usuariosServiceMock = {
      getUsuarios: vi.fn().mockResolvedValue([]),
      crearUsuario: vi.fn().mockResolvedValue({})
    };

    vi.spyOn(Swal, 'fire').mockResolvedValue(true as any);

    await TestBed.configureTestingModule({
      imports: [CreacionUsuariosComponent],
      providers: [{ provide: UsuariosService, useValue: usuariosServiceMock }]
    }).compileComponents();

    fixture = TestBed.createComponent(CreacionUsuariosComponent);
    component = fixture.componentInstance;
  });

  // Prueba Unitaria 1: el indicador de validación no llega a 'verde' si la contraseña no cumple las reglas
  it('no debe considerarse válida (color verde) una contraseña que no cumpla longitud, mayúscula y números', () => {
    component.password = 'abc';
    expect(component.colorRecuadro).not.toBe('verde');

    component.password = 'Abcdef1@';
    expect(component.colorRecuadro).toBe('verde');
  });

  // Prueba Unitaria 2: el formulario captura y envía correctamente el rol seleccionado
  it('debe capturar y enviar correctamente el rol seleccionado al servicio crearUsuario', async () => {
    component.nombre_completo = 'Carlos Ruiz';
    component.email = 'carlos.ruiz@clinica.com';
    component.password = 'Abcdef1@';
    component.rol = 'auxiliar';

    await component.crearUsuario();

    expect(usuariosServiceMock.crearUsuario).toHaveBeenCalledWith({
      nombre_completo: 'Carlos Ruiz',
      email: 'carlos.ruiz@clinica.com',
      password: 'Abcdef1@',
      rol: 'auxiliar'
    });
  });

  // Prueba Unitaria 3: en caso de error (correo duplicado) se muestra la alerta y no se limpian los datos válidos
  it('debe capturar el error de correo duplicado, mostrar la alerta correspondiente y conservar los datos ingresados', async () => {
    component.nombre_completo = 'Carlos Ruiz';
    component.email = 'carlos.ruiz@clinica.com';
    component.password = 'Abcdef1@';
    component.rol = 'medico';

    usuariosServiceMock.crearUsuario.mockRejectedValueOnce(new Error('El correo ya existe'));

    await component.crearUsuario();

    expect(Swal.fire).toHaveBeenCalledWith(expect.objectContaining({ icon: 'error' }));
    // Los datos válidos del formulario no deben limpiarse ante un error
    expect(component.nombre_completo).toBe('Carlos Ruiz');
    expect(component.email).toBe('carlos.ruiz@clinica.com');
    expect(component.password).toBe('Abcdef1@');
  });
});