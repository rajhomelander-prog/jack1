import { Injectable, signal } from '@angular/core';

export interface TarotCard {
  id: number;
  name: string;
  arcana: 'Major' | 'Minor';
  suit?: 'Wands' | 'Cups' | 'Swords' | 'Pentacles';
  meaning_up: string;
  img_url: string;
}

const ALL_TAROT_CARDS: TarotCard[] = [
  // Major Arcana
  { id: 0, name: 'The Fool', arcana: 'Major', meaning_up: 'Beginnings, innocence, spontaneity, a free spirit.', img_url: 'https://picsum.photos/seed/tarot0/400/600' },
  { id: 1, name: 'The Magician', arcana: 'Major', meaning_up: 'Manifestation, resourcefulness, power, inspired action.', img_url: 'https://picsum.photos/seed/tarot1/400/600' },
  { id: 2, name: 'The High Priestess', arcana: 'Major', meaning_up: 'Intuition, sacred knowledge, divine feminine, the subconscious mind.', img_url: 'https://picsum.photos/seed/tarot2/400/600' },
  { id: 3, name: 'The Empress', arcana: 'Major', meaning_up: 'Femininity, beauty, nature, nurturing, abundance.', img_url: 'https://picsum.photos/seed/tarot3/400/600' },
  { id: 4, name: 'The Emperor', arcana: 'Major', meaning_up: 'Authority, establishment, structure, a father figure.', img_url: 'https://picsum.photos/seed/tarot4/400/600' },
  { id: 5, name: 'The Hierophant', arcana: 'Major', meaning_up: 'Spiritual wisdom, religious beliefs, conformity, tradition.', img_url: 'https://picsum.photos/seed/tarot5/400/600' },
  { id: 6, name: 'The Lovers', arcana: 'Major', meaning_up: 'Love, harmony, relationships, values alignment, choices.', img_url: 'https://picsum.photos/seed/tarot6/400/600' },
  { id: 7, name: 'The Chariot', arcana: 'Major', meaning_up: 'Control, willpower, success, action, determination.', img_url: 'https://picsum.photos/seed/tarot7/400/600' },
  { id: 8, name: 'Strength', arcana: 'Major', meaning_up: 'Courage, persuasion, influence, compassion.', img_url: 'https://picsum.photos/seed/tarot8/400/600' },
  { id: 9, name: 'The Hermit', arcana: 'Major', meaning_up: 'Soul-searching, introspection, being alone, inner guidance.', img_url: 'https://picsum.photos/seed/tarot9/400/600' },
  { id: 10, name: 'Wheel of Fortune', arcana: 'Major', meaning_up: 'Good luck, karma, life cycles, destiny, a turning point.', img_url: 'https://picsum.photos/seed/tarot10/400/600' },
  { id: 11, name: 'Justice', arcana: 'Major', meaning_up: 'Justice, fairness, truth, cause and effect, law.', img_url: 'https://picsum.photos/seed/tarot11/400/600' },
  { id: 12, name: 'The Hanged Man', arcana: 'Major', meaning_up: 'Pause, surrender, letting go, new perspectives.', img_url: 'https://picsum.photos/seed/tarot12/400/600' },
  { id: 13, name: 'Death', arcana: 'Major', meaning_up: 'Endings, change, transformation, transition.', img_url: 'https://picsum.photos/seed/tarot13/400/600' },
  { id: 14, name: 'Temperance', arcana: 'Major', meaning_up: 'Balance, moderation, patience, purpose.', img_url: 'https://picsum.photos/seed/tarot14/400/600' },
  { id: 15, name: 'The Devil', arcana: 'Major', meaning_up: 'Shadow self, attachment, addiction, restriction, sexuality.', img_url: 'https://picsum.photos/seed/tarot15/400/600' },
  { id: 16, name: 'The Tower', arcana: 'Major', meaning_up: 'Sudden change, upheaval, chaos, revelation, awakening.', img_url: 'https://picsum.photos/seed/tarot16/400/600' },
  { id: 17, name: 'The Star', arcana: 'Major', meaning_up: 'Hope, faith, purpose, renewal, spirituality.', img_url: 'https://picsum.photos/seed/tarot17/400/600' },
  { id: 18, name: 'The Moon', arcana: 'Major', meaning_up: 'Illusion, fear, anxiety, subconscious, intuition.', img_url: 'https://picsum.photos/seed/tarot18/400/600' },
  { id: 19, name: 'The Sun', arcana: 'Major', meaning_up: 'Positivity, fun, warmth, success, vitality.', img_url: 'https://picsum.photos/seed/tarot19/400/600' },
  { id: 20, name: 'Judgement', arcana: 'Major', meaning_up: 'Judgement, rebirth, inner calling, absolution.', img_url: 'https://picsum.photos/seed/tarot20/400/600' },
  { id: 21, name: 'The World', arcana: 'Major', meaning_up: 'Completion, integration, accomplishment, travel.', img_url: 'https://picsum.photos/seed/tarot21/400/600' },
  // Wands
  { id: 22, name: 'Ace of Wands', arcana: 'Minor', suit: 'Wands', meaning_up: 'Inspiration, new opportunities, growth, potential.', img_url: 'https://picsum.photos/seed/tarot22/400/600' },
  { id: 23, name: 'Two of Wands', arcana: 'Minor', suit: 'Wands', meaning_up: 'Future planning, progress, decisions, discovery.', img_url: 'https://picsum.photos/seed/tarot23/400/600' },
  { id: 35, name: 'King of Wands', arcana: 'Minor', suit: 'Wands', meaning_up: 'Natural-born leader, vision, entrepreneur, honour.', img_url: 'https://picsum.photos/seed/tarot35/400/600' },
  // Cups
  { id: 36, name: 'Ace of Cups', arcana: 'Minor', suit: 'Cups', meaning_up: 'Love, new relationships, compassion, creativity.', img_url: 'https://picsum.photos/seed/tarot36/400/600' },
  { id: 37, name: 'Two of Cups', arcana: 'Minor', suit: 'Cups', meaning_up: 'Unified love, partnership, mutual attraction.', img_url: 'https://picsum.photos/seed/tarot37/400/600' },
  { id: 49, name: 'King of Cups', arcana: 'Minor', suit: 'Cups', meaning_up: 'Emotionally balanced, compassionate, diplomatic.', img_url: 'https://picsum.photos/seed/tarot49/400/600' },
  // Swords
  { id: 50, name: 'Ace of Swords', arcana: 'Minor', suit: 'Swords', meaning_up: 'Breakthroughs, new ideas, mental clarity, success.', img_url: 'https://picsum.photos/seed/tarot50/400/600' },
  { id: 51, name: 'Two of Swords', arcana: 'Minor', suit: 'Swords', meaning_up: 'Difficult decisions, weighing up options, an impasse, avoidance.', img_url: 'https://picsum.photos/seed/tarot51/400/600' },
  { id: 63, name: 'King of Swords', arcana: 'Minor', suit: 'Swords', meaning_up: 'Mental clarity, intellectual power, authority, truth.', img_url: 'https://picsum.photos/seed/tarot63/400/600' },
  // Pentacles
  { id: 64, name: 'Ace of Pentacles', arcana: 'Minor', suit: 'Pentacles', meaning_up: 'A new financial or career opportunity, manifestation, abundance.', img_url: 'https://picsum.photos/seed/tarot64/400/600' },
  { id: 65, name: 'Two of Pentacles', arcana: 'Minor', suit: 'Pentacles', meaning_up: 'Multiple priorities, time management, prioritisation, adaptability.', img_url: 'https://picsum.photos/seed/tarot65/400/600' },
  { id: 77, name: 'King of Pentacles', arcana: 'Minor', suit: 'Pentacles', meaning_up: 'Wealth, business, leadership, security, discipline, abundance.', img_url: 'https://picsum.photos/seed/tarot77/400/600' },
];

