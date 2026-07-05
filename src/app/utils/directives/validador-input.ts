import { Directive, ElementRef, HostListener, Input } from '@angular/core';

@Directive({
  selector: '[appValidador]',
  standalone: true
})
export class ValidadorInputDirective {
  
  @Input('appValidador') tipoValidacion: 'letras' | 'numeros' | 'alfanumerico' | 'busqueda' | 'signos' = 'alfanumerico';

  constructor(private el: ElementRef) {}

  @HostListener('keypress', ['$event'])
  onKeyPress(event: KeyboardEvent) {
    let regex: RegExp;

    switch (this.tipoValidacion) {
      case 'letras':
        regex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]*$/;
        break;
      case 'numeros':
        regex = /^[0-9]*$/;
        break;
      case 'alfanumerico':
        regex = /^[a-zA-Z0-9]*$/;
        break;
      case 'busqueda':
        regex = /^[a-zA-Z0-9\s]*$/;
        break;
      case 'signos':
        regex = /^[0-9.,/]*$/;
        break;
      default:
        return;
    }

    if (!regex.test(event.key)) {
      event.preventDefault();
    }
  }
}