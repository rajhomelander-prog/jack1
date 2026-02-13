import { ChangeDetectionStrategy, Component, effect, ElementRef, viewChild, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ChatService, Conversation, Message, Participant, Sticker, ConversationType } from '../../services/chat.service';
import { FeedService } from '../../services/feed.service';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule],
})
export class ChatComponent {
  private chatService = inject(ChatService);
  private feedService = inject(FeedService);
  
  messageContainer = viewChild<ElementRef>('messageContainer');

  conversations = this.chatService.conversations;
  selectedConversation = this.chatService.selectedConversation;
  isOpponentTyping = this.chatService.isOpponentTyping;
  stickers = this.chatService.stickers;
  activeCall = this.chatService.activeCall;

  // --- UI State ---
  isStickerPopoverOpen = signal(false);
  chatInput = new FormControl('', { nonNullable: true, validators: [Validators.required] });
  reactionEmojis = ['👍', '❤️', '😂', '😮', '😢', '🙏'];
  activeMessageMenu = signal<number | null>(null);
  
  // Modes
  replyingToMessage = signal<Message | null>(null);
  editingMessage = signal<Message | null>(null);
  
  // Call UI State
  isMuted = signal(false);
  isCameraOff = signal(false);

  // New Chat Modal State
  isNewChatModalOpen = signal(false);
  newChatForm = new FormGroup({
    name: new FormControl('', [Validators.maxLength(50)]), // Optional for 1-on-1, required for group
    participants: new FormControl<string[]>([], [Validators.required, Validators.minLength(1)])
  });

  connectableUsers = computed(() => {
    const following = this.feedService.following();
    const suggestions = this.feedService.suggestions();
    const all = [...following, ...suggestions];
    const seen = new Set();
    return all.filter(el => {
      const duplicate = seen.has(el.id);
      seen.add(el.id);
      return !duplicate;
    });
  });
  
  pinnedMessages = computed(() => {
    const convo = this.selectedConversation();
    if (!convo || convo.pinnedMessageIds.length === 0) return [];
    
    const messageMap = new Map(convo.messages.map(m => [m.id, m]));
    return convo.pinnedMessageIds.map(id => messageMap.get(id)).filter((m): m is Message => !!m);
  });

  // Expose Object.keys to the template
  objectKeys = Object.keys;

  constructor() {
    effect(() => {
      if (this.selectedConversation() || this.isOpponentTyping()) {
        this.scrollToBottom();
      }
    });
  }
  
  // --- Message Actions ---
  submitMessage() {
    if (this.chatInput.invalid) return;
    const messageText = this.chatInput.value.trim();
    if (!messageText) return;

    if (this.editingMessage()) {
      this.chatService.editMessage(this.editingMessage()!.id, messageText);
    } else {
      this.chatService.sendMessage(messageText, this.replyingToMessage() ?? undefined);
    }
    this.cancelEditOrReply();
  }

  // --- UI & Mode Management ---
  openMessageMenu(messageId: number, event: MouseEvent) {
    event.preventDefault(); // Prevent default right-click menu
    this.activeMessageMenu.set(messageId);
    // Add a listener to close the menu when clicking outside
    const listener = () => {
      this.closeMessageMenu();
      window.removeEventListener('click', listener);
      window.removeEventListener('contextmenu', listener);
    };
    window.addEventListener('click', listener, { once: true });
    window.addEventListener('contextmenu', listener, { once: true });
  }

  closeMessageMenu() {
    this.activeMessageMenu.set(null);
  }

  setReplyMode(message: Message) {
    if (message.isDeleted) return;
    this.editingMessage.set(null);
    this.replyingToMessage.set(message);
    this.chatInput.reset();
    this.closeMessageMenu();
  }
  
  setEditMode(message: Message) {
    if (message.isDeleted) return;
    this.replyingToMessage.set(null);
    this.editingMessage.set(message);
    this.chatInput.setValue(message.text);
    this.closeMessageMenu();
  }
  
  cancelEditOrReply() {
    this.replyingToMessage.set(null);
    this.editingMessage.set(null);
    this.chatInput.reset();
  }

  deleteMessageForEveryone(messageId: number) {
    this.chatService.deleteMessageForEveryone(messageId);
    this.closeMessageMenu();
  }
  
  pinMessage(message: Message) {
    if (message.isDeleted) return;
    this.chatService.pinMessage(message.id);
    this.closeMessageMenu();
  }
  
  unpinMessage(messageId: number) {
    this.chatService.unpinMessage(messageId);
  }

  getParticipant(convo: Conversation, senderId: string): Participant | undefined {
    return convo.participants.find(p => p.id === senderId);
  }

