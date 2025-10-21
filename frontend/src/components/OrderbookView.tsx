import { useMemo } from 'react';
import type { OrderbookLevel } from '@/types';

type OrderbookViewProps = {
  bids: OrderbookLevel[];
  asks: OrderbookLevel[];
  maxLevels?: number;
};

export function OrderbookView({ bids, asks, maxLevels = 20 }: OrderbookViewProps) {
  const displayBids = useMemo(() => bids.slice(0, maxLevels), [bids, maxLevels]);
  const displayAsks = useMemo(() => asks.slice(0, maxLevels), [asks, maxLevels]);

  const maxBidQty = useMemo(
    () => Math.max(...displayBids.map((b) => parseFloat(b.quantity)), 0),
    [displayBids]
  );
  const maxAskQty = useMemo(
    () => Math.max(...displayAsks.map((a) => parseFloat(a.quantity)), 0),
    [displayAsks]
  );
  const maxQty = Math.max(maxBidQty, maxAskQty);

  if (displayBids.length === 0 && displayAsks.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        No orderbook data available
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full text-xl">
      {/* Header */}
      <div className="grid grid-cols-3 gap-6 px-8 py-4 text-lg font-bold text-muted-foreground border-b-2 border-border bg-muted/40 sticky top-0 z-10">
        <div className="text-left">Price</div>
        <div className="text-right">Quantity</div>
        <div className="text-right">Total</div>
      </div>

      <div className="flex-1 overflow-auto">
        {/* Asks (sell orders) - highest to lowest, so lowest ask appears at bottom next to bids */}
        <div className="flex flex-col-reverse">
          {displayAsks.map((ask, index) => {
            const qty = parseFloat(ask.quantity);
            const widthPercent = maxQty > 0 ? (qty / maxQty) * 100 : 0;

            return (
              <div
                key={`ask-${index}`}
                className="relative grid grid-cols-3 gap-6 px-8 py-3"
              >
                {/* Background bar */}
                <div
                  className="absolute right-0 top-0 h-full bg-red-500/10"
                  style={{ width: `${widthPercent}%` }}
                />

                {/* Content */}
                <div className="relative font-mono text-red-500 font-bold text-left text-xl">
                  {parseFloat(ask.price).toFixed(2)}
                </div>
                <div className="relative font-mono text-right text-lg">
                  {qty.toFixed(4)}
                </div>
                <div className="relative font-mono text-right text-muted-foreground text-lg">
                  {parseFloat(ask.cumulative).toFixed(2)}
                </div>
              </div>
            );
          })}
        </div>

        {/* Bids (buy orders) */}
        <div>
          {displayBids.map((bid, index) => {
            const qty = parseFloat(bid.quantity);
            const widthPercent = maxQty > 0 ? (qty / maxQty) * 100 : 0;

            return (
              <div
                key={`bid-${index}`}
                className="relative grid grid-cols-3 gap-6 px-8 py-3"
              >
                {/* Background bar */}
                <div
                  className="absolute right-0 top-0 h-full bg-green-500/10"
                  style={{ width: `${widthPercent}%` }}
                />

                {/* Content */}
                <div className="relative font-mono text-green-500 font-bold text-left text-xl">
                  {parseFloat(bid.price).toFixed(2)}
                </div>
                <div className="relative font-mono text-right text-lg">
                  {qty.toFixed(4)}
                </div>
                <div className="relative font-mono text-right text-muted-foreground text-lg">
                  {parseFloat(bid.cumulative).toFixed(2)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
