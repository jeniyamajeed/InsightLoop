import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuditEvent, Commitment } from '../../core/models';
import { AuthService } from '../../core/services/auth.service';

interface Detail { commitment: Commitment; audit: AuditEvent[]; }

@Component({
  selector: 'app-commitment-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div *ngIf="!hasReadAccess()" class="flex flex-col items-center justify-center py-24 text-center">
      <div class="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center text-rose-500 mb-3 border border-rose-100/50">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
        </svg>
      </div>
      <h2 class="text-sm font-semibold text-slate-800">Access Restricted</h2>
      <p class="text-xs text-slate-400 max-w-xs mt-1">You do not have the required permissions to view commitment details.</p>
    </div>

    <div *ngIf="hasReadAccess() && data() as d" class="max-w-3xl">
      <a routerLink="/commitments" class="text-xs text-indigo-600 hover:text-indigo-800 font-semibold">← Back to commitments</a>
      <div class="mt-4 flex items-baseline justify-between mb-6">
        <div>
          <div class="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">Commitment Detail</div>
          <h1 class="text-xl font-semibold text-slate-900">C-{{ 1000 + d.commitment.id }} · {{ d.commitment.customerName }}</h1>
        </div>
        <span class="pill" [ngClass]="badge(d.commitment.status)">{{ d.commitment.status.replace('_',' ') }}</span>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <div class="card p-5">
          <div class="text-[10px] tracking-widest text-slate-400 font-semibold uppercase">Type</div>
          <div class="text-lg font-semibold text-slate-800 mt-1">{{ d.commitment.commitmentType.replace('_',' ') }}</div>
          <p class="text-sm text-slate-500 mt-3">{{ d.commitment.description }}</p>
        </div>
        <div class="card p-5">
          <div class="text-[10px] tracking-widest text-slate-400 font-semibold uppercase">Timeline</div>
          <div class="mt-2 text-sm space-y-1 text-slate-600">
            <div><span class="text-slate-400 font-medium">Created:</span> {{ d.commitment.createdAt | date:'medium' }}</div>
            <div><span class="text-slate-400 font-medium">Due:</span> {{ d.commitment.dueAt | date:'medium' }}</div>
            <div *ngIf="d.commitment.validationSentAt"><span class="text-slate-400 font-medium">Validation sent:</span> {{ d.commitment.validationSentAt | date:'medium' }}</div>
            <div *ngIf="d.commitment.validationRespondedAt"><span class="text-slate-400 font-medium">Customer responded:</span> {{ d.commitment.validationRespondedAt | date:'medium' }}</div>
          </div>
        </div>
      </div>

      <div class="card p-6 mt-4">
        <div class="text-[10px] tracking-widest text-slate-400 font-semibold uppercase">Audit Timeline</div>
        <ol class="mt-4 space-y-4">
          <li *ngFor="let a of d.audit" class="flex gap-4">
            <div class="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-2 shrink-0"></div>
            <div>
              <div class="text-sm font-semibold text-slate-800">{{ a.event.replace('_',' ') }}</div>
              <div class="text-xs text-slate-400">{{ a.at | date:'medium' }}</div>
              <div class="text-sm text-slate-600 mt-0.5">{{ a.detail }}</div>
            </div>
          </li>
          <li *ngIf="!d.audit?.length" class="text-sm text-slate-400">No events yet.</li>
        </ol>
      </div>
    </div>
  `,
})
export class CommitmentDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  
  data = signal<Detail | null>(null);

  hasReadAccess(): boolean {
    return this.auth.hasPermission('commitment:read') || this.auth.hasRole('ADMIN');
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    this.http.get<Detail>(`/api/commitments/${id}`).subscribe(d => this.data.set(d));
  }

  badge(s: string): string {
    return s === 'ESCALATED' || s === 'UNRESOLVED' ? 'pill-warn'
         : s === 'RESOLVED' ? 'pill-ok' : 'pill-open';
  }
}
