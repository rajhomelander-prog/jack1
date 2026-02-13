import { Injectable, signal } from '@angular/core';

export interface MangaChapter {
  id: number;
  title: string;
  pages: string[]; // URLs to images
}

export interface Manga {
  id: number;
  title: string;
  author: string;
  coverImage: string;
  description: string;
  chapters: MangaChapter[];
}

const MANGA_DATA: Manga[] = [
  { 
    id: 1, 
    title: 'Berserk', 
    author: 'Kentaro Miura', 
    coverImage: 'https://picsum.photos/seed/berserk/300/450',
    description: 'Guts, a former mercenary now known as the "Black Swordsman," is out for revenge. After a tumultuous childhood, he finally finds someone he respects and believes he can trust, only to have everything taken away when this person takes away everything important to Guts for the purpose of fulfilling his own desires.',
    chapters: [
      {
        id: 1,
        title: 'Chapter 1: The Black Swordsman',
        pages: Array.from({ length: 5 }, (_, i) => `https://picsum.photos/seed/berserk_c1_p${i+1}/800/1200`),
      },
      {
        id: 2,
        title: 'Chapter 2: The Brand',
        pages: Array.from({ length: 6 }, (_, i) => `https://picsum.photos/seed/berserk_c2_p${i+1}/800/1200`),
      },
      {
        id: 3,
        title: 'Chapter 3: Guardians of Desire',
        pages: Array.from({ length: 4 }, (_, i) => `https://picsum.photos/seed/berserk_c3_p${i+1}/800/1200`),
      }
    ]
  },
  { id: 2, title: 'Vagabond', author: 'Takehiko Inoue', coverImage: 'https://picsum.photos/seed/vagabond/300/450', description: 'A story of the legendary swordsman Miyamoto Musashi.', chapters: [] },
  { id: 3, title: 'One Piece', author: 'Eiichiro Oda', coverImage: 'https://picsum.photos/seed/onepiece/300/450', description: 'Follows the adventures of Monkey D. Luffy and his pirate crew in order to find the greatest treasure ever left by the legendary Pirate, Gold Roger.', chapters: [] },
  { id: 4, title: 'Kingdom', author: 'Yasuhisa Hara', coverImage: 'https://picsum.photos/seed/kingdom/300/450', description: 'Follows the story of the war orphan Xin in his path to becoming the greatest general under the heavens.', chapters: [] },
  { id: 5, title: 'Attack on Titan', author: 'Hajime Isayama', coverImage: 'https://picsum.photos/seed/aot/300/450', description: 'In a world where humanity resides within enormous walls, a young boy vows to exterminate the giant humanoid Titans that threaten his home.', chapters: [] },
];

@Injectable({
  providedIn: 'root'
})
export class MangaService {
  private manga = signal<Manga[]>(MANGA_DATA);

  getManga() {
    return this.manga.asReadonly();
  }

  getMangaById(id: number): Manga | null {
    return this.manga().find(m => m.id === id) ?? null;
  }
}