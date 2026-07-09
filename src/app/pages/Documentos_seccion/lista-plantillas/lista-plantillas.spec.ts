import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListaPlantillasComponent } from './lista-plantillas';

describe('ListaPlantillas', () => {
  let component: ListaPlantillasComponent;
  let fixture: ComponentFixture<ListaPlantillasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListaPlantillasComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ListaPlantillasComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
