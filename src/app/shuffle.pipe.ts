import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'shuffle'
})
export class ShufflePipe implements PipeTransform {

  transform<T>(array: T[]): T[] {
    if (!array || !Array.isArray(array)) {
      return array;
    }
    
    return array
      .map(value => ({ value, sort: Math.random() })) // Cria um array com valores e um número aleatório
      .sort((a, b) => a.sort - b.sort) // Ordena pelo número aleatório
      .map(({ value }) => value); // Retorna o array embaralhado
  }
}
