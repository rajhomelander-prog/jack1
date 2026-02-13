import { Injectable, signal, computed, effect } from '@angular/core';
import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";

export type MarketTab = 'Stocks' | 'Crypto' | 'Forex' | 'Commodities';

export interface TechnicalAnalysis {
  rsi: number;
  sma20: number;
  sma50: number;
  sentiment: 'Bullish' | 'Bearish' | 'Neutral';
  summary: string;
}

export interface AItopic {
  bull: string;
  bear: string;
  error?: string;
}

export interface AiAudit {
  summary: string;
  vulnerabilities: {
    name: string;
    severity: 'High' | 'Medium' | 'Low';
  }[];
  error?: string;
}

export interface AiGeopoliticalAnalysis {
  summary: string;
  factors: {
    name: string;
    impact: 'Positive' | 'Negative' | 'Neutral';
  }[];
  error?: string;
}

export interface AiSupplyChainOutlook {
  summary: string;
  outlook_points: {
    point: string;
    type: 'Risk' | 'Opportunity';
  }[];
  error?: string;
}

export interface Asset {
  symbol: string;
  name: string;
  assetType: 'Stock' | 'Crypto' | 'Forex' | 'Commodity';
  price: number;
  priceHistory: number[];
  changePercent: number;
  changeValue: number;
  sparkline: string;
  marketCap: number;
  volume: number;
  peRatio?: number;
  open: number;
  high: number;
  low: number;
  aiThesis?: AItopic | null; // undefined: not loaded, null: loading, object: loaded/error
  aiAudit?: AiAudit | null; // undefined: not loaded, null: loading, object: loaded/error
  aiGeopoliticalAnalysis?: AiGeopoliticalAnalysis | null;
  aiSupplyChainOutlook?: AiSupplyChainOutlook | null;
}

@Injectable({
  providedIn: 'root'
})
export class MarketService {
  activeTab = signal<MarketTab>('Stocks');
  
  private allAssets = signal<Asset[]>([
    // Stocks
    { symbol: 'AAPL', name: 'Apple Inc.', assetType: 'Stock', price: 172.45, priceHistory: [170,171,173,172,172.45], changeValue: 1.92, changePercent: 1.12, sparkline: '', marketCap: 2847000000000, volume: 52847392, peRatio: 28.5, open: 171.00, high: 173.50, low: 170.50 },
    { symbol: 'TSLA', name: 'Tesla, Inc.', assetType: 'Stock', price: 180.01, priceHistory: [185,183,181,182,180.01], changeValue: -4.67, changePercent: -2.54, sparkline: '', marketCap: 576000000000, volume: 98453210, peRatio: 40.1, open: 184.50, high: 185.00, low: 179.00 },
    { symbol: 'NVDA', name: 'NVIDIA Corp.', assetType: 'Stock', price: 903.67, priceHistory: [880,885,890,900,903.67], changeValue: 30.15, changePercent: 3.45, sparkline: '', marketCap: 2259000000000, volume: 65032189, peRatio: 75.8, open: 875.00, high: 905.00, low: 872.00 },
    { symbol: 'GOOGL', name: 'Alphabet Inc.', assetType: 'Stock', price: 170.89, priceHistory: [168,169,170,169.5,170.89], changeValue: 1.33, changePercent: 0.78, sparkline: '', marketCap: 2120000000000, volume: 24509870, peRatio: 26.4, open: 169.00, high: 171.00, low: 168.50 },
    // Crypto
    { symbol: 'BTC/USD', name: 'Bitcoin', assetType: 'Crypto', price: 68450.12, priceHistory: [70000,69500,69000,68800,68450.12], changeValue: -2193.15, changePercent: -3.11, sparkline: '', marketCap: 1349000000000, volume: 28492847392, open: 70500, high: 71000, low: 68000 },
    { symbol: 'ETH/USD', name: 'Ethereum', assetType: 'Crypto', price: 3450.99, priceHistory: [3600,3550,3500,3480,3450.99], changeValue: -151.84, changePercent: -4.20, sparkline: '', marketCap: 414000000000, volume: 15203987450, open: 3600, high: 3620, low: 3440 },
    // Forex
    { symbol: 'EUR/USD', name: 'Euro to US Dollar', assetType: 'Forex', price: 1.0855, priceHistory: [1.0850, 1.0860, 1.0852, 1.0858, 1.0855], changeValue: 0.0003, changePercent: 0.028, sparkline: '', marketCap: 0, volume: 0, open: 1.0852, high: 1.0865, low: 1.0850 },
    { symbol: 'USD/JPY', name: 'US Dollar to Japanese Yen', assetType: 'Forex', price: 157.25, priceHistory: [157.10, 157.20, 157.15, 157.30, 157.25], changeValue: -0.05, changePercent: -0.032, sparkline: '', marketCap: 0, volume: 0, open: 157.30, high: 157.35, low: 157.10 },
    // Commodities
    { symbol: 'XAU/USD', name: 'Gold', assetType: 'Commodity', price: 2350.50, priceHistory: [2345, 2355, 2348, 2352, 2350.50], changeValue: 10.20, changePercent: 0.43, sparkline: '', marketCap: 0, volume: 0, open: 2340.30, high: 2358.00, low: 2340.00 },
    { symbol: 'WTI/USD', name: 'Crude Oil (WTI)', assetType: 'Commodity', price: 78.50, priceHistory: [78.00, 78.25, 77.90, 78.60, 78.50], changeValue: -1.10, changePercent: -1.38, sparkline: '', marketCap: 0, volume: 0, open: 79.60, high: 79.80, low: 77.80 },
  ].map(a => ({ ...a, sparkline: this.generateSparkline(a.priceHistory) })));
  
