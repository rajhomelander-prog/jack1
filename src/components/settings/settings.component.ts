import { ChangeDetectionStrategy, Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ThemeService, Theme } from '../../services/theme.service';
import { ProfileService } from '../../services/profile.service';

type SettingsTab = 'Profile' | 'Account' | 'Notifications' | 'Appearance' | 'Developer';

type NotificationSettings = {
    comments: { label: string; value: boolean };
    mentions: { label: string; value: boolean };
    newFollowers: { label: string; value: boolean };
    marketUpdates: { label: string; value: boolean };
    productUpdates: { label: string; value: boolean };
};

interface Webhook {
  id: number;
  url: string;
  status: 'Active' | 'Disabled';
}

interface ApiUsageData {
  day: string;
  calls: number;
}

interface ApiEvent {
  id: string;
  description: string;
  subscribed: boolean;
}


@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule]
})
export class SettingsComponent implements OnInit {
  private router = inject(Router);
  private themeService = inject(ThemeService);
  private profileService = inject(ProfileService);
  activeTab = signal<SettingsTab>('Profile');
  tabs: SettingsTab[] = ['Profile', 'Account', 'Notifications', 'Appearance', 'Developer'];
  
  tabIcons: Record<SettingsTab, string> = {
    Profile: 'M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z',
    Account: 'M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1 1 21.75 8.25Z',
    Notifications: 'M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0',
    Appearance: 'M12.378 1.602a.75.75 0 0 0-.756 0L3 7.25V13.5a.75.75 0 0 0 .75.75h1.5a.75.75 0 0 0 .75-.75V8.207l4.25-2.656V13.5a.75.75 0 0 0 .75.75h1.5a.75.75 0 0 0 .75-.75V5.551l4.25 2.656V13.5a.75.75 0 0 0 .75.75h1.5a.75.75 0 0 0 .75-.75V7.25l-9.378-5.648ZM21 15.75h-1.5a.75.75 0 0 0-.75.75v1.5a.75.75 0 0 0 .75.75H21a.75.75 0 0 0 .75-.75v-1.5a.75.75 0 0 0-.75-.75Z',
    Developer: 'M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5'
  };

  // Profile Form
  profileForm = new FormGroup({
    name: new FormControl('', [Validators.required]),
    handle: new FormControl('', [Validators.required, Validators.pattern(/^[a-zA-Z0-9_]+$/)]),
    bio: new FormControl('', [Validators.maxLength(160)]),
  });

  // Notification Settings
  notificationSettings = signal<NotificationSettings>({
    comments: { label: 'Comments on your posts', value: true },
    mentions: { label: 'When someone mentions you', value: true },
    newFollowers: { label: 'When you get a new follower', value: true },
    marketUpdates: { label: 'Weekly market summary', value: false },
    productUpdates: { label: 'Vichara.life product updates', value: true },
  });
  
  objectKeys = Object.keys as (obj: object) => Array<keyof typeof obj>;

  areAllNotificationsEnabled = computed(() => {
    // FIX: Add explicit type for `setting` to fix `unknown` type from `Object.values`.
    return Object.values(this.notificationSettings()).every((setting: { value: boolean }) => setting.value);
  });

  // Appearance Settings
  selectedTheme = this.themeService.theme;
  availableThemes = signal<{id: Theme, name: string, previewClass: string, accentClass: string}[]>([
    { id: 'dark', name: 'Dark', previewClass: 'bg-[#0B0F14]', accentClass: 'bg-[#E50914]' },
    { id: 'midnight', name: 'Midnight', previewClass: 'bg-[#000000]', accentClass: 'bg-[#E50914]' },
    { id: 'light', name: 'Light', previewClass: 'bg-[#F3F4F6]', accentClass: 'bg-[#E50914]' },
    { id: 'solarized', name: 'Solarized', previewClass: 'bg-[#002b36]', accentClass: 'bg-[#dc322f]' },
    { id: 'dracula', name: 'Dracula', previewClass: 'bg-[#282a36]', accentClass: 'bg-[#ff5555]' },
    { id: 'nord', name: 'Nord', previewClass: 'bg-[#2E3440]', accentClass: 'bg-[#BF616A]' },
    { id: 'rose-pine', name: 'Rosé Pine', previewClass: 'bg-[#191724]', accentClass: 'bg-[#eb6f92]' },
    { id: 'gruvbox', name: 'Gruvbox', previewClass: 'bg-[#282828]', accentClass: 'bg-[#fb4934]' },
    { id: 'monokai', name: 'Monokai', previewClass: 'bg-[#272822]', accentClass: 'bg-[#F92672]' },
    { id: 'synthwave', name: 'Synthwave', previewClass: 'bg-[#2d2a54]', accentClass: 'bg-[#ff4883]' },
  ]);


