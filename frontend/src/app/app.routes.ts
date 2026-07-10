import { Routes } from '@angular/router';
import { authGuard, roleGuard } from './core/guards/auth.guard';
import { ShellComponent } from './shared/layout/shell.component';

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./features/login/login.component').then(m => m.LoginComponent) },
  { path: 'pitch', loadComponent: () => import('./features/pitch/pitch.component').then(m => m.PitchComponent) },
  { path: 'signup', loadComponent: () => import('./features/auth/signup.component').then(m => m.SignupComponent), },

  {
    path: '',
    component: ShellComponent,
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      { path: 'dashboard',    loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent) },
      { path: 'interactions', loadComponent: () => import('./features/interactions/interactions.component').then(m => m.InteractionsComponent) },
      { path: 'commitments',  loadComponent: () => import('./features/commitments/commitments.component').then(m => m.CommitmentsComponent) },
      { path: 'commitments/new', loadComponent: () => import('./features/commitments/create-commitment.component').then(m => m.CreateCommitmentComponent) },
      { path: 'commitments/:id', loadComponent: () => import('./features/commitments/commitment-detail.component').then(m => m.CommitmentDetailComponent) },
      { path: 'validation',   loadComponent: () => import('./features/validation/validation.component').then(m => m.ValidationComponent) },
      { path: 'escalations',  loadComponent: () => import('./features/escalations/escalations.component').then(m => m.EscalationsComponent) },
      { path: 'analytics',    loadComponent: () => import('./features/analytics/analytics.component').then(m => m.AnalyticsComponent) },
      {
        path: 'admin/users',
        canActivate: [roleGuard(['ADMIN'])],
        loadComponent: () => import('./features/admin-users/admin-users.component').then(m => m.AdminUsersComponent),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
