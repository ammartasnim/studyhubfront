import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'formatTimer',
  standalone: true
})
export class FormatTimerPipe implements PipeTransform {
  transform(value: string): string {
    if (!value) return '00:00:00';
    
    // Expecting format HH:mm:ss or mm:ss
    const parts = value.split(':').map(part => parseInt(part, 10));
    
    let hours = 0;
    let minutes = 0;
    let seconds = 0;
    
    if (parts.length === 3) {
      [hours, minutes, seconds] = parts;
    } else if (parts.length === 2) {
      [minutes, seconds] = parts;
    } else if (parts.length === 1) {
      seconds = parts[0];
    }
    
    // Ensure two digits
    const pad = (num: number) => num.toString().padStart(2, '0');
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }
}