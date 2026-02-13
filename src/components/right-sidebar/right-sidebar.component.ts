import { ChangeDetectionStrategy, Component, inject, signal, Signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InsightService, Insight } from '../../services/insight.service';
import { MarketDataService, MarketIndex } from '../../services/market-data.service';
import { StoryService, UserStory } from '../../services/story.service';
import { FeedService, User } from '../../services/feed.service';

@Component({
  selector: 'app-right-sidebar',
  templateUrl: './right-sidebar.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule]
})
export class RightSidebarComponent {
  private insightService = inject(InsightService);
  private marketDataService = inject(MarketDataService);
  private storyService = inject(StoryService);
  private feedService = inject(FeedService);
  
  dailyInsight = signal<Insight>(this.insightService.getDailyInsight());
  marketSnapshot: Signal<MarketIndex[]> = this.marketDataService.getMarketSnapshot();
  stories: Signal<UserStory[]> = this.storyService.allStories;
  suggested: Signal<User[]> = this.feedService.suggestions;

  refreshInsight(): void {
    this.dailyInsight.set(this.insightService.getRandomInsight());
  }

  openStoryViewer(userId: string): void {
    this.storyService.openViewer(userId);
  }

  follow(user: User): void {
    this.feedService.followUser(user.id);
  }
}