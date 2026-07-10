import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-create-commitment',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div *ngIf="!hasWriteAccess()" class="flex flex-col items-center justify-center py-24 text-center">
      <div class="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center text-rose-500 mb-3 border border-rose-100/50">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
        </svg>
      </div>
      <h2 class="text-sm font-semibold text-slate-800">Access Restricted</h2>
      <p class="text-xs text-slate-400 max-w-xs mt-1">You do not have the required permissions to create commitments.</p>
    </div>

    <div *ngIf="hasWriteAccess()" class="max-w-xl">
      <div class="mb-6">
        <div class="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">New Commitment</div>
        <h1 class="text-xl font-semibold text-slate-900">Record a Customer Promise</h1>
        <p class="text-sm text-slate-500 mt-0.5">Commitment targets will schedule validation checkouts.</p>
      </div>

      <form (ngSubmit)="submit()" class="card p-6 mt-6 space-y-4">
        <div><label>Customer name</label><input name="cn" [(ngModel)]="customerName" required /></div>
        <div><label>Commitment type</label>
          <select name="ct" [(ngModel)]="commitmentType" required>
            <option value="REFUND">Refund</option>
            <option value="CARD_REPLACEMENT">Card replacement</option>
            <option value="ACCOUNT_CORRECTION">Account correction</option>
            <option value="TECHNICIAN_VISIT">Technician visit</option>
            <option value="SERVICE_ACTIVATION">Service activation</option>
            <option value="CALL_BACK">Call back</option>
            <option value="FOLLOW_UP">Follow up</option>
            <option value="RESOLUTION">Resolution</option>
          </select>
        </div>
        <div><label>Description</label><textarea name="d" [(ngModel)]="description" rows="3" required></textarea></div>
        <div><label>Due at</label><input name="due" type="datetime-local" [(ngModel)]="dueAt" required /></div>
        <div *ngIf="error" class="text-sm text-rose-600">{{ error }}</div>
        <div class="flex gap-2">
          <button type="submit" class="btn btn-primary" [disabled]="loading">{{ loading ? 'Saving…' : 'Create commitment' }}</button>
          <button type="button" (click)="cancel()" class="btn btn-ghost">Cancel</button>
        </div>
      </form>
    </div>
  `,
})
export class CreateCommitmentComponent {
  customerName = '';
  commitmentType = 'REFUND';
  description = '';
  dueAt = this.tomorrow();
  loading = false;
  error = '';

  private http = inject(HttpClient);
  private router = inject(Router);
  private auth = inject(AuthService);

  hasWriteAccess(): boolean {
    return this.auth.hasPermission('commitment:write') || this.auth.hasRole('ADMIN');
  }

  submit(): void {
    this.loading = true;
    this.http.post('/api/commitments', {
      customerName: this.customerName,
      commitmentType: this.commitmentType,
      description: this.description,
      dueAt: new Date(this.dueAt).toISOString(),
    }).subscribe({
      next: () => this.router.navigate(['/commitments']),
      error: (e) => { this.loading = false; this.error = e?.error?.error ?? 'Failed to create'; },
    });
  }

  cancel(): void { this.router.navigate(['/commitments']); }

  private tomorrow(): string {
    const d = new Date(Date.now() + 24 * 60 * 60 * 1000);
    return d.toISOString().slice(0, 16);
  }
}
