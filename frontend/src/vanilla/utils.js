/**
 * Utility functions for formatting and calculations
 */

export function formatNumber(num, decimals = 2) {
  if (num === null || num === undefined || isNaN(num)) return '-';
  return num.toFixed(decimals);
}

export function formatPrice(price) {
  return formatNumber(parseFloat(price), 2);
}

export function formatQuantity(qty) {
  return formatNumber(parseFloat(qty), 4);
}

export function calculateMaxCumulative(levels) {
  if (!levels || levels.length === 0) return 0;
  return Math.max(...levels.map(l => parseFloat(l.cumulative)));
}

export function filterExchangesByMarket(exchange, filter) {
  if (filter === 'all') return true;
  if (filter === 'spot') return !exchange.endsWith('f');
  if (filter === 'perps') return exchange.endsWith('f');
  return true;
}

export function sortExchangesByGroup(exchanges) {
  const groups = {
    'Binance Spot': 1,
    'Binance Perps': 2,
    'Bybit Spot': 3,
    'Bybit Perps': 4,
    'Coinbase Spot': 5,
    'Kraken Spot': 6,
    'OKX Spot': 7,
    'OKX Perps': 8,
  };

  return exchanges.sort((a, b) => {
    const aGroup = groups[a] || 999;
    const bGroup = groups[b] || 999;
    return aGroup - bGroup;
  });
}

