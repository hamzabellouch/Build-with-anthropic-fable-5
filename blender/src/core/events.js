// Tiny synchronous event emitter used as the app-wide message bus.
export class Emitter {
  constructor() {
    this._map = new Map();
  }

  on(event, fn) {
    if (!this._map.has(event)) this._map.set(event, new Set());
    this._map.get(event).add(fn);
    return () => this.off(event, fn);
  }

  off(event, fn) {
    this._map.get(event)?.delete(fn);
  }

  emit(event, ...args) {
    const set = this._map.get(event);
    if (!set) return;
    for (const fn of [...set]) {
      try {
        fn(...args);
      } catch (err) {
        console.error(`[events] listener for "${event}" failed`, err);
      }
    }
  }
}