@Injectable({
  providedIn: 'root'
})
export class TarotService {
  private allCards: TarotCard[] = ALL_TAROT_CARDS;
  
  cardOfTheDay = signal<TarotCard | null>(null);
  
  constructor() {
    this.loadDailyCardFromStorage();
  }
  
  private getTodayString(): string {
    return new Date().toISOString().split('T')[0];
  }

  private loadDailyCardFromStorage(): void {
    try {
      const storedData = localStorage.getItem('vichara_tarot_daily');
      if (storedData) {
        const { date, cardId } = JSON.parse(storedData);
        if (date === this.getTodayString()) {
          const card = this.allCards.find(c => c.id === cardId);
          if (card) {
            this.cardOfTheDay.set(card);
          }
        }
      }
    } catch (e) {
      console.error('Could not load daily tarot card from storage', e);
      localStorage.removeItem('vichara_tarot_daily');
    }
  }

  drawCardOfTheDay(): TarotCard {
    if (this.cardOfTheDay()) {
      return this.cardOfTheDay()!;
    }
    
    // Use the current date as a seed for a consistent "random" card per day.
    const today = new Date();
    const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
    // A simple pseudo-random number generator based on the seed.
    const pseudoRandom = Math.abs(Math.sin(seed));
    const pseudoRandomIndex = Math.floor(pseudoRandom * this.allCards.length);
    
    const card = this.allCards[pseudoRandomIndex];
    this.cardOfTheDay.set(card);
    
    try {
      localStorage.setItem('vichara_tarot_daily', JSON.stringify({
        date: this.getTodayString(),
        cardId: card.id
      }));
    } catch (e) {
      console.error('Could not save daily tarot card to storage', e);
    }
    
    return card;
  }
}