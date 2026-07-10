import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Commitment } from '../../core/models';
import { AuthService } from '../../core/services/auth.service';

const STATUS_STYLE: Record<string, string> = {
  PENDING: 'pill pill-neutral',
  VALIDATION_SENT: 'pill pill-neutral',
  RESOLVED: 'pill pill-open',
  UNRESOLVED: 'pill pill-warn',
  ESCALATED: 'pill pill-warn',
};

const STATUSES = ['PENDING', 'VALIDATION_SENT', 'RESOLVED', 'UNRESOLVED', 'ESCALATED'];

@Component({
  selector: 'app-commitments',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div *ngIf="!hasReadAccess()" class="flex flex-col items-center justify-center py-24 text-center">
      <div class="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center text-rose-500 mb-3 border border-rose-100/50">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
        </svg>
      </div>
      <h2 class="text-sm font-semibold text-slate-800">Access Restricted</h2>
      <p class="text-xs text-slate-400 max-w-xs mt-1">You do not have the required permissions to view commitments.</p>
    </div>

    <div *ngIf="hasReadAccess()">
      <div class="flex justify-between items-baseline mb-4">
        <div>
          <div class="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">Outcomes</div>
          <h1 class="text-xl font-semibold text-slate-900">Commitments</h1>
          <p class="text-xs text-slate-500 mt-0.5">Track agent promises, due dates, and fulfillment states.</p>
        </div>
        <a *ngIf="hasWriteAccess()" routerLink="/commitments/new" class="btn btn-primary">+ New commitment</a>
      </div>

      <div class="flex items-center gap-2 mt-4">
        <select class="filter-select" [ngModel]="filter()" (ngModelChange)="filter.set($event); currentPage.set(1)">
          <option value="">All Statuses</option>
          <option value="PENDING">Pending Resolution</option>
          <option value="VALIDATION_SENT">Outreach Sent</option>
          <option value="RESOLVED">Resolved</option>
          <option value="UNRESOLVED">Unresolved</option>
          <option value="ESCALATED">Escalated P1</option>
        </select>
      </div>

      <div class="card mt-4 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Customer</th>
                <th>Type</th>
                <th>Description</th>
                <th>Due</th>
                <th>Status</th>
                <th *ngIf="hasWriteAccess() || hasDeleteAccess()" class="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let c of paginatedItems(); let idx = index">
                <ng-container *ngIf="editingId() !== c.id; else editRow">
                  <td><a class="link" [routerLink]="['/commitments', c.id]">{{ idx + 1 + (currentPage() - 1) * pageSize() }}</a></td>
                  <td class="font-semibold text-slate-800">{{ c.customerName }}</td>
                  <td>{{ c.commitmentType.replace('_',' ') }}</td>
                  <td class="text-slate-500">{{ c.description }}</td>
                  <td class="text-xs text-slate-600">{{ c.dueAt | date:'mediumDate' }}</td>
                  <td><span [class]="style(c.status)">{{ statusLabel(c.status) }}</span></td>
                  <td class="text-right" *ngIf="hasWriteAccess() || hasDeleteAccess()">
                    <div class="inline-flex items-center justify-end gap-2">
                      <button *ngIf="hasWriteAccess()" (click)="startEdit(c)" title="Edit" class="p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-50 transition-all duration-200">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                      </button>
                      <button *ngIf="hasDeleteAccess()" (click)="remove(c)" title="Delete" class="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-all duration-200">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                      </button>
                    </div>
                  </td>
                </ng-container>
  
                <ng-template #editRow>
                  <td>{{ idx + 1 + (currentPage() - 1) * pageSize() }}</td>
                  <td><input [(ngModel)]="draft.customerName" class="filter-select" /></td>
                  <td>
                    <select [(ngModel)]="draft.commitmentType" class="filter-select">
                      <option value="REFUND">Refund</option>
                      <option value="CARD_REPLACEMENT">Card replacement</option>
                      <option value="ACCOUNT_CORRECTION">Account correction</option>
                      <option value="TECHNICIAN_VISIT">Technician visit</option>
                      <option value="SERVICE_ACTIVATION">Service activation</option>
                      <option value="CALL_BACK">Call back</option>
                      <option value="FOLLOW_UP">Follow up</option>
                      <option value="RESOLUTION">Resolution</option>
                    </select>
                  </td>
                  <td><input [(ngModel)]="draft.description" class="filter-select" /></td>
                  <td><input type="datetime-local" [(ngModel)]="draft.dueAt" class="filter-select" /></td>
                  <td>
                    <select [(ngModel)]="draft.status" class="filter-select">
                      <option *ngFor="let s of statuses" [value]="s">{{ statusLabel(s) }}</option>
                    </select>
                  </td>
                  <td class="text-right">
                    <div class="inline-flex items-center justify-end gap-2">
                      <button (click)="save(c)" title="Save" [disabled]="saving()" class="p-1.5 rounded-lg text-green-600 hover:bg-green-50 transition-all duration-200">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
                      </button>
                      <button (click)="cancel()" title="Cancel" class="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 transition-all duration-200">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                      </button>
                    </div>
                  </td>
                </ng-template>
              </tr>
              <tr *ngIf="filtered().length === 0">
                <td colspan="7" class="text-center py-6 text-slate-400">No commitments found.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Pagination Controls -->
      <div *ngIf="filtered().length > 0" class="flex justify-between items-center mt-3 px-1">
        <div class="text-xs text-slate-500">
          Showing {{ showingFrom() }} to {{ showingTo() }} of {{ filtered().length }} entries
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

      <!-- Delete Confirmation Modal -->
      <div *ngIf="deleteTarget" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm" (click)="deleteTarget = null">
        <div class="card p-5 w-full max-w-sm mx-4 shadow-xl bg-white" (click)="$event.stopPropagation()">
          <div class="flex items-center gap-3 mb-4">
            <div class="p-2 rounded-full bg-rose-100">
              <svg class="w-4 h-4 text-rose-600" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <div>
              <div class="font-bold text-slate-900 text-sm">Delete Commitment</div>
              <div class="text-xs text-slate-400 mt-0.5">This action cannot be undone</div>
            </div>
          </div>
          <p class="text-sm text-slate-500 mb-5">Are you sure you want to delete the commitment for <span class="font-semibold text-slate-950">{{ deleteTarget!.customerName }}</span>?</p>
          <div class="flex justify-end gap-2">
            <button (click)="deleteTarget = null" class="btn btn-ghost text-sm">Cancel</button>
            <button (click)="confirmDelete()" class="btn text-sm bg-rose-600 hover:bg-rose-700 text-white border-0">Delete</button>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class CommitmentsComponent implements OnInit {
  private http = inject(HttpClient);
  auth = inject(AuthService);

  hasReadAccess(): boolean {
    return this.auth.hasPermission('commitment:read') || this.auth.hasRole('ADMIN');
  }

  hasWriteAccess(): boolean {
    return this.auth.hasPermission('commitment:write') || this.auth.hasRole('ADMIN');
  }

  hasDeleteAccess(): boolean {
    return (this.auth.hasRole('ADMIN') || this.auth.hasRole('MANAGER')) && this.hasWriteAccess();
  }

  items = signal<Commitment[]>([]);
  filter = signal<string>('');
  
  filtered = computed(() =>
    this.filter() ? this.items().filter(c => c.status === this.filter()) : this.items()
  );

  // --- pagination state ---
  currentPage = signal(1);
  pageSize = signal(5);

  totalPages = computed(() => Math.ceil(this.filtered().length / this.pageSize()));

  paginatedItems = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize();
    return this.filtered().slice(start, start + this.pageSize());
  });

  showingFrom = computed(() => {
    if (this.filtered().length === 0) return 0;
    return (this.currentPage() - 1) * this.pageSize() + 1;
  });

  showingTo = computed(() => {
    return Math.min(this.currentPage() * this.pageSize(), this.filtered().length);
  });

  // --- edit state ---
  editingId = signal<number | null>(null);
  saving = signal(false);
  statuses = STATUSES;
  draft: Partial<Commitment> & { dueAt?: string } = {};

  ngOnInit(): void {
    this.http.get<Commitment[]>('/api/commitments').subscribe(x => this.items.set(x));
  }

  style(s: string): string { return STATUS_STYLE[s] ?? 'pill pill-neutral'; }

  statusLabel(s: string): string {
    const labels: Record<string, string> = {
      PENDING: 'Pending Resolution',
      VALIDATION_SENT: 'Outreach Sent',
      RESOLVED: 'Resolved',
      UNRESOLVED: 'Unresolved',
      ESCALATED: 'Escalated P1',
    };
    return labels[s] ?? s.replace('_', ' ');
  }

  startEdit(c: Commitment) {
    this.editingId.set(c.id);
    this.draft = {
      customerName: c.customerName,
      commitmentType: c.commitmentType,
      description: c.description,
      dueAt: c.dueAt ? new Date(c.dueAt).toISOString().substring(0, 16) : '',
      status: c.status,
    };
  }

  cancel() {
    this.editingId.set(null);
    this.draft = {};
  }

  save(c: Commitment) {
    if (this.saving()) return;
    this.saving.set(true);

    const payload = {
      ...this.draft,
      dueAt: this.draft.dueAt ? new Date(this.draft.dueAt).toISOString() : null,
    };

    this.http.put<Commitment>(`/api/commitments/${c.id}`, payload).subscribe({
      next: (updated) => {
        this.items.update(list =>
          list.map(i => (i.id === c.id ? { ...i, ...updated } : i))
        );
        this.saving.set(false);
        this.cancel();
      },
      error: () => this.saving.set(false),
    });
  }

  deleteTarget: Commitment | null = null;

  remove(c: Commitment): void {
    this.deleteTarget = c;
  }

  confirmDelete(): void {
    if (!this.deleteTarget) return;
    this.http.delete(`/api/commitments/${this.deleteTarget.id}`).subscribe({
      next: () => {
        this.items.update(list => list.filter(i => i.id !== this.deleteTarget!.id));
        this.deleteTarget = null;
      },
      error: (e) => { this.deleteTarget = null; alert(e?.error?.error ?? 'Delete failed'); }
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