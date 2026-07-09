import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router'; // <-- Importa provideRouter
import { MainLayoutComponent } from './main-layout';

describe('MainLayout', () => {
  let component: MainLayoutComponent;
  let fixture: ComponentFixture<MainLayoutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MainLayoutComponent],
      providers: [
        provideRouter([]) // <-- Provee una configuración de rutas vacía para la prueba
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(MainLayoutComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});