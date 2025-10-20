/**
 * Orderbooks Page Controller
 * Dedicated page for orderbook visualization
 */

import { WebSocketManager } from './websocket-manager.js';
import { OrderbookCard } from './components/orderbook-card.js';
import { filterExchangesByMarket, sortExchangesByGroup } from './utils.js';

class OrderbooksApp {
  constructor() {
    this.ws = null;
    this.orderbooks = new Map();
    this.stats = new Map();
    this.marketFilter = localStorage.getItem('marketFilter') || 'all';
    this.showAggregate = false;
    this.theme = localStorage.getItem('theme') || 'dark';
    this.orderbookCards = new Map();

    this.init();
  }

  init() {
    // Apply theme
    document.documentElement.classList.toggle('dark', this.theme === 'dark');

    // Setup WebSocket
    this.ws = new WebSocketManager('ws://localhost:8086/ws');
    this.ws.on('orderbook', (updates) => this.handleOrderbookUpdates(updates));
    this.ws.on('stats', (updates) => this.handleStatsUpdates(updates));
    this.ws.on('connection', (connected) => this.handleConnection(connected));

    // Setup event listeners
    this.setupEventListeners();

    // Initialize filter UI
    this.updateFilterButtons();
  }

  handleOrderbookUpdates(updates) {
    updates.forEach((data, exchange) => {
      this.orderbooks.set(exchange, data);

      if (this.shouldShowExchange(exchange) && !this.showAggregate) {
        this.updateOrderbookCard(exchange);
      }
    });

    if (this.showAggregate) {
      this.updateAggregateOrderbook();
    }
  }

  handleStatsUpdates(updates) {
    updates.forEach((stat, exchange) => {
      this.stats.set(exchange, stat);
    });
  }

  handleConnection(connected) {
    const indicator = document.getElementById('connection-indicator');
    const status = document.getElementById('connection-status');

    if (indicator) {
      indicator.className = connected
        ? 'connection-dot connected'
        : 'connection-dot disconnected';
    }

    if (status) {
      status.textContent = connected ? 'Connected' : 'Disconnected';
    }
  }

  shouldShowExchange(exchange) {
    return filterExchangesByMarket(exchange, this.marketFilter);
  }

  updateOrderbookCard(exchange) {
    let card = this.orderbookCards.get(exchange);

    if (!card) {
      card = document.createElement('orderbook-card');
      this.orderbookCards.set(exchange, card);
    }

    const orderbookData = this.orderbooks.get(exchange);
    const statsData = this.stats.get(exchange);

    if (orderbookData && statsData) {
      card.setData(exchange, orderbookData.bids, orderbookData.asks, statsData);
    }
  }

  updateAggregateOrderbook() {
    const aggregatedBids = new Map();
    const aggregatedAsks = new Map();
    let totalBidsQty = 0;
    let totalAsksQty = 0;

    this.orderbooks.forEach((data, exchange) => {
      if (!this.shouldShowExchange(exchange)) return;

      data.bids.forEach(bid => {
        const price = parseFloat(bid.price);
        const qty = parseFloat(bid.quantity);
        aggregatedBids.set(price, (aggregatedBids.get(price) || 0) + qty);
        totalBidsQty += qty;
      });

      data.asks.forEach(ask => {
        const price = parseFloat(ask.price);
        const qty = parseFloat(ask.quantity);
        aggregatedAsks.set(price, (aggregatedAsks.get(price) || 0) + qty);
        totalAsksQty += qty;
      });
    });

    const bids = this.aggregateAndCalculateCumulative(aggregatedBids, 'desc');
    const asks = this.aggregateAndCalculateCumulative(aggregatedAsks, 'asc');

    const bestBid = bids.length > 0 ? bids[0].price : '0';
    const bestAsk = asks.length > 0 ? asks[0].price : '0';
    const midPrice = ((parseFloat(bestBid) + parseFloat(bestAsk)) / 2).toString();
    const spread = (parseFloat(bestAsk) - parseFloat(bestBid)).toString();

    const aggregatedStats = {
      bestBid,
      bestAsk,
      midPrice,
      spread,
      totalBidsQty: totalBidsQty.toString(),
      totalAsksQty: totalAsksQty.toString(),
      totalDelta: (totalBidsQty - totalAsksQty).toString(),
    };

    let card = this.orderbookCards.get('Aggregated');
    if (!card) {
      card = document.createElement('orderbook-card');
      this.orderbookCards.set('Aggregated', card);
    }

    card.setData('Aggregated', bids, asks, aggregatedStats);
  }

  aggregateAndCalculateCumulative(priceMap, order) {
    const sorted = Array.from(priceMap.entries())
      .sort((a, b) => order === 'desc' ? b[0] - a[0] : a[0] - b[0]);

    let cumulative = 0;
    return sorted.map(([price, quantity]) => {
      cumulative += quantity;
      return {
        price: price.toString(),
        quantity: quantity.toString(),
        cumulative: cumulative.toString(),
      };
    });
  }

  renderOrderbookCards() {
    const container = document.getElementById('orderbooks-container');
    container.innerHTML = '';

    if (this.showAggregate) {
      const card = this.orderbookCards.get('Aggregated');
      if (card) {
        container.appendChild(card);
      }
    } else {
      const exchanges = Array.from(this.orderbooks.keys()).filter(ex =>
        this.shouldShowExchange(ex)
      );
      const sorted = sortExchangesByGroup(exchanges);

      sorted.forEach(exchange => {
        this.updateOrderbookCard(exchange);
        const card = this.orderbookCards.get(exchange);
        if (card) {
          container.appendChild(card);
        }
      });
    }
  }

  updateMarketFilter(filter) {
    this.marketFilter = filter;
    localStorage.setItem('marketFilter', filter);

    this.updateFilterButtons();
    this.renderOrderbookCards();
  }

  updateFilterButtons() {
    document.querySelectorAll('.filter-btn').forEach(btn => {
      if (btn.dataset.filter === this.marketFilter) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  toggleAggregate() {
    this.showAggregate = !this.showAggregate;

    const btn = document.getElementById('aggregate-btn');
    if (btn) {
      btn.classList.toggle('active', this.showAggregate);
    }

    if (this.showAggregate) {
      this.updateAggregateOrderbook();
    }

    this.renderOrderbookCards();
  }

  toggleTheme() {
    this.theme = this.theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('theme', this.theme);
    document.documentElement.classList.toggle('dark', this.theme === 'dark');
  }

  setTickLevel(tick) {
    this.ws.setTickLevel(tick);
  }

  setupEventListeners() {
    // Market filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.updateMarketFilter(btn.dataset.filter);
      });
    });

    // Aggregate toggle
    const aggregateBtn = document.getElementById('aggregate-btn');
    if (aggregateBtn) {
      aggregateBtn.addEventListener('click', () => {
        this.toggleAggregate();
      });
    }

    // Theme toggle
    const themeBtn = document.getElementById('theme-btn');
    if (themeBtn) {
      themeBtn.addEventListener('click', () => {
        this.toggleTheme();
      });
    }

    // Tick level selector
    const tickSelect = document.getElementById('tick-select');
    if (tickSelect) {
      tickSelect.addEventListener('change', (e) => {
        this.setTickLevel(parseFloat(e.target.value));
      });
    }
  }
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new OrderbooksApp());
} else {
  new OrderbooksApp();
}
