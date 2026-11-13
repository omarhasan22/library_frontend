import { CanDeactivateFn } from '@angular/router';

/** Implemented by pages with forms: return true when leaving is safe (or after the user agrees). */
export interface HasUnsavedChanges {
  canLeave(): boolean | Promise<boolean>;
}

/** Asks before leaving a form with unsaved changes (the component shows the dialog). */
export const unsavedChangesGuard: CanDeactivateFn<HasUnsavedChanges> = component =>
  component?.canLeave ? component.canLeave() : true;
