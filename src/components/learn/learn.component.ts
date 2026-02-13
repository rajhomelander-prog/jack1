import { ChangeDetectionStrategy, Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WebNovelService } from '../../services/web-novel.service';
import { MangaService } from '../../services/manga.service';
import { RouterLink } from '@angular/router';

interface ContinueReadingItem {
  id: number;
  title: string;
  author: string;
  coverImage: string;
  progress: number; // 0-100
  lastChapter: string;
}

interface DailyChallenge {
  id: number;
  title: string;
  description: string;
  xp: number;
}

@Component({
  selector: 'app-learn',
  templateUrl: './learn.component.html',
  styleUrls: ['./learn.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink],
})
export class LearnComponent {
  private webNovelService = inject(WebNovelService);
  private mangaService = inject(MangaService);

  continueReading = signal<ContinueReadingItem[]>([
    { id: 1, title: 'Meditations', author: 'Marcus Aurelius', coverImage: 'https://picsum.photos/seed/meditations/300/450', progress: 65, lastChapter: 'Book VII' },
    { id: 2, 'title': 'Sapiens: A Brief History of Humankind', author: 'Yuval Noah Harari', coverImage: 'https://picsum.photos/seed/sapiens/300/450', progress: 30, lastChapter: 'Chapter 4' },
    { id: 3, 'title': 'The Three-Body Problem', author: 'Cixin Liu', coverImage: 'https://picsum.photos/seed/threebody/300/450', progress: 85, lastChapter: 'Part III: The Sunset of Mankind' },
  ]);

  dailyChallenge = signal<DailyChallenge>({
    id: 1,
    title: 'The Logic of Causality',
    description: 'Analyze a complex scenario and identify the primary causal chain. 15 minutes.',
    xp: 500,
  });

  webNovels = this.webNovelService.getNovels();
  
  manga = this.mangaService.getManga();

}