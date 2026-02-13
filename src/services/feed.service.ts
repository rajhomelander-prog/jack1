import { Injectable, signal, computed, effect, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ProfileService } from './profile.service';

export interface User {
  id: string;
  name: string;
  avatar: string;
  role: string;
}

export interface PollOption {
  id: number;
  text: string;
  votes: number;
}

export interface Poll {
  options: PollOption[];
  userVote?: number; // Store the ID of the option the current user voted for
}

export interface Comment {
  id: number;
  author: User;
  content: string;
  timestamp: string;
}

interface RawComment {
  id: number;
  authorId: string;
  content: string;
  timestamp: string;
}

export interface Post {
  id: number;
  author: User;
  time: string;
  content: string;
  image?: string;
  likes: number;
  comments: number;
  reposts: number;
  saves: number;
  isLiked: boolean;
  isSaved: boolean;
  isReposted: boolean;
  tags?: string[];
  createdAt: Date;
  poll?: Poll;
  commentData?: Comment[];
}

export type FeedType = 'Home' | 'Friends' | 'Market';

// Internal representation of a post before enrichment with user data
interface RawPost {
  id: number;
  authorId: string;
  time: string;
  content: string;
  image?: string | null;
  likes: number;
  comments: number;
  reposts: number;
  saves: number;
  isLiked: boolean;
  isSaved: boolean;
  isReposted: boolean;
  tags?: string[];
  createdAt: Date;
  poll?: Poll;
  commentData?: RawComment[];
}

const DEFAULT_RAW_POSTS: RawPost[] = [
    {
      id: 1, authorId: 'user1', createdAt: new Date(Date.now() - 2 * 3600 * 1000), time: '2h',
      content: 'Just published a deep dive on the emergent properties of complex adaptive systems. The parallels between financial markets and biological ecosystems are staggering. We are on the cusp of a new paradigm in economic modeling.',
      image: 'https://picsum.photos/seed/post1/800/400', likes: 128, comments: 25, reposts: 12, saves: 45, isLiked: false, isSaved: true, isReposted: false, tags: ['systems-theory', 'finance', 'market'],
      commentData: [
        { id: 101, authorId: 'user3', content: 'Fascinating read! The feedback loops are indeed very similar.', timestamp: '1h' },
        { id: 102, authorId: 'user2', content: 'Could you elaborate on the implications for algorithmic trading?', timestamp: '45m' }
      ]
    },
    {
      id: 2, authorId: 'user2', createdAt: new Date(Date.now() - 5 * 3600 * 1000), time: '5h',
      content: 'The latency reduction in our latest model is below the perceptual threshold for human consciousness. This has profound implications for brain-computer interfaces and real-time cognitive augmentation. The future is closer than we think.',
      likes: 452, comments: 89, reposts: 67, saves: 150, isLiked: true, isSaved: false, isReposted: true, tags: ['neurotech', 'bci'], commentData: []
    },
    {
      id: 3, authorId: 'user3', createdAt: new Date(Date.now() - 24 * 3600 * 1000), time: '1d',
      content: 'Finalized the whitepaper for our new consensus algorithm, "Proof of Thought". It incentivizes computational resources towards solving complex scientific problems instead of arbitrary hashes. This could be a game-changer for distributed research.',
      likes: 831, comments: 156, reposts: 205, saves: 300, isLiked: false, isSaved: false, isReposted: false, tags: ['blockchain', 'research'], commentData: []
    },
    {
      id: 4, authorId: 'user1', createdAt: new Date(Date.now() - 3 * 3600 * 1000), time: '3h',
      content: 'The VIX index is showing unusual complacency given the macroeconomic headwinds. Expecting a volatility spike in Q4 as markets reprice risk.',
      likes: 95, comments: 41, reposts: 18, saves: 60, isLiked: false, isSaved: true, isReposted: false, tags: ['market', 'volatility'], commentData: []
    },
    {
      id: 5, authorId: 'user5', createdAt: new Date(Date.now() - 48 * 3600 * 1000), time: '2d',
      content: 'The latest data from the Event Horizon Telescope is challenging our understanding of black hole accretion disks. The magnetic field structures are far more chaotic than predicted.',
      image: 'https://picsum.photos/seed/post5/800/400', likes: 620, comments: 130, reposts: 180, saves: 250, isLiked: true, isSaved: true, isReposted: false, tags: ['astrophysics', 'blackholes'], commentData: []
    },
    {
      id: 6, authorId: 'user3', createdAt: new Date(Date.now() - 72 * 3600 * 1000), time: '3d',
      content: 'Which decentralized storage solution do you think has the most long-term potential?',
      likes: 345, comments: 112, reposts: 55, saves: 120, isLiked: false, isSaved: false, isReposted: false, tags: ['web3', 'storage'],
      poll: {
        options: [
          { id: 0, text: 'IPFS / Filecoin', votes: 450 },
          { id: 1, text: 'Arweave', votes: 312 },
          { id: 2, text: 'Sia', votes: 128 },
        ],
      },
      commentData: []
    }
  ];

