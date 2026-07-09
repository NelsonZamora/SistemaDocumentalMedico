import { ValidadorInputDirective } from './validador-input';
import { ElementRef } from '@angular/core';

describe('ValidadorInputDirective', () => {
  it('should create an instance', () => {
    // 1. Creamos un mock del ElementRef
    // Simulamos un elemento nativo (input)
    const mockElement = new ElementRef(document.createElement('input'));
    
    // 2. Pasamos el mock al constructor
    const directive = new ValidadorInputDirective(mockElement);
    
    expect(directive).toBeTruthy();
  });
});