  watchlist = this.allAssets.asReadonly();
  
  filteredWatchlist = computed(() => {
    const tab = this.activeTab();
    const assetTypeMap: Record<MarketTab, Asset['assetType']> = {
      'Stocks': 'Stock',
      'Crypto': 'Crypto',
      'Forex': 'Forex',
      'Commodities': 'Commodity',
    };
    return this.allAssets().filter(a => a.assetType === assetTypeMap[tab]);
  });

  selectedAssetSymbol = signal<string>(this.filteredWatchlist()[0]?.symbol);
  
  selectedAsset = computed(() => {
    return this.allAssets().find(item => item.symbol === this.selectedAssetSymbol()) ?? null;
  });

  technicalAnalysis = computed<TechnicalAnalysis | null>(() => {
    const asset = this.selectedAsset();
    if (!asset) return null;
    return this._calculateTechnicalAnalysis(asset);
  });

  constructor() {
    // Simulate real-time market data
    setInterval(() => this._updateMarketData(), 2000);

    // Effect to auto-select the first item when the tab changes
    effect(() => {
      const currentList = this.filteredWatchlist();
      if (currentList.length > 0) {
        this.selectAsset(currentList[0].symbol);
      } else {
        this.selectedAssetSymbol.set('');
      }
    }, { allowSignalWrites: true });
  }

