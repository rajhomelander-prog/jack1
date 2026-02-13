import { Injectable } from '@angular/core';

export interface Insight {
  quote: string;
  author: string;
  type: 'Philosophy' | 'Finance' | 'Reflection';
}

@Injectable({
  providedIn: 'root',
})
export class InsightService {
  private insights: Insight[] = [
    { quote: "The intelligent investor is a realist who sells to optimists and buys from pessimists.", author: "Benjamin Graham", type: 'Finance' },
    { quote: "The stock market is a device for transferring money from the impatient to the patient.", author: "Warren Buffett", type: 'Finance' },
    { quote: "An unexamined life is not worth living.", author: "Socrates", type: 'Philosophy' },
    { quote: "What we know is a drop, what we don't know is an ocean.", author: "Isaac Newton", type: 'Reflection' },
    { quote: "The best investment you can make is in yourself.", author: "Warren Buffett", type: 'Finance' },
    { quote: "We are what we repeatedly do. Excellence, then, is not an act, but a habit.", author: "Aristotle", type: 'Philosophy' },
    { quote: "Risk comes from not knowing what you're doing.", author: "Warren Buffett", type: 'Finance' },
    { quote: "The only true wisdom is in knowing you know nothing.", author: "Socrates", type: 'Philosophy' },
    { quote: "The four most dangerous words in investing are: 'this time it's different'.", author: "Sir John Templeton", type: 'Finance' }
  ];

  getDailyInsight(): Insight {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const diff = now.getTime() - start.getTime();
    const oneDay = 1000 * 60 * 60 * 24;
    const dayOfYear = Math.floor(diff / oneDay);
    
    const index = dayOfYear % this.insights.length;
    return this.insights[index];
  }

  getRandomInsight(): Insight {
    const index = Math.floor(Math.random() * this.insights.length);
    return this.insights[index];
  }
}
