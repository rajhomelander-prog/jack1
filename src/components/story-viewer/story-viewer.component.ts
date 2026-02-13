import { ChangeDetectionStrategy, Component, inject, effect, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StoryService } from '../../services/story.service';

@Component({
  selector: 'app-story-viewer',
  templateUrl: './story-viewer.component.html',
  styleUrls: ['./story-viewer.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
})
export class StoryViewerComponent {
  storyService = inject(StoryService);
  isViewerOpen = this.storyService.isViewerOpen;
  activeUserStory = this.storyService.activeUserStory;
  activeStoryItem = this.storyService.activeStoryItem;
  activeItemIndex = this.storyService.activeItemIndex;

  private timer: any;
  // Use a signal to manage animation key for progress bar reset
  animationKey = signal(0); 

  constructor() {
    effect(() => {
      this.stopTimer();
      const item = this.activeStoryItem();
      if (item && this.isViewerOpen()) {
        this.startTimer(item.duration);
        // Increment key to force re-render/re-animation of progress bar
        this.animationKey.update(k => k + 1);
      }
    });
  }

  next() {
    this.storyService.next();
  }

  previous() {
    this.storyService.previous();
  }

  close() {
    this.storyService.closeViewer();
  }

  private startTimer(duration: number) {
    this.timer = setTimeout(() => {
      this.next();
    }, duration);
  }

  private stopTimer() {
    clearTimeout(this.timer);
  }
}
