import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MarketService, MarketTab, Asset, TechnicalAnalysis } from '../../services/market.service';
import { Signal } from '@angular/core';

@Component({
  selector: 'app-market',
  templateUrl: './market.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
})
export class MarketComponent {
  private marketService = inject(MarketService);

  activeTab = this.marketService.activeTab;
  tabs: MarketTab[] = ['Stocks', 'Crypto', 'Forex', 'Commodities'];
  watchlist: Signal<Asset[]> = this.marketService.filteredWatchlist;
  selectedAsset: Signal<Asset | null> = this.marketService.selectedAsset;
  technicalAnalysis: Signal<TechnicalAnalysis | null> = this.marketService.technicalAnalysis;

  setActiveTab(tab: MarketTab) {
    this.marketService.setActiveTab(tab);
  }

  selectAsset(item: Asset) {
    this.marketService.selectAsset(item.symbol);
  }
  
  getAIThesis(asset: Asset) {
    this.marketService.generateInvestmentThesis(asset.symbol);
  }

  getAIAudit(asset: Asset) {
    this.marketService.generateContractAudit(asset.symbol);
  }

  getAIGeopoliticalAnalysis(asset: Asset) {
    this.marketService.generateGeopoliticalAnalysis(asset.symbol);
  }

  getAISupplyChainOutlook(asset: Asset) {
    this.marketService.generateSupplyChainOutlook(asset.symbol);
  }
}