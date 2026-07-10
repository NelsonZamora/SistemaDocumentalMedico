import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ListaPlantillasComponent } from './lista-plantillas';
import { PlantillasService } from '../../../services/plantillas';

// IMPORTANTE: sin este mock, Angular resuelve la cadena real de inyección
// (PlantillasService -> AuthService real -> createClient() real de Supabase)
// solo por construir el componente, lo que puede dejar el test colgado.
const mockPlantillasService = {
  getPlantillas: vi.fn().mockResolvedValue([]),
  descargarPlantilla: vi.fn().mockResolvedValue({
    arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(8))
  }),
  actualizarPlantilla: vi.fn().mockResolvedValue({}),
  getColumnas: vi.fn().mockResolvedValue([]),
  guardarPlantilla: vi.fn().mockResolvedValue({})
};

describe('ListaPlantillas', () => {
  let component: ListaPlantillasComponent;
  let fixture: ComponentFixture<ListaPlantillasComponent>;

  beforeEach(async () => {
    vi.clearAllMocks();

    await TestBed.configureTestingModule({
      imports: [ListaPlantillasComponent],
      providers: [
        { provide: PlantillasService, useValue: mockPlantillasService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ListaPlantillasComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});