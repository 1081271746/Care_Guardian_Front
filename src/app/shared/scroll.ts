/**
 * Brings a just-opened form into view (after Angular renders it) and focuses
 * its first field, so editing a row far down the list is obvious on phones.
 */
export function revealForm(selector = '.form-card'): void {
  if (typeof window === 'undefined') return;
  window.setTimeout(() => {
    const form = document.querySelector<HTMLElement>(selector);
    if (!form) return;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    form.scrollIntoView?.({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    form.querySelector<HTMLElement>('input, select, textarea')?.focus({ preventScroll: true });
  });
}
