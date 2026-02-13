import { Injectable } from '@angular/core';

export interface Insight {
  id: number;
  quote: string;
  author: string;
  type: 'Philosophy' | 'Finance' | 'Reflection';
}

@Injectable({
  providedIn: 'root',
})
export class InsightService {
  private insights: Insight[] = [
    { id: 1, quote: "The intelligent investor is a realist who sells to optimists and buys from pessimists.", author: "Benjamin Graham", type: 'Finance' },
    { id: 2, quote: "The stock market is a device for transferring money from the impatient to the patient.", author: "Warren Buffett", type: 'Finance' },
    { id: 3, quote: "An unexamined life is not worth living.", author: "Socrates", type: 'Philosophy' },
    { id: 4, quote: "What we know is a drop, what we don't know is an ocean.", author: "Isaac Newton", type: 'Reflection' },
    { id: 5, quote: "The best investment you can make is in yourself.", author: "Warren Buffett", type: 'Finance' },
    { id: 6, quote: "We are what we repeatedly do. Excellence, then, is not an act, but a habit.", author: "Aristotle", type: 'Philosophy' },
    { id: 7, quote: "Risk comes from not knowing what you're doing.", author: "Warren Buffett", type: 'Finance' },
    { id: 8, quote: "The only true wisdom is in knowing you know nothing.", author: "Socrates", type: 'Philosophy' },
    { id: 9, quote: "The four most dangerous words in investing are: 'this time it's different'.", author: "Sir John Templeton", type: 'Finance' }
  ];

  private recentlyViewedIds = new Set<number>();

  getDailyInsight(): Insight {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const diff = now.getTime() - start.getTime();
    const oneDay = 1000 * 60 * 60 * 24;
    const dayOfYear = Math.floor(diff / oneDay);
    
    const index = dayOfYear % this.insights.length;
    const insight = this.insights[index];
    this.recentlyViewedIds.add(insight.id);
    return insight;
  }

  getRandomInsight(category: Insight['type'] | 'All' = 'All'): Insight {
    let potentialInsights = this.insights;

    if (category !== 'All') {
        potentialInsights = this.insights.filter(i => i.type === category);
    }
    
    let availableInsights = potentialInsights.filter(i => !this.recentlyViewedIds.has(i.id));
    
    if (availableInsights.length === 0) {
        // All insights in this category have been viewed in this session.
        // Reset the viewed set for this category and allow repeats.
        potentialInsights.forEach(i => this.recentlyViewedIds.delete(i.id));
        availableInsights = potentialInsights;
    }

    const randomIndex = Math.floor(Math.random() * availableInsights.length);
    const selectedInsight = availableInsights[randomIndex];
    
    this.recentlyViewedIds.add(selectedInsight.id);

    return selectedInsight;
  }
}