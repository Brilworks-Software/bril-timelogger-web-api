// Loading manager to track loading state outside of React context
// This allows the API service to manage loading state

type LoadingCallback = (loading: boolean) => void;

class LoadingManager {
  private callbacks: Set<LoadingCallback> = new Set();
  private requestCount: number = 0;
  private delayMs: number = 500; // Default delay in milliseconds

  setDelay(ms: number) {
    this.delayMs = ms;
  }

  getDelay() {
    return this.delayMs;
  }

  subscribe(callback: LoadingCallback) {
    this.callbacks.add(callback);
    return () => {
      this.callbacks.delete(callback);
    };
  }

  private notify(loading: boolean) {
    this.callbacks.forEach((callback) => callback(loading));
  }

  startRequest() {
    this.requestCount++;
    if (this.requestCount === 1) {
      this.notify(true);
    }
  }

  endRequest() {
    this.requestCount = Math.max(0, this.requestCount - 1);
    if (this.requestCount === 0) {
      this.notify(false);
    }
  }

  getRequestCount() {
    return this.requestCount;
  }
}

export const loadingManager = new LoadingManager();

