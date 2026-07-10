import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Router } from '@angular/router';
import { AtencionMedicaComponent } from './atencion-medica';
import { AtencionMedicaService } from '../../../services/atencion-medica';

const mockAtencionMedicaService = {
  getPendientes: vi.fn().mockResolvedValue([]),
  getSignos: vi.fn().mockResolvedValue(null),
  guardarAtencion: vi.fn().mockResolvedValue({ id: 'atencion-1' }),
  getAtencionCompletabyCitaId: vi.fn().mockResolvedValue({}),
  getAtencionesMedicas: vi.fn().mockResolvedValue([]),
  getAtencionesMedicasbyId: vi.fn().mockResolvedValue([])
};

const mockRouter = {
  navigate: vi.fn()
};

describe('AtencionMedica', () => {
  let component: AtencionMedicaComponent;
  let fixture: ComponentFixture<AtencionMedicaComponent>;

  beforeEach(async () => {
    vi.clearAllMocks();

    await TestBed.configureTestingModule({
      imports: [AtencionMedicaComponent],
      providers: [
        { provide: AtencionMedicaService, useValue: mockAtencionMedicaService },
        { provide: Router, useValue: mockRouter }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AtencionMedicaComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});