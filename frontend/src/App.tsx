import { useLocalStorage } from '@uidotdev/usehooks';
import { useStore } from './store/useStore';
import { useTheme } from './hooks/useTheme';
import { Button } from './components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from './components/ui/tooltip';
import { ToggleGroup, ToggleGroupItem } from './components/ui/toggle-group';
import { Moon, Sun } from 'lucide-react';
import type { MarketFilter } from './types';
import { useWebSocket } from './hooks/useWebSocket';

import { StatsTable } from './components/StatsTable';

function App() {
  const { isDark, toggleTheme } = useTheme();
  const [marketFilter, setMarketFilter] = useLocalStorage<MarketFilter>('marketFilter', 'all');
  const { isConnected } = useStore();
  useWebSocket('ws://localhost:8086/ws');

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-[1400px] mx-auto px-4 md:px-6 lg:px-8 py-6">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">Crypto Dashboard</h1>
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

          <div className="flex items-center gap-2">
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

        <div className="space-y-6">
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
                Exchange Statistics
              </h2>
            </div>
            <StatsTable filter={marketFilter} />
          </section>
        </div>
      </div>
    </div>
  );
}

export default App;