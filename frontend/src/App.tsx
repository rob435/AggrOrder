import { useLocalStorage } from '@uidotdev/usehooks';
import { useStore } from './store/useStore';
import { useTheme } from './hooks/useTheme';
import { Button } from './components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from './components/ui/tooltip';
import { ToggleGroup, ToggleGroupItem } from './components/ui/toggle-group';
import { Moon, Sun, X } from 'lucide-react';
import type { MarketFilter } from './types';
import { useWebSocket } from './hooks/useWebSocket';
import { getPlatformClass } from './utils/platform';

import { StatsTable } from './components/StatsTable';

type AssetFilter = 'BTC' | 'ETH';

function App() {
  const { isDark, toggleTheme } = useTheme();
  const [marketFilter, setMarketFilter] = useLocalStorage<MarketFilter>('marketFilter', 'all');
  const [assetFilter, setAssetFilter] = useLocalStorage<AssetFilter>('assetFilter', 'BTC');
  const { isConnected } = useStore();
  useWebSocket('ws://localhost:8086/ws');

  const handleShutdown = async () => {
    try {
      await fetch('http://localhost:8086/shutdown', { method: 'POST' });
      // Close the browser tab
      window.close();
      // If window.close() doesn't work (requires tab to be opened by script),
      // show a message
      setTimeout(() => {
        alert('Backend shut down. You can close this tab.');
      }, 100);
    } catch (error) {
      console.error('Error shutting down:', error);
    }
  };

  return (
    <div className={`h-screen bg-background text-foreground flex flex-col ${getPlatformClass()}`}>
      <div className="flex-1 flex flex-col px-4 md:px-6 lg:px-8 py-6 overflow-hidden relative">
        <Button
          variant="destructive"
          size="icon"
          aria-label="Close and shutdown"
          onClick={handleShutdown}
          className="absolute top-6 right-6 z-50 pointer-events-auto cursor-pointer"
          title="Close and shutdown backend"
        >
          <X className="size-4" />
        </Button>

        <div className="mb-6 flex items-center justify-between gap-3 flex-shrink-0">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-semibold tracking-tight">Orderbook</h1>
            <div className="hidden sm:inline-flex items-center gap-2 rounded-full border border-border bg-muted/30 px-2 py-1">
              <span
                className={`size-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-destructive'
                  }`}
              />
              <span className="text-xs text-muted-foreground">
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 mr-16">
            <ToggleGroup
              type="single"
              value={assetFilter}
              onValueChange={(value) => value && setAssetFilter(value as AssetFilter)}
              variant="outline"
            >
              <ToggleGroupItem value="BTC" aria-label="Show BTC pairs" className="px-2.5">
                BTC
              </ToggleGroupItem>
              <ToggleGroupItem value="ETH" aria-label="Show ETH pairs" className="px-2.5">
                ETH
              </ToggleGroupItem>
            </ToggleGroup>

            <ToggleGroup
              type="single"
              value={marketFilter}
              onValueChange={(value) => value && setMarketFilter(value as MarketFilter)}
              variant="outline"
            >
              <ToggleGroupItem value="all" aria-label="Show all markets" className="px-2.5">
                All
              </ToggleGroupItem>
              <ToggleGroupItem value="spot" aria-label="Show spot markets" className="px-2.5">
                Spot
              </ToggleGroupItem>
              <ToggleGroupItem value="perps" aria-label="Show perpetual futures" className="px-2.5">
                Perps
              </ToggleGroupItem>
            </ToggleGroup>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="Toggle theme"
                  onClick={toggleTheme}
                >
                  {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>Toggle theme</TooltipContent>
            </Tooltip>
          </div>
        </div>

        <div className="flex-1 flex flex-col min-h-0">
          <section className="flex-1 flex flex-col min-h-0">
            <div className="mb-3 flex items-center justify-between flex-shrink-0">
              <h2 className="text-base font-semibold tracking-wide text-muted-foreground uppercase">
                Exchange Statistics
              </h2>
            </div>
            <div className="flex-1 min-h-0">
              <StatsTable filter={marketFilter} assetFilter={assetFilter} />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default App;