  // Account Deletion Logic
  isDeleteModalOpen = signal(false);
  deleteConfirmationInput = new FormControl('');
  userHandleForDelete = computed(() => this.profileService.userProfile().handle);
  isDeleteButtonEnabled = computed(() => {
    return this.deleteConfirmationInput.value === this.userHandleForDelete();
  });

  // === Developer Settings Logic ===
  apiKey = signal('vl_sk_************************1234');
  
  // Webhooks
  webhooks = signal<Webhook[]>([
    { id: 1, url: 'https://api.example.com/v1/webhooks/vichara', status: 'Active' },
  ]);
  newWebhookUrl = new FormControl('', [Validators.required, Validators.pattern(/https?:\/\/.+/)]);

  // API Usage
  apiUsage = signal<ApiUsageData[]>([
    { day: 'Mon', calls: 120 }, { day: 'Tue', calls: 250 }, { day: 'Wed', calls: 180 },
    { day: 'Thu', calls: 300 }, { day: 'Fri', calls: 280 }, { day: 'Sat', calls: 450 },
    { day: 'Sun', calls: 400 },
  ]);
  maxApiUsage = computed(() => Math.max(...this.apiUsage().map(d => d.calls), 1));
  
  // API Events
  apiEvents = signal<ApiEvent[]>([
    { id: 'post.created', description: 'A new post is created by the user.', subscribed: true },
    { id: 'post.liked', description: 'A post by the user is liked.', subscribed: false },
    { id: 'user.followed', description: 'The user gains a new follower.', subscribed: true },
    { id: 'market.transaction', description: 'A market transaction is initiated.', subscribed: false },
  ]);

  ngOnInit() {
    const userProfile = this.profileService.userProfile();
    this.profileForm.patchValue({
      name: userProfile.name,
      handle: userProfile.handle,
      bio: userProfile.bio
    });
  }

  setActiveTab(tab: SettingsTab) {
    this.activeTab.set(tab);
  }

  saveProfile() {
    if (this.profileForm.valid) {
      this.profileService.updateProfile(this.profileForm.value);
      this.profileForm.markAsPristine();
    }
  }

  toggleNotification(key: keyof NotificationSettings) {
    this.notificationSettings.update(settings => ({
      ...settings,
      [key]: { ...settings[key], value: !settings[key].value }
    }));
  }
  
  toggleAllNotifications() {
    const newState = !this.areAllNotificationsEnabled();
    this.notificationSettings.update(currentSettings => {
      const newSettings: NotificationSettings = { ...currentSettings };
      for (const key in newSettings) {
        newSettings[key as keyof NotificationSettings] = {
          ...newSettings[key as keyof NotificationSettings],
          value: newState
        };
      }
      return newSettings;
    });
  }

  setTheme(theme: Theme) {
    this.themeService.setTheme(theme);
  }

  // Account Deletion Methods
  openDeleteModal() {
    this.isDeleteModalOpen.set(true);
  }

  closeDeleteModal() {
    this.isDeleteModalOpen.set(false);
    this.deleteConfirmationInput.reset();
  }

  confirmAccountDeletion() {
    if (!this.isDeleteButtonEnabled()) return;
    console.log('Account deletion confirmed. This would trigger a backend API call.');
    this.closeDeleteModal();
    // Simulate logging out and redirecting
    this.router.navigate(['/login']);
  }
  
  generateNewApiKey() {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const randomPart = Array.from({ length: 24 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    this.apiKey.set(`vl_sk_${randomPart}${Math.floor(1000 + Math.random() * 9000)}`);
  }

  addWebhook() {
    if (this.newWebhookUrl.valid) {
      const newHook: Webhook = {
        id: Date.now(),
        url: this.newWebhookUrl.value!,
        status: 'Active'
      };
      this.webhooks.update(hooks => [...hooks, newHook]);
      this.newWebhookUrl.reset();
    }
  }

  deleteWebhook(id: number) {
    this.webhooks.update(hooks => hooks.filter(h => h.id !== id));
  }

  toggleApiEvent(eventId: string) {
    this.apiEvents.update(events =>
      events.map(e => e.id === eventId ? { ...e, subscribed: !e.subscribed } : e)
    );
  }
}