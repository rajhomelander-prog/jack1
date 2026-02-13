import { ChangeDetectionStrategy, Component, signal, inject, computed, OnDestroy } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, NavigationEnd } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs/operators';
import { TimeService, CityTimezone } from '../../services/time.service';

@Component({
  selector: 'app-top-nav',
  templateUrl: './top-nav.component.html',
  imports: [CommonModule, RouterLink, RouterLinkActive],
})
export class TopNavComponent implements OnDestroy {
  private timeService = inject(TimeService);
  private router = inject(Router);
  private location = inject(Location);
  private timerInterval: any;

  navItems = signal([]);
  isTimePopoverOpen = signal(false);
  
  currentTime = signal(new Date());
  
  selectedCity = this.timeService.selectedCity;
  
  searchResults = signal<CityTimezone[]>([]);
  searchTerm = signal('');

  private currentUrl = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map(event => event.urlAfterRedirects)
    )
  );

  showBackButton = computed(() => {
    const url = this.currentUrl();
    if (!url) return false;
    
    // Show on specific game pages (but not the main game center)
    const isGamePage = url.startsWith('/game/') && url !== '/game';
    // Show on novel reader
    const isNovelPage = url.startsWith('/novel/');
    // Show on manga reader
    const isMangaPage = url.startsWith('/manga/');
    
    return isGamePage || isNovelPage || isMangaPage;
  });

  // Computed signal for display
  displayTime = computed(() => {
    const city = this.selectedCity();
    const now = this.currentTime();
    
    if (!city) return { time: '', date: '', timezone: '' };
    
    const time = now.toLocaleTimeString('en-US', {
      timeZone: city.timezone,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });

    const date = now.toLocaleDateString('en-US', {
      timeZone: city.timezone,
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

    const timezoneOffset = new Intl.DateTimeFormat('en-US', {
        timeZoneName: 'short',
        timeZone: city.timezone,
    }).formatToParts(now).find(part => part.type === 'timeZoneName')?.value;

    return { time, date, timezone: timezoneOffset || '' };
  });

  constructor() {
    this.timerInterval = setInterval(() => {
      this.currentTime.set(new Date());
    }, 1000);
  }

  ngOnDestroy() {
    clearInterval(this.timerInterval);
  }

  goBack(): void {
    this.location.back();
  }

  toggleTimePopover() {
    this.isTimePopoverOpen.update(v => !v);
    if (!this.isTimePopoverOpen()) {
      this.searchTerm.set('');
      this.searchResults.set([]);
    }
  }

  onSearch(event: Event) {
    const input = event.target as HTMLInputElement;
    const query = input.value;
    this.searchTerm.set(query);
    this.searchResults.set(this.timeService.searchCities(query));
  }
  
  selectCity(city: CityTimezone) {
    this.timeService.setSelectedCity(city);
    this.toggleTimePopover();
  }
}