  selectConversation(conversation: Conversation) {
    this.chatService.selectConversation(conversation.id);
  }
  
  sendSticker(stickerId: string) {
    this.chatService.sendSticker(stickerId);
    this.isStickerPopoverOpen.set(false);
  }
  
  toggleStickerPopover() {
    this.isStickerPopoverOpen.update(v => !v);
  }

  toggleReaction(message: Message, emoji: string) {
    this.chatService.toggleReaction(message.id, emoji);
  }
  
  // --- Call Methods ---
  startVideoCall() { this.chatService.startCall('video'); }
  startVoiceCall() { this.chatService.startCall('voice'); }
  acceptCall() { this.chatService.acceptCall(); }
  declineCall() { this.chatService.declineCall(); }
  endCall() { this.chatService.endCall(); }
  toggleMute() { this.isMuted.update(v => !v); }
  toggleCamera() { this.isCameraOff.update(v => !v); }

  // --- New Chat/Group Methods ---
  openNewChatModal(open?: boolean): void {
    this.isNewChatModalOpen.set(open ?? !this.isNewChatModalOpen());
    if (!this.isNewChatModalOpen()) {
      this.newChatForm.reset({ name: '', participants: [] });
    }
  }

  onParticipantSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    const userId = input.value;
    const isChecked = input.checked;
    
    const currentParticipants = this.newChatForm.controls.participants.value ?? [];
    
    if (isChecked) {
      this.newChatForm.controls.participants.setValue([...currentParticipants, userId]);
    } else {
      this.newChatForm.controls.participants.setValue(currentParticipants.filter(id => id !== userId));
    }

    // Auto-fill name for 1-on-1 chats
    const selected = this.newChatForm.controls.participants.value;
    if (selected && selected.length === 1) {
        const user = this.connectableUsers().find(u => u.id === selected[0]);
        if (user) this.newChatForm.controls.name.setValue(user.name);
    }
  }

  createConversation(): void {
    if (this.newChatForm.invalid) return;
    const { name, participants } = this.newChatForm.value;
    const formName = name?.trim() || '';

    if (participants) {
      if (participants.length > 1 && !formName) {
        // Group name is required for groups
        this.newChatForm.controls.name.setErrors({ required: true });
        return;
      }
      this.chatService.createConversation(formName, participants);
      this.openNewChatModal(false);
    }
  }

  getConversationIcon(type: ConversationType): string {
    switch(type) {
      case 'group': return 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z';
      case 'market': return 'M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941';
      case 'broadcast': return 'M10 3.75a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5a.75.75 0 01.75-.75zM10 8.25a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 8.25zM10 12.75a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5a.75.75 0 01.75-.75zM15.75 4.5a.75.75 0 00-1.5 0v1.5a.75.75 0 001.5 0v-1.5zM15.75 9a.75.75 0 00-1.5 0v1.5a.75.75 0 001.5 0V9zM15.75 13.5a.75.75 0 00-1.5 0v1.5a.75.75 0 001.5 0v-1.5zM4.25 5.25a.75.75 0 011.5 0v1.5a.75.75 0 01-1.5 0v-1.5zM4.25 9.75a.75.75 0 011.5 0v1.5a.75.75 0 01-1.5 0v-1.5zM4.25 14.25a.75.75 0 011.5 0v1.5a.75.75 0 01-1.5 0v-1.5zM12 1.5a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0V2.25A.75.75 0 0112 1.5zM12 6a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0V6.75A.75.75 0 0112 6zM12 10.5a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5a.75.75 0 01.75-.75zM12 15a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5a.75.75 0 01.75-.75zM8.25 3.75a.75.75 0 00-1.5 0v1.5a.75.75 0 001.5 0v-1.5zM8.25 8.25a.75.75 0 00-1.5 0v1.5a.75.75 0 001.5 0V8.25zM8.25 12.75a.75.75 0 00-1.5 0v1.5a.75.75 0 001.5 0v-1.5z';
      default: return '';
    }
  }

  getMessageStatusIcon(status: Message['status']): string {
    switch (status) {
      case 'sending': return 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'; 
      case 'sent': return 'M5 13l4 4L19 7';
      case 'delivered': return 'M5 13l4 4L19 7m-9 6l4 4L19 7'; 
      case 'read': return 'M5 13l4 4L19 7m-9 6l4 4L19 7';
      default: return '';
    }
  }

  private scrollToBottom(): void {
    try {
      if (this.messageContainer()) {
        const element = this.messageContainer()!.nativeElement;
        setTimeout(() => element.scrollTop = element.scrollHeight, 0);
      }
    } catch (err) { console.error("Could not scroll to bottom", err); }
  }
}