@Injectable({
  providedIn: 'root'
})
export class FeedService {
  private platformId = inject(PLATFORM_ID);
  private profileService = inject(ProfileService);

  private readonly POSTS_STORAGE_KEY = 'vichara-posts';
  private readonly FOLLOWING_STORAGE_KEY = 'vichara-following';

  // --- MASTER DATA ---
  private _users = signal<User[]>([
    { id: 'currentUser', name: 'John Doe', avatar: 'https://picsum.photos/seed/currentuser/40/40', role: 'You' },
    { id: 'user1', name: 'Eleanor Vance', avatar: 'https://picsum.photos/seed/user1/40/40', role: 'Principal Analyst, QuantumLeap' },
    { id: 'user2', name: 'Kenji Tanaka', avatar: 'https://picsum.photos/seed/user2/40/40', role: 'Founder, NeuroStream' },
    { id: 'user3', name: 'Sofia Reyes', avatar: 'https://picsum.photos/seed/user3/40/40', role: 'Lead Architect, decentralized.net' },
    { id: 'user4', name: 'Marcus Holloway', avatar: 'https://picsum.photos/seed/user4/40/40', role: 'Cybersecurity Expert' },
    { id: 'user5', name: 'Dr. Aris Thorne', avatar: 'https://picsum.photos/seed/user5/40/40', role: 'Theoretical Physicist' },
    { id: 'conn1', name: 'Alice Walker', avatar: 'https://picsum.photos/seed/conn1/40/40', role: 'AI Ethicist' },
    { id: 'conn2', name: 'Bob Chen', avatar: 'https://picsum.photos/seed/conn2/40/40', role: 'Quant Trader' },
  ]);
  users = this._users.asReadonly();

  private followingIds = signal<string[]>(this.getInitialFollowing());
  private currentUser = computed(() => this.users().find(u => u.id === 'currentUser')!);

  private allPosts = signal<RawPost[]>(this.getInitialPosts());

  // --- STATE & COMPUTED SIGNALS ---
  activeFeedType = signal<FeedType>('Home');

  following = computed(() => {
    const followingIds = this.followingIds();
    const usersMap = new Map(this.users().map(u => [u.id, u]));
    return followingIds.map(id => usersMap.get(id)).filter((u): u is User => !!u);
  });

  suggestions = computed(() => {
    const followingIdsSet = new Set(this.followingIds());
    const allUsers = this.users();
    return allUsers.filter(u => u.id !== 'currentUser' && !followingIdsSet.has(u.id));
  });
  
  private enrichedPosts = computed(() => {
    const usersMap = new Map(this.users().map(u => [u.id, u]));
    const currentUser = this.currentUser();
    return this.allPosts().map(post => {
      const enrichedComments = post.commentData?.map(comment => ({
        ...comment,
        author: usersMap.get(comment.authorId) || currentUser
      }));
      return {
        ...post,
        author: usersMap.get(post.authorId) || currentUser,
        commentData: enrichedComments
      };
    });
  });

  private friendsFeed = computed(() =>
    this.enrichedPosts()
      .filter(p => this.followingIds().includes(p.author.id) || p.author.id === 'currentUser')
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  );

  private marketFeed = computed(() =>
    this.enrichedPosts()
      .filter(p => p.tags?.includes('market'))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  );

  private homeFeed = computed(() => {
    // A more advanced "Home" feed algorithm.
    // It includes posts from the user's network, plus highly popular posts from others for discovery.
    const followingAndCurrentUserIds = new Set([...this.followingIds(), 'currentUser']);
    
    const homePosts = this.enrichedPosts().filter(p => {
        // Include if the post is from someone the user follows (or the user themselves)
        if (followingAndCurrentUserIds.has(p.author.id)) {
            return true;
        }
        // OR if the post is popular (from a non-followed user)
        if (p.likes > 400) {
            return true;
        }
        return false;
    });

    return homePosts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  });
  
  posts = computed<Post[]>(() => {
    switch(this.activeFeedType()) {
      case 'Home': return this.homeFeed();
      case 'Friends': return this.friendsFeed();
      case 'Market': return this.marketFeed();
    }
  });

  constructor() {
    effect(() => {
      const profile = this.profileService.userProfile();
      this._users.update(currentUsers => 
        currentUsers.map(user => 
          user.id === 'currentUser' ? { ...user, name: profile.name } : user
        )
      );
    });
  }

