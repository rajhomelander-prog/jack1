import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

type NotificationType = 'mention' | 'comment' | 'like' | 'follow';
type NotificationFilter = 'All' | 'Mentions' | 'Comments' | 'Likes' | 'Follows';

interface Notification {
  id: number;
  type: NotificationType;
  actor: {
    name: string;
    avatar: string;
  };
  text: string;
  timestamp: string;
  isRead: boolean;
}

@Component({
  selector: 'app-notifications',
  templateUrl: './notifications.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
})
export class NotificationsComponent {
  allNotifications = signal<Notification[]>([
    { id: 1, type: 'comment', actor: { name: 'Kenji Tanaka', avatar: 'https://picsum.photos/seed/user2/40/40' }, text: 'commented on your post: "The latency reduction..."', timestamp: '2h ago', isRead: false },
    { id: 2, type: 'like', actor: { name: 'Sofia Reyes', avatar: 'https://picsum.photos/seed/user3/40/40' }, text: 'liked your post about decentralized identity.', timestamp: '5h ago', isRead: false },
    { id: 3, type: 'follow', actor: { name: 'Alice Walker', avatar: 'https://picsum.photos/seed/conn1/40/40' }, text: 'started following you.', timestamp: '1d ago', isRead: true },
    { id: 4, type: 'mention', actor: { name: 'Eleanor Vance', avatar: 'https://picsum.photos/seed/user1/40/40' }, text: 'mentioned you in a post.', timestamp: '2d ago', isRead: false },
    { id: 5, type: 'like', actor: { name: 'Bob Chen', avatar: 'https://picsum.photos/seed/conn2/40/40' }, text: 'liked your post.', timestamp: '3d ago', isRead: true },
    { id: 6, type: 'comment', actor: { name: 'Sofia Reyes', avatar: 'https://picsum.photos/seed/user3/40/40' }, text: 'replied to your comment.', timestamp: '4d ago', isRead: true },
  ]);

  filters: NotificationFilter[] = ['All', 'Mentions', 'Comments', 'Likes', 'Follows'];
  activeFilter = signal<NotificationFilter>('All');

  filteredNotifications = computed(() => {
    const filter = this.activeFilter();
    if (filter === 'All') {
      return this.allNotifications();
    }
    const typeMap: Record<string, NotificationType> = {
      'Mentions': 'mention',
      'Comments': 'comment',
      'Likes': 'like',
      'Follows': 'follow'
    }
    return this.allNotifications().filter(n => n.type === typeMap[filter]);
  });

  setActiveFilter(filter: NotificationFilter) {
    this.activeFilter.set(filter);
  }

  markAsRead(notificationId: number) {
    this.allNotifications.update(notifications =>
      notifications.map(n =>
        n.id === notificationId ? { ...n, isRead: true } : n
      )
    );
  }

  getIconForType(type: NotificationType): string {
    switch (type) {
      case 'mention':
        return 'M15 7a2 2 0 012 2v6a2 2 0 01-2 2H9a2 2 0 01-2-2V9a2 2 0 012-2h6zM9 9v6h6V9H9z';
      case 'comment':
        return 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z';
      case 'like':
        return 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z';
      case 'follow':
        return 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z';
      default:
        return '';
    }
  }
}
