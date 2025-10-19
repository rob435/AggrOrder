import { useEffect, useRef, useState, useCallback } from 'react';
import type {
  WebSocketMessage,
  OrderbookData,
  StatsData,
} from '@/types';

export function useWebSocket(url: string) {
  const [orderbooks, setOrderbooks] = useState<OrderbookData>({});
  const [stats, setStats] = useState<StatsData>({});
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | undefined>(undefined);

  // Batching buffers
  const orderbookBufferRef = useRef<Map<string, { bids: any[], asks: any[] }>>(new Map());
  const statsBufferRef = useRef<Map<string, any>>(new Map());
  const batchTimeoutRef = useRef<number | undefined>(undefined);

  // Batch update function - updates React state once per batch
  const flushUpdates = useCallback(() => {
    if (orderbookBufferRef.current.size > 0) {
      const orderbookUpdates = Object.fromEntries(orderbookBufferRef.current);
      setOrderbooks((prev) => ({ ...prev, ...orderbookUpdates }));
      orderbookBufferRef.current.clear();
    }

    if (statsBufferRef.current.size > 0) {
      const statsUpdates = Object.fromEntries(statsBufferRef.current);
      setStats((prev) => ({ ...prev, ...statsUpdates }));
      statsBufferRef.current.clear();
    }

    batchTimeoutRef.current = undefined;
  }, []);

  // Schedule batch update (throttled to ~60fps max)
  const scheduleBatchUpdate = useCallback(() => {
    if (!batchTimeoutRef.current) {
      batchTimeoutRef.current = window.requestAnimationFrame(flushUpdates);
    }
  }, [flushUpdates]);

  useEffect(() => {
    function connect() {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        console.log('WebSocket connected');
      };

      ws.onmessage = (event) => {
        const message: WebSocketMessage = JSON.parse(event.data);

        if (message.type === 'orderbook') {
          // Buffer orderbook update instead of immediate state update
          orderbookBufferRef.current.set(message.exchange, {
            bids: message.bids,
            asks: message.asks,
          });
          scheduleBatchUpdate();
        } else if (message.type === 'stats') {
          // Buffer stats update instead of immediate state update
          statsBufferRef.current.set(message.exchange, {
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
          scheduleBatchUpdate();
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      ws.onclose = () => {
        setIsConnected(false);
        console.log('WebSocket disconnected, reconnecting in 3s...');
        reconnectTimeoutRef.current = window.setTimeout(connect, 3000);
      };
    }

    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (batchTimeoutRef.current) {
        cancelAnimationFrame(batchTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
      // Clear buffers on cleanup
      orderbookBufferRef.current.clear();
      statsBufferRef.current.clear();
    };
  }, [url, scheduleBatchUpdate]);

  const setTickLevel = (tick: number) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'set_tick', tick }));
    }
  };

  return { orderbooks, stats, isConnected, setTickLevel };
}
