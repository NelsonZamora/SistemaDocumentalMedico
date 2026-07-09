import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreacionUsuariosComponent } from './creacion-usuarios';

describe('CreacionUsuarios', () => {
  let component: CreacionUsuariosComponent;
  let fixture: ComponentFixture<CreacionUsuariosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreacionUsuariosComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CreacionUsuariosComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