  // --- ACTIONS ---
  setFeedType(type: FeedType) {
    this.activeFeedType.set(type);
  }

  addPost(content: string, image: string | null = null, pollOptions: string[] | null = null) {
    let poll: Poll | undefined = undefined;
    if (pollOptions && pollOptions.length >= 2) {
      poll = {
        options: pollOptions.map((text, index) => ({ id: index, text, votes: 0 })),
        userVote: undefined
      };
    }
    
    const newPost: RawPost = {
      id: Date.now(),
      authorId: 'currentUser',
      createdAt: new Date(),
      time: 'Just now',
      content: content,
      image: image,
      likes: 0,
      comments: 0,
      reposts: 0,
      saves: 0,
      isLiked: false,
      isSaved: false,
      isReposted: false,
      poll: poll,
      commentData: []
    };
    this.allPosts.update(currentPosts => [newPost, ...currentPosts]);
    this.savePostsToStorage();
  }
  
  private updatePost(postId: number, updateFn: (post: RawPost) => Partial<RawPost>) {
    this.allPosts.update(posts =>
      posts.map(p => {
        if (p.id === postId) {
          return { ...p, ...updateFn(p) };
        }
        return p;
      })
    );
    this.savePostsToStorage();
  }

  toggleLike(postId: number) {
    this.updatePost(postId, (p) => ({
      isLiked: !p.isLiked,
      likes: p.isLiked ? p.likes - 1 : p.likes + 1
    }));
  }

  toggleSave(postId: number) {
    this.updatePost(postId, (p) => ({
      isSaved: !p.isSaved,
      saves: p.isSaved ? p.saves - 1 : p.saves + 1
    }));
  }

  toggleRepost(postId: number) {
    this.updatePost(postId, (p) => ({
      isReposted: !p.isReposted,
      reposts: p.isReposted ? p.reposts - 1 : p.reposts + 1
    }));
  }
  
  addComment(postId: number, content: string) {
    this.updatePost(postId, (p) => {
      const newComment: RawComment = {
        id: Date.now(),
        authorId: 'currentUser',
        content,
        timestamp: 'Just now'
      };
      const existingComments = p.commentData ?? [];
      return {
        commentData: [...existingComments, newComment],
        comments: p.comments + 1
      };
    });
  }

  voteOnPoll(postId: number, optionId: number) {
    this.updatePost(postId, (p) => {
      if (!p.poll || p.poll.userVote !== undefined) {
        // Can't vote if there's no poll or user already voted
        return {};
      }

      const newPoll: Poll = {
        ...p.poll,
        userVote: optionId,
        options: p.poll.options.map(opt => 
          opt.id === optionId ? { ...opt, votes: opt.votes + 1 } : opt
        )
      };
      return { poll: newPoll };
    });
  }

  followUser(userId: string) {
    this.followingIds.update(ids => {
      if (!ids.includes(userId)) {
        const newIds = [...ids, userId];
        this.saveFollowingToStorage(newIds);
        return newIds;
      }
      return ids;
    });
  }

  // --- LOCAL STORAGE ---
  private getInitialPosts(): RawPost[] {
    if (isPlatformBrowser(this.platformId)) {
        try {
            const savedPosts = localStorage.getItem(this.POSTS_STORAGE_KEY);
            if (savedPosts) {
                const parsed = JSON.parse(savedPosts);
                return parsed.map((p: any) => ({ ...p, createdAt: new Date(p.createdAt) }));
            }
        } catch (e) {
            console.error('Could not load posts from localStorage', e);
            localStorage.removeItem(this.POSTS_STORAGE_KEY);
        }
    }
    return DEFAULT_RAW_POSTS;
  }

  private getInitialFollowing(): string[] {
      if (isPlatformBrowser(this.platformId)) {
          try {
              const savedFollowing = localStorage.getItem(this.FOLLOWING_STORAGE_KEY);
              if (savedFollowing) {
                  return JSON.parse(savedFollowing);
              }
          } catch (e) {
              console.error('Could not load following from localStorage', e);
              localStorage.removeItem(this.FOLLOWING_STORAGE_KEY);
          }
      }
      return ['user1', 'user3'];
  }

  private savePostsToStorage() {
      if (isPlatformBrowser(this.platformId)) {
          try {
              localStorage.setItem(this.POSTS_STORAGE_KEY, JSON.stringify(this.allPosts()));
          } catch (e) {
              console.error('Could not save posts to localStorage', e);
          }
      }
  }

  private saveFollowingToStorage(ids: string[]) {
      if (isPlatformBrowser(this.platformId)) {
          try {
              localStorage.setItem(this.FOLLOWING_STORAGE_KEY, JSON.stringify(ids));
          } catch (e) {
              console.error('Could not save following to localStorage', e);
          }
      }
  }
}
