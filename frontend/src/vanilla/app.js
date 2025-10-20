/**
 * Dashboard Page Controller
 * Statistics table only
 */

import { WebSocketManager } from './websocket-manager.js';
import { StatsTable } from './components/stats-table.js';
import { filterExchangesByMarket } from './utils.js';

class App {
  constructor() {
    this.ws = null;
    this.stats = new Map();
    this.marketFilter = localStorage.getItem('marketFilter') || 'all';
    this.theme = localStorage.getItem('theme') || 'dark';
    this.statsTable = null;

    this.init();
  }

  init() {
    console.log('🚀 Initializing Dashboard App...');

    // Apply theme
    document.documentElement.classList.toggle('dark', this.theme === 'dark');

    // Setup WebSocket
    this.ws = new WebSocketManager('ws://localhost:8086/ws');
    this.ws.on('stats', (updates) => this.handleStatsUpdates(updates));
    this.ws.on('connection', (connected) => this.handleConnection(connected));

    // Create stats table
    const container = document.getElementById('stats-container');
    if (!container) {
      console.error('❌ Stats container not found!');
      return;
    }

    this.statsTable = document.createElement('stats-table');
    container.appendChild(this.statsTable);
    console.log('✅ Stats table created and appended');

    // Setup event listeners
    this.setupEventListeners();
  }

  handleStatsUpdates(updates) {
    console.log('📊 Received stats updates:', updates.size);
    updates.forEach((stat, exchange) => {
      this.stats.set(exchange, stat);
    });

    // Update stats table
    if (this.statsTable) {
      const filteredStats = this.getFilteredStats();
      console.log('📈 Updating table with', Object.keys(filteredStats).length, 'exchanges');
      this.statsTable.setStats(filteredStats);
    } else {
      console.error('❌ Stats table not found!');
    }
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

  getFilteredStats() {
    const filtered = {};
    this.stats.forEach((stat, exchange) => {
      if (this.shouldShowExchange(exchange)) {
        filtered[exchange] = stat;
      }
    });
    return filtered;
  }

  toggleTheme() {
    this.theme = this.theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('theme', this.theme);
    document.documentElement.classList.toggle('dark', this.theme === 'dark');
  }

  setupEventListeners() {
    // Theme toggle
    const themeBtn = document.getElementById('theme-btn');
    if (themeBtn) {
      themeBtn.addEventListener('click', () => {
        this.toggleTheme();
      });
    }
  }
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new App());
} else {
  new App();
}
