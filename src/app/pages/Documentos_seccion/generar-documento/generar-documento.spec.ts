import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GenerarDocumentoComponent } from './generar-documento';
import { PlantillasService } from '../../../services/plantillas';
import { PacientesService } from '../../../services/pacientes';
import { AtencionMedicaService } from '../../../services/atencion-medica';

describe('GenerarDocumentoComponent - HU-11: Generación automática de documentos clínicos', () => {
  let component: GenerarDocumentoComponent;
  let fixture: ComponentFixture<GenerarDocumentoComponent>;
  let plantillasServiceMock: any;
  let pacientesServiceMock: any;
  let atencionMedicaServiceMock: any;

  const pacienteMock = { id: 'pac-1', nombres: 'Juan', apellidos: 'Pérez', edad: 30 };

  const plantillaMock = {
    id: 'plt-1',
    archivo_url_path: 'plantillas/informe.txt',
    contenido_json: {
      campos: [
        { nombre: 'nombre', origen: 'bd', columna: 'nombres' },
        { nombre: 'diagnostico', origen: 'manual' }
      ]
    }
  };

  beforeEach(async () => {
    plantillasServiceMock = {
      getPlantillas: vi.fn().mockResolvedValue([plantillaMock]),
      descargarPlantilla: vi.fn().mockResolvedValue({
        arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(8))
      }),
      subirDocumentoGenerado: vi.fn().mockResolvedValue('ruta/documento.txt'),
      registrarDocumento: vi.fn().mockResolvedValue({})
    };

    pacientesServiceMock = {
      getPacientes: vi.fn().mockResolvedValue([pacienteMock])
    };

    atencionMedicaServiceMock = {
      getAtencionesMedicas: vi.fn().mockResolvedValue([]),
      getAtencionesMedicasbyId: vi.fn().mockResolvedValue([])
    };

    await TestBed.configureTestingModule({
      imports: [GenerarDocumentoComponent],
      providers: [
        { provide: PlantillasService, useValue: plantillasServiceMock },
        { provide: PacientesService, useValue: pacientesServiceMock },
        { provide: AtencionMedicaService, useValue: atencionMedicaServiceMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(GenerarDocumentoComponent);
    component = fixture.componentInstance;

    await component.cargarDatos();
    component.pacienteSeleccionado.set(pacienteMock);
    component.plantillaSeleccionada.set(plantillaMock);
  });

  it('debe extraer y listar correctamente los campos dinámicos detectados al seleccionar una plantilla', async () => {
    await component.seleccionarPlantilla();

    expect(component.camposPlantilla().length).toBe(2);
    expect(component.camposPlantilla().map((c: any) => c.nombre)).toEqual(['nombre', 'diagnostico']);
    expect(component.valoresCampos['nombre']).toBe('Juan');
  });

  it('debe mapear correctamente los datos de la atención médica y los signos vitales hacia los campos de la plantilla', async () => {
    await component.seleccionarPlantilla();

    const atencionMock = {
      diagnostico: 'Faringitis aguda',
      signos_vitales: { presion_arterial: '118/76' }
    };

    (component as any).camposPlantilla.set([
      { nombre: 'diagnostico', origen: 'bd', columna: 'diagnostico' },
      { nombre: 'presion', origen: 'bd', columna: 'presion_arterial' }
    ]);

    component.atencionSeleccionada.set(atencionMock);
    component.actualizarCamposAtencion();

    expect(component.valoresCampos['diagnostico']).toBe('Faringitis aguda');
    expect(component.valoresCampos['presion']).toBe('118/76');
  });

  it('debe actualizar la previsualización HTML en tiempo real conforme se ingresan valores en los campos', () => {
    (component as any).previewHtmlOriginal = 'Paciente: {nombre} - Diagnóstico: {diagnostico}';
    (component as any).camposPlantilla.set([
      { nombre: 'nombre', origen: 'bd' },
      { nombre: 'diagnostico', origen: 'manual' }
    ]);

    component.valoresCampos = { nombre: 'Juan Pérez', diagnostico: '' };
    component.actualizarPreview();

    expect(component.previewHtml()).toContain('Juan Pérez');
    expect(component.previewHtml()).toContain('{diagnostico}');

    component.valoresCampos = { nombre: 'Juan Pérez', diagnostico: 'Gripe común' };
    component.actualizarPreview();

    expect(component.previewHtml()).toContain('Gripe común');
  });
});