export function getExchangeIcon(exchange) {
  const lowerExchange = exchange.toLowerCase();

  if (lowerExchange.includes('binance')) {
    return { name: 'Binance', svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2500 2500"><path d="M1250 187.5l562.5 562.5-562.5 562.5-562.5-562.5L1250 187.5zM437.5 1250l562.5 562.5 562.5-562.5-562.5-562.5L437.5 1250zm812.5 812.5l562.5-562.5-562.5-562.5-562.5 562.5 562.5 562.5z" fill="#FCD535"/><path d="M1250 1250l250-250-250-250-250 250 250 250z" fill="#FCD535"/></svg>' };
  } else if (lowerExchange.includes('bybit')) {
    return { name: 'Bybit', svg: '<svg width="88" height="88" viewBox="0 0 88 88" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M0 18.7C0 8.37227 8.37228 0 18.7 0H69.3C79.6277 0 88 8.37228 88 18.7V69.3C88 79.6277 79.6277 88 69.3 88H18.7C8.37227 88 0 79.6277 0 69.3V18.7Z" fill="#404347"/><path d="M7.57617 26.8067C6.78516 24.0787 8.4775 21.2531 11.2559 20.663L57.6087 10.8173C59.809 10.35 62.0443 11.4443 63.0247 13.4689L83.8443 56.4657L25.1776 87.5101L7.57617 26.8067Z" fill="url(#paint0_linear_312_17534)"/><path d="M8.18242 30.1618C7.35049 27.2838 9.27925 24.3413 12.2502 23.9559L73.6865 15.9881C76.2391 15.6571 78.6111 17.3618 79.1111 19.8867L88.0003 64.7771L24.6892 87.2665L8.18242 30.1618Z" fill="white"/><path d="M0 34.2222C0 28.8221 4.37766 24.4445 9.77778 24.4445H68.4444C79.2447 24.4445 88 33.1998 88 44V68.4445C88 79.2447 79.2447 88 68.4444 88H19.5556C8.75532 88 0 79.2447 0 68.4445V34.2222Z" fill="black"/><path d="M58.2201 61.1959V42.8755H61.7937V61.1959H58.2201Z" fill="#F7A600"/><path d="M17.4395 66.6637H9.77795V48.3434H17.1313C20.7049 48.3434 22.7874 50.3505 22.7874 53.4893C22.7874 55.5215 21.4504 56.8345 20.5257 57.2721C21.6315 57.7869 23.0456 58.9438 23.0456 61.3885C23.0456 64.8108 20.7049 66.6637 17.4395 66.6637ZM16.8481 51.5343H13.3516V55.7548H16.8481C18.3642 55.7548 19.2138 54.9064 19.2138 53.6455C19.2138 52.3826 18.3662 51.5343 16.8481 51.5343ZM17.0793 58.9708H13.3516V63.4728H17.0793C18.6994 63.4728 19.47 62.4432 19.47 61.2092C19.472 59.9733 18.6994 58.9708 17.0793 58.9708Z" fill="white"/><path d="M27.1312 66.6637V48.3434H38.0132V51.5343H30.7048V56.426H37.2677V59.6169H30.7048V63.4728H38.2444V66.6637H27.1312Z" fill="white"/><path d="M42.0918 66.6637V48.3434H53.8791V51.5343H45.6654V56.426H52.839V59.6169H45.6654V66.6637H42.0918Z" fill="white"/><path d="M65.8414 66.6637H62.2678L58.2202 60.0545V66.6637H54.6466V48.3434H58.2202V54.8983L62.0366 48.3434H65.8706L61.135 54.489L65.8414 66.6637Z" fill="white"/><defs><linearGradient id="paint0_linear_312_17534" x1="45.7102" y1="9.99204" x2="45.7102" y2="87.5101" gradientUnits="userSpaceOnUse"><stop stop-color="#F7A600"/><stop offset="1" stop-color="#F48400"/></linearGradient></defs></svg>' };
  } else if (lowerExchange.includes('coinbase')) {
    return { name: 'Coinbase', svg: '<svg width="1024" height="1024" viewBox="0 0 1024 1024" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="512" cy="512" r="512" fill="#0052FF"/><path d="M268 512C268 376.432 376.432 268 512 268C647.568 268 756 376.432 756 512C756 647.568 647.568 756 512 756C376.432 756 268 647.568 268 512ZM512 338C415.34 338 338 415.34 338 512C338 608.66 415.34 686 512 686C608.66 686 686 608.66 686 512C686 415.34 608.66 338 512 338Z" fill="white"/><path d="M442 442H582V582H442V442Z" fill="white"/></svg>' };
  } else if (lowerExchange.includes('kraken')) {
    return { name: 'Kraken', svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024"><defs><style>.cls-1{fill:#fff;}</style></defs><title>Kraken-Logotype-White</title><g id="Layer_2" data-name="Layer 2"><g id="Layer_1-2" data-name="Layer 1"><path class="cls-1" d="M512,0A512,512,0,1,0,952.3,748.7,512,512,0,0,0,512,0ZM339.3,273.4H423v83.4H339.3Zm0,166.8H423v83.4H339.3Zm0,166.8H423V690.4H339.3ZM684.7,748.7,512,591.5,339.3,748.7H226.6L453.2,522.1,226.6,295.5H339.3L512,452.7,684.7,295.5H797.4L570.8,522.1,797.4,748.7Z"/></g></g></svg>' };
  } else if (lowerExchange.includes('okx')) {
    return { name: 'OKX', svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 558 157.5"><path d="M44.9 111.8V45.7h23.5v25.8l21.3-25.8h27.8L89.7 79.2l29.9 32.6h-29l-16.2-19-19.5 19zm120.3-66.1v66.1h62.8V89.4h-39.3V74h37.6V45.7zm70.7 66.1V45.7h23.5v66.1zm120.2-33.2L299.9 0 243.7 45.7h29.9l26.3-23.1 26.3 23.1zm62.8 33.2V45.7h23.5v25.8l21.3-25.8h27.8l-27.8 33.5 29.9 32.6h-29l-16.2-19-19.5 19zM558 78.8L513.1 0h-29.9l26.3 45.7-26.3 45.7h29.9zM371.8 45.7h23.5v66.1h-23.5zM115.6 78.8L70.7 0H40.8l26.3 45.7L40.8 91.5h29.9zM0 78.8L44.9 0h29.9L48.5 45.7l26.3 45.7H44.9zM243.7 111.8V45.7h23.5v25.8l21.3-25.8h27.8l-27.8 33.5 29.9 32.6h-29l-16.2-19-19.5 19zM182.4 0l-44.9 78.8L182.4 157.5h29.9l-26.3-45.7 26.3-45.7z"></path></svg>' };
  } else if (lowerExchange.includes('bitfinex')) {
    return { name: 'Bitfinex', svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 894.4 105.4"><path d="M133.7 85.9V20h-19.2v85.4h19.2V85.9zM183.5 20h-19.2v85.4h19.2V20zM233.4 20h-19.2v85.4h19.2V20zM293.2 39.1h-29.9V20h79v19.1h-29.9v16.3h29.9v19.1h-29.9v16.3h29.9v19.1h-79V20h-19.2zM369 20h19.2v66.2h40.4v19.1H369V20zM454.8 20h19.2v85.4h-19.2V20zM504.7 20h-19.2v85.4h19.2V20zM574.5 39.1h-29.9V20h79v19.1h-29.9v16.3h29.9v19.1h-29.9v16.3h29.9v19.1h-79V20h-19.2zM640.3 20h19.2v85.4h-19.2V20zM894.4 48.3c0-15.1-12-27.4-26.8-27.4-14.8 0-26.8 12.3-26.8 27.4s12 27.4 26.8 27.4c14.8 0 26.8-12.3 26.8-27.4zm-34.4 0c0-5.4 4.1-9.8 9.6-9.8 5.5 0 9.6 4.4 9.6 9.8s-4.1 9.8-9.6 9.8c-5.5 0-9.6-4.4-9.6-9.8zM720.1 85.9V20h-19.2v85.4h19.2V85.9zM799.9 20h-19.2v85.4h19.2V20zM89.6 52.7C89.6 23.6 69.5 0 44.8 0 20.1 0 0 23.6 0 52.7c0 29.1 20.1 52.7 44.8 52.7 24.7 0 44.8-23.6 44.8-52.7zm-65.2 0c0-12.9 8.8-23.6 19.7-23.6C55 29.1 64 39.8 64 52.7c0 12.9-8.9 23.6-19.8 23.6-10.9.1-19.8-10.6-19.8-23.6z" fill="#03ca9b"/></svg>' };
  }

  return { name: exchange, svg: '' };
}

export function getMarketType(exchange) {
  return exchange.endsWith('f') ? 'Perps' : 'Spot';
}

export function debounce(fn, delay) {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), delay);
  };
}

export function throttle(fn, delay) {
  let lastCall = 0;
  return function (...args) {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      return fn.apply(this, args);
    }
  };
}
