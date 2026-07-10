import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { Escalation } from '../../core/models';
import { AuthService } from '../../core/services/auth.service';

const STATUSES = ['OPEN', 'IN_PROGRESS', 'RESOLVED'];

@Component({
  selector: 'app-escalations',
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
      <p class="text-xs text-slate-400 max-w-xs mt-1">You do not have the required permissions to view escalated cases.</p>
    </div>

    <div *ngIf="hasReadAccess()">
      <div class="mb-4">
        <div class="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">Escalation Queue</div>
        <h1 class="text-xl font-semibold text-slate-900">Escalated Cases</h1>
        <p class="text-xs text-slate-500 mt-0.5">Manage commitments that failed direct validation and require immediate outcome resolution.</p>
      </div>

      <div class="card mt-4 overflow-hidden">
        <div class="overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Customer</th>
                <th>Summary</th>
                <th>Priority</th>
                <th>SLA</th>
                <th>Status</th>
                <th>Opened</th>
                <th *ngIf="canManage()" class="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let e of paginatedItems(); let idx = index">
                <ng-container *ngIf="editingId !== e.id; else editRow">
                  <td class="font-mono text-xs text-slate-400">{{ idx + 1 + (currentPage() - 1) * pageSize() }}</td>
                  <td class="font-semibold text-slate-800">{{ e.customerName }}</td>
                  <td class="text-slate-500">{{ e.summary }}</td>
                  <td>
                    <span [ngClass]="e.priority === 'P1' ? 'pill pill-warn' : 'pill pill-neutral'">{{ e.priority }}</span>
                  </td>
                  <td class="text-xs text-slate-600">{{ e.slaHours }}h</td>
                  <td>
                    <select
                      class="filter-select"
                      [ngModel]="e.status"
                      [disabled]="true"
                      (ngModelChange)="changeStatus(e, $event)">
                      <option *ngFor="let s of statuses" [value]="s">{{ statusLabel(s) }}</option>
                    </select>
                  </td>
                  <td class="text-xs text-slate-600">{{ e.createdAt | date:'short' }}</td>
                  <td class="text-right" *ngIf="canManage()">
                    <div class="inline-flex items-center justify-end gap-2">
                      <button (click)="startEdit(e)" title="Edit" class="p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-50 transition-all duration-200">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                      </button>
                      <button (click)="remove(e)" title="Delete" class="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-all duration-200">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                      </button>
                    </div>
                  </td>
                </ng-container>
  
                <ng-template #editRow>
                  <td class="font-mono text-xs text-slate-400">{{ idx + 1 + (currentPage() - 1) * pageSize() }}</td>
                  <td><input [(ngModel)]="draft.customerName" class="filter-select" /></td>
                  <td><input [(ngModel)]="draft.summary" class="filter-select" /></td>
                  <td>
                    <select [(ngModel)]="draft.priority" class="filter-select">
                      <option value="P1">P1</option>
                      <option value="P2">P2</option>
                      <option value="P3">P3</option>
                    </select>
                  </td>
                  <td><input type="number" [(ngModel)]="draft.slaHours" class="filter-select" style="width:60px" /></td>
                  <td>
                    <select [(ngModel)]="draft.status" class="filter-select">
                      <option *ngFor="let s of statuses" [value]="s">{{ statusLabel(s) }}</option>
                    </select>
                  </td>
                  <td class="text-xs text-slate-600">{{ e.createdAt | date:'short' }}</td>
                  <td class="text-right">
                    <div class="inline-flex items-center justify-end gap-2">
                      <button (click)="saveEdit(e)" title="Save" class="p-1.5 rounded-lg text-green-600 hover:bg-green-50 transition-all duration-200">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
                      </button>
                      <button (click)="cancelEdit()" title="Cancel" class="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 transition-all duration-200">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                      </button>
                    </div>
                  </td>
                </ng-template>
              </tr>
              <tr *ngIf="items().length === 0">
                <td colspan="8" class="text-center py-6 text-slate-400">No escalations found.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Pagination Controls -->
      <div *ngIf="items().length > 0" class="flex justify-between items-center mt-3 px-1">
        <div class="text-xs text-slate-500">
          Showing {{ showingFrom() }} to {{ showingTo() }} of {{ items().length }} entries
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
              <div class="font-bold text-slate-900 text-sm">Delete Escalation</div>
              <div class="text-xs text-slate-400 mt-0.5">This action cannot be undone</div>
            </div>
          </div>
          <p class="text-sm text-slate-500 mb-5">Are you sure you want to delete the escalation for <span class="font-semibold text-slate-950">{{ deleteTarget!.customerName }}</span>?</p>
          <div class="flex justify-end gap-2">
            <button (click)="deleteTarget = null" class="btn btn-ghost text-sm">Cancel</button>
            <button (click)="confirmDelete()" class="btn text-sm bg-rose-600 hover:bg-rose-700 text-white border-0">Delete</button>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class EscalationsComponent implements OnInit {
  private http = inject(HttpClient);
  auth = inject(AuthService);

  items = signal<Escalation[]>([]);
  statuses = STATUSES;

  // --- edit state ---
  editingId: number | null = null;
  draft: Partial<Escalation> = {};

  // --- pagination state ---
  currentPage = signal(1);
  pageSize = signal(5);

  totalPages = computed(() =>
    Math.max(1, Math.ceil(this.items().length / this.pageSize()))
  );

  paginatedItems = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize();
    return this.items().slice(start, start + this.pageSize());
  });

  showingFrom = computed(() => {
    if (this.items().length === 0) return 0;
    return (this.currentPage() - 1) * this.pageSize() + 1;
  });

  showingTo = computed(() => {
    return Math.min(this.currentPage() * this.pageSize(), this.items().length);
  });

  nextPage(): void {
    if (this.currentPage() < this.totalPages()) this.currentPage.set(this.currentPage() + 1);
  }

  prevPage(): void {
    if (this.currentPage() > 1) this.currentPage.set(this.currentPage() - 1);
  }

  hasReadAccess(): boolean {
    return this.auth.hasPermission('escalation:read') || this.auth.hasRole('ADMIN');
  }

  canManage(): boolean {
    return this.auth.hasPermission('escalation:manage') || this.auth.hasRole('ADMIN');
  }

  ngOnInit(): void {
    if (this.hasReadAccess()) {
      this.load();
    }
  }

  load(): void {
    this.http.get<Escalation[]>('/api/escalations').subscribe(x => {
      this.items.set(x);
      if (this.currentPage() > this.totalPages()) {
        this.currentPage.set(this.totalPages());
      }
    });
  }

  changeStatus(e: Escalation, newStatus: string): void {
    this.http.patch(`/api/escalations/${e.id}`, { status: newStatus }).subscribe(() => this.load());
  }

  statusLabel(s: string): string {
    const labels: Record<string, string> = {
      OPEN: 'Open Case',
      IN_PROGRESS: 'Investigating',
      RESOLVED: 'Resolved',
    };
    return labels[s] ?? s.replace('_', ' ');
  }

  startEdit(e: Escalation): void {
    this.editingId = e.id;
    this.draft = {
      customerName: e.customerName,
      summary: e.summary,
      priority: e.priority,
      slaHours: e.slaHours,
      status: e.status,
    };
  }

  cancelEdit(): void {
    this.editingId = null;
    this.draft = {};
  }

  saveEdit(e: Escalation): void {
    this.http.put(`/api/escalations/${e.id}`, this.draft).subscribe({
      next: () => { this.editingId = null; this.load(); },
      error: (err) => alert(err?.error?.error ?? 'Update failed'),
    });
  }

  deleteTarget: Escalation | null = null;

  remove(e: Escalation): void {
    this.deleteTarget = e;
  }

  confirmDelete(): void {
    if (!this.deleteTarget) return;
    this.http.delete(`/api/escalations/${this.deleteTarget.id}`).subscribe({
      next: () => { this.deleteTarget = null; this.load(); },
      error: (err) => { this.deleteTarget = null; alert(err?.error?.error ?? 'Delete failed'); },
    });
  }
}