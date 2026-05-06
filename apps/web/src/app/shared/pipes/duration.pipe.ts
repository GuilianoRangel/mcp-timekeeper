import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'duration',
  standalone: true
})
export class DurationPipe implements PipeTransform {
  transform(seconds: number | undefined | null): string {
    if (seconds === undefined || seconds === null || Number.isNaN(seconds)) return '--:--:--';
    
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    return [hrs, mins, secs]
      .map(v => v < 10 ? '0' + v : v)
      .join(':');
  }
}
