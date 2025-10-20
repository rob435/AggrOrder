/**
 * High-performance OrderbookCard Web Component
 * Uses direct DOM manipulation for sub-10ms update times
 */

import { formatPrice, formatQuantity, calculateMaxCumulative, getExchangeIcon, getMarketType } from '../utils.js';

export class OrderbookCard extends HTMLElement {
  constructor() {
    super();
    this.rowsPerSide = 10;
    this.exchange = '';
    this.bids = [];
    this.asks = [];
    this.stats = null;

    // Pre-create row elements for reuse
    this.askRows = [];
    this.bidRows = [];
  }

  connectedCallback() {
    this.render();
  }

  setData(exchange, bids, asks, stats) {
    console.log({ exchange, bids, asks, stats });
    this.exchange = exchange;
    this.bids = bids || [];
    this.asks = asks || [];
    this.stats = stats || null;

    if (this.isConnected) {
      this.update();
    }
  }

  render() {
    const exchangeInfo = getExchangeIcon(this.exchange);
    const marketType = getMarketType(this.exchange);

    this.className = 'orderbook-card';
    this.innerHTML = `
      <div class="orderbook-header">
        <span class="orderbook-exchange">${exchangeInfo.svg} ${exchangeInfo.name}</span>
        <span class="orderbook-market-type">${marketType}</span>
      </div>

      <div class="orderbook-labels">
        <span>Price</span>
        <span class="text-right">Size</span>
        <span class="text-right">Sum</span>
      </div>

      <div class="orderbook-asks" id="asks-${this.exchange}">
        ${Array(this.rowsPerSide).fill('<div class="orderbook-row ask-row"></div>').join('')}
      </div>

      <div class="orderbook-mid-section">
        <div class="orderbook-mid-content">
          <div>
            <span class="orderbook-label">Mid </span>
            <span class="orderbook-mid-price">$0.00</span>
          </div>
          <div class="orderbook-divider"></div>
          <div>
            <span class="orderbook-label">Spread </span>
            <span class="orderbook-spread">$0.00</span>
          </div>
        </div>
      </div>

      <div class="orderbook-bids" id="bids-${this.exchange}">
        ${Array(this.rowsPerSide).fill('<div class="orderbook-row bid-row"></div>').join('')}
      </div>

      <div class="orderbook-imbalance-section">
        <div class="orderbook-imbalance-bar">
          <div class="orderbook-imbalance-bid"></div>
          <div class="orderbook-imbalance-center"></div>
          <div class="orderbook-imbalance-badge"></div>
          <div class="orderbook-imbalance-labels">
            <span class="orderbook-imbalance-bids">Bids: 0</span>
            <span class="orderbook-imbalance-asks">Asks: 0</span>
          </div>
        </div>
      </div>
    `;

    // Cache DOM references for fast updates
    this.askRowElements = Array.from(this.querySelector(`#asks-${this.exchange}`).children);
    this.bidRowElements = Array.from(this.querySelector(`#bids-${this.exchange}`).children);
    this.midPriceElement = this.querySelector('.orderbook-mid-price');
    this.spreadElement = this.querySelector('.orderbook-spread');
    this.imbalanceBidBar = this.querySelector('.orderbook-imbalance-bid');
    this.imbalanceBadge = this.querySelector('.orderbook-imbalance-badge');
    this.imbalanceBidsLabel = this.querySelector('.orderbook-imbalance-bids');
    this.imbalanceAsksLabel = this.querySelector('.orderbook-imbalance-asks');
  }

