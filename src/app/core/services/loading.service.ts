import { type Signal, Service, type WritableSignal, computed, signal } from '@angular/core';

@Service()
export class LoadingService {
  private readonly pending: WritableSignal<number> = signal<number>(0);

  readonly isLoading: Signal<boolean> = computed(() => this.pending() > 0);

  start(): void {
    this.pending.update((count: number) => count + 1);
  }

  stop(): void {
    this.pending.update((count: number) => Math.max(0, count - 1));
  }
}
