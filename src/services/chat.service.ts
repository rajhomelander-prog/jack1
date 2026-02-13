import { Injectable, signal, computed, effect, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ProfileService } from './profile.service';

export interface Message {
  id: number;
  senderId: string; // 'me' or 'them'
  text: string;
  timestamp: string;
  status: 'sending' | 'sent' | 'delivered' | 'read';
  reactions: { [key: string]: string[] }; // emoji -> userIds ('me', 'them')
  attachment?: {
    type: 'image';
    url: string;
  };
}

export interface Participant {
  id: string;
  name: string;
  avatar: string;
}

export interface Conversation {
  id: number;
  name: string;
  avatar: string;
  participants: Participant[];
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  type: 'human' | 'ai';
  messages: Message[];
}

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private platformId = inject(PLATFORM_ID);
  private profileService = inject(ProfileService);
  private readonly CHAT_STORAGE_KEY = 'vichara-chat-conversations';

  private currentUser = computed(() => {
    const profile = this.profileService.userProfile();
    return { id: 'me', name: profile.name, avatar: 'https://picsum.photos/seed/currentuser/40/40' };
  });
  
  private conversationsSignal = signal<Conversation[]>(this.getInitialConversations());

  isOpponentTyping = signal(false);
  conversations = this.conversationsSignal.asReadonly();
  
  private selectedConversationId = signal<number | null>(null);

  selectedConversation = computed(() => {
    const id = this.selectedConversationId();
    if (id === null) return null;
    return this.conversationsSignal().find(c => c.id === id) ?? null;
  });

  constructor() {
    if (this.conversations().length > 0 && !this.selectedConversationId()) {
      this.selectedConversationId.set(this.conversations()[0].id);
    }
    
    // Effect to keep current user details in sync
    effect(() => {
        const newCurrentUser = this.currentUser();
        this.conversationsSignal.update(convos => 
          convos.map(convo => ({
            ...convo,
            participants: convo.participants.map(p => p.id === 'me' ? newCurrentUser : p)
          }))
        );
    });

    // Effect to persist all conversation changes
    effect(() => {
      this.saveConversationsToStorage();
    });
  }

  selectConversation(conversationId: number) {
    this.selectedConversationId.set(conversationId);
    this.conversationsSignal.update(convos =>
      convos.map(c => {
        if (c.id === conversationId) {
          const updatedMessages = c.messages.map(m =>
            m.senderId !== 'me' && m.status !== 'read' ? { ...m, status: 'read' as const } : m
          );
          return { ...c, unreadCount: 0, messages: updatedMessages };
        }
        return c;
      })
    );
  }

  sendMessage(text: string) {
    const selectedId = this.selectedConversationId();
    if (!selectedId) return;

    const newMessage: Message = {
      id: Date.now(),
      text,
      senderId: 'me',
      timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      status: 'sending',
      reactions: {}
    };

    this.conversationsSignal.update(convos =>
      convos.map(c => c.id === selectedId ? { ...c, messages: [...c.messages, newMessage], lastMessage: text, lastMessageTime: newMessage.timestamp } : c)
    );
    
    // Simulate status updates and reply
    setTimeout(() => this.updateMessageStatus(newMessage.id, 'sent'), 500);
    setTimeout(() => this.updateMessageStatus(newMessage.id, 'delivered'), 1200);
    setTimeout(() => {
      this.isOpponentTyping.set(true);
      this.updateMessageStatus(newMessage.id, 'read');
    }, 2000);
    setTimeout(() => this.simulateReply(selectedId), 3500);
  }

  toggleReaction(messageId: number, emoji: string) {
    const selectedId = this.selectedConversationId();
    if (!selectedId) return;

    this.conversationsSignal.update(convos =>
      convos.map(c => {
        if (c.id === selectedId) {
          return {
            ...c,
            messages: c.messages.map(m => {
              if (m.id === messageId) {
                const newReactions = { ...m.reactions };
                const reactors = newReactions[emoji] || [];
                if (reactors.includes('me')) {
                  newReactions[emoji] = reactors.filter(r => r !== 'me');
                  if (newReactions[emoji].length === 0) delete newReactions[emoji];
                } else {
                  newReactions[emoji] = [...reactors, 'me'];
                }
                return { ...m, reactions: newReactions };
              }
              return m;
            })
          };
        }
        return c;
      })
    );
  }

  private updateMessageStatus(messageId: number, status: Message['status']) {
    this.conversationsSignal.update(convos =>
      convos.map(c => ({
        ...c,
        messages: c.messages.map(m => m.id === messageId ? { ...m, status } : m)
      }))
    );
  }

  private simulateReply(conversationId: number) {
    this.isOpponentTyping.set(false);
    const conversation = this.conversationsSignal().find(c => c.id === conversationId);
    if (!conversation) return;

    const opponent = conversation.participants.find(p => p.id !== 'me');
    if (!opponent) return;

    const replyMessage: Message = {
      id: Date.now(),
      senderId: opponent.id,
      text: 'That is an interesting perspective. I will analyze it further.',
      timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      status: 'read',
      reactions: {}
    };

    this.conversationsSignal.update(convos =>
      convos.map(c => {
        if (c.id === conversationId) {
          return {
            ...c,
            messages: [...c.messages, replyMessage],
            lastMessage: replyMessage.text,
            lastMessageTime: replyMessage.timestamp,
          };
        }
        return c;
      })
    );
  }

  private getInitialConversations(): Conversation[] {
    if (isPlatformBrowser(this.platformId)) {
      try {
        const savedData = localStorage.getItem(this.CHAT_STORAGE_KEY);
        if (savedData) {
          return JSON.parse(savedData);
        }
      } catch (e) {
        console.error('Could not load chat conversations from localStorage', e);
        localStorage.removeItem(this.CHAT_STORAGE_KEY);
      }
    }
    return this.getDefaultConversations();
  }

  private saveConversationsToStorage(): void {
    if (isPlatformBrowser(this.platformId)) {
      try {
        localStorage.setItem(this.CHAT_STORAGE_KEY, JSON.stringify(this.conversationsSignal()));
      } catch (e) {
        console.error('Could not save chat conversations to localStorage', e);
      }
    }
  }

  private getDefaultConversations(): Conversation[] {
    const currentUser = this.currentUser();
    return [
      {
        id: 1,
        name: 'Kenji Tanaka',
        avatar: 'https://picsum.photos/seed/user2/40/40',
        participants: [
          currentUser,
          { id: 'them-kenji', name: 'Kenji Tanaka', avatar: 'https://picsum.photos/seed/user2/40/40' }
        ],
        lastMessage: 'Here is the latest render from the simulation.',
        lastMessageTime: '10:43 AM',
        unreadCount: 0,
        type: 'human',
        messages: [
          { id: 1, senderId: 'them-kenji', text: 'Hey, did you see the latest market data?', timestamp: '10:40 AM', status: 'read', reactions: {} },
          { id: 2, senderId: 'me', text: 'Yes, wild volatility. The new NeuroStream model is performing well though.', timestamp: '10:41 AM', status: 'read', reactions: {} },
          { id: 3, senderId: 'them-kenji', text: 'The BCI latency is down another 5ms.', timestamp: '10:42 AM', status: 'read', reactions: { '🚀': ['them-kenji'] } },
          { id: 4, senderId: 'me', text: 'Incredible! Here is the latest render from the simulation.', timestamp: '10:43 AM', status: 'read', reactions: { '👍': ['them-kenji'] }, attachment: { type: 'image', url: 'https://picsum.photos/seed/render1/400/250' } },
        ],
      },
      {
        id: 2,
        name: 'Philosophy AI',
        avatar: 'https://picsum.photos/seed/ai1/40/40',
        participants: [
          currentUser,
          { id: 'them-ai', name: 'Philosophy AI', avatar: 'https://picsum.photos/seed/ai1/40/40' }
        ],
        lastMessage: 'The nature of consciousness is a perennial question...',
        lastMessageTime: '9:30 AM',
        unreadCount: 0,
        type: 'ai',
        messages: [
          { id: 5, senderId: 'me', text: 'Can you explain the concept of phenomenal consciousness?', timestamp: '9:29 AM', status: 'read', reactions: {} },
          { id: 6, senderId: 'them-ai', text: 'Of course. Phenomenal consciousness refers to the subjective, qualitative experience of being—the "what it is like" aspect of mental states. The nature of consciousness is a perennial question...', timestamp: '9:30 AM', status: 'read', reactions: { '💡': ['me'] } },
        ],
      }
    ];
  }
}
