// BroadcastChannel utility with storage event fallback
class BroadcastChannelWrapper {
  private channel: BroadcastChannel | null = null;
  private listeners: Map<string, ((message: any) => void)[]> = new Map();
  private storageListener: ((e: StorageEvent) => void) | null = null;
  private readonly channelName: string;

  constructor(channelName: string) {
    this.channelName = channelName;

    // Try to use BroadcastChannel API
    if (typeof BroadcastChannel !== 'undefined') {
      this.channel = new BroadcastChannel(this.channelName);
      this.channel.onmessage = (event) => {
        this.handleMessage(event.data);
      };
    } else {
      // Fallback to storage events
      this.storageListener = (event) => {
        if (event.key === this.channelName && event.newValue) {
          try {
            const message = JSON.parse(event.newValue);
            this.handleMessage(message);
          } catch (e) {
            console.error('Failed to parse storage event:', e);
          }
        }
      };
      window.addEventListener('storage', this.storageListener);
    }
  }

  private handleMessage(message: any) {
    const listeners = this.listeners.get(message.type) || [];
    listeners.forEach((listener) => listener(message.payload));
  }

  send(type: string, payload: any) {
    const message = { type, payload };
    if (this.channel) {
      this.channel.postMessage(message);
    } else {
      // Fallback: store a message in localStorage to trigger storage event
      // We use a timestamp to avoid duplicate events
      try {
        localStorage.setItem(
          this.channelName,
          JSON.stringify({ ...message, timestamp: Date.now() })
        );
      } catch (e) {
        console.error('Failed to store broadcast message:', e);
      }
    }
  }

  subscribe(type: string, listener: (payload: any) => void) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, []);
    }
    this.listeners.get(type)?.push(listener);

    // Return unsubscribe function
    return () => {
      const listeners = this.listeners.get(type) || [];
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
      if (listeners.length === 0) {
        this.listeners.delete(type);
      }
    };
  }

  close() {
    if (this.channel) {
      this.channel.close();
      this.channel = null;
    }
    if (this.storageListener) {
      window.removeEventListener('storage', this.storageListener);
      this.storageListener = null;
    }
    this.listeners.clear();
  }
}

// Export a singleton instance for the day-night channel
export const dayNightBroadcastChannel = new BroadcastChannelWrapper('day-night-channel');

export default BroadcastChannelWrapper;
