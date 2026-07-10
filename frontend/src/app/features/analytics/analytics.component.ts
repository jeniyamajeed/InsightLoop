import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Commitment, DashboardSummary } from '../../core/models';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="!hasReadAccess()" class="flex flex-col items-center justify-center py-24 text-center">
      <div class="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center text-rose-500 mb-3 border border-rose-100/50">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
        </svg>
      </div>
      <h2 class="text-sm font-semibold text-slate-800">Access Restricted</h2>
      <p class="text-xs text-slate-400 max-w-xs mt-1">You do not have the required permissions to view analytics.</p>
    </div>

    <div *ngIf="hasReadAccess()">
      <div class="mb-4">
        <div class="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">Performance Metrics</div>
        <h1 class="text-xl font-semibold text-slate-900">Resolution Gap Analytics</h1>
        <p class="text-xs text-slate-500 mt-0.5">Performance metrics analyzing the resolution gap between CSAT and verified outcomes.</p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        <!-- Immediate vs Actual Card -->
        <div class="card">
          <div class="flex items-center gap-2 pb-3 border-b border-slate-100">
            <div class="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 00-2-2zm6 0v-4a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div class="text-sm font-semibold text-slate-800">Immediate Sentiment vs. Actual Resolution</div>
          </div>
          
          <div class="mt-4 space-y-4">
            <div>
              <div class="flex justify-between text-xs text-slate-500 font-medium mb-1.5">
                <span>Immediate Satisfaction (CSAT)</span>
                <span class="text-indigo-600 font-semibold">{{ summary()?.csatImmediate }}%</span>
              </div>
              <div class="h-1 bg-slate-100 rounded-full overflow-hidden">
                <div class="h-1 bg-indigo-500 rounded-full transition-all duration-500" [style.width.%]="summary()?.csatImmediate ?? 0"></div>
              </div>
            </div>
            
            <div>
              <div class="flex justify-between text-xs text-slate-500 font-medium mb-1.5">
                <span>Verified Resolution Rate</span>
                <span class="text-slate-900 font-semibold">{{ summary()?.actualResolutionConfirmed }}%</span>
              </div>
              <div class="h-1 bg-slate-100 rounded-full overflow-hidden">
                <div class="h-1 bg-slate-700 rounded-full transition-all duration-500" [style.width.%]="summary()?.actualResolutionConfirmed ?? 0"></div>
              </div>
            </div>
            
            <div>
              <div class="flex justify-between text-xs text-slate-500 font-medium mb-1.5">
                <span>{{ (summary()?.resolutionGap ?? 0) > 0 ? 'Resolution Discrepancy (Unresolved Promises)' : 'Resolution Gap' }}</span>
                <span [class]="(summary()?.resolutionGap ?? 0) > 0 ? 'text-amber-600 font-semibold' : 'text-green-600 font-semibold'">{{ summary()?.resolutionGap }}%</span>
              </div>
              <div class="h-1 bg-slate-100 rounded-full overflow-hidden">
                <div class="h-1 rounded-full transition-all duration-500"
                     [class]="(summary()?.resolutionGap ?? 0) > 0 ? 'bg-amber-400' : 'bg-green-500'"
                     [style.width.%]="summary()?.resolutionGap ?? 0"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Commitments by Type Card -->
        <div class="card">
          <div class="flex items-center gap-2 pb-3 border-b border-slate-100">
            <div class="p-1.5 rounded-lg bg-slate-100 text-slate-700">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <div class="text-sm font-semibold text-slate-800">Commitments by Type</div>
          </div>
          
          <div class="mt-4 space-y-3">
            <div *ngFor="let row of byType()" class="flex items-center gap-4">
              <div class="w-32 text-xs font-semibold text-slate-500 truncate uppercase tracking-wider">{{ row.type.replace('_',' ') }}</div>
              <div class="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden">
                <div class="h-1 bg-indigo-500 rounded-full" [style.width.%]="row.pct"></div>
              </div>
              <div class="w-8 text-xs font-semibold text-slate-700 text-right">{{ row.count }}</div>
            </div>
            <div *ngIf="byType().length === 0" class="text-center text-xs text-slate-400 py-8">
              No commitment metrics recorded.
            </div>
          </div>
        </div>
      </div>

      <!-- Status Breakdown Section -->
      <div class="card mt-4">
        <div class="flex items-center gap-2 pb-3 border-b border-slate-100">
          <div class="p-1.5 rounded-lg bg-slate-100 text-slate-700">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm0 8a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1v-2zm0 8a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1v-2z" />
            </svg>
          </div>
          <div class="text-sm font-semibold text-slate-800">Commitment Lifecycle Breakdown</div>
        </div>
        
        <div class="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4">
          <div *ngFor="let s of statusRows()" class="p-3 rounded-lg border border-slate-100 bg-slate-50/50">
            <div class="text-2xl font-bold text-slate-900 tracking-tight">{{ s.count }}</div>
            <div class="text-[9px] tracking-wider font-semibold uppercase text-slate-400 mt-1">{{ statusLabel(s.status) }}</div>
          </div>
          <div *ngIf="statusRows().length === 0" class="col-span-full text-center text-xs text-slate-400 py-6">
            No active lifecycle statuses.
          </div>
        </div>
      </div>
    </div>
  `,
})
export class AnalyticsComponent implements OnInit {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  
  summary = signal<DashboardSummary | null>(null);
  byType = signal<{ type: string; count: number; pct: number }[]>([]);
  statusRows = signal<{ status: string; count: number }[]>([]);

  hasReadAccess(): boolean {
    return this.auth.hasPermission('analytics:read') || this.auth.hasRole('ADMIN');
  }

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

  ngOnInit(): void {
    if (this.hasReadAccess()) {
      this.load();
    }
  }

  load(): void {
    this.http.get<DashboardSummary>('/api/analytics/summary').subscribe(s => this.summary.set(s));
    this.http.get<Commitment[]>('/api/commitments').subscribe(list => {
      const types: Record<string, number> = {};
      const statuses: Record<string, number> = {};
      list.forEach(c => {
        types[c.commitmentType] = (types[c.commitmentType] || 0) + 1;
        statuses[c.status] = (statuses[c.status] || 0) + 1;
      });
      const max = Math.max(...Object.values(types), 1);
      this.byType.set(Object.entries(types).map(([type, count]) => ({ type, count, pct: (count / max) * 100 })));
      
      const order = ['PENDING', 'VALIDATION_SENT', 'RESOLVED', 'UNRESOLVED', 'ESCALATED'];
      const sortedStatuses = Object.entries(statuses).sort((a, b) => {
        return order.indexOf(a[0]) - order.indexOf(b[0]);
      });
      this.statusRows.set(sortedStatuses.map(([status, count]) => ({ status, count })));
    });
  }
}
