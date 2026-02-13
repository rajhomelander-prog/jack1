import { Injectable, signal, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export interface CityTimezone {
  city: string;
  country: string;
  timezone: string;
}

// A curated list of major world cities and their IANA timezones
const TIMEZONE_DATA: CityTimezone[] = [
  // Americas
  { city: 'New York', country: 'USA', timezone: 'America/New_York' },
  { city: 'Los Angeles', country: 'USA', timezone: 'America/Los_Angeles' },
  { city: 'Chicago', country: 'USA', timezone: 'America/Chicago' },
  { city: 'Toronto', country: 'Canada', timezone: 'America/Toronto' },
  { city: 'Mexico City', country: 'Mexico', timezone: 'America/Mexico_City' },
  { city: 'São Paulo', country: 'Brazil', timezone: 'America/Sao_Paulo' },
  { city: 'Buenos Aires', country: 'Argentina', timezone: 'America/Argentina/Buenos_Aires' },
  // Europe
  { city: 'London', country: 'UK', timezone: 'Europe/London' },
  { city: 'Paris', country: 'France', timezone: 'Europe/Paris' },
  { city: 'Berlin', country: 'Germany', timezone: 'Europe/Berlin' },
  { city: 'Moscow', country: 'Russia', timezone: 'Europe/Moscow' },
  { city: 'Istanbul', country: 'Turkey', timezone: 'Europe/Istanbul' },
  // Asia
  { city: 'Tokyo', country: 'Japan', timezone: 'Asia/Tokyo' },
  { city: 'Dubai', country: 'UAE', timezone: 'Asia/Dubai' },
  { city: 'Shanghai', country: 'China', timezone: 'Asia/Shanghai' },
  { city: 'Kolkata', country: 'India', timezone: 'Asia/Kolkata' },
  { city: 'Singapore', country: 'Singapore', timezone: 'Asia/Singapore' },
  { city: 'Seoul', country: 'South Korea', timezone: 'Asia/Seoul' },
  // Africa & Oceania
  { city: 'Sydney', country: 'Australia', timezone: 'Australia/Sydney' },
  { city: 'Cairo', country: 'Egypt', timezone: 'Africa/Cairo' },
  { city: 'Lagos', country: 'Nigeria', timezone: 'Africa/Lagos' },
  { city: 'Johannesburg', country: 'South Africa', timezone: 'Africa/Johannesburg' },
];

@Injectable({
  providedIn: 'root'
})
export class TimeService {
  private platformId = inject(PLATFORM_ID);
  private allTimezones = signal<CityTimezone[]>(TIMEZONE_DATA);
  private readonly TIMEZONE_STORAGE_KEY = 'vichara-selected-timezone';

  selectedCity = signal<CityTimezone>(this.getInitialCity());

  searchCities(query: string): CityTimezone[] {
    if (!query) {
      return [];
    }
    const lowerQuery = query.toLowerCase();
    return this.allTimezones().filter(
      tz => tz.city.toLowerCase().includes(lowerQuery) || tz.country.toLowerCase().includes(lowerQuery)
    );
  }
  
  setSelectedCity(city: CityTimezone) {
    this.selectedCity.set(city);
    if (isPlatformBrowser(this.platformId)) {
        try {
            localStorage.setItem(this.TIMEZONE_STORAGE_KEY, city.timezone);
        } catch (e) {
            console.error('Could not save timezone to localStorage', e);
        }
    }
  }

  private findCityByTimezone(timezone: string): CityTimezone | undefined {
    return this.allTimezones().find(c => c.timezone === timezone);
  }

  private getInitialCity(): CityTimezone {
    if (isPlatformBrowser(this.platformId)) {
        try {
            const savedTimezone = localStorage.getItem(this.TIMEZONE_STORAGE_KEY);
            if (savedTimezone) {
                const savedCity = this.findCityByTimezone(savedTimezone);
                if (savedCity) return savedCity;
            }
        } catch (e) {
            console.error('Could not load timezone from localStorage', e);
            localStorage.removeItem(this.TIMEZONE_STORAGE_KEY);
        }
    }
    
    const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    return this.findCityByTimezone(userTimezone) || TIMEZONE_DATA.find(c => c.timezone === 'Europe/London')!;
  }
}