  update() {
    console.log('Updating orderbook card', this.exchange);
    const perfStart = performance.now();

    if (!this.stats) {
      console.log('No stats, returning');
      return;
    }

    const spread = parseFloat(this.stats.spread) || 0;
    const midPrice = parseFloat(this.stats.midPrice) || 0;
    const bestBid = parseFloat(this.stats.bestBid) || 0;
    const bestAsk = parseFloat(this.stats.bestAsk) || 0;

    console.log({ bestBid, bestAsk });

    // Update mid section
    this.midPriceElement.textContent = `${formatPrice(midPrice)}`;
    this.spreadElement.textContent = `${formatPrice(spread)}`;

    // Calculate max cumulative for bar widths
    const maxAskCum = calculateMaxCumulative(this.asks);
    const maxBidCum = calculateMaxCumulative(this.bids);

    console.log({ maxAskCum, maxBidCum });

    // Filter and prepare data
    const relevantAsks = this.asks.filter(ask => parseFloat(ask.price) >= bestAsk).slice(0, this.rowsPerSide);
    const relevantBids = this.bids.filter(bid => parseFloat(bid.price) <= bestBid).slice(0, this.rowsPerSide);

    console.log({ relevantAsks, relevantBids });

    // Update asks (reversed)
    const reversedAsks = relevantAsks.slice().reverse();
    for (let i = 0; i < this.rowsPerSide; i++) {
      const row = this.askRowElements[i];
      const askIndex = i - (this.rowsPerSide - reversedAsks.length);

      if (askIndex >= 0 && askIndex < reversedAsks.length) {
        const ask = reversedAsks[askIndex];
        const pct = (parseFloat(ask.cumulative) / maxAskCum) * 100;
        row.innerHTML = `
          <div class="orderbook-row-bg ask-bg" style="width: ${pct}%"></div>
          <span class="orderbook-price ask-price">${formatPrice(ask.price)}</span>
          <span class="orderbook-quantity">${formatQuantity(ask.quantity)}</span>
          <span class="orderbook-cumulative">${formatQuantity(ask.cumulative)}</span>
        `;
      } else {
        row.innerHTML = `
          <span class="orderbook-empty">-</span>
          <span class="orderbook-empty">-</span>
          <span class="orderbook-empty">-</span>
        `;
      }
    }

    // Update bids
    for (let i = 0; i < this.rowsPerSide; i++) {
      const row = this.bidRowElements[i];

      if (i < relevantBids.length) {
        const bid = relevantBids[i];
        const pct = (parseFloat(bid.cumulative) / maxBidCum) * 100;
        row.innerHTML = `
          <div class="orderbook-row-bg bid-bg" style="width: ${pct}%"></div>
          <span class="orderbook-price bid-price">${formatPrice(bid.price)}</span>
          <span class="orderbook-quantity">${formatQuantity(bid.quantity)}</span>
          <span class="orderbook-cumulative">${formatQuantity(bid.cumulative)}</span>
        `;
      } else {
        row.innerHTML = `
          <span class="orderbook-empty">-</span>
          <span class="orderbook-empty">-</span>
          <span class="orderbook-empty">-</span>
        `;
      }
    }

    // Update imbalance
    const totalBids = parseFloat(this.stats.totalBidsQty) || 0;
    const totalAsks = parseFloat(this.stats.totalAsksQty) || 0;
    const total = totalBids + totalAsks;
    const bidPercentage = total > 0 ? (totalBids / total) * 100 : 50;

    this.imbalanceBidBar.style.width = `${bidPercentage}%`;
    this.imbalanceBidsLabel.textContent = `Bids: ${formatPrice(totalBids)}`;
    this.imbalanceAsksLabel.textContent = `Asks: ${formatPrice(totalAsks)}`;

    const imbalanceDiff = Math.abs(bidPercentage - 50);
    if (bidPercentage > 50) {
      this.imbalanceBadge.textContent = `↑ ${formatPrice(imbalanceDiff)}%`;
      this.imbalanceBadge.className = 'orderbook-imbalance-badge bid-dominant';
    } else if (bidPercentage < 50) {
      this.imbalanceBadge.textContent = `↓ ${formatPrice(imbalanceDiff)}%`;
      this.imbalanceBadge.className = 'orderbook-imbalance-badge ask-dominant';
    } else {
      this.imbalanceBadge.textContent = '=';
      this.imbalanceBadge.className = 'orderbook-imbalance-badge balanced';
    }

    const perfEnd = performance.now();
    if (perfEnd - perfStart > 10) {
      console.warn(`Slow orderbook update for ${this.exchange}: ${(perfEnd - perfStart).toFixed(2)}ms`);
    }
  }
}

customElements.define('orderbook-card', OrderbookCard);
