import type { OrderbookLevel, OrderbookData } from '@/types';

/**
 * Aggregates multiple orderbooks into a single combined orderbook
 * Merges price levels and sums quantities across all exchanges
 */
export function aggregateOrderbooks(orderbooks: OrderbookData): {
  bids: OrderbookLevel[];
  asks: OrderbookLevel[];
} {
  const bidMap = new Map<string, number>();
  const askMap = new Map<string, number>();

  // Aggregate all bids and asks across exchanges
  Object.values(orderbooks).forEach((book) => {
    book.bids.forEach((bid) => {
      const price = bid.price;
      const qty = parseFloat(bid.quantity);
      bidMap.set(price, (bidMap.get(price) || 0) + qty);
    });

    book.asks.forEach((ask) => {
      const price = ask.price;
      const qty = parseFloat(ask.quantity);
      askMap.set(price, (askMap.get(price) || 0) + qty);
    });
  });

  // Convert maps to sorted arrays
  const bids: OrderbookLevel[] = Array.from(bidMap.entries())
    .sort((a, b) => parseFloat(b[0]) - parseFloat(a[0])) // Sort descending
    .map(([price, quantity], index, arr) => {
      // Calculate cumulative
      const cumulative = arr
        .slice(0, index + 1)
        .reduce((sum, [, qty]) => sum + qty, 0);

      return {
        price,
        quantity: quantity.toString(),
        cumulative: cumulative.toString(),
      };
    });

  const asks: OrderbookLevel[] = Array.from(askMap.entries())
    .sort((a, b) => parseFloat(a[0]) - parseFloat(b[0])) // Sort ascending
    .map(([price, quantity], index, arr) => {
      // Calculate cumulative
      const cumulative = arr
        .slice(0, index + 1)
        .reduce((sum, [, qty]) => sum + qty, 0);

      return {
        price,
        quantity: quantity.toString(),
        cumulative: cumulative.toString(),
      };
    });

  return { bids, asks };
}
