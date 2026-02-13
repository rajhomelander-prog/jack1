import { Injectable, signal, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export interface UserProfile {
  name: string;
  handle: string;
  bio: string;
  avatar: string;
  cover: string;
  level: number;
  xp: number;
  xp_to_next: number;
  stats: {
    posts: number;
    followers: number;
    following: number;
  };
}

const DEFAULT_PROFILE: UserProfile = {
  name: 'John Doe',
  handle: 'johndoe',
  bio: 'Builder, thinker, investor. Exploring the frontiers of technology and consciousness.',
  avatar: 'https://picsum.photos/seed/currentuser/160/160',
  cover: 'https://picsum.photos/seed/succulents/1200/400',
  level: 12,
  xp: 2450,
  xp_to_next: 3000,
  stats: {
    posts: 124,
    followers: 4096,
    following: 512,
  },
};

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  private platformId = inject(PLATFORM_ID);
  
  userProfile = signal<UserProfile>(this.getInitialProfile());

  private getInitialProfile(): UserProfile {
      if (isPlatformBrowser(this.platformId)) {
          try {
              const savedProfile = localStorage.getItem('vichara-user-profile');
              if (savedProfile) {
                  // Basic validation to merge with default in case of outdated stored data
                  const parsed = JSON.parse(savedProfile);
                  return { ...DEFAULT_PROFILE, ...parsed };
              }
          } catch (e) {
              console.error('Could not load profile from localStorage', e);
          }
      }
      return DEFAULT_PROFILE;
  }
  
  updateProfile(profileData: Partial<Pick<UserProfile, 'name' | 'handle' | 'bio'>>) {
    this.userProfile.update(currentProfile => ({
      ...currentProfile,
      ...profileData
    }));
    this.saveProfileToStorage();
  }

  private saveProfileToStorage() {
    if (isPlatformBrowser(this.platformId)) {
      try {
        localStorage.setItem('vichara-user-profile', JSON.stringify(this.userProfile()));
      } catch (e) {
        console.error('Could not save profile to localStorage', e);
      }
    }
  }
}
