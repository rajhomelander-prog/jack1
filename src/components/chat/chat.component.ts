import { ChangeDetectionStrategy, Component, effect, ElementRef, viewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { ChatService, Conversation, Message, Participant } from '../../services/chat.service';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule],
})
export class ChatComponent {
  private chatService = inject(ChatService);
  
  messageContainer = viewChild<ElementRef>('messageContainer');

  conversations = this.chatService.conversations;
  selectedConversation = this.chatService.selectedConversation;
  isOpponentTyping = this.chatService.isOpponentTyping;

  chatInput = new FormControl('', { nonNullable: true, validators: [Validators.required] });
  reactionEmojis = ['👍', '❤️', '😂', '😮', '😢', '🙏'];
  
  // Expose Object.keys to the template
  objectKeys = Object.keys;

  constructor() {
    effect(() => {
      if (this.selectedConversation() || this.isOpponentTyping()) {
        this.scrollToBottom();
      }
    });
  }

  getParticipant(convo: Conversation, senderId: string): Participant | undefined {
    return convo.participants.find(p => p.id === senderId);
  }

  selectConversation(conversation: Conversation) {
    this.chatService.selectConversation(conversation.id);
  }

  sendMessage() {
    if (this.chatInput.invalid) return;
    const messageText = this.chatInput.value.trim();
    if (!messageText) return;
    this.chatService.sendMessage(messageText);
    this.chatInput.reset();
  }

  toggleReaction(message: Message, emoji: string) {
    this.chatService.toggleReaction(message.id, emoji);
  }

  getMessageStatusIcon(status: Message['status']): string {
    switch (status) {
      case 'sending': return 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'; // Clock icon
      case 'sent': return 'M5 13l4 4L19 7'; // Single check
      case 'delivered': return 'M5 13l4 4L19 7m-9 6l4 4L19 7'; // Double check
      case 'read': return 'M5 13l4 4L19 7m-9 6l4 4L19 7'; // Double check (could be colored)
      default: return '';
    }
  }

  private scrollToBottom(): void {
    try {
      if (this.messageContainer()) {
        const element = this.messageContainer()!.nativeElement;
        setTimeout(() => element.scrollTop = element.scrollHeight, 0);
      }
    } catch (err) { 
      console.error("Could not scroll to bottom", err);
    }
  }
}
