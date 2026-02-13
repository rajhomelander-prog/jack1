import { Pipe, PipeTransform, inject } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Pipe({
  name: 'highlight',
  standalone: true
})
export class HighlightPipe implements PipeTransform {
  private sanitizer = inject(DomSanitizer);

  transform(value: string | null | undefined): SafeHtml {
    if (!value) return '';

    const highlightedText = value
      .replace(/#(\w+)/g, '<span class="text-accent-red font-semibold cursor-pointer hover:underline">#$1</span>')
      .replace(/@(\w+)/g, '<span class="text-accent-red font-semibold cursor-pointer hover:underline">@$1</span>');

    return this.sanitizer.bypassSecurityTrustHtml(highlightedText);
  }
}