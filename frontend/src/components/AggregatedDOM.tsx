import { useMemo, useState } from 'react';
import { useLocalStorage } from '@uidotdev/usehooks';
import { useStore } from '@/store/useStore';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { OrderbookView } from '@/components/OrderbookView';
import { ExchangeBadge } from '@/components/ExchangeBadge';
import type { MarketFilter, OrderbookData } from '@/types';
import { filterExchangesByMarket, filterExchangesByAsset, sortExchangesByGroup } from '@/utils/calculations';
import { aggregateOrderbooks } from '@/utils/aggregateOrderbook';
import { useWebSocket } from '@/hooks/useWebSocket';

type AggregatedDOMProps = {
  filter?: MarketFilter;
  assetFilter?: 'BTC' | 'ETH';
};

const TICK_LEVELS = [
  { value: '0.01', label: '0.01' },
  { value: '0.1', label: '0.1' },
  { value: '1', label: '1' },
  { value: '10', label: '10' },
  { value: '50', label: '50' },
  { value: '100', label: '100' },
];

export function AggregatedDOM({ filter = 'all', assetFilter = 'BTC' }: AggregatedDOMProps) {
  const orderbooks = useStore((state) => state.orderbooks);
  const { setTickLevel } = useWebSocket('ws://localhost:8086/ws');
  const [tickLevel, setTickLevelState] = useLocalStorage<string>('tickLevel', '1');

  // Get filtered orderbooks
  const filteredOrderbooks = useMemo(() => {
    const filtered: OrderbookData = {};
    Object.entries(orderbooks).forEach(([exchange, book]) => {
      if (filterExchangesByAsset(exchange, assetFilter) && filterExchangesByMarket(exchange, filter)) {
        filtered[exchange] = book;
      }
    });
    return filtered;
  }, [orderbooks, filter, assetFilter]);

  // Get sorted exchange list
  const exchanges = useMemo(() => {
    const sorted = sortExchangesByGroup(Object.entries(filteredOrderbooks));
    return sorted.map(([exchange]) => exchange);
  }, [filteredOrderbooks]);

  // Aggregate all orderbooks
  const aggregatedOrderbook = useMemo(() => {
    return aggregateOrderbooks(filteredOrderbooks);
  }, [filteredOrderbooks]);

  // Set "all" as default tab
  const [activeTab, setActiveTab] = useState<string>('all');

  // Update active tab when exchanges change
  useMemo(() => {
    if (exchanges.length > 0 && activeTab !== 'all' && !exchanges.includes(activeTab)) {
      setActiveTab('all');
    }
  }, [exchanges, activeTab]);

  const handleTickLevelChange = (value: string) => {
    setTickLevelState(value);
    setTickLevel(parseFloat(value));
  };

  if (exchanges.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        No orderbook data available
      </div>
    );
  }

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
      {/* Tabs list with exchange badges and tick selector */}
      <div className="flex items-center justify-between gap-3 flex-shrink-0">
        <TabsList className="flex-1 justify-start overflow-x-auto h-auto p-1 gap-1">
          {/* Aggregated "All" tab */}
          <TabsTrigger
            value="all"
            className="px-3 py-1.5 data-[state=active]:bg-background font-medium"
          >
            All Exchanges
          </TabsTrigger>

          {/* Individual exchange tabs */}
          {exchanges.map((exchange) => (
            <TabsTrigger
              key={exchange}
              value={exchange}
              className="px-2 py-1.5 data-[state=active]:bg-background"
            >
              <ExchangeBadge
                exchange={exchange}
                showLabel={true}
                showMarketType={true}
                iconClassName="size-4"
              />
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Tick level selector */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-sm text-muted-foreground font-medium">Tick Size:</span>
          <Select value={tickLevel} onValueChange={handleTickLevelChange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TICK_LEVELS.map((tick) => (
                <SelectItem key={tick.value} value={tick.value}>
                  {tick.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tab content with orderbook for each exchange */}
      <div className="flex-1 min-h-0 mt-3">
        {/* Aggregated orderbook */}
        <TabsContent
          value="all"
          className="h-full m-0 data-[state=active]:flex data-[state=active]:flex-col"
        >
          <div className="flex-1 rounded-lg border border-border bg-card overflow-hidden">
            <OrderbookView
              bids={aggregatedOrderbook.bids}
              asks={aggregatedOrderbook.asks}
              maxLevels={50}
            />
          </div>
        </TabsContent>

        {/* Individual exchange orderbooks */}
        {exchanges.map((exchange) => {
          const orderbook = orderbooks[exchange];
          return (
            <TabsContent
              key={exchange}
              value={exchange}
              className="h-full m-0 data-[state=active]:flex data-[state=active]:flex-col"
            >
              {orderbook ? (
                <div className="flex-1 rounded-lg border border-border bg-card overflow-hidden">
                  <OrderbookView
                    bids={orderbook.bids}
                    asks={orderbook.asks}
                    maxLevels={50}
                  />
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  Loading orderbook...
                </div>
              )}
            </TabsContent>
          );
        })}
      </div>
    </Tabs>
  );
}
