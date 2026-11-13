import { Pipe, PipeTransform } from '@angular/core';
import { AR_NOUNS, arCount, formatNumber } from '../utils/arabic';

/** {{ 762 | arCount:'book' }} -> "762 كتاباً" ; {{ 5642 | num }} -> "5,642" */
@Pipe({ name: 'arCount', standalone: false })
export class ArCountPipe implements PipeTransform {
  transform(value: number | null | undefined, noun: keyof typeof AR_NOUNS): string {
    return arCount(value, noun);
  }
}

@Pipe({ name: 'num', standalone: false })
export class NumPipe implements PipeTransform {
  transform(value: number | null | undefined): string {
    return formatNumber(value);
  }
}
