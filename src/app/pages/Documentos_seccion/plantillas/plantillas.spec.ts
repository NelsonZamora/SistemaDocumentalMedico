import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PlantillasComponent } from './plantillas';
import { PlantillasService } from '../../../services/plantillas';

const mockPlantillasService = {
  subirDocumento: vi.fn().mockResolvedValue('ruta/documento.docx'),
  guardarPlantilla: vi.fn().mockResolvedValue({}),
  getColumnas: vi.fn().mockResolvedValue([])
};

describe('Plantillas', () => {
  let component: PlantillasComponent;
  let fixture: ComponentFixture<PlantillasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlantillasComponent],
      providers: [
        { provide: PlantillasService, useValue: mockPlantillasService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(PlantillasComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});