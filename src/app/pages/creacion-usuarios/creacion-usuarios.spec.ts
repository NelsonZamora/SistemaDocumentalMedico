import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreacionUsuarios } from './creacion-usuarios';

describe('CreacionUsuarios', () => {
  let component: CreacionUsuarios;
  let fixture: ComponentFixture<CreacionUsuarios>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreacionUsuarios],
    }).compileComponents();

    fixture = TestBed.createComponent(CreacionUsuarios);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
