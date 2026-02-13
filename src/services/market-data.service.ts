import { Injectable, signal, Signal } from '@angular/core';
import { MarketTab } from './market.service';

export interface MarketIndex {
  name: string;
  type: MarketTab;
  value: number;
  changeValue: number;
  changePercent: number;
  priceHistory: number[];
  sparkline: string;
}

@Injectable({
  providedIn: 'root'
})
export class MarketDataService {
  private marketIndices = signal<MarketIndex[]>([]);

  constructor() {
    this.initializeData();
    setInterval(() => this._updateMarketData(), 2500);
  }

  private initializeData(): void {
    const initialData: Omit<MarketIndex, 'priceHistory' | 'sparkline' | 'changeValue' | 'changePercent'>[] = [
      { name: 'S&P 500', type: 'Stocks', value: 5430.12 },
      { name: 'NASDAQ', type: 'Stocks', value: 17650.88 },
      { name: 'BTC/USD', type: 'Crypto', value: 68450.12 },
    ];

    const processedData = initialData.map(d => {
      const priceHistory = Array.from({ length: 20 }, () => d.value * (1 + (Math.random() - 0.5) * 0.02));
      priceHistory[priceHistory.length - 1] = d.value;
      const open = priceHistory[0];
      const changeValue = d.value - open;
      const changePercent = (changeValue / open) * 100;

      return {
        ...d,
        priceHistory,
        changeValue,
        changePercent,
        sparkline: this.generateSparkline(priceHistory)
      };
    });

    this.marketIndices.set(processedData);
  }

  getMarketSnapshot(): Signal<MarketIndex[]> {
    return this.marketIndices.asReadonly();
  }

  private _updateMarketData() {
    this.marketIndices.update(indices =>
      indices.map(index => {
        const changeFactor = (Math.random() - 0.49) * 0.005; // Smaller change for indices
        const newValue = index.value * (1 + changeFactor);
        const newPriceHistory = [...index.priceHistory.slice(1), newValue];
        const open = newPriceHistory[0];
        const changeValue = newValue - open;
        const changePercent = (changeValue / open) * 100;

        return {
          ...index,
          value: newValue,
          priceHistory: newPriceHistory,
          changeValue,
          changePercent,
          sparkline: this.generateSparkline(newPriceHistory)
        };
      })
    );
  }

  private generateSparkline(history: number[]): string {
    const max = Math.max(...history);
    const min = Math.min(...history);
    const range = max - min;
    if (range === 0) return 'M0,30 L100,30';

    const points = history.map((p, i) => {
      const x = (i / (history.length - 1)) * 100;
      const y = 55 - ((p - min) / range) * 50; // Inverted Y-axis for SVG, scaled to 50px height with 5px margin
      return `${x},${y}`;
    });

    return `M${points.join(' L')}`;
  }
}