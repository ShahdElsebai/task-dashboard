import { Service, signal, WritableSignal } from '@angular/core';

@Service()
export class SearchService {
  readonly query: WritableSignal<string> = signal<string>('');

  set(query: string): void {
    this.query.set(query);
  }
}
