import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { DashboardSummary } from '../../core/models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div>
      <div class="mb-4">
        <div class="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-0.5">Overview</div>
        <h1 class="text-lg font-semibold text-slate-900">Outcome Resolution Dashboard</h1>
        <p class="text-xs text-slate-500 mt-0.5">Track and verify promise resolutions directly with your customers.</p>
      </div>

      <div *ngIf="summary() as s">
        <!-- Primary metrics -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          <!-- CSAT -->
          <div class="card p-4">
            <div class="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Immediate Feedback CSAT</div>
            <div class="flex items-end justify-between">
              <div class="text-2xl font-bold text-slate-900 tracking-tight">{{ s.csatImmediate }}%</div>
              <div class="text-xs text-slate-400 mb-0.5">Post-conversation CSAT</div>
            </div>
            <div class="mt-2 h-1 bg-slate-100 rounded-full overflow-hidden">
              <div class="h-1 bg-indigo-500 rounded-full" [style.width.%]="s.csatImmediate"></div>
            </div>
          </div>

          <!-- Resolution -->
          <div class="card p-4">
            <div class="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Verified Resolutions</div>
            <div class="flex items-end justify-between">
              <div class="text-2xl font-bold text-slate-900 tracking-tight">{{ s.actualResolutionConfirmed }}%</div>
              <div class="text-xs text-slate-400 mb-0.5">Customer verified</div>
            </div>
            <div class="mt-2 h-1 bg-slate-100 rounded-full overflow-hidden">
              <div class="h-1 bg-indigo-500 rounded-full" [style.width.%]="s.actualResolutionConfirmed"></div>
            </div>
          </div>

          <!-- Gap -->
          <div class="card p-4">
            <div class="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Resolution Discrepancy</div>
            <div class="flex items-end justify-between">
              <div class="text-2xl font-bold tracking-tight"
                   [class]="s.resolutionGap > 0 ? 'text-amber-600' : 'text-green-600'">
                {{ s.resolutionGap }}%
              </div>
              <div class="text-xs mb-0.5"
                   [class]="s.resolutionGap > 0 ? 'text-amber-500' : 'text-green-500'">
                {{ s.resolutionGap > 0 ? 'Discrepancy' : 'Fully closed' }}
              </div>
            </div>
            <div class="mt-2 h-1 bg-slate-100 rounded-full overflow-hidden">
              <div class="h-1 rounded-full"
                   [class]="s.resolutionGap > 0 ? 'bg-amber-400' : 'bg-green-500'"
                   [style.width.%]="s.resolutionGap"></div>
            </div>
          </div>
        </div>

        <!-- Secondary metrics -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-3.5 mt-3.5">
          <div class="card p-4 flex items-center justify-between">
            <div>
              <div class="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Due Today</div>
              <div class="text-xl font-bold text-slate-900 mt-0.5">{{ s.commitmentsDueToday }}</div>
            </div>
            <a routerLink="/commitments" class="text-xs text-indigo-600 hover:text-indigo-800 font-medium">View queue →</a>
          </div>

          <div class="card p-4 flex items-center justify-between">
            <div>
              <div class="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Overdue Commitments</div>
              <div class="text-xl font-bold mt-0.5" [class]="s.overdueCommitments > 0 ? 'text-amber-600' : 'text-slate-900'">
                {{ s.overdueCommitments }}
              </div>
            </div>
            <a routerLink="/commitments" class="text-xs text-indigo-600 hover:text-indigo-800 font-medium">Resolve overdue →</a>
          </div>

          <div class="card p-4 flex items-center justify-between">
            <div>
              <div class="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Open Escalations</div>
              <div class="text-xl font-bold mt-0.5" [class]="s.openEscalations > 0 ? 'text-red-600' : 'text-slate-900'">
                {{ s.openEscalations }}
              </div>
            </div>
            <a routerLink="/escalations" class="text-xs text-indigo-600 hover:text-indigo-800 font-medium">Open escalations →</a>
          </div>
        </div>

        <!-- Methodology note -->
        <div class="card p-4 mt-3.5 border-l-2 border-indigo-500 rounded-l-none" style="border-radius: 0 8px 8px 0; border-left-width: 2px;">
          <div class="text-xs font-semibold text-slate-700 mb-0.5">About the Outcome Resolution Gap</div>
          <p class="text-xs text-slate-500 leading-relaxed">
            CSAT ratings capture the sentiment of a conversation, but not the delivery of agent promises. InsightLoop bridges this discrepancy by soliciting direct outcome feedback on the due date and auto-escalating unfulfilled commitments.
          </p>
        </div>
      </div>
    </div>
  `,
})
export class DashboardComponent implements OnInit {
  private http = inject(HttpClient);
  summary = signal<DashboardSummary | null>(null);

  ngOnInit(): void {
    this.http.get<DashboardSummary>('/api/analytics/summary').subscribe(s => this.summary.set(s));
  }
}
