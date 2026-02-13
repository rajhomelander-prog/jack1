import { ChangeDetectionStrategy, Component, inject, signal, computed, effect, ElementRef, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';
import { WebNovelService, WebNovel, Chapter } from '../../services/web-novel.service';

@Component({
  selector: 'app-web-novel',
  templateUrl: './web-novel.component.html',
  styleUrls: ['./web-novel.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink],
})
export class WebNovelComponent {
  private route = inject(ActivatedRoute);
  private novelService = inject(WebNovelService);

  readerContent = viewChild<ElementRef>('readerContent');

  private novelId = toSignal(this.route.paramMap.pipe(map(params => Number(params.get('id')))));
  
  novel = signal<WebNovel | null>(null);
  selectedChapter = signal<Chapter | null>(null);

  constructor() {
    effect(() => {
      const id = this.novelId();
      if (id) {
        const foundNovel = this.novelService.getNovelById(id);
        this.novel.set(foundNovel);
        // Automatically select the first chapter when a novel is loaded
        if (foundNovel && foundNovel.chapters.length > 0) {
          this.selectedChapter.set(foundNovel.chapters[0]);
        } else {
          this.selectedChapter.set(null);
        }
      }
    }, { allowSignalWrites: true });
  }

  currentChapterIndex = computed(() => {
    const chapter = this.selectedChapter();
    const novel = this.novel();
    if (!chapter || !novel) return -1;
    return novel.chapters.findIndex(c => c.id === chapter.id);
  });

  selectChapter(chapter: Chapter) {
    this.selectedChapter.set(chapter);
    this.readerContent()?.nativeElement.scrollTo(0, 0);
  }

  goToNextChapter() {
    const novel = this.novel();
    const currentIndex = this.currentChapterIndex();
    if (novel && currentIndex < novel.chapters.length - 1) {
      this.selectChapter(novel.chapters[currentIndex + 1]);
    }
  }

  goToPrevChapter() {
    const novel = this.novel();
    const currentIndex = this.currentChapterIndex();
    if (novel && currentIndex > 0) {
      this.selectChapter(novel.chapters[currentIndex - 1]);
    }
  }
}