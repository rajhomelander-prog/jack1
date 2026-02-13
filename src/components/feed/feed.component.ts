import { ChangeDetectionStrategy, Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators, FormArray } from '@angular/forms';
import { FeedService, Post, FeedType, Poll, PollOption } from '../../services/feed.service';
import { HighlightPipe } from '../../pipes/highlight.pipe';

@Component({
  selector: 'app-feed',
  templateUrl: './feed.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule, HighlightPipe]
})
export class FeedComponent {
  private feedService = inject(FeedService);

  posts = this.feedService.posts;
  activeFeedType = this.feedService.activeFeedType;
  feedTypes: FeedType[] = ['Home', 'Friends', 'Market'];

  maxPostLength = 280;
  postImagePreview = signal<string | null>(null);
  isCreatingPoll = signal(false);

  newPostForm = new FormGroup({
    content: new FormControl('', [Validators.maxLength(this.maxPostLength)]),
    pollOptions: new FormArray([
      new FormControl('', Validators.required),
      new FormControl('', Validators.required)
    ])
  });

  commentInput = new FormControl('', [Validators.required, Validators.maxLength(280)]);
  
  get pollOptions(): FormArray {
    return this.newPostForm.get('pollOptions') as FormArray;
  }

  isPostButtonDisabled = computed(() => {
    const content = this.newPostForm.get('content')?.value?.trim();
    const hasImage = !!this.postImagePreview();

    if (this.isCreatingPoll()) {
      // For polls, content is required, and the poll options must be valid.
      return !content || this.pollOptions.invalid;
    } else {
      // For regular posts, either content or an image is required.
      return !content && !hasImage;
    }
  });

  remainingChars = computed(() => {
    const contentLength = this.newPostForm.get('content')?.value?.length ?? 0;
    return this.maxPostLength - contentLength;
  });

  expandedPosts = signal(new Set<number>());
  activeCommentSection = signal(new Set<number>());

  setFeedType(type: FeedType) {
    this.feedService.setFeedType(type);
  }

  addPost() {
    if (this.isPostButtonDisabled()) return;

    const content = this.newPostForm.value.content?.trim() ?? '';
    const image = this.postImagePreview();
    let pollOptions: string[] | null = null;

    if (this.isCreatingPoll() && this.pollOptions.valid) {
      pollOptions = this.pollOptions.value.map((opt: string) => opt.trim()).filter(Boolean);
      if (pollOptions.length < 2) return; // Should be caught by disabled state, but as a safeguard
    }
    
    this.feedService.addPost(content, image, pollOptions);
    this.newPostForm.reset({ content: '' });
    this.removeImage();
    
    // Reset poll creation UI
    this.isCreatingPoll.set(false);
    this.pollOptions.clear();
    this.pollOptions.push(new FormControl('', Validators.required));
    this.pollOptions.push(new FormControl('', Validators.required));

    // Reset textarea height
    const textarea = document.querySelector('textarea[formControlName="content"]');
    if (textarea) {
      (textarea as HTMLTextAreaElement).style.height = 'auto';
    }
  }

  attachImage() {
    this.isCreatingPoll.set(false);
    const randomId = Math.floor(Math.random() * 500);
    this.postImagePreview.set(`https://picsum.photos/seed/${randomId}/800/400`);
  }

  removeImage() {
    this.postImagePreview.set(null);
  }

  togglePollCreation() {
    this.isCreatingPoll.update(v => !v);
    if (this.isCreatingPoll()) {
      this.removeImage();
    } else {
       this.pollOptions.clear();
       this.pollOptions.push(new FormControl('', Validators.required));
       this.pollOptions.push(new FormControl('', Validators.required));
    }
  }

  addPollOption() {
    if (this.pollOptions.length < 4) {
      this.pollOptions.push(new FormControl('', Validators.required));
    }
  }

  removePollOption(index: number) {
    if (this.pollOptions.length > 2) {
      this.pollOptions.removeAt(index);
    }
  }

  toggleLike(post: Post) {
    this.feedService.toggleLike(post.id);
  }
  
  toggleSave(post: Post) {
    this.feedService.toggleSave(post.id);
  }

  toggleRepost(post: Post) {
    this.feedService.toggleRepost(post.id);
  }

  toggleCommentSection(postId: number) {
    this.activeCommentSection.update(set => {
      const newSet = new Set(set);
      if (newSet.has(postId)) {
        newSet.delete(postId);
      } else {
        newSet.add(postId);
      }
      return newSet;
    });
    this.commentInput.reset(); // Reset input when toggling
  }
  
  postComment(postId: number) {
    if (this.commentInput.invalid) return;
    const content = this.commentInput.value!.trim();
    if (!content) return;

    this.feedService.addComment(postId, content);
    this.commentInput.reset();
  }

  togglePostExpansion(postId: number) {
    this.expandedPosts.update(set => {
      const newSet = new Set(set);
      if (newSet.has(postId)) {
        newSet.delete(postId);
      } else {
        newSet.add(postId);
      }
      return newSet;
    });
  }

  vote(postId: number, optionId: number) {
    this.feedService.voteOnPoll(postId, optionId);
  }

  getPollTotalVotes(poll: Poll): number {
    return poll.options.reduce((total, option) => total + option.votes, 0);
  }

  getPollOptionPercentage(poll: Poll, option: PollOption): number {
    const totalVotes = this.getPollTotalVotes(poll);
    if (totalVotes === 0) return 0;
    return (option.votes / totalVotes) * 100;
  }

  autosizeTextarea(event: Event): void {
    const textarea = event.target as HTMLTextAreaElement;
    textarea.style.height = 'auto'; // Reset height
    const maxHeight = 200; // Max height of ~10 rows
    textarea.style.height = `${Math.min(textarea.scrollHeight, maxHeight)}px`;
    if (textarea.value === '') {
      textarea.style.height = 'auto';
    }
  }
}