import { create } from 'zustand';
import type { OrderbookData, StatsData, OrderbookLevel } from '@/types';

type State = {
  orderbooks: OrderbookData;
  stats: StatsData;
  isConnected: boolean;
  actions: {
    setOrderbooks: (orderbooks: OrderbookData) => void;
    setStats: (stats: StatsData) => void;
    setIsConnected: (isConnected: boolean) => void;
    updateOrderbook: (exchange: string, bids: OrderbookLevel[], asks: OrderbookLevel[]) => void;
    updateStats: (exchange: string, newStats: StatsData[string]) => void;
  };
};

export const useStore = create<State>((set) => ({
  orderbooks: {},
  stats: {},
  isConnected: false,
  actions: {
    setOrderbooks: (orderbooks) => set({ orderbooks }),
    setStats: (stats) => set({ stats }),
    setIsConnected: (isConnected) => set({ isConnected }),
    updateOrderbook: (exchange, bids, asks) =>
      set((state) => ({
        orderbooks: {
          ...state.orderbooks,
          [exchange]: { bids, asks },
        },
      })),
    updateStats: (exchange, newStats) =>
      set((state) => ({
        stats: {
          ...state.stats,
          [exchange]: newStats,
        },
      })),
  },
}));
