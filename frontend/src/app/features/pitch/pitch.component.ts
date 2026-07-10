import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-pitch',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="min-h-screen bg-slate-50/50 text-slate-800 flex flex-col font-sans">
      <!-- Sticky Navigation Header -->
      <header class="sticky top-0 z-50 bg-white/90 backdrop-blur-md text-slate-800 border-b border-slate-200/80 px-6 py-2">
        <div class="max-w-5xl mx-auto flex items-center justify-between">
          <div class="flex items-center gap-2">
            <div class="p-1 bg-indigo-50 text-indigo-600 rounded">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
              </svg>
            </div>
            <span class="text-sm font-semibold tracking-tight text-slate-900">InsightLoop</span>
          </div>

          <!-- Middle Anchors -->
          <nav class="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-500">
            <a href="#features" class="hover:text-slate-900 transition-colors">Features</a>
            <a href="#gap" class="hover:text-slate-900 transition-colors">The Resolution Gap</a>
            <a href="#architecture" class="hover:text-slate-900 transition-colors">Architecture</a>
          </nav>

          <!-- Action Buttons -->
          <div class="flex items-center gap-3">
            <a routerLink="/login" class="text-xs font-semibold px-3 py-1.5 border border-slate-200 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all duration-200">
              Sign In
            </a>
            <a routerLink="/signup" class="text-xs font-semibold px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all duration-200 shadow-sm">
              Get Started
            </a>
          </div>
        </div>
      </header>

      <!-- Hero Section -->
      <section class="bg-white border-b border-slate-200/60 py-10 px-6 relative overflow-hidden">
        <div class="max-w-4xl mx-auto text-center relative z-10">
          <p class="text-xs tracking-widest text-indigo-600 font-semibold uppercase mb-2">Outcome Validation Engine</p>
          <h1 class="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 leading-tight">
            Verify actual resolution, <br />
            not just conversation quality.
          </h1>
          <p class="mt-3 text-sm md:text-base text-slate-500 max-w-2xl mx-auto leading-relaxed">
            InsightLoop closes the loop on customer commitments by automating delayed customer validation surveys, matching immediate CSAT sentiment with the absolute truth.
          </p>
          <div class="mt-6 flex justify-center gap-3">
            <a routerLink="/signup" class="btn btn-primary px-5 py-2 text-xs font-semibold">
              Start Free Trial
            </a>
            <a href="#features" class="btn btn-ghost text-slate-600 px-5 py-2 text-xs font-semibold">
              Learn More
            </a>
          </div>
        </div>
      </section>

      <!-- Features Details Grid -->
      <section id="features" class="py-8 px-6 max-w-5xl mx-auto w-full">
        <div class="text-center mb-6">
          <p class="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">Details & Capabilities</p>
          <h2 class="text-xl font-bold text-slate-900 tracking-tight">Operational Capabilities</h2>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="card bg-white">
            <div class="p-2 bg-indigo-50 text-indigo-600 rounded-lg w-fit">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 class="text-sm font-semibold text-slate-900 mt-3">1. Support Interactions</h3>
            <p class="text-xs text-slate-500 mt-1 leading-relaxed">
              Capture immediate customer conversations, channels (call, email, chat), and post-interaction CSAT ratings in a unified operator log.
            </p>
          </div>

          <div class="card bg-white">
            <div class="p-2 bg-indigo-50 text-indigo-600 rounded-lg w-fit">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <h3 class="text-sm font-semibold text-slate-900 mt-3">2. Commitment Tracking</h3>
            <p class="text-xs text-slate-500 mt-1 leading-relaxed">
              Log specific agent promises (refunds, replacements, activations) with explicit due dates, auto-scheduling validation outreach.
            </p>
          </div>

          <div class="card bg-white">
            <div class="p-2 bg-rose-50 text-rose-600 rounded-lg w-fit">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 class="text-sm font-semibold text-slate-900 mt-3">3. Automated Escalation</h3>
            <p class="text-xs text-slate-500 mt-1 leading-relaxed">
              If the customer reports that the promise was unresolved, a high-priority P1 escalation ticket is instantly routed to managers.
            </p>
          </div>
        </div>
      </section>

      <!-- The Resolution Gap Stats Widget -->
      <section id="gap" class="py-8 bg-white border-y border-slate-200/60 px-6">
        <div class="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div>
            <p class="text-xs tracking-widest text-indigo-600 font-semibold uppercase mb-1">The Customer Experience Blindspot</p>
            <h2 class="text-xl font-bold text-slate-900 tracking-tight">Understanding the Resolution Gap</h2>
            <p class="mt-3 text-xs text-slate-500 leading-relaxed">
              Most contact centers measure quality based on how the agent sounded during the call. They do not verify whether the refund card was actually dispatched or if the international UPI block was lifted.
            </p>
            <p class="mt-2 text-xs text-slate-500 leading-relaxed">
              InsightLoop maps post-interaction feedback directly to actual resolution states, exposing the silent failures hiding behind positive CSAT scores.
            </p>
          </div>

          <div class="grid grid-cols-1 gap-3">
            <div class="p-3.5 bg-slate-50 border border-slate-100 rounded-lg">
              <div class="flex justify-between text-xs text-slate-500 font-medium mb-1.5">
                <span>Immediate CSAT Rating</span>
                <span class="text-indigo-600 font-semibold">84%</span>
              </div>
              <div class="h-1 bg-slate-200/60 rounded-full overflow-hidden">
                <div class="h-1 bg-indigo-500 rounded-full" style="width: 84%"></div>
              </div>
            </div>

            <div class="p-3.5 bg-slate-50 border border-slate-100 rounded-lg">
              <div class="flex justify-between text-xs text-slate-500 font-medium mb-1.5">
                <span>Confirmed True Outcomes</span>
                <span class="text-slate-800 font-semibold">61%</span>
              </div>
              <div class="h-1 bg-slate-200/60 rounded-full overflow-hidden">
                <div class="h-1 bg-slate-700 rounded-full" style="width: 61%"></div>
              </div>
            </div>

            <div class="p-3.5 bg-amber-50/50 border border-amber-100 rounded-lg">
              <div class="flex justify-between text-xs text-amber-700 font-medium mb-1.5">
                <span>The Resolution Gap (Failure Index)</span>
                <span class="text-amber-600 font-semibold">23%</span>
              </div>
              <div class="h-1 bg-amber-100 rounded-full overflow-hidden">
                <div class="h-1 bg-amber-500 rounded-full" style="width: 23%"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Technical Architecture Tree -->
      <section id="architecture" class="py-8 px-6 max-w-5xl mx-auto w-full">
        <div class="text-center mb-6">
          <p class="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">Modern Microservices Stack</p>
          <h2 class="text-xl font-bold text-slate-900 tracking-tight">Platform Architecture</h2>
        </div>

        <div class="flex flex-col md:flex-row items-center justify-center gap-4">
          <div class="card bg-white p-4 w-full md:w-48 text-center border-slate-200">
            <div class="text-[9px] font-bold text-indigo-600 uppercase tracking-wider">Frontend Layer</div>
            <div class="text-xs font-semibold text-slate-800 mt-1">Angular Web Console</div>
            <div class="text-[9px] text-slate-400 mt-0.5">Tailwind CSS · Signals</div>
          </div>

          <div class="text-lg text-slate-300 hidden md:block">→</div>

          <div class="p-4 bg-slate-900 text-white rounded-lg shadow-sm w-full md:w-48 text-center">
            <div class="text-[9px] font-bold text-indigo-400 uppercase tracking-wider">Gateway Routing</div>
            <div class="text-xs font-semibold text-white mt-1">Spring Cloud Gateway</div>
            <div class="text-[9px] text-slate-400 mt-0.5">JWT Security Auth</div>
          </div>

          <div class="text-lg text-slate-300 hidden md:block">→</div>

          <div class="grid grid-cols-2 gap-2.5 w-full md:w-72">
            <div class="p-2.5 bg-white border border-slate-200 rounded-lg text-center shadow-sm">
              <div class="text-[10px] font-semibold text-slate-800">Auth Service</div>
              <div class="text-[8px] text-slate-400 mt-0.5">Spring Boot · JPA</div>
            </div>
            <div class="p-2.5 bg-white border border-slate-200 rounded-lg text-center shadow-sm">
              <div class="text-[10px] font-semibold text-slate-800">Feedback Service</div>
              <div class="text-[8px] text-slate-400 mt-0.5">Spring Boot · JPA</div>
            </div>
            <div class="p-2.5 bg-white border border-slate-200 rounded-lg text-center shadow-sm">
              <div class="text-[10px] font-semibold text-slate-800">Validation Service</div>
              <div class="text-[8px] text-slate-400 mt-0.5">Spring Boot · WebClient</div>
            </div>
            <div class="p-2.5 bg-white border border-slate-200 rounded-lg text-center shadow-sm">
              <div class="text-[10px] font-semibold text-slate-800">Escalation Service</div>
              <div class="text-[8px] text-slate-400 mt-0.5">Spring Boot · MySQL</div>
            </div>
          </div>
        </div>
      </section>

      <!-- Onboarding CTA Footer -->
      <footer class="bg-slate-900 text-white py-8 px-6 text-center">
        <div class="max-w-2xl mx-auto">
          <h2 class="text-xl font-bold tracking-tight">Ready to bridge your CX resolution gap?</h2>
          <p class="mt-1 text-xs text-slate-400">Access the operator workspace and configure validations.</p>
          <div class="mt-4 flex justify-center">
            <a routerLink="/login" class="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold py-2 px-5 rounded-lg transition-colors">
              Access Platform Dashboard
            </a>
          </div>
          <div class="mt-6 text-[8px] text-slate-500 font-semibold tracking-widest uppercase">
            InsightLoop CX © 2026. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  `,
})
export class PitchComponent {}
