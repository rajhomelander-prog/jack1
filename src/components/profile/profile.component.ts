import { ChangeDetectionStrategy, Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FeedService } from '../../services/feed.service';
import { TarotService } from '../../services/tarot.service';
import { ProfileService } from '../../services/profile.service';

type Tab = 'Dashboard' | 'Posts' | 'Gallery' | 'Astrology' | 'Tarot' | 'Resume';

interface Post {
  id: number;
  content: string;
  image?: string;
  likes: number;
  comments: number;
  time: string;
}

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule]
})
export class ProfileComponent {
  private feedService = inject(FeedService);
  private tarotService = inject(TarotService);
  private profileService = inject(ProfileService);
  activeTab = signal<Tab>('Dashboard');

  tabs: Tab[] = ['Dashboard', 'Posts', 'Gallery', 'Astrology', 'Tarot', 'Resume'];

  user = this.profileService.userProfile;

  posts = signal([
    {
      id: 1,
      time: '2d',
      content: 'Exploring the implications of decentralized identity verification on the future of digital trust. The potential to give users control over their own data is immense.',
      image: 'https://picsum.photos/seed/profilepost1/800/400',
      likes: 15,
      comments: 4,
    },
    {
      id: 2,
      time: '5d',
      content: 'The architectural beauty of procedural generation in game design is not just in its efficiency, but in its ability to create emergent, unpredictable experiences for players.',
      likes: 32,
      comments: 8,
    }
  ] as Post[]);

  achievements = signal([
    { id: 1, name: 'First Post', icon: 'M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z' },
    { id: 2, name: '100 Followers', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
    { id: 3, name: 'Power User', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
    { id: 4, name: 'Commentator', icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' },
    { id: 5, name: 'Streak 7', icon: 'M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.657 7.343A8 8 0 0118 14c0 2.21-1.79 4-4 4a4 4 0 01-4-4 4 4 0 014-4 .5.5 0 000-1 5 5 0 00-5 5 5 5 0 005 5 5 5 0 005-5c0-1.272-.486-2.428-1.343-3.343z' }
  ]);

  connections = this.feedService.following;
  
  // Tarot tab state
  dailyTarotCard = this.tarotService.cardOfTheDay;
  isCardRevealed = signal<boolean>(!!this.tarotService.cardOfTheDay());

  setActiveTab(tab: Tab) {
    this.activeTab.set(tab);
  }

  revealCard() {
    if (this.isCardRevealed()) return;
    this.tarotService.drawCardOfTheDay();
    this.isCardRevealed.set(true);
  }
}
