import { Directive, Input, TemplateRef, ViewContainerRef, inject } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';

/** Structural directive: renders content only when user has the given permission. */
@Directive({ selector: '[hasPermission]', standalone: true })
export class HasPermissionDirective {
  private auth = inject(AuthService);
  private tpl = inject(TemplateRef<unknown>);
  private vcr = inject(ViewContainerRef);
  private shown = false;

  @Input() set hasPermission(perm: string) {
    const allow = this.auth.hasPermission(perm) || this.auth.hasRole('ADMIN');
    if (allow && !this.shown) { this.vcr.createEmbeddedView(this.tpl); this.shown = true; }
    else if (!allow && this.shown) { this.vcr.clear(); this.shown = false; }
  }
}
