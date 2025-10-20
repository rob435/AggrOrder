/**
 * High-performance StatsTable Component
 * Uses table reuse and direct updates for minimal DOM operations
 */

import { formatPrice, formatQuantity, filterExchangesByMarket, sortExchangesByGroup, getExchangeIcon, getMarketType } from '../utils.js';

export class StatsTable extends HTMLElement {
  constructor() {
    super();
    this.stats = {};
    this.filter = 'all';
    this.sortColumn = null;
    this.sortDirection = 'asc';
    this.rowElements = new Map();
  }

  connectedCallback() {
    this.render();
  }

  setFilter(filter) {
    this.filter = filter;
    this.update();
  }

  setStats(stats) {
    this.stats = stats;
    this.update();
  }

  render() {
    this.className = 'stats-table-container';
    this.innerHTML = `
      <table class="stats-table">
        <thead>
          <tr>
            <th data-column="exchange" style="width: 200px">Exchange</th>
            <th data-column="midPrice" style="width: 150px">Mid Price</th>
            <th data-column="bestBid" style="width: 150px">Best Bid</th>
            <th data-column="bestAsk" style="width: 150px">Best Ask</th>
            <th data-column="bidLiquidity05Pct" style="width: 150px">Bid Qty 0.5%</th>
            <th data-column="askLiquidity05Pct" style="width: 150px">Ask Qty 0.5%</th>
            <th data-column="deltaLiquidity05Pct" style="width: 150px">Δ Liq 0.5%</th>
            <th data-column="bidLiquidity2Pct" style="width: 150px">Bid Qty 2%</th>
            <th data-column="askLiquidity2Pct" style="width: 150px">Ask Qty 2%</th>
            <th data-column="deltaLiquidity2Pct" style="width: 150px">Δ Liq 2%</th>
            <th data-column="bidLiquidity10Pct" style="width: 150px">Bid Qty 10%</th>
            <th data-column="askLiquidity10Pct" style="width: 150px">Ask Qty 10%</th>
            <th data-column="deltaLiquidity10Pct" style="width: 150px">Δ Liq 10%</th>
            <th data-column="totalBidsQty" style="width: 150px">Total Bids Qty</th>
            <th data-column="totalAsksQty" style="width: 150px">Total Asks Qty</th>
            <th data-column="totalDelta" style="width: 150px">Total Δ</th>
          </tr>
        </thead>
        <tbody></tbody>
      </table>
    `;

    this.tbody = this.querySelector('tbody');
    this.thead = this.querySelector('thead');

    // Add sort handlers
    this.thead.addEventListener('click', (e) => {
      const th = e.target.closest('th');
      if (th && th.dataset.column) {
        this.handleSort(th.dataset.column);
      }
    });
  }

  handleSort(column) {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }

    // Update header indicators
    this.querySelectorAll('th').forEach(th => {
      th.classList.remove('sort-asc', 'sort-desc');
      if (th.dataset.column === column) {
        th.classList.add(`sort-${this.sortDirection}`);
      }
    });

    this.update();
  }

  update() {
    const perfStart = performance.now();

    // Filter exchanges
    const filtered = Object.entries(this.stats).filter(([exchange]) =>
      filterExchangesByMarket(exchange, this.filter)
    );

    // Sort exchanges
    const sorted = sortExchangesByGroup(filtered.map(([ex]) => ex)).map(exchange => [
      exchange,
      this.stats[exchange]
    ]);

    // Apply column sorting if active
    if (this.sortColumn) {
      sorted.sort((a, b) => {
        const aValue = this.getSortValue(a[1], this.sortColumn);
        const bValue = this.getSortValue(b[1], this.sortColumn);

        const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
        return this.sortDirection === 'asc' ? comparison : -comparison;
      });
    }

    // Clear existing rows
    this.tbody.innerHTML = '';
    this.rowElements.clear();

    // Create rows
    sorted.forEach(([exchange, stat]) => {
      const row = this.createRow(exchange, stat);
      this.tbody.appendChild(row);
      this.rowElements.set(exchange, row);
    });

    const perfEnd = performance.now();
    if (perfEnd - perfStart > 20) {
      console.warn(`Slow stats table update: ${(perfEnd - perfStart).toFixed(2)}ms`);
    }
  }

  getSortValue(stat, column) {
    if (column === 'exchange') return stat.exchange;
    return parseFloat(stat[column]) || 0;
  }

  createRow(exchange, stat) {
    const tr = document.createElement('tr');
    tr.className = 'stats-row';

    const exchangeInfo = getExchangeIcon(exchange);
    const marketType = getMarketType(exchange);

    const deltaClass05 = this.getDeltaClass(stat.deltaLiquidity05Pct);
    const deltaClass2 = this.getDeltaClass(stat.deltaLiquidity2Pct);
    const deltaClass10 = this.getDeltaClass(stat.deltaLiquidity10Pct);
    const deltaClassTotal = this.getDeltaClass(stat.totalDelta);

    tr.innerHTML = `
      <td>
        <div class="exchange-cell">
          <span class="exchange-logo">${exchangeInfo.svg}</span>
          <span class="exchange-name">${exchangeInfo.name}</span>
          <span class="market-type">${marketType}</span>
        </div>
      </td>
      <td class="numeric">${formatPrice(stat.midPrice)}</td>
      <td class="numeric bid-color">${formatPrice(stat.bestBid)}</td>
      <td class="numeric ask-color">${formatPrice(stat.bestAsk)}</td>
      <td class="numeric small">${formatPrice(stat.bidLiquidity05Pct)}</td>
      <td class="numeric small">${formatPrice(stat.askLiquidity05Pct)}</td>
      <td class="numeric small ${deltaClass05}">${formatPrice(stat.deltaLiquidity05Pct)}</td>
      <td class="numeric small">${formatPrice(stat.bidLiquidity2Pct)}</td>
      <td class="numeric small">${formatPrice(stat.askLiquidity2Pct)}</td>
      <td class="numeric small ${deltaClass2}">${formatPrice(stat.deltaLiquidity2Pct)}</td>
      <td class="numeric small">${formatPrice(stat.bidLiquidity10Pct)}</td>
      <td class="numeric small">${formatPrice(stat.askLiquidity10Pct)}</td>
      <td class="numeric small ${deltaClass10}">${formatPrice(stat.deltaLiquidity10Pct)}</td>
      <td class="numeric small bid-color">${formatPrice(stat.totalBidsQty)}</td>
      <td class="numeric small ask-color">${formatPrice(stat.totalAsksQty)}</td>
      <td class="numeric small bold ${deltaClassTotal}">${formatPrice(stat.totalDelta)}</td>
    `;

    return tr;
  }

  getDeltaClass(value) {
    const num = parseFloat(value);
    if (num > 0) return 'positive';
    if (num < 0) return 'negative';
    return 'neutral';
  }
}

customElements.define('stats-table', StatsTable);
