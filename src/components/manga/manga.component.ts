import { ChangeDetectionStrategy, Component, inject, signal, computed, effect, ElementRef, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';
import { MangaService, Manga, MangaChapter } from '../../services/manga.service';

@Component({
  selector: 'app-manga',
  templateUrl: './manga.component.html',
  styleUrls: ['./manga.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink],
})
export class MangaComponent {
  private route = inject(ActivatedRoute);
  private mangaService = inject(MangaService);

  readerContent = viewChild<ElementRef>('readerContent');

  private mangaId = toSignal(this.route.paramMap.pipe(map(params => Number(params.get('id')))));
  
  manga = signal<Manga | null>(null);
  selectedChapter = signal<MangaChapter | null>(null);

  constructor() {
    effect(() => {
      const id = this.mangaId();
      if (id) {
        const foundManga = this.mangaService.getMangaById(id);
        this.manga.set(foundManga);
        // Automatically select the first chapter when a manga is loaded
        if (foundManga && foundManga.chapters.length > 0) {
          this.selectedChapter.set(foundManga.chapters[0]);
        } else {
          this.selectedChapter.set(null);
        }
      }
    }, { allowSignalWrites: true });
  }

  currentChapterIndex = computed(() => {
    const chapter = this.selectedChapter();
    const manga = this.manga();
    if (!chapter || !manga) return -1;
    return manga.chapters.findIndex(c => c.id === chapter.id);
  });

  selectChapter(chapter: MangaChapter) {
    this.selectedChapter.set(chapter);
    this.readerContent()?.nativeElement.scrollTo(0, 0);
  }

  goToNextChapter() {
    const manga = this.manga();
    const currentIndex = this.currentChapterIndex();
    if (manga && currentIndex < manga.chapters.length - 1) {
      this.selectChapter(manga.chapters[currentIndex + 1]);
    }
  }

  goToPrevChapter() {
    const manga = this.manga();
    const currentIndex = this.currentChapterIndex();
    if (manga && currentIndex > 0) {
      this.selectChapter(manga.chapters[currentIndex - 1]);
    }
  }
}