import { Injectable, signal, computed } from '@angular/core';

export interface StoryItem {
  id: number;
  type: 'image'; // For now, only images
  url: string;
  duration: number; // in milliseconds
}

export interface UserStory {
  userId: string;
  userName: string;
  userAvatar: string;
  items: StoryItem[];
  seen?: boolean; // To control the glow effect
}

@Injectable({
  providedIn: 'root'
})
export class StoryService {
  private stories = signal<UserStory[]>([
    {
      userId: 'user1', userName: 'Eleanor', userAvatar: 'https://picsum.photos/seed/user1/40/40', seen: false,
      items: [
        { id: 101, type: 'image', url: 'https://picsum.photos/seed/story1_1/1080/1920', duration: 5000 },
        { id: 102, type: 'image', url: 'https://picsum.photos/seed/story1_2/1080/1920', duration: 5000 },
      ]
    },
    {
      userId: 'user2', userName: 'Kenji', userAvatar: 'https://picsum.photos/seed/user2/40/40', seen: false,
      items: [
        { id: 201, type: 'image', url: 'https://picsum.photos/seed/story2_1/1080/1920', duration: 5000 },
      ]
    },
    {
      userId: 'user3', userName: 'Sofia', userAvatar: 'https://picsum.photos/seed/user3/40/40', seen: true,
      items: [
        { id: 301, type: 'image', url: 'https://picsum.photos/seed/story3_1/1080/1920', duration: 5000 },
        { id: 302, type: 'image', url: 'https://picsum.photos/seed/story3_2/1080/1920', duration: 5000 },
        { id: 303, type: 'image', url: 'https://picsum.photos/seed/story3_3/1080/1920', duration: 5000 },
      ]
    },
    {
      userId: 'user4', userName: 'Marcus', userAvatar: 'https://picsum.photos/seed/user4/40/40', seen: false,
      items: [
        { id: 401, type: 'image', url: 'https://picsum.photos/seed/story4_1/1080/1920', duration: 5000 },
      ]
    },
  ]);

  isViewerOpen = signal(false);
  private activeUserIndex = signal(0);
  private activeItemIndex = signal(0);

  allStories = this.stories.asReadonly();

  activeUserStory = computed(() => {
    if (!this.isViewerOpen()) return null;
    return this.stories()[this.activeUserIndex()];
  });

  activeStoryItem = computed(() => {
    const userStory = this.activeUserStory();
    if (!userStory) return null;
    return userStory.items[this.activeItemIndex()];
  });

  openViewer(userId: string) {
    const userIndex = this.stories().findIndex(s => s.userId === userId);
    if (userIndex === -1) return;

    this.activeUserIndex.set(userIndex);
    this.activeItemIndex.set(0);
    this.isViewerOpen.set(true);
    this.markStoryAsSeen(userId);
  }

  closeViewer() {
    this.isViewerOpen.set(false);
  }

  next() {
    const currentUser = this.activeUserStory();
    if (!currentUser) return;

    if (this.activeItemIndex() < currentUser.items.length - 1) {
      // Go to next item in the same story
      this.activeItemIndex.update(i => i + 1);
    } else {
      // Go to next user's story
      if (this.activeUserIndex() < this.stories().length - 1) {
        this.activeUserIndex.update(i => i + 1);
        this.activeItemIndex.set(0);
        this.markStoryAsSeen(this.stories()[this.activeUserIndex()].userId);
      } else {
        // Last item of last story, close viewer
        this.closeViewer();
      }
    }
  }

  previous() {
    if (this.activeItemIndex() > 0) {
      // Go to previous item in same story
      this.activeItemIndex.update(i => i - 1);
    } else {
      // Go to previous user's story
      if (this.activeUserIndex() > 0) {
        this.activeUserIndex.update(i => i - 1);
        // Go to the last item of the previous user's story
        const prevUserStory = this.stories()[this.activeUserIndex()];
        this.activeItemIndex.set(prevUserStory.items.length - 1);
        this.markStoryAsSeen(prevUserStory.userId);
      }
    }
  }

  private markStoryAsSeen(userId: string) {
    this.stories.update(stories =>
      stories.map(s => s.userId === userId ? { ...s, seen: true } : s)
    );
  }
}
