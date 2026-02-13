import { ChangeDetectionStrategy, Component, inject, signal, Signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { InsightService, Insight } from '../../services/insight.service';
import { MarketDataService, MarketIndex } from '../../services/market-data.service';
import { StoryService, UserStory } from '../../services/story.service';
import { FeedService, User } from '../../services/feed.service';
import { MarketService, MarketTab } from '../../services/market.service';

export type InsightCategory = Insight['type'] | 'All';

@Component({
  selector: 'app-right-sidebar',
  templateUrl: './right-sidebar.component.html',
  styleUrls: ['./right-sidebar.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule]
})
export class RightSidebarComponent {
  private insightService = inject(InsightService);
  private marketDataService = inject(MarketDataService);
  private storyService = inject(StoryService);
  private feedService = inject(FeedService);
  private router = inject(Router);
  private marketService = inject(MarketService);
  
  dailyInsight = signal<Insight>(this.insightService.getDailyInsight());
  marketSnapshot: Signal<MarketIndex[]> = this.marketDataService.getMarketSnapshot();
  stories: Signal<UserStory[]> = this.storyService.allStories;
  suggested: Signal<User[]> = this.feedService.suggestions;

  activeInsightCategory = signal<InsightCategory>('All');
  insightCategories: InsightCategory[] = ['All', 'Philosophy', 'Finance', 'Reflection'];

  refreshInsight(): void {
    this.dailyInsight.set(this.insightService.getRandomInsight(this.activeInsightCategory()));
  }

  setInsightCategory(category: InsightCategory): void {
    if (this.activeInsightCategory() === category) {
      this.refreshInsight();
      return;
    }
    this.activeInsightCategory.set(category);
    this.refreshInsight();
  }

  openStoryViewer(userId: string): void {
    this.storyService.openViewer(userId);
  }

  follow(user: User): void {
    this.feedService.followUser(user.id);
  }

  navigateToMarket(type: MarketTab): void {
    this.router.navigate(['/market']);
    // A slight delay ensures the navigation completes before we try to set the tab.
    setTimeout(() => {
      this.marketService.setActiveTab(type);
    }, 100);
  }
}