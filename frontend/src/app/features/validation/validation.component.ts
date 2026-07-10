import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Commitment } from '../../core/models';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-validation',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div *ngIf="!hasReadAccess()" class="flex flex-col items-center justify-center py-24 text-center">
      <div class="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center text-rose-500 mb-3 border border-rose-100/50">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
        </svg>
      </div>
      <h2 class="text-sm font-semibold text-slate-800">Access Restricted</h2>
      <p class="text-xs text-slate-400 max-w-xs mt-1">You do not have the required permissions to view validation queue.</p>
    </div>

    <div *ngIf="hasReadAccess()">
      <div class="mb-4">
        <div class="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">Validation Loop</div>
        <h1 class="text-xl font-semibold text-slate-900">Verification Queue</h1>
        <p class="text-xs text-slate-500 mt-0.5">
          Simulate customer feedback loops to verify resolution outcomes.
        </p>
      </div>

      <!-- Validation Queue Table -->
      <div class="card mt-4 overflow-hidden">
        <div class="overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>ID</th>
                <th>Customer</th>
                <th>Type</th>
                <th>Description</th>
                <th>Due Date</th>
                <th *ngIf="hasWriteAccess()" class="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let c of paginatedItems(); let idx = index">
                <td class="font-mono text-xs text-slate-400">{{ idx + 1 + (currentPage() - 1) * pageSize() }}</td>
                <td class="font-mono text-xs text-indigo-600 font-semibold">C-{{ 1000 + c.id }}</td>
                <td class="font-semibold text-slate-800">{{ c.customerName }}</td>
                <td><span class="pill pill-neutral">{{ c.commitmentType.replace('_', ' ') }}</span></td>
                <td class="text-slate-500">{{ c.description }}</td>
                <td class="text-xs text-slate-600">{{ c.dueAt | date:'mediumDate' }}</td>
                <td *ngIf="hasWriteAccess()" class="text-right">
                  <button (click)="openSimulator(c)" class="text-indigo-600 hover:text-indigo-800 font-semibold text-xs transition-colors duration-200">
                    Verify Outcome
                  </button>
                </td>
              </tr>
              <tr *ngIf="pending().length === 0">
                <td colspan="7" class="text-center py-6 text-slate-400">
                  No commitments currently awaiting validation. All outcomes verified!
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Pagination Controls -->
      <div *ngIf="pending().length > 0" class="flex justify-between items-center mt-3 px-1">
        <div class="text-xs text-slate-500">
          Showing {{ showingFrom() }} to {{ showingTo() }} of {{ pending().length }} entries
        </div>
        <div class="flex gap-2">
          <button (click)="prevPage()" [disabled]="currentPage() === 1" class="btn btn-ghost py-1 px-3 text-xs flex items-center gap-1" [class.opacity-50]="currentPage() === 1">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
            </svg>
            Previous
          </button>
          <button (click)="nextPage()" [disabled]="currentPage() >= totalPages()" class="btn btn-ghost py-1 px-3 text-xs flex items-center gap-1" [class.opacity-50]="currentPage() >= totalPages()">
            Next
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
            </svg>
          </button>
        </div>
      </div>

      <!-- Simulator Drawer Modal -->
      <div *ngIf="activeCommitment" class="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div class="card bg-white w-full max-w-lg p-5 shadow-lg relative animate-in fade-in zoom-in duration-200">
          <button (click)="closeSimulator()" class="absolute top-4 right-4 text-slate-400 hover:text-slate-655">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>

          <div class="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Outcome Validation Simulator</div>
          <h2 class="text-lg font-semibold text-slate-900 mb-4">Simulate Customer Resolution Feedback</h2>

          <!-- Selected Commitment Preview Info -->
          <div class="bg-slate-50 rounded-lg p-4 border border-slate-100 mb-4 text-left">
            <div class="flex items-start justify-between">
              <div>
                <div class="text-sm font-semibold text-slate-800">{{ activeCommitment.customerName }}</div>
                <div class="text-xs text-slate-500 mt-1 leading-relaxed">{{ activeCommitment.description }}</div>
              </div>
              <span class="pill pill-neutral shrink-0">{{ activeCommitment.commitmentType.replace('_', ' ') }}</span>
            </div>
            <div class="flex items-center gap-4 mt-3 pt-3 border-t border-slate-200/50 text-xs text-slate-400">
              <div class="flex items-center gap-1.5">
                <svg class="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Due: {{ activeCommitment.dueAt | date:'mediumDate' }}</span>
              </div>
              <div class="flex items-center gap-1.5">
                <span class="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
                <span>C-{{ 1000 + activeCommitment.id }}</span>
              </div>
            </div>
          </div>

          <div class="mt-4">
            <label>Customer Resolution Feedback (Optional)</label>
            <textarea rows="3" [(ngModel)]="comment" placeholder="e.g. The refund was successfully credited to my account. Thank you!"></textarea>
          </div>

          <div class="flex gap-3 mt-6">
            <button (click)="respond(true)" 
                    class="flex-1 btn text-white bg-green-600 hover:bg-green-700 border-0 flex items-center justify-center gap-2 py-2 font-medium" 
                    [disabled]="loading">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4" />
              </svg>
              Resolved ✓
            </button>
            <button (click)="respond(false)" 
                    class="flex-1 btn btn-danger flex items-center justify-center gap-2 py-2 font-medium" 
                    [disabled]="loading">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
              Unresolved ✗
            </button>
          </div>

          <!-- Simulation Success Banner -->
          <div *ngIf="msg && !isError" class="mt-4 p-4 bg-emerald-50 border border-emerald-100 rounded-lg text-emerald-800 flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
            <div class="p-1 rounded bg-emerald-500 text-white shrink-0">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4" />
              </svg>
            </div>
            <div class="text-left">
              <div class="text-[10px] font-bold uppercase tracking-wider">Validation Captured</div>
              <div class="text-xs mt-0.5 opacity-90">{{ msg }}</div>
            </div>
          </div>

          <!-- Simulation Failure Banner -->
          <div *ngIf="msg && isError" class="mt-4 p-4 bg-rose-50 border border-rose-100 rounded-lg text-rose-800 flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
            <div class="p-1 rounded bg-rose-500 text-white shrink-0">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div class="text-left">
              <div class="text-[10px] font-bold uppercase tracking-wider">Escalation Triggered</div>
              <div class="text-xs mt-0.5 opacity-90">{{ msg }}</div>
            </div>
          </div>
        </div>
      </div>
  `,
})
export class ValidationComponent implements OnInit {
  private http = inject(HttpClient);
  private auth = inject(AuthService);

  hasReadAccess(): boolean {
    return this.auth.hasPermission('commitment:read') || this.auth.hasRole('ADMIN');
  }

  hasWriteAccess(): boolean {
    return this.auth.hasPermission('commitment:write') || this.auth.hasRole('ADMIN');
  }

  pending = signal<Commitment[]>([]);
  activeCommitment: Commitment | null = null;
  comment = '';
  loading = false;
  msg = '';
  isError = false;

  // --- pagination state ---
  currentPage = signal(1);
  pageSize = signal(5);

  totalPages = computed(() => Math.max(1, Math.ceil(this.pending().length / this.pageSize())));

  paginatedItems = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize();
    return this.pending().slice(start, start + this.pageSize());
  });

  showingFrom = computed(() => {
    if (this.pending().length === 0) return 0;
    return (this.currentPage() - 1) * this.pageSize() + 1;
  });

  showingTo = computed(() => {
    return Math.min(this.currentPage() * this.pageSize(), this.pending().length);
  });

  ngOnInit(): void {
    if (this.hasReadAccess()) {
      this.load();
    }
  }

  load(): void {
    this.http.get<Commitment[]>('/api/commitments').subscribe(x => {
      const filtered = x.filter(c => c.status === 'PENDING' || c.status === 'VALIDATION_SENT');
      // Sort descending by ID so new ones are first
      this.pending.set(filtered.sort((a, b) => b.id - a.id));
      if (this.currentPage() > this.totalPages()) {
        this.currentPage.set(this.totalPages());
      }
    });
  }

  openSimulator(c: Commitment): void {
    this.activeCommitment = c;
    this.comment = '';
    this.msg = '';
    this.isError = false;
  }

  closeSimulator(): void {
    this.activeCommitment = null;
    this.comment = '';
    this.msg = '';
    this.isError = false;
  }

  respond(resolved: boolean): void {
    if (!this.activeCommitment) return;
    this.loading = true; 
    this.msg = '';
    
    this.http.post(`/api/validations/${this.activeCommitment.id}/respond`, { resolved, comment: this.comment })
      .subscribe({
        next: () => {
          this.loading = false;
          this.msg = resolved
            ? 'Customer confirmed resolution. Commitment closed.'
            : 'Unresolved. High-priority escalation created.';
          this.isError = !resolved;
          this.comment = '';
          
          // Re-load the validation queue
          this.load();
          
          // Wait 2 seconds and close the modal automatically on success
          setTimeout(() => {
            if (this.activeCommitment) {
              this.closeSimulator();
            }
          }, 2000);
        },
        error: (e) => { 
          this.loading = false; 
          this.msg = e?.error?.error ?? 'Failed'; 
          this.isError = true; 
        },
      });
  }

  prevPage(): void {
    if (this.currentPage() > 1) {
      this.currentPage.set(this.currentPage() - 1);
    }
  }

  nextPage(): void {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.set(this.currentPage() + 1);
    }
  }
}
