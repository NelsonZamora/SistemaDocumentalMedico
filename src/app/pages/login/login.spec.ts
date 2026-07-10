import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Router } from '@angular/router';
import { NgZone } from '@angular/core';
import { LoginComponent } from './login';
import { AuthService } from '../../services/auth';

describe('LoginComponent - HU-8: Inicio de sesión seguro', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let authServiceMock: any;
  let routerMock: any;

  beforeEach(async () => {
    authServiceMock = {
      login: vi.fn(),
      getUserProfile: vi.fn()
    };

    routerMock = {
      navigate: vi.fn()
    };

    Storage.prototype.setItem = vi.fn();

    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        { provide: AuthService, useValue: authServiceMock },
        { provide: Router, useValue: routerMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
  });

  // Prueba Unitaria 1: previene el envío si los campos están vacíos o el formato es inválido
  it('no debe intentar autenticar si el formulario es inválido (campos vacíos o formato incorrecto)', async () => {
    const formInvalido = { invalid: true };

    await component.onLogin(formInvalido);

    expect(authServiceMock.login).not.toHaveBeenCalled();
    expect(component.intentoLogin()).toBe(true);
  });

  // Prueba Unitaria 2: autenticación exitosa almacena datos y redirige al dashboard
  it('debe almacenar userRole y userName en localStorage y redirigir a /dashboard tras un login exitoso', async () => {
    component.email = 'medico@clinica.com';
    component.password = 'ClaveSegura1@';

    authServiceMock.login.mockResolvedValueOnce({ user: { id: 'user-1' } });
    authServiceMock.getUserProfile.mockResolvedValueOnce({
      rol: 'medico',
      nombre_completo: 'Dra. Smith'
    });

    const formValido = { invalid: false };
    await component.onLogin(formValido);

    expect(authServiceMock.login).toHaveBeenCalledWith('medico@clinica.com', 'ClaveSegura1@');
    expect(localStorage.setItem).toHaveBeenCalledWith('userRole', 'medico');
    expect(localStorage.setItem).toHaveBeenCalledWith('userName', 'Dra. Smith');
    expect(routerMock.navigate).toHaveBeenCalledWith(['/dashboard']);
  });

  // Prueba Unitaria 3: autenticación fallida muestra el error y no redirige
  it('debe mostrar el mensaje de error correspondiente y no redirigir si las credenciales son incorrectas', async () => {
    component.email = 'medico@clinica.com';
    component.password = 'ClaveIncorrecta';

    authServiceMock.login.mockRejectedValueOnce(new Error('Credenciales inválidas'));

    const formValido = { invalid: false };
    await component.onLogin(formValido);

    expect(component.error()).toBe('Credenciales inválidas');
    expect(component.cargando()).toBe(false);
    expect(routerMock.navigate).not.toHaveBeenCalled();
  });
});