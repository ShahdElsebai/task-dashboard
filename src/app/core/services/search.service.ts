import { Service, signal, WritableSignal } from '@angular/core';

/**
 * The global search text typed in the header.
 *
 * Lives in core so the header (layout) doesn't depend on a feature; features
 * that support search read `query` and apply it to their own data.
 */
@Service()
export class SearchService {
  readonly query: WritableSignal<string> = signal<string>('');

  set(query: string): void {
    this.query.set(query);
  }
}
