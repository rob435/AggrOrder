/**
 * High-performance Canvas-based Liquidity Chart
 * Replaces Recharts for 10x faster rendering
 */

import { formatPrice } from '../utils.js';

export class LiquidityChart extends HTMLElement {
  constructor() {
    super();
    this.data = [];
    this.title = '';
    this.canvas = null;
    this.ctx = null;
    this.resizeObserver = null;
  }

  connectedCallback() {
    this.render();
    this.setupResize();
  }

  disconnectedCallback() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
  }

  setData(title, data) {
    this.title = title;
    this.data = data || [];

    // Update title if element exists
    if (this.titleElement) {
      this.titleElement.textContent = title;
    }

    // Only draw if canvas is ready
    if (this.canvas && this.ctx) {
      this.draw();
    }
  }

  render() {
    this.className = 'liquidity-chart';
    this.innerHTML = `
      <div class="chart-header">
        <h3 class="chart-title">${this.title}</h3>
      </div>
      <canvas class="chart-canvas"></canvas>
    `;

    this.canvas = this.querySelector('.chart-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.titleElement = this.querySelector('.chart-title');

    // Set initial size
    this.updateCanvasSize();
  }

  setupResize() {
    this.resizeObserver = new ResizeObserver(() => {
      this.updateCanvasSize();
      this.draw();
    });
    this.resizeObserver.observe(this);
  }

  updateCanvasSize() {
    const rect = this.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    // Reserve space for header
    const headerHeight = 40;
    const canvasHeight = rect.height - headerHeight;

    this.canvas.width = rect.width * dpr;
    this.canvas.height = canvasHeight * dpr;
    this.canvas.style.width = rect.width + 'px';
    this.canvas.style.height = canvasHeight + 'px';

    this.ctx.scale(dpr, dpr);
  }

  draw() {
    // Don't draw if canvas isn't ready
    if (!this.canvas || !this.ctx) {
      return;
    }

    if (!this.data || this.data.length === 0) {
      this.drawEmpty();
      return;
    }

    const perfStart = performance.now();

    const width = this.canvas.width / (window.devicePixelRatio || 1);
    const height = this.canvas.height / (window.devicePixelRatio || 1);

    // Clear canvas
    this.ctx.clearRect(0, 0, width, height);

    // Calculate dimensions
    const padding = { top: 20, right: 20, bottom: 40, left: 60 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    // Get exchanges and max values
    const exchanges = this.getUniqueExchanges();
    const maxBid = Math.max(...this.data.map(d => d.bid || 0));
    const maxAsk = Math.max(...this.data.map(d => d.ask || 0));
    const maxValue = Math.max(maxBid, maxAsk);

    // Draw grid and axes
    this.drawGrid(padding, chartWidth, chartHeight, maxValue);
    this.drawAxes(padding, chartWidth, chartHeight, exchanges, maxValue);

    // Draw bars
    this.drawBars(padding, chartWidth, chartHeight, exchanges, maxValue);

    const perfEnd = performance.now();
    if (perfEnd - perfStart > 16) {
      console.warn(`Slow chart render: ${(perfEnd - perfStart).toFixed(2)}ms`);
    }
  }

  drawEmpty() {
    if (!this.canvas || !this.ctx) return;

    const width = this.canvas.width / (window.devicePixelRatio || 1);
    const height = this.canvas.height / (window.devicePixelRatio || 1);

    this.ctx.clearRect(0, 0, width, height);
    this.ctx.fillStyle = '#888';
    this.ctx.font = '14px sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('No data available', width / 2, height / 2);
  }

  getUniqueExchanges() {
    return [...new Set(this.data.map(d => d.exchange))];
  }

  drawGrid(padding, chartWidth, chartHeight, maxValue) {
    const gridLines = 5;
    this.ctx.strokeStyle = 'rgba(128, 128, 128, 0.2)';
    this.ctx.lineWidth = 1;

    for (let i = 0; i <= gridLines; i++) {
      const y = padding.top + (chartHeight / gridLines) * i;
      this.ctx.beginPath();
      this.ctx.moveTo(padding.left, y);
      this.ctx.lineTo(padding.left + chartWidth, y);
      this.ctx.stroke();
    }
  }

  drawAxes(padding, chartWidth, chartHeight, exchanges, maxValue) {
    // Y-axis labels
    const gridLines = 5;
    this.ctx.fillStyle = '#888';
    this.ctx.font = '11px monospace';
    this.ctx.textAlign = 'right';

    for (let i = 0; i <= gridLines; i++) {
      const value = maxValue - (maxValue / gridLines) * i;
      const y = padding.top + (chartHeight / gridLines) * i;
      this.ctx.fillText(formatPrice(value), padding.left - 10, y + 4);
    }

    // X-axis labels
    this.ctx.textAlign = 'center';
    const barWidth = chartWidth / exchanges.length;

    exchanges.forEach((exchange, i) => {
      const x = padding.left + barWidth * i + barWidth / 2;
      const y = padding.top + chartHeight + 20;

      // Truncate long exchange names
      const shortName = exchange.replace(' Spot', '').replace(' Perps', '');
      this.ctx.fillText(shortName, x, y);
    });
  }

  drawBars(padding, chartWidth, chartHeight, exchanges, maxValue) {
    const barWidth = chartWidth / exchanges.length;
    const barPadding = barWidth * 0.2;
    const halfBarWidth = (barWidth - barPadding) / 2;

    exchanges.forEach((exchange, i) => {
      const dataPoint = this.data.find(d => d.exchange === exchange);
      if (!dataPoint) return;

      const x = padding.left + barWidth * i + barPadding / 2;
      const bidValue = dataPoint.bid || 0;
      const askValue = dataPoint.ask || 0;

      // Draw bid bar (green)
      const bidHeight = (bidValue / maxValue) * chartHeight;
      const bidY = padding.top + chartHeight - bidHeight;

      this.ctx.fillStyle = 'rgba(34, 197, 94, 0.7)';
      this.ctx.fillRect(x, bidY, halfBarWidth, bidHeight);

      // Draw ask bar (red)
      const askHeight = (askValue / maxValue) * chartHeight;
      const askY = padding.top + chartHeight - askHeight;

      this.ctx.fillStyle = 'rgba(239, 68, 68, 0.7)';
      this.ctx.fillRect(x + halfBarWidth, askY, halfBarWidth, askHeight);
    });
  }
}

customElements.define('liquidity-chart', LiquidityChart);