  async generateInvestmentThesis(symbol: string): Promise<void> {
    const asset = this.allAssets().find(a => a.symbol === symbol);
    if (!asset || asset.aiThesis !== undefined) {
      return; // Already generated or loading
    }
    
    // Set loading state
    this.allAssets.update(assets => assets.map(a => a.symbol === symbol ? { ...a, aiThesis: null } : a));

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `Generate a concise investment thesis for ${asset.name} (${asset.symbol}). Provide a "Bull Case" and a "Bear Case". Format the response as a JSON object with two keys: "bull" and "bear".`;

      const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              bull: { type: Type.STRING },
              bear: { type: Type.STRING }
            }
          }
        }
      });
      
      const thesis = JSON.parse(response.text);
      
      // Set success state
      this.allAssets.update(assets => assets.map(a => a.symbol === symbol ? { ...a, aiThesis: thesis } : a));

    } catch (error) {
      console.error('Error generating investment thesis:', error);
      // Set error state
      this.allAssets.update(assets => assets.map(a => a.symbol === symbol ? { ...a, aiThesis: { bull: '', bear: '', error: 'Failed to generate thesis.' } } : a));
    }
  }

  async generateContractAudit(symbol: string): Promise<void> {
    const asset = this.allAssets().find(a => a.symbol === symbol);
    if (!asset || asset.aiAudit !== undefined) {
      return; // Already generated or loading
    }

    // Set loading state
    this.allAssets.update(assets => assets.map(a => a.symbol === symbol ? { ...a, aiAudit: null } : a));
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `Provide a simplified, high-level smart contract audit for a hypothetical token contract for ${asset.name} (${asset.symbol}). Identify 3-4 potential common vulnerabilities and their severity (High, Medium, or Low). Format the response as a JSON object with a "summary" (a brief overview) and a "vulnerabilities" array (each object having "name" and "severity").`;

      const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: { type: Type.STRING },
              vulnerabilities: { 
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    severity: { type: Type.STRING }
                  }
                }
              }
            }
          }
        }
      });

      const audit = JSON.parse(response.text);

      // Set success state
      this.allAssets.update(assets => assets.map(a => a.symbol === symbol ? { ...a, aiAudit: audit } : a));

    } catch(error) {
       console.error('Error generating contract audit:', error);
       // Set error state
       this.allAssets.update(assets => assets.map(a => a.symbol === symbol ? { ...a, aiAudit: { summary: '', vulnerabilities: [], error: 'Failed to generate audit.' } } : a));
    }
  }
  
  async generateGeopoliticalAnalysis(symbol: string): Promise<void> {
    const asset = this.allAssets().find(a => a.symbol === symbol);
    if (!asset || asset.aiGeopoliticalAnalysis !== undefined) return;

    this.allAssets.update(assets => assets.map(a => a.symbol === symbol ? { ...a, aiGeopoliticalAnalysis: null } : a));

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `Provide a brief geopolitical analysis for the currency pair ${asset.name} (${asset.symbol}). Identify 3 key factors. Format as JSON with 'summary' and an array of 'factors', where each factor has a 'name' and 'impact' ('Positive', 'Negative', or 'Neutral' for the base currency).`;
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT, properties: {
              summary: { type: Type.STRING },
              factors: { type: Type.ARRAY, items: {
                type: Type.OBJECT, properties: {
                  name: { type: Type.STRING },
                  impact: { type: Type.STRING }
                }
              }}
            }
          }
        }
      });
      const analysis = JSON.parse(response.text);
      this.allAssets.update(assets => assets.map(a => a.symbol === symbol ? { ...a, aiGeopoliticalAnalysis: analysis } : a));
    } catch (error) {
      console.error('Error generating geopolitical analysis:', error);
      this.allAssets.update(assets => assets.map(a => a.symbol === symbol ? { ...a, aiGeopoliticalAnalysis: { summary: '', factors: [], error: 'Failed to generate analysis.' } } : a));
    }
  }

  async generateSupplyChainOutlook(symbol: string): Promise<void> {
    const asset = this.allAssets().find(a => a.symbol === symbol);
    if (!asset || asset.aiSupplyChainOutlook !== undefined) return;

    this.allAssets.update(assets => assets.map(a => a.symbol === symbol ? { ...a, aiSupplyChainOutlook: null } : a));

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `Provide a brief supply chain outlook for ${asset.name} (${asset.symbol}). Identify 2-3 key risks or opportunities. Format as JSON with 'summary' and an array of 'outlook_points', where each point has a 'point' description and 'type' ('Risk' or 'Opportunity').`;
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT, properties: {
              summary: { type: Type.STRING },
              outlook_points: { type: Type.ARRAY, items: {
                  type: Type.OBJECT, properties: {
                    point: { type: Type.STRING },
                    type: { type: Type.STRING }
                  }
              }}
            }
          }
        }
      });
      const outlook = JSON.parse(response.text);
      this.allAssets.update(assets => assets.map(a => a.symbol === symbol ? { ...a, aiSupplyChainOutlook: outlook } : a));
    } catch (error) {
      console.error('Error generating supply chain outlook:', error);
      this.allAssets.update(assets => assets.map(a => a.symbol === symbol ? { ...a, aiSupplyChainOutlook: { summary: '', outlook_points: [], error: 'Failed to generate outlook.' } } : a));
    }
  }

  private _updateMarketData() {
    this.allAssets.update(assets => 
      assets.map(asset => {
        const changeFactor = (Math.random() - 0.49) * 0.01; // Small random change
        const newPrice = asset.price * (1 + changeFactor);
        const newPriceHistory = [...asset.priceHistory.slice(1), newPrice];

        return {
          ...asset,
          price: newPrice,
          priceHistory: newPriceHistory,
          changeValue: newPrice - asset.open,
          changePercent: ((newPrice - asset.open) / asset.open) * 100,
          sparkline: this.generateSparkline(newPriceHistory)
        };
      })
    );
  }

  private _calculateTechnicalAnalysis(asset: Asset): TechnicalAnalysis {
    const prices = asset.priceHistory;
    const rsi = 50 + (asset.changePercent * 5); // Simplified RSI simulation
    const sma20 = prices.slice(-20).reduce((a, b) => a + b, 0) / Math.min(prices.length, 20);
    const sma50 = prices.reduce((a, b) => a + b, 0) / prices.length;
    
    let sentiment: 'Bullish' | 'Bearish' | 'Neutral' = 'Neutral';
    if (asset.price > sma20 && rsi > 55) sentiment = 'Bullish';
    if (asset.price < sma20 && rsi < 45) sentiment = 'Bearish';

    return {
      rsi: Math.max(0, Math.min(100, rsi)),
      sma20,
      sma50,
      sentiment,
      summary: sentiment === 'Bullish' ? 'Price is above short-term average with positive momentum.' : sentiment === 'Bearish' ? 'Price is below short-term average with negative momentum.' : 'Market indicators are mixed; showing consolidation.'
    };
  }

  setActiveTab(tab: MarketTab) {
    this.activeTab.set(tab);
  }

  selectAsset(symbol: string) {
    this.selectedAssetSymbol.set(symbol);
  }

  private generateSparkline(history: number[]): string {
    const max = Math.max(...history);
    const min = Math.min(...history);
    const range = max - min;
    if (range === 0) return 'M0,30 L100,30';

    const points = history.map((p, i) => {
      const x = (i / (history.length - 1)) * 100;
      const y = 55 - ((p - min) / range) * 50;
      return `${x},${y}`;
    });

    return `M${points.join(' L')}`;
  }
}