import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="min-h-screen grid lg:grid-cols-12 bg-slate-50">
      <!-- Left brand panel -->
      <div class="hidden lg:flex lg:col-span-5 flex-col justify-between p-12 bg-slate-900 text-white relative overflow-hidden">
        <div class="relative z-10">
          <div class="flex items-center gap-2">
            <div class="p-1.5 bg-indigo-500/20 rounded-lg text-indigo-400">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
              </svg>
            </div>
            <span class="text-xl font-semibold tracking-tight text-white">InsightLoop</span>
          </div>
          <p class="text-xs tracking-widest text-indigo-400 font-semibold uppercase mt-6">Outcome Validation Engine</p>
          <h1 class="mt-4 text-3xl font-extrabold leading-tight tracking-tight text-white">From feedback to confirmed resolution.</h1>
          <p class="mt-3 text-sm text-slate-400 leading-relaxed max-w-sm">
            Close the loop on customer commitments automatically. Stop letting promises hide behind generic metrics.
          </p>
        </div>

        <div class="relative z-10 grid grid-cols-3 gap-6 pt-12 border-t border-white/10">
          <div>
            <p class="text-2xl font-bold text-indigo-400">84%</p>
            <p class="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-1">CSAT score</p>
          </div>
          <div>
            <p class="text-2xl font-bold text-white">61%</p>
            <p class="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-1">Confirmed</p>
          </div>
          <div>
            <p class="text-2xl font-bold text-rose-400">23%</p>
            <p class="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-1">Resolution gap</p>
          </div>
        </div>

        <div class="relative z-10 text-xs text-slate-500 font-medium">
          Enterprise Customer Validation Console · v1.1
        </div>
      </div>

      <!-- Right form panel -->
      <div class="flex items-center justify-center p-8 lg:col-span-7">
        <div class="w-full max-w-md bg-white border border-slate-200 rounded-xl p-8 shadow-sm">
          <div class="flex justify-center mb-6 lg:hidden">
            <div class="p-2 bg-slate-100 text-slate-800 rounded-lg">
              <svg class="w-8 h-8" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
              </svg>
            </div>
          </div>
          
          <h2 class="text-xl font-semibold text-slate-900">Welcome back</h2>
          <p class="mt-1 text-sm text-slate-500">Sign in to access your validation queue.</p>

          <form (ngSubmit)="submit()" class="mt-6 space-y-4">
            <div>
              <label>Email Address</label>
              <input type="email" [(ngModel)]="email" name="email" placeholder="name@company.com" required
                     class="focus:ring-2 focus:ring-indigo-500/20" />
            </div>

            <div>
              <label>Password</label>
              <input type="password" [(ngModel)]="password" name="password" placeholder="••••••••" required
                     class="focus:ring-2 focus:ring-indigo-500/20" />
            </div>

            <p *ngIf="error" class="text-xs text-rose-600 font-semibold">{{ error }}</p>

            <button type="submit" [disabled]="loading"
                    class="w-full btn btn-primary py-2.5 flex items-center justify-center gap-2 mt-2 font-medium">
              <span *ngIf="loading" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              {{ loading ? 'Authenticating...' : 'Sign In' }}
            </button>
          </form>

          <!-- <div class="mt-6 pt-6 border-t border-slate-100 text-center text-sm text-slate-500">
            Need an account? 
            <a routerLink="/signup" class="text-indigo-600 font-semibold hover:underline">Create account</a>
          </div> -->
        </div>
      </div>
    </div>
  `,
})
export class LoginComponent {
  email = '';
  password = '';
  loading = false;
  error = '';

  private auth = inject(AuthService);
  private router = inject(Router);

  submit(): void {
    this.loading = true;
    this.error = '';
    this.auth.login(this.email, this.password).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.error ?? 'Invalid credentials';
      },
    });
  }
}
