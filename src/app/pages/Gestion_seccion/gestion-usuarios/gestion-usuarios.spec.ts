import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GestionUsuariosComponent } from './gestion-usuarios';

describe('GestionUsuarios', () => {
  let component: GestionUsuariosComponent;
  let fixture: ComponentFixture<GestionUsuariosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GestionUsuariosComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(GestionUsuariosComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
