/**
 * High-performance WebSocket manager with batched updates
 * Optimized for sub-50ms render times with 500ms update frequency
 */

export class WebSocketManager {
  constructor(url) {
    this.url = url;
    this.ws = null;
    this.isConnected = false;
    this.reconnectTimeout = null;
    this.tickLevel = 1;

    // Batching buffers
    this.orderbookBuffer = new Map();
    this.statsBuffer = new Map();
    this.batchScheduled = false;

    // Event listeners
    this.listeners = {
      orderbook: new Set(),
      stats: new Set(),
      connection: new Set(),
    };

    this.connect();
  }

  connect() {
    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        this.isConnected = true;
        this.notifyConnectionListeners(true);
        console.log('WebSocket connected');
      };

      this.ws.onmessage = (event) => {
        const message = JSON.parse(event.data);

        if (message.type === 'orderbook') {
          this.orderbookBuffer.set(message.exchange, {
            bids: message.bids,
            asks: message.asks,
          });
          this.scheduleBatchUpdate();
        } else if (message.type === 'stats') {
          this.statsBuffer.set(message.exchange, {
            bestBid: message.bestBid,
            bestAsk: message.bestAsk,
            midPrice: message.midPrice,
            spread: message.spread,
            bidLiquidity05Pct: message.bidLiquidity05Pct,
            askLiquidity05Pct: message.askLiquidity05Pct,
            deltaLiquidity05Pct: message.deltaLiquidity05Pct,
            bidLiquidity2Pct: message.bidLiquidity2Pct,
            askLiquidity2Pct: message.askLiquidity2Pct,
            deltaLiquidity2Pct: message.deltaLiquidity2Pct,
            bidLiquidity10Pct: message.bidLiquidity10Pct,
            askLiquidity10Pct: message.askLiquidity10Pct,
            deltaLiquidity10Pct: message.deltaLiquidity10Pct,
            totalBidsQty: message.totalBidsQty,
            totalAsksQty: message.totalAsksQty,
            totalDelta: message.totalDelta,
          });
          this.scheduleBatchUpdate();
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      this.ws.onclose = () => {
        this.isConnected = false;
        this.notifyConnectionListeners(false);
        console.log('WebSocket disconnected, reconnecting in 3s...');
        this.reconnectTimeout = setTimeout(() => this.connect(), 3000);
      };
    } catch (error) {
      console.error('Failed to connect:', error);
      this.reconnectTimeout = setTimeout(() => this.connect(), 3000);
    }
  }

  scheduleBatchUpdate() {
    if (!this.batchScheduled) {
      this.batchScheduled = true;
      requestAnimationFrame(() => this.flushUpdates());
    }
  }

  flushUpdates() {
    const perfStart = performance.now();

    // Notify orderbook listeners
    if (this.orderbookBuffer.size > 0) {
      const updates = new Map(this.orderbookBuffer);
      this.orderbookBuffer.clear();
      this.listeners.orderbook.forEach(listener => listener(updates));
    }

    // Notify stats listeners
    if (this.statsBuffer.size > 0) {
      const updates = new Map(this.statsBuffer);
      this.statsBuffer.clear();
      this.listeners.stats.forEach(listener => listener(updates));
    }

    this.batchScheduled = false;

    const perfEnd = performance.now();
    if (perfEnd - perfStart > 50) {
      console.warn(`Slow update: ${(perfEnd - perfStart).toFixed(2)}ms`);
    }
  }

  setTickLevel(tick) {
    this.tickLevel = tick;
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'set_tick', tick }));
    }
  }

  on(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event].add(callback);
    }
  }

  off(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event].delete(callback);
    }
  }

  notifyConnectionListeners(connected) {
    this.listeners.connection.forEach(listener => listener(connected));
  }

  destroy() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
    if (this.ws) {
      this.ws.close();
    }
    this.listeners.orderbook.clear();
    this.listeners.stats.clear();
    this.listeners.connection.clear();
  }
}
