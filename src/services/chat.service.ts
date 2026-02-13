import { Injectable, signal, computed, effect, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ProfileService } from './profile.service';
import { FeedService } from './feed.service';

export interface Sticker {
  id: string;
  name: string;
  imageUrl: string;
}

export interface Message {
  id: number;
  senderId: string; 
  text: string;
  timestamp: string;
  status: 'sending' | 'sent' | 'delivered' | 'read';
  reactions: { [key: string]: string[] }; 
  attachment?: {
    type: 'image';
    url: string;
  };
  sticker?: Sticker;
  replyTo?: Message;
  isDeleted?: boolean;
  editedAt?: string;
}

export interface Participant {
  id: string;
  name: string;
  avatar: string;
}

export type CallStatus = 'none' | 'outgoing' | 'incoming' | 'active';
export type CallType = 'video' | 'voice';
export type ConversationType = 'human' | 'ai' | 'group' | 'broadcast' | 'market';

export interface Conversation {
  id: number;
  name: string;
  avatar: string;
  participants: Participant[];
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  type: ConversationType;
  messages: Message[];
  callStatus: CallStatus;
  callType: CallType | null;
  isLocked: boolean;
  isDisappearing: boolean;
  pinnedMessageIds: number[];
}

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private platformId = inject(PLATFORM_ID);
  private profileService = inject(ProfileService);
  private feedService = inject(FeedService);
  private readonly CHAT_STORAGE_KEY = 'vichara-chat-conversations';

  private currentUser = computed(() => {
    const profile = this.profileService.userProfile();
    return { id: 'me', name: profile.name, avatar: 'https://picsum.photos/seed/currentuser/40/40' };
  });
  
  private conversationsSignal = signal<Conversation[]>(this.getInitialConversations());
  
  private availableStickers = signal<Sticker[]>([
    { id: 'aapl_1', name: '1 AAPL Share', imageUrl: 'https://picsum.photos/seed/aapl_sticker/128/128' },
    { id: 'tsla_1', name: '1 TSLA Share', imageUrl: 'https://picsum.photos/seed/tsla_sticker/128/128' },
    { id: 'btc_001', name: '0.01 BTC', imageUrl: 'https://picsum.photos/seed/btc_sticker/128/128' },
  ]);

  isOpponentTyping = signal(false);
  conversations = this.conversationsSignal.asReadonly();
  stickers = this.availableStickers.asReadonly();
  
  private selectedConversationId = signal<number | null>(null);

  selectedConversation = computed(() => {
    const id = this.selectedConversationId();
    if (id === null) return null;
    return this.conversationsSignal().find(c => c.id === id) ?? null;
  });

  activeCall = computed(() => {
    return this.conversationsSignal().find(c => c.callStatus !== 'none');
  });

  constructor() {
    if (this.conversations().length > 0 && !this.selectedConversationId()) {
      this.selectedConversationId.set(this.conversations()[0].id);
    }
    
    effect(() => {
        const newCurrentUser = this.currentUser();
        this.conversationsSignal.update(convos => 
          convos.map(convo => ({
            ...convo,
            participants: convo.participants.map(p => p.id === 'me' ? newCurrentUser : p)
          }))
        );
    });

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

  sendMessage(text: string, replyTo?: Message) {
    const selectedId = this.selectedConversationId();
    if (!selectedId) return;

    const newMessage: Message = {
      id: Date.now(),
      text,
      senderId: 'me',
      timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      status: 'sending',
      reactions: {},
      replyTo: replyTo ? { ...replyTo, replyTo: undefined } : undefined // Avoid nested replies
    };

    this.conversationsSignal.update(convos =>
      convos.map(c => c.id === selectedId ? { ...c, messages: [...c.messages, newMessage], lastMessage: text, lastMessageTime: newMessage.timestamp } : c)
    );
    
    this.simulateMessageLifecycle(newMessage, 'That is an interesting perspective. I will analyze it further.');
  }

  editMessage(messageId: number, newText: string) {
    const selectedId = this.selectedConversationId();
    if (!selectedId) return;

    this.conversationsSignal.update(convos => 
      convos.map(c => {
        if (c.id === selectedId) {
          return {
            ...c,
            messages: c.messages.map(m => 
              m.id === messageId 
                ? { ...m, text: newText, editedAt: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) } 
                : m
            )
          };
        }
        return c;
      })
    );
  }

  deleteMessageForEveryone(messageId: number) {
    const selectedId = this.selectedConversationId();
    if (!selectedId) return;

    this.conversationsSignal.update(convos => 
      convos.map(c => {
        if (c.id === selectedId) {
          return {
            ...c,
            messages: c.messages.map(m => 
              m.id === messageId 
                ? { ...m, isDeleted: true, text: 'This message was deleted.', sticker: undefined, attachment: undefined } 
                : m
            )
          };
        }
        return c;
      })
    );
  }

  pinMessage(messageId: number) {
    const selectedId = this.selectedConversationId();
    if (!selectedId) return;

    this.conversationsSignal.update(convos => 
      convos.map(c => {
        if (c.id === selectedId) {
          const newPinnedIds = [...c.pinnedMessageIds];
          if (!newPinnedIds.includes(messageId)) {
            // Unshift to add to the beginning (most recent pin)
            newPinnedIds.unshift(messageId);
          }
          return { ...c, pinnedMessageIds: newPinnedIds };
        }
        return c;
      })
    );
  }
  
  unpinMessage(messageId: number) {
    const selectedId = this.selectedConversationId();
    if (!selectedId) return;

    this.conversationsSignal.update(convos => 
      convos.map(c => 
        c.id === selectedId 
          ? { ...c, pinnedMessageIds: c.pinnedMessageIds.filter(id => id !== messageId) }
          : c
      )
    );
  }

  sendSticker(stickerId: string) {
    const selectedId = this.selectedConversationId();
    const sticker = this.availableStickers().find(s => s.id === stickerId);
    if (!selectedId || !sticker) return;

    const newMessage: Message = {
      id: Date.now(),
      text: '',
      senderId: 'me',
      timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      status: 'sending',
      reactions: {},
      sticker: sticker,
    };

    const lastMessageText = `Sent a sticker: ${sticker.name}`;
    this.conversationsSignal.update(convos =>
      convos.map(c => c.id === selectedId ? { ...c, messages: [...c.messages, newMessage], lastMessage: lastMessageText, lastMessageTime: newMessage.timestamp } : c)
    );

    this.simulateMessageLifecycle(newMessage, 'Thank you for the gift!');
  }

  createConversation(name: string, participantIds: string[]): void {
    const allUsers = this.feedService.users();
    const currentUser = this.currentUser();

    const selectedParticipants: Participant[] = participantIds
      .map(id => {
        const user = allUsers.find(u => u.id === id);
        return user ? { id: user.id, name: user.name, avatar: user.avatar } : null;
      })
      .filter((p): p is Participant => p !== null);
    
    if (selectedParticipants.length < 1) return;
    
    const isGroup = selectedParticipants.length > 1;

    const newConversation: Conversation = {
      id: Date.now(),
      name: isGroup ? name : selectedParticipants[0].name,
      avatar: isGroup ? `https://picsum.photos/seed/group${Date.now()}/40/40` : selectedParticipants[0].avatar,
      participants: [currentUser, ...selectedParticipants],
      lastMessage: isGroup ? 'Group created.' : 'Conversation started.',
      lastMessageTime: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      unreadCount: 0,
      type: isGroup ? 'group' : 'human',
      messages: [],
      callStatus: 'none',
      callType: null,
      isLocked: false,
      isDisappearing: false,
      pinnedMessageIds: [],
    };

    this.conversationsSignal.update(convos => [newConversation, ...convos]);
    this.selectConversation(newConversation.id);
  }

  startCall(type: CallType) {
    const selectedId = this.selectedConversationId();
    if (!selectedId || this.activeCall()) return;

    this.updateConversationCallState(selectedId, { callStatus: 'outgoing', callType: type });

    setTimeout(() => {
      this.updateConversationCallState(selectedId, { callStatus: 'active' });
    }, 3000);
  }

  acceptCall() {
    const call = this.activeCall();
    if (call && call.callStatus === 'incoming') {
      this.updateConversationCallState(call.id, { callStatus: 'active' });
    }
  }

  endCall() {
    const call = this.activeCall();
    if (call) {
      this.updateConversationCallState(call.id, { callStatus: 'none', callType: null });
    }
  }
  
  declineCall() { this.endCall(); }

  private updateConversationCallState(convoId: number, updates: Partial<Pick<Conversation, 'callStatus' | 'callType'>>) {
    this.conversationsSignal.update(convos => 
      convos.map(c => c.id === convoId ? { ...c, ...updates } : c)
    );
  }

  private simulateMessageLifecycle(message: Message, replyText: string) {
    setTimeout(() => this.updateMessageStatus(message.id, 'sent'), 500);
    setTimeout(() => this.updateMessageStatus(message.id, 'delivered'), 1200);
    setTimeout(() => {
      const conv = this.selectedConversation();
      if (conv?.type !== 'group' && conv?.type !== 'market') {
          this.isOpponentTyping.set(true);
      }
      this.updateMessageStatus(message.id, 'read');
    }, 2000);
    setTimeout(() => this.simulateReply(this.selectedConversationId()!, replyText), 3500);
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

  private simulateReply(conversationId: number, text: string) {
    this.isOpponentTyping.set(false);
    const conversation = this.conversationsSignal().find(c => c.id === conversationId);
    if (!conversation || conversation.type === 'group' || conversation.type === 'market') {
      this.isOpponentTyping.set(false);
      return; 
    }

    const opponent = conversation.participants.find(p => p.id !== 'me');
    if (!opponent) return;

    const replyMessage: Message = {
      id: Date.now(),
      senderId: opponent.id,
      text: text,
      timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      status: 'read',
      reactions: {}
    };

    this.conversationsSignal.update(convos =>
      convos.map(c => {
        if (c.id === conversationId) {
          if (c.type === 'human' && Math.random() > 0.8 && !this.activeCall()) {
            setTimeout(() => {
                this.updateConversationCallState(c.id, { callStatus: 'incoming', callType: Math.random() > 0.5 ? 'video' : 'voice' });
            }, 2000);
          }
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
          return JSON.parse(savedData).map((c: any) => ({...c, callStatus: 'none', callType: null, isLocked: c.isLocked || false, isDisappearing: c.isDisappearing || false, pinnedMessageIds: c.pinnedMessageIds || [] }));
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
    const currentUser = { id: 'me', name: 'You', avatar: this.currentUser().avatar };
    const baseProps = {
        lastMessage: '', lastMessageTime: '', unreadCount: 0, messages: [],
        callStatus: 'none' as CallStatus, callType: null, isLocked: false, isDisappearing: false, pinnedMessageIds: []
    };
    return [
      {
        id: 1, name: 'Kenji Tanaka', avatar: 'https://picsum.photos/seed/user2/40/40', type: 'human',
        participants: [ currentUser, { id: 'them-kenji', name: 'Kenji Tanaka', avatar: 'https://picsum.photos/seed/user2/40/40' }],
        lastMessage: 'Incredible! Here is the latest render from the simulation.', lastMessageTime: '10:43 AM', unreadCount: 0,
        messages: [
          { id: 1, senderId: 'them-kenji', text: 'Hey, did you see the latest market data?', timestamp: '10:40 AM', status: 'read', reactions: {} },
          { id: 2, senderId: 'me', text: 'Yes, wild volatility. The new NeuroStream model is performing well though.', timestamp: '10:41 AM', status: 'read', reactions: {} },
          { id: 3, senderId: 'them-kenji', text: 'The BCI latency is down another 5ms.', timestamp: '10:42 AM', status: 'read', reactions: { '🚀': ['them-kenji'] } },
          { id: 4, senderId: 'me', text: 'Incredible! Here is the latest render from the simulation.', timestamp: '10:43 AM', status: 'read', reactions: { '👍': ['them-kenji'] }, attachment: { type: 'image', url: 'https://picsum.photos/seed/render1/400/250' } },
        ],
        callStatus: 'none', callType: null, isLocked: false, isDisappearing: false, pinnedMessageIds: [3],
      },
      {
        id: 3, name: 'AI Assistant', avatar: 'https://picsum.photos/seed/ai2/40/40', type: 'ai',
        participants: [ currentUser, { id: 'ai-assistant', name: 'AI Assistant', avatar: 'https://picsum.photos/seed/ai2/40/40' }],
        lastMessage: 'I can summarize conversations, translate text, and more.', lastMessageTime: '11:00 AM',
        messages: [{ id: 10, senderId: 'ai-assistant', text: 'Hello! I am your AI Assistant. How can I help you today?', timestamp: '11:00 AM', status: 'read', reactions: {} }],
        ...baseProps
      },
      {
        id: 4, name: '#neurotech-investors', avatar: 'https://picsum.photos/seed/market1/40/40', type: 'market',
        participants: [ currentUser, { id: 'them-kenji', name: 'Kenji Tanaka', avatar: 'https://picsum.photos/seed/user2/40/40' }, { id: 'user1', name: 'Eleanor Vance', avatar: 'https://picsum.photos/seed/user1/40/40' }],
        lastMessage: 'What are your thoughts on the latest Neuralink update?', lastMessageTime: '11:05 AM',
        messages: [{ id: 11, senderId: 'user1', text: 'What are your thoughts on the latest Neuralink update?', timestamp: '11:05 AM', status: 'read', reactions: {} }],
        ...baseProps
      },
      {
        id: 2, name: 'Philosophy AI', avatar: 'https://picsum.photos/seed/ai1/40/40', type: 'ai',
        participants: [ currentUser, { id: 'them-ai', name: 'Philosophy AI', avatar: 'https://picsum.photos/seed/ai1/40/40' }],
        lastMessage: 'The nature of consciousness is a perennial question...', lastMessageTime: '9:30 AM', unreadCount: 0,
        messages: [
          { id: 5, senderId: 'me', text: 'Can you explain the concept of phenomenal consciousness?', timestamp: '9:29 AM', status: 'read', reactions: {} },
          { id: 6, senderId: 'them-ai', text: 'Of course. Phenomenal consciousness refers to the subjective, qualitative experience of being—the "what it is like" aspect of mental states. The nature of consciousness is a perennial question...', timestamp: '9:30 AM', status: 'read', reactions: { '💡': ['me'] } },
        ],
        callStatus: 'none', callType: null, isLocked: true, isDisappearing: true, pinnedMessageIds: [],
      }
    ];
  }
}