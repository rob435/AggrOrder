import { useEffect, useRef, useCallback } from 'react';
import { useStore } from '@/store/useStore';
import type { WebSocketMessage, OrderbookLevel, StatsData } from '@/types';

export function useWebSocket(url: string) {
  const { setIsConnected, updateOrderbook, updateStats } = useStore((state) => state.actions);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | undefined>(undefined);

  const orderbookBufferRef = useRef<Map<string, { bids: OrderbookLevel[]; asks: OrderbookLevel[] }>>(new Map());
  const statsBufferRef = useRef<Map<string, StatsData[string]>>(new Map());
  const batchTimeoutRef = useRef<number | undefined>(undefined);

  const flushUpdates = useCallback(() => {
    if (orderbookBufferRef.current.size > 0) {
      orderbookBufferRef.current.forEach((value, key) => {
        updateOrderbook(key, value.bids, value.asks);
      });
      orderbookBufferRef.current.clear();
    }

    if (statsBufferRef.current.size > 0) {
      statsBufferRef.current.forEach((value, key) => {
        updateStats(key, value);
      });
      statsBufferRef.current.clear();
    }

    batchTimeoutRef.current = undefined;
  }, [updateOrderbook, updateStats]);

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
          orderbookBufferRef.current.set(message.exchange, {
            bids: message.bids,
            asks: message.asks,
          });
        } else if (message.type === 'stats') {
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
        }
        scheduleBatchUpdate();
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
      // eslint-disable-next-line react-hooks/exhaustive-deps
      orderbookBufferRef.current.clear();
      // eslint-disable-next-line react-hooks/exhaustive-deps
      statsBufferRef.current.clear();
    };
  }, [url, scheduleBatchUpdate, setIsConnected, orderbookBufferRef, statsBufferRef]);

  const setTickLevel = (tick: number) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'set_tick', tick }));
    }
  };

  return { setTickLevel };
}