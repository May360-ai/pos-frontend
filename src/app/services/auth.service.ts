import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private currentUserSubject: BehaviorSubject<any>;
  public currentUser: Observable<any>;

  constructor(
    private apiService: ApiService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    let user = null;
    if (isPlatformBrowser(this.platformId)) {
      const storedUser = localStorage.getItem('currentUser');
      if (storedUser) {
        try {
          user = JSON.parse(storedUser);
          console.log('AuthService: User loaded from localStorage', user.email);
        } catch (e) {
          console.error('AuthService: Error parsing stored user', e);
          localStorage.removeItem('currentUser');
        }
      }
    }
    this.currentUserSubject = new BehaviorSubject<any>(user);
    this.currentUser = this.currentUserSubject.asObservable();
  }

  public get currentUserValue(): any {
    return this.currentUserSubject.value;
  }

  login(credentials: any): Observable<any> {
    return this.apiService.login(credentials).pipe(
      map((response: any) => {
        const data = response.data;
        if (data && data.accessToken) {
          const user = {
            ...data,
            email: credentials.email
          };
          if (isPlatformBrowser(this.platformId)) {
            localStorage.setItem('currentUser', JSON.stringify(user));
          }
          this.currentUserSubject.next(user);
          console.log('AuthService: Login successful', user.email);
        }
        return data;
      })
    );
  }

  logout() {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('currentUser');
    }
    this.currentUserSubject.next(null);
    console.log('AuthService: Logged out');
  }

  getToken(): string | null {
    const user = this.currentUserValue;
    const token = user ? user.accessToken : null;
    return token;
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }
}
