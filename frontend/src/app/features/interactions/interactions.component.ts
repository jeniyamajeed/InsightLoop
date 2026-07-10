import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { Interaction } from '../../core/models';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-interactions',
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
      <p class="text-xs text-slate-400 max-w-xs mt-1">You do not have the required permissions to view support logs.</p>
    </div>

    <div *ngIf="hasReadAccess()">
      <div class="flex justify-between items-center mb-4">
        <div>
          <div class="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">Support Logs</div>
          <h1 class="text-xl font-semibold text-slate-900">Support Contacts & Immediate Feedback</h1>
          <p class="text-xs text-slate-500 mt-0.5">Log customer contacts and track post-interaction feedback.</p>
        </div>
        <button (click)="showForm.set(true)" class="btn btn-primary flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Log Support Contact
        </button>
      </div>

      <div class="card mt-4 overflow-hidden">
        <div class="overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Customer</th>
                <th>Channel</th>
                <th>Summary</th>
                <th>CSAT</th>
                <th>Feedback</th>
                <th *ngIf="hasWriteAccess()" class="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let i of paginatedItems(); let idx = index">
                <ng-container *ngIf="editingId !== i.id; else editRow">
                  <td class="font-mono text-xs text-slate-400">{{ idx + 1 + (currentPage() - 1) * pageSize() }}</td>
                  <td class="font-semibold text-slate-800">{{ i.customerName }}</td>
                  <td><span class="pill pill-neutral">{{ i.channel }}</span></td>
                  <td class="text-slate-500">{{ i.summary }}</td>
                  <td>
                    <ng-container *ngIf="i.csatScore != null; else noCsat">
                      <span [ngClass]="i.csatScore >= 4 ? 'pill pill-open' : (i.csatScore <= 2 ? 'pill pill-warn' : 'pill pill-neutral')">
                        {{ i.csatScore }} / 5
                      </span>
                    </ng-container>
                    <ng-template #noCsat>
                      <button *ngIf="hasWriteAccess()" (click)="giveFeedback(i)" class="text-xs text-indigo-600 hover:text-indigo-800 font-semibold">Capture CSAT</button>
                    </ng-template>
                  </td>
                  <td class="text-xs text-slate-500">{{ i.csatComment }}</td>
                  <td class="text-right" *ngIf="hasWriteAccess()">
                    <div class="inline-flex items-center justify-end gap-2">
                      <button (click)="startEdit(i)" title="Edit" class="p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-50 transition-all duration-200">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                      </button>
                      <button *ngIf="hasDeleteAccess()" (click)="remove(i)" title="Delete" class="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-all duration-200">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                      </button>
                    </div>
                  </td>
                </ng-container>
  
                <ng-template #editRow>
                  <td class="font-mono text-xs text-slate-400">{{ idx + 1 + (currentPage() - 1) * pageSize() }}</td>
                  <td><input [(ngModel)]="editCustomerName" class="filter-select" style="min-width: 130px;" /></td>
                  <td>
                    <select [(ngModel)]="editChannel" class="filter-select">
                      <option value="CALL">Call</option>
                      <option value="CHAT">Chat</option>
                      <option value="EMAIL">Email</option>
                    </select>
                  </td>
                  <td><input [(ngModel)]="editSummary" class="filter-select" style="min-width: 180px;" /></td>
                  <td>
                    <select [(ngModel)]="editCsatScore" class="filter-select" style="min-width: 100px;">
                      <option value="">No CSAT</option>
                      <option value="5">5 / 5</option>
                      <option value="4">4 / 5</option>
                      <option value="3">3 / 5</option>
                      <option value="2">2 / 5</option>
                      <option value="1">1 / 5</option>
                    </select>
                  </td>
                  <td><input [(ngModel)]="editCsatComment" class="filter-select" style="min-width: 140px;" placeholder="Optional" /></td>
                  <td class="text-right">
                    <div class="inline-flex items-center justify-end gap-2">
                      <button (click)="saveEdit(i)" title="Save" class="p-1.5 rounded-lg text-green-600 hover:bg-green-50 transition-all duration-200">
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
                <td colspan="7" class="text-center py-6 text-slate-400">No support logs found.</td>
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
      <!-- Log Interaction Modal -->
      <div *ngIf="showForm()" class="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div class="card bg-white w-full max-w-lg p-5 shadow-lg relative animate-in fade-in zoom-in duration-200">
          <button (click)="closeForm()" class="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
          
          <div class="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">New Record</div>
          <h2 class="text-lg font-semibold text-slate-900 mb-4">Log Support Contact</h2>
          
          <form (ngSubmit)="submitInteraction()" class="space-y-4">
            <div>
              <label>Customer Name</label>
              <input name="customerName" [(ngModel)]="customerName" placeholder="e.g. Sarah Jenkins" required />
            </div>
            
            <div>
              <label>Channel</label>
              <select name="channel" [(ngModel)]="channel" required>
                <option value="CALL">Call</option>
                <option value="CHAT">Chat</option>
                <option value="EMAIL">Email</option>
              </select>
            </div>
            
            <div>
              <label>Interaction Summary</label>
              <textarea name="summary" [(ngModel)]="summary" placeholder="e.g. Card blocked, needs replacement" rows="3" required></textarea>
            </div>

            <hr class="border-slate-100 my-4" />
            
            <div class="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">CSAT Feedback (Optional)</div>
            
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label>CSAT Score</label>
                <select name="csatScore" [(ngModel)]="csatScore">
                  <option value="">No Feedback</option>
                  <option value="5">5 - Excellent</option>
                  <option value="4">4 - Good</option>
                  <option value="3">3 - Average</option>
                  <option value="2">2 - Poor</option>
                  <option value="1">1 - Terrible</option>
                </select>
              </div>
              <div>
                <label>Feedback Comment</label>
                <input name="csatComment" [(ngModel)]="csatComment" placeholder="e.g. Very helpful service" />
              </div>
            </div>
            
            <div *ngIf="formError()" class="text-sm text-rose-600 font-medium">{{ formError() }}</div>
            
            <div class="flex justify-end gap-2 pt-2">
              <button type="button" (click)="closeForm()" class="btn btn-ghost">Cancel</button>
              <button type="submit" class="btn btn-primary" [disabled]="submitting()">
                {{ submitting() ? 'Saving...' : 'Save Record' }}
              </button>
            </div>
          </form>
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
              <div class="font-bold text-slate-900 text-sm">Delete Support Record</div>
              <div class="text-xs text-slate-400 mt-0.5">This action cannot be undone</div>
            </div>
          </div>
          <p class="text-sm text-slate-500 mb-5">Are you sure you want to delete the support record for <span class="font-semibold text-slate-950">{{ deleteTarget!.customerName }}</span>?</p>
          <div class="flex justify-end gap-2">
            <button (click)="deleteTarget = null" class="btn btn-ghost text-sm">Cancel</button>
            <button (click)="confirmDelete()" class="btn text-sm bg-rose-600 hover:bg-rose-700 text-white border-0">Delete</button>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class InteractionsComponent implements OnInit {
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

  // Data signals
  items = signal<Interaction[]>([]);
  showForm = signal(false);
  submitting = signal(false);
  formError = signal('');

  // Form fields
  customerName = '';
  channel = 'CALL';
  summary = '';
  csatScore = '';
  csatComment = '';

  // Inline editing state
  editingId: number | null = null;
  editCustomerName = '';
  editChannel = 'CALL';
  editSummary = '';
  editCsatScore = '';
  editCsatComment = '';

  // Pagination signals
  currentPage = signal(1);
  pageSize = signal(5);

  // Pagination computeds
  totalPages = computed(() => Math.ceil(this.items().length / this.pageSize()));
  
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

  ngOnInit(): void { this.load(); }
  
  load(): void {
    this.http.get<Interaction[]>('/api/interactions').subscribe(x => {
      const sorted = x.sort((a, b) => b.id - a.id);
      this.items.set(sorted);
    });
  }

  giveFeedback(i: Interaction): void {
    const raw = prompt(`CSAT score (1-5) for ${i.customerName}?`, '5');
    if (!raw) return;
    const score = parseInt(raw, 10);
    if (isNaN(score) || score < 1 || score > 5) return;
    const comment = prompt('Comment?') ?? '';
    this.http.post(`/api/interactions/${i.id}/feedback`, { score, comment }).subscribe(() => this.load());
  }

  startEdit(i: Interaction): void {
    this.editingId = i.id;
    this.editCustomerName = i.customerName;
    this.editChannel = i.channel;
    this.editSummary = i.summary;
    this.editCsatScore = i.csatScore != null ? String(i.csatScore) : '';
    this.editCsatComment = i.csatComment || '';
  }

  cancelEdit(): void {
    this.editingId = null;
  }

  saveEdit(i: Interaction): void {
    const body: any = {
      customerName: this.editCustomerName.trim(),
      channel: this.editChannel,
      summary: this.editSummary.trim(),
      csatScore: this.editCsatScore ? parseInt(this.editCsatScore, 10) : null,
      csatComment: this.editCsatScore ? this.editCsatComment.trim() : null
    };

    this.http.put(`/api/interactions/${i.id}`, body).subscribe({
      next: () => { this.editingId = null; this.load(); },
      error: (e) => alert(e?.error?.error ?? 'Update failed')
    });
  }

  deleteTarget: Interaction | null = null;

  remove(i: Interaction): void {
    this.deleteTarget = i;
  }

  confirmDelete(): void {
    if (!this.deleteTarget) return;
    this.http.delete(`/api/interactions/${this.deleteTarget.id}`).subscribe({
      next: () => { this.deleteTarget = null; this.load(); },
      error: (e) => { this.deleteTarget = null; alert(e?.error?.error ?? 'Delete failed'); }
    });
  }

  submitInteraction(): void {
    if (!this.customerName.trim() || !this.channel || !this.summary.trim()) {
      this.formError.set('Please fill out all required fields.');
      return;
    }
    this.submitting.set(true);
    this.formError.set('');

    const body: any = {
      customerName: this.customerName.trim(),
      channel: this.channel,
      summary: this.summary.trim()
    };

    if (this.csatScore) {
      body.csatScore = parseInt(this.csatScore, 10);
      body.csatComment = this.csatComment.trim();
    }

    this.http.post('/api/interactions', body).subscribe({
      next: () => {
        this.submitting.set(false);
        this.closeForm();
        this.load();
        this.currentPage.set(1);
      },
      error: (err) => {
        this.submitting.set(false);
        this.formError.set(err?.error?.error || 'Failed to save interaction.');
      }
    });
  }

  closeForm(): void {
    this.showForm.set(false);
    this.customerName = '';
    this.channel = 'CALL';
    this.summary = '';
    this.csatScore = '';
    this.csatComment = '';
    this.formError.set('');
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
