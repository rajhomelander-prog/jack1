import { Injectable, signal, Signal } from '@angular/core';

export interface MarketIndex {
  name: string;
  changePercent: number;
}

@Injectable({
  providedIn: 'root'
})
export class MarketDataService {

  private marketIndices = signal<MarketIndex[]>([
    { name: 'S&P 500', changePercent: 0.45 },
    { name: 'NASDAQ', changePercent: 0.22 },
    { name: 'BTC/USD', changePercent: -1.12 },
  ]);

  getMarketSnapshot(): Signal<MarketIndex[]> {
    return this.marketIndices.asReadonly();
  }
}
