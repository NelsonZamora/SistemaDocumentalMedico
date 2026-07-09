import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlantillasComponent } from './plantillas';

describe('Plantillas', () => {
  let component: PlantillasComponent;
  let fixture: ComponentFixture<PlantillasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlantillasComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PlantillasComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
