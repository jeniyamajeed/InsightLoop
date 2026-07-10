import { Component, inject, computed, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';

interface NavItem { label: string; path: string; roles?: string[]; icon: string; }

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    <div class="min-h-screen flex bg-[#f8fafc]">
      <!-- Sidebar -->
      <aside class="w-48 shrink-0 bg-[#1e293b] flex flex-col">
        <!-- Logo -->
        <div class="px-3.5 py-2.5 border-b border-white/5">
          <!-- <div class="text-[9px] tracking-[0.18em] text-slate-500 font-semibold mb-1.5">WORKSPACE</div> -->
          <div class="flex items-center gap-2">
            <div class="w-6 h-6 rounded bg-indigo-500 flex items-center justify-center shrink-0">
              <svg class="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
              </svg>
            </div>
            <span class="text-xs font-semibold text-white tracking-tight">InsightLoop</span>
          </div>
        </div>

        <!-- Nav -->
        <nav class="flex-1 px-1.5 py-2.5 space-y-0.5">
          <a routerLink="/dashboard" routerLinkActive="bg-white/10 text-white" [routerLinkActiveOptions]="{exact:true}"
             class="flex items-center gap-2 px-2 py-1 rounded text-xs font-medium text-slate-400 hover:bg-white/5 hover:text-slate-200 transition-all duration-150 group">
            <svg class="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
            <span>Dashboard</span>
          </a>

          <a routerLink="/interactions" routerLinkActive="bg-white/10 text-white"
             class="flex items-center gap-2 px-2 py-1 rounded text-xs font-medium text-slate-400 hover:bg-white/5 hover:text-slate-200 transition-all duration-150">
            <svg class="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span>Interactions</span>
          </a>

          <a routerLink="/commitments" routerLinkActive="bg-white/10 text-white"
             class="flex items-center gap-2 px-2 py-1 rounded text-xs font-medium text-slate-400 hover:bg-white/5 hover:text-slate-200 transition-all duration-150">
            <svg class="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            <span>Commitments</span>
          </a>

          <a routerLink="/validation" routerLinkActive="bg-white/10 text-white"
             class="flex items-center gap-2 px-2 py-1 rounded text-xs font-medium text-slate-400 hover:bg-white/5 hover:text-slate-200 transition-all duration-150">
            <svg class="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span>Outcome Validation</span>
          </a>

          <a routerLink="/escalations" routerLinkActive="bg-white/10 text-white"
             class="flex items-center gap-2 px-2 py-1 rounded text-xs font-medium text-slate-400 hover:bg-white/5 hover:text-slate-200 transition-all duration-150">
            <svg class="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>Escalated Cases</span>
          </a>

          <!-- <a routerLink="/analytics" routerLinkActive="bg-white/10 text-white"
             class="flex items-center gap-2 px-2 py-1 rounded text-xs font-medium text-slate-400 hover:bg-white/5 hover:text-slate-200 transition-all duration-150">
            <svg class="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 00-2-2zm6 0v-4a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span>Outcome Analytics</span>
          </a> -->

          <a *ngIf="hasAdmin()" routerLink="/admin/users" routerLinkActive="bg-white/10 text-white"
             class="flex items-center gap-2 px-2 py-1 rounded text-xs font-medium text-slate-400 hover:bg-white/5 hover:text-slate-200 transition-all duration-150">
            <svg class="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>Users & Roles</span>
          </a>
        </nav>
      </aside>

      <!-- Main content -->
      <main class="flex-1 flex flex-col overflow-hidden min-w-0">
        <!-- Top bar -->
        <header class="h-11 bg-white border-b border-slate-200 flex items-center justify-end px-3.5 shrink-0 gap-3 relative">
          <div (click)="togglePermissions($event)" class="flex items-center gap-2 cursor-pointer hover:bg-slate-50 p-1 rounded-md transition-colors duration-150 relative select-none">
            <div class="w-5.5 h-5.5 rounded-full bg-slate-100 flex items-center justify-center text-[9px] font-semibold text-slate-600 border border-slate-200">
              {{ userInitials() }}
            </div>
            <div class="hidden sm:block">
              <div class="text-[10px] font-semibold text-slate-700 leading-none">{{ userEmailPrefix() }}</div>
              <div class="text-[8px] text-slate-400 mt-0.5">{{ user()?.roles?.join(', ') }}</div>
            </div>
            <svg class="w-2.5 h-2.5 text-slate-400" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>

            <!-- Permissions Dropdown -->
            <div *ngIf="showPermissions()" (click)="$event.stopPropagation()" 
                 class="absolute right-0 top-full mt-1.5 w-48 bg-white border border-slate-200 rounded-lg shadow-lg py-2 px-3 z-50 text-left">
              <div class="text-[9px] font-bold text-slate-400 tracking-wider uppercase mb-1.5 border-b border-slate-100 pb-1">Assigned Permissions</div>
              <div class="space-y-1.5 max-h-40 overflow-y-auto">
                <div *ngFor="let p of user()?.permissions" class="flex items-center gap-2 text-[10px] text-slate-600 font-medium">
                  <div class="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0"></div>
                  <span>{{ p }}</span>
                </div>
                <div *ngIf="!user()?.permissions?.length" class="text-[10px] text-slate-400 italic">No direct permissions.</div>
              </div>
            </div>
          </div>
          <div class="w-px h-2.5 bg-slate-200"></div>
          <button (click)="logout()" class="text-[10px] text-slate-500 hover:text-slate-800 transition-colors duration-150 flex items-center gap-1 font-medium">
            <svg class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sign out
          </button>
        </header>
        <div class="flex-1 overflow-auto p-3">
          <router-outlet></router-outlet>
        </div>
      </main>
    </div>
  `,
})
export class ShellComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  readonly user = this.auth.user;

  readonly userEmail = computed(() => this.user()?.email ?? '');
  readonly userEmailPrefix = computed(() => this.userEmail().split('@')[0] || 'User');
  readonly userInitials = computed(() => this.userEmailPrefix().substring(0, 2).toUpperCase() || 'US');

  showPermissions = signal(false);

  constructor() {
    window.addEventListener('click', () => this.showPermissions.set(false));
  }

  togglePermissions(event: MouseEvent): void {
    event.stopPropagation();
    this.showPermissions.set(!this.showPermissions());
  }

  hasAdmin(): boolean {
    return this.auth.hasAnyRole(['ADMIN']);
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
