import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { AuthUser } from '../../core/models';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-admin-users',
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
      <p class="text-xs text-slate-400 max-w-xs mt-1">You do not have the required permissions to manage users.</p>
    </div>

    <div *ngIf="hasReadAccess()">
      <div class="flex justify-between items-baseline mb-4">
        <div>
          <h1 class="text-xl font-semibold text-slate-900">Access & Roles</h1>
          <p class="text-xs text-slate-500 mt-0.5">Configure team accounts, access roles, and security permissions.</p>
        </div>
        <a *ngIf="hasWriteAccess()" href="" (click)="$event.preventDefault(); openCreateModal()" class="btn btn-primary">
          + Add User
        </a>
      </div>

      <div class="card lg:col-span-2 mt-4 overflow-hidden">
        <div class="overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Email Address</th>
                <th>Group Roles</th>
                <th>Permissions List</th>
                <th class="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let u of pagedUsers(); let idx = index">
                <ng-container *ngIf="editingId !== u.id; else editRow">
                  <td class="text-xs font-mono text-slate-400">{{ idx + 1 + (currentPage() - 1) * pageSize() }}</td>
                  <td class="font-semibold text-slate-800">{{ u.email }}</td>
                  <td>
                    <span *ngFor="let r of u.roles" class="pill pill-neutral mr-1">{{ r }}</span>
                  </td>
                  <td class="text-xs text-slate-500">{{ u.permissions.join(', ') }}</td>
                  <td class="text-right">
                    <div class="inline-flex items-center justify-end gap-2">
                      <button (click)="startEdit(u)" title="Edit" class="p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-50 transition-all duration-200">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                      </button>
                      <button (click)="remove(u)" title="Delete" class="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-all duration-200">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                      </button>
                    </div>
                  </td>
                </ng-container>
  
                <ng-template #editRow>
                  <td class="text-xs font-mono text-slate-400">{{ idx + 1 + (currentPage() - 1) * pageSize() }}</td>
                  <td><input [(ngModel)]="editEmail" class="filter-select" /></td>
                  <td class="space-y-1 py-2">
                    <div class="flex flex-col gap-1">
                      <label class="flex items-center gap-1.5 font-normal text-xs normal-case tracking-normal cursor-pointer select-none">
                        <input type="checkbox" (change)="toggleEditRole('AGENT')" [checked]="editRoles().includes('AGENT')" style="width: auto; scale: 0.85;" /> AGENT
                      </label>
                      <label class="flex items-center gap-1.5 font-normal text-xs normal-case tracking-normal cursor-pointer select-none">
                        <input type="checkbox" (change)="toggleEditRole('MANAGER')" [checked]="editRoles().includes('MANAGER')" style="width: auto; scale: 0.85;" /> MANAGER
                      </label>
                      <label class="flex items-center gap-1.5 font-normal text-xs normal-case tracking-normal cursor-pointer select-none">
                        <input type="checkbox" (change)="toggleEditRole('ADMIN')" [checked]="editRoles().includes('ADMIN')" style="width: auto; scale: 0.85;" /> ADMIN
                      </label>
                    </div>
                  </td>
                  <td class="space-y-1 py-2">
                    <div class="flex flex-col gap-1 max-h-24 overflow-y-auto pr-1">
                      <label *ngFor="let p of availablePermsForEdit()" class="flex items-center gap-1.5 font-normal text-[10px] normal-case tracking-normal cursor-pointer select-none">
                        <input type="checkbox" (change)="toggleEditPermission(p)" [checked]="editPermissions.includes(p)" style="width: auto; scale: 0.8;" /> {{ p }}
                      </label>
                    </div>
                  </td>
                  <td class="text-right">
                    <div class="inline-flex items-center justify-end gap-2">
                      <button (click)="saveEdit(u)" title="Save" class="p-1.5 rounded-lg text-green-600 hover:bg-green-50 transition-all duration-200">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
                      </button>
                      <button (click)="cancelEdit()" title="Cancel" class="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 transition-all duration-200">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                      </button>
                    </div>
                  </td>
                </ng-template>
              </tr>
              <tr *ngIf="users().length === 0">
                <td colspan="5" class="text-center py-6 text-slate-400">No users found.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Pagination Controls -->
      <div *ngIf="users().length > 0" class="flex justify-between items-center mt-3 px-1">
        <div class="text-xs text-slate-500">
          Showing {{ showingFrom() }} to {{ showingTo() }} of {{ users().length }} entries
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

      <div *ngIf="showCreateModal"
           class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm"
           (click)="closeCreateModal()">
        <div class="card p-5 w-full max-w-sm mx-4 bg-white" (click)="$event.stopPropagation()">
          <div class="flex items-center justify-between pb-3 border-b border-slate-100">
            <div class="text-sm font-semibold text-slate-900">Create User Account</div>
            <button (click)="closeCreateModal()" class="text-slate-400 hover:text-slate-655">✕</button>
          </div>
          <div class="mt-4 space-y-3">
            <div>
              <label>Email</label>
              <input [(ngModel)]="newEmail" type="email" />
            </div>
            <div>
              <label>Password</label>
              <input [(ngModel)]="newPassword" type="password" />
            </div>
            <div>
              <label>Roles</label>
              <div class="space-y-2 mt-1.5">
                <label class="flex items-center gap-2 font-normal text-xs normal-case tracking-normal cursor-pointer select-none text-slate-600">
                  <input type="checkbox" (change)="toggleNewRole('AGENT')" [checked]="newRoles().includes('AGENT')" style="width: auto;" /> AGENT
                </label>
                <label class="flex items-center gap-2 font-normal text-xs normal-case tracking-normal cursor-pointer select-none text-slate-600">
                  <input type="checkbox" (change)="toggleNewRole('MANAGER')" [checked]="newRoles().includes('MANAGER')" style="width: auto;" /> MANAGER
                </label>
                <label class="flex items-center gap-2 font-normal text-xs normal-case tracking-normal cursor-pointer select-none text-slate-600">
                  <input type="checkbox" (change)="toggleNewRole('ADMIN')" [checked]="newRoles().includes('ADMIN')" style="width: auto;" /> ADMIN
                </label>
              </div>
            </div>
            <div>
              <label>Custom Permissions</label>
              <div class="space-y-1.5 mt-1.5 max-h-24 overflow-y-auto border border-slate-100 p-2 rounded-md">
                <label *ngFor="let p of availablePermsForNew()" class="flex items-center gap-2 font-normal text-xs normal-case tracking-normal cursor-pointer select-none text-slate-600">
                  <input type="checkbox" (change)="toggleNewPermission(p)" [checked]="newPermissions.includes(p)" style="width: auto;" /> {{ p }}
                </label>
              </div>
            </div>
            <button (click)="create()" class="btn btn-primary w-full mt-4">Create Account</button>
            <div *ngIf="msg" class="text-xs text-rose-600 mt-2">{{ msg }}</div>
          </div>
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
              <div class="font-bold text-slate-900 text-sm">Delete User Account</div>
              <div class="text-xs text-slate-400 mt-0.5">This action cannot be undone</div>
            </div>
          </div>
          <p class="text-sm text-slate-500 mb-5">Are you sure you want to delete user account <span class="font-semibold text-slate-950">{{ deleteTarget!.email }}</span>?</p>
          <div class="flex justify-end gap-2">
            <button (click)="deleteTarget = null" class="btn btn-ghost text-sm">Cancel</button>
            <button (click)="confirmDelete()" class="btn text-sm bg-rose-600 hover:bg-rose-700 text-white border-0">Delete</button>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class AdminUsersComponent implements OnInit {
  private http = inject(HttpClient);
  auth = inject(AuthService);
  users = signal<AuthUser[]>([]);
  allPermissions = signal<string[]>([]);

  // Permissions available for a given set of roles — user:read/write are admin-only
  private filterPerms(perms: string[], forRoles: string[]): string[] {
    const isAdmin = forRoles.includes('ADMIN');
    return isAdmin ? perms : perms.filter(p => p !== 'user:read' && p !== 'user:write');
  }

  availablePermsForEdit = computed(() =>
    this.filterPerms(this.allPermissions(), this.editRoles())
  );

  availablePermsForNew = computed(() =>
    this.filterPerms(this.allPermissions(), this.newRoles())
  );

  hasReadAccess(): boolean {
    return this.auth.hasPermission('user:read') || this.auth.hasRole('ADMIN');
  }

  hasWriteAccess(): boolean {
    return this.auth.hasPermission('user:write') || this.auth.hasRole('ADMIN');
  }

  newEmail = ''; newPassword = ''; newPermissions: string[] = []; msg = '';
  newRoles = signal<string[]>(['AGENT']);
  assignUserId: number | null = null; assignRole = 'AGENT';
  editingId: number | null = null;
  editEmail = '';
  editRoles = signal<string[]>([]);
  editPermissions: string[] = [];

  // --- pagination state ---
  currentPage = signal(1);
  pageSize = signal(5);

  totalPages = computed(() =>
    Math.max(1, Math.ceil(this.users().length / this.pageSize()))
  );

  pagedUsers = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize();
    return this.users().slice(start, start + this.pageSize());
  });

  showingFrom = computed(() => {
    if (this.users().length === 0) return 0;
    return (this.currentPage() - 1) * this.pageSize() + 1;
  });

  showingTo = computed(() => {
    return Math.min(this.currentPage() * this.pageSize(), this.users().length);
  });

  nextPage(): void {
    if (this.currentPage() < this.totalPages()) this.currentPage.set(this.currentPage() + 1);
  }

  prevPage(): void {
    if (this.currentPage() > 1) this.currentPage.set(this.currentPage() - 1);
  }

  toggleNewRole(role: string): void {
    const curr = this.newRoles();
    this.newRoles.set(curr.includes(role) ? curr.filter(r => r !== role) : [...curr, role]);
  }

  toggleEditRole(role: string): void {
    const curr = this.editRoles();
    this.editRoles.set(curr.includes(role) ? curr.filter(r => r !== role) : [...curr, role]);
  }

  toggleNewPermission(perm: string): void {
    if (this.newPermissions.includes(perm)) {
      this.newPermissions = this.newPermissions.filter(p => p !== perm);
    } else {
      this.newPermissions.push(perm);
    }
  }

  toggleEditPermission(perm: string): void {
    if (this.editPermissions.includes(perm)) {
      this.editPermissions = this.editPermissions.filter(p => p !== perm);
    } else {
      this.editPermissions.push(perm);
    }
  }

  startEdit(u: AuthUser): void {
    this.editingId = u.id;
    this.editEmail = u.email;
    this.editRoles.set([...(u.roles || [])]);
    this.editPermissions = [...(u.permissions || [])];
  }

  cancelEdit(): void {
    this.editingId = null;
  }

  saveEdit(u: AuthUser): void {
    this.http.put(`/api/users/${u.id}`, {
      email: this.editEmail,
      roles: this.editRoles(),
      permissions: this.editPermissions
    }).subscribe({
      next: () => { this.editingId = null; this.load(); },
      error: (e) => alert(e?.error?.error ?? 'Update failed'),
    });
  }

  ngOnInit(): void { this.load(); }

  load(): void {
    this.http.get<AuthUser[]>('/api/users').subscribe(x => {
      this.users.set(x.sort((a, b) => a.id - b.id));
      if (this.currentPage() > this.totalPages()) {
        this.currentPage.set(this.totalPages());
      }
    });
    this.http.get<string[]>('/api/permissions').subscribe(perms => {
      this.allPermissions.set(perms);
    });
  }

  create(): void {
    this.msg = '';
    this.http.post<AuthUser>('/api/users', {
      email: this.newEmail,
      password: this.newPassword,
      roles: this.newRoles(),
      permissions: this.newPermissions
    }).subscribe({
      next: () => {
        this.newEmail = ''; this.newPassword = ''; this.newRoles.set(['AGENT']); this.newPermissions = [];
        this.load();
        this.showCreateModal = false;
      },
      error: (e) => this.msg = e?.error?.error ?? 'Create failed',
    });
  }

  assign(): void {
    if (!this.assignUserId) return;
    this.http.post('/api/roles/assign', { userId: this.assignUserId, role: this.assignRole })
      .subscribe(() => this.load());
  }

  deleteTarget: AuthUser | null = null;

  remove(u: AuthUser): void {
    this.deleteTarget = u;
  }

  confirmDelete(): void {
    if (!this.deleteTarget) return;
    this.http.delete(`/api/users/${this.deleteTarget.id}`).subscribe({
      next: () => { this.deleteTarget = null; this.load(); },
      error: (e) => { this.deleteTarget = null; alert(e?.error?.error ?? 'Delete failed'); }
    });
  }

  showCreateModal = false;

  openCreateModal() {
    this.showCreateModal = true;
  }

  closeCreateModal() {
    this.showCreateModal = false;
    this.msg = '';
    this.newEmail = '';
    this.newPassword = '';
    this.newRoles.set(['AGENT']);
    this.newPermissions = [];
  }
}