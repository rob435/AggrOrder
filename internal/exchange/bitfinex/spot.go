package bitfinex

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strconv"
	"sync"
	"sync/atomic"
	"time"

	"github.com/gorilla/websocket"
	"orderbook/internal/exchange"
)

// SpotExchange implements the Exchange interface for Bitfinex Spot
type SpotExchange struct {
	symbol     string
	wsURL      string
	restURL    string
	wsConn     *websocket.Conn
	updateChan chan *exchange.DepthUpdate
	done       chan struct{}
	ctx        context.Context
	cancel     context.CancelFunc
	health     atomic.Value // stores exchange.HealthStatus

	chanID     int
	chanIDLock sync.RWMutex

	bids       map[string]string // price -> amount
	asks       map[string]string
	bookLock   sync.RWMutex

	lastUpdateID int64
}

// NewSpotExchange creates a new Bitfinex Spot exchange instance
func NewSpotExchange(config Config) *SpotExchange {
	ctx, cancel := context.WithCancel(context.Background())

	// Bitfinex uses tBTCUSD format for trading pairs
	symbol := formatSymbol(config.Symbol)
	wsURL := "wss://api-pub.bitfinex.com/ws/2"
	restURL := fmt.Sprintf("https://api-pub.bitfinex.com/v2/book/%s/P0", symbol)

	ex := &SpotExchange{
		symbol:     symbol,
		wsURL:      wsURL,
		restURL:    restURL,
		updateChan: make(chan *exchange.DepthUpdate, 1000),
		done:       make(chan struct{}),
		ctx:        ctx,
		cancel:     cancel,
		bids:       make(map[string]string),
		asks:       make(map[string]string),
	}

	ex.health.Store(exchange.HealthStatus{
		Connected:    false,
		LastPing:     time.Time{},
		MessageCount: 0,
		ErrorCount:   0,
	})

	return ex
}

// formatSymbol converts symbol to Bitfinex format (e.g., BTCUSDT -> tBTCUSD)
func formatSymbol(symbol string) string {
	// Convert BTCUSDT to tBTCUSD
	if len(symbol) >= 6 {
		if symbol[len(symbol)-4:] == "USDT" {
			return "t" + symbol[:len(symbol)-1] // Remove T from USDT
		}
	}
	return "t" + symbol
}

// GetName returns the exchange name
func (e *SpotExchange) GetName() exchange.ExchangeName {
	return exchange.Bitfinex
}

// GetSymbol returns the trading symbol
func (e *SpotExchange) GetSymbol() string {
	return e.symbol
}

// Connect establishes WebSocket connection to Bitfinex
func (e *SpotExchange) Connect(ctx context.Context) error {
	dialer := websocket.Dialer{
		HandshakeTimeout: 10 * time.Second,
	}

	conn, _, err := dialer.DialContext(ctx, e.wsURL, nil)
	if err != nil {
		e.incrementErrorCount()
		return fmt.Errorf("websocket connection failed: %w", err)
	}

	e.wsConn = conn
	e.updateConnectionStatus(true)
	log.Printf("[%s] WebSocket connected successfully", e.GetName())

	// Subscribe to orderbook channel
	subscribeMsg := WSSubscribeMessage{
		Event:   "subscribe",
		Channel: "book",
		Symbol:  e.symbol,
		Prec:    "P0", // Precision level 0 (max precision)
		Freq:    "F0", // Frequency level 0 (realtime)
		Len:     "100", // Number of price levels
	}

	if err := conn.WriteJSON(subscribeMsg); err != nil {
		e.incrementErrorCount()
		return fmt.Errorf("failed to subscribe: %w", err)
	}

	log.Printf("[%s] Subscribed to book channel for %s", e.GetName(), e.symbol)

	go e.readMessages()

	return nil
}

// Close closes the WebSocket connection
func (e *SpotExchange) Close() error {
	if e.cancel != nil {
		e.cancel()
	}

	if e.wsConn != nil {
		select {
		case <-e.done:
		default:
			close(e.done)
		}

		err := e.wsConn.WriteMessage(websocket.CloseMessage,
			websocket.FormatCloseMessage(websocket.CloseNormalClosure, ""))
		if err != nil {
			log.Printf("[%s] Error sending close message: %v", e.GetName(), err)
		}

		select {
		case <-time.After(time.Second):
		}

		e.updateConnectionStatus(false)
		return e.wsConn.Close()
	}
	return nil
}

// GetSnapshot fetches the initial orderbook snapshot via REST API
func (e *SpotExchange) GetSnapshot(ctx context.Context) (*exchange.Snapshot, error) {
	log.Printf("[%s] Fetching orderbook snapshot...", e.GetName())

	req, err := http.NewRequestWithContext(ctx, "GET", e.restURL, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		e.incrementErrorCount()
		return nil, fmt.Errorf("failed to get snapshot: %w", err)
	}
	defer resp.Body.Close()

	var bitfinexSnapshot SnapshotResponse
	if err := json.NewDecoder(resp.Body).Decode(&bitfinexSnapshot); err != nil {
		e.incrementErrorCount()
		return nil, fmt.Errorf("failed to decode snapshot: %w", err)
	}

	snapshot := e.convertSnapshot(bitfinexSnapshot)
	return snapshot, nil
}

// Updates returns a channel that receives depth updates
func (e *SpotExchange) Updates() <-chan *exchange.DepthUpdate {
	return e.updateChan
}

// IsConnected checks if the WebSocket connection is active
func (e *SpotExchange) IsConnected() bool {
	return e.wsConn != nil
}

// Health returns connection health information
func (e *SpotExchange) Health() exchange.HealthStatus {
	if status, ok := e.health.Load().(exchange.HealthStatus); ok {
		return status
	}
	return exchange.HealthStatus{}
}

// readMessages continuously reads WebSocket messages
func (e *SpotExchange) readMessages() {
	defer close(e.updateChan)
	defer e.updateConnectionStatus(false)

	for {
		select {
		case <-e.ctx.Done():
			log.Printf("[%s] Context cancelled, stopping message reading", e.GetName())
			return
		case <-e.done:
			return
		default:
			_, message, err := e.wsConn.ReadMessage()
			if err != nil {
				e.incrementErrorCount()
				log.Printf("[%s] WebSocket read error: %v", e.GetName(), err)
				return
			}

			e.incrementMessageCount()
			e.updateLastPing()

			// Try to parse as event message first
			var eventMsg WSEventMessage
			if err := json.Unmarshal(message, &eventMsg); err == nil && eventMsg.Event != "" {
				e.handleEventMessage(&eventMsg)
				continue
			}

			// Parse as update message
			var updateMsg WSUpdateMessage
			if err := json.Unmarshal(message, &updateMsg); err == nil {
				e.handleUpdateMessage(updateMsg)
			}
		}
	}
}

// handleEventMessage processes event messages (subscribed, info, etc)
func (e *SpotExchange) handleEventMessage(msg *WSEventMessage) {
	switch msg.Event {
	case "subscribed":
		e.chanIDLock.Lock()
		e.chanID = msg.ChanID
		e.chanIDLock.Unlock()
		log.Printf("[%s] Subscribed to channel %d for %s", e.GetName(), msg.ChanID, msg.Symbol)
	case "info":
		log.Printf("[%s] Info: %s", e.GetName(), msg.Msg)
	case "error":
		log.Printf("[%s] Error: %s (code: %d)", e.GetName(), msg.Msg, msg.Code)
		e.incrementErrorCount()
	}
}

// handleUpdateMessage processes orderbook update messages
func (e *SpotExchange) handleUpdateMessage(msg WSUpdateMessage) {
	if len(msg) < 2 {
		return
	}

	// Check channel ID
	chanID, ok := msg[0].(float64)
	if !ok {
		return
	}

	e.chanIDLock.RLock()
	expectedChanID := e.chanID
	e.chanIDLock.RUnlock()

	if int(chanID) != expectedChanID {
		return
	}

	data := msg[1]

	// Check if this is a snapshot (array of arrays) or update (single array)
	switch v := data.(type) {
	case []interface{}:
		if len(v) > 0 {
			// Check if first element is also an array (snapshot)
			if _, isArray := v[0].([]interface{}); isArray {
				e.handleSnapshot(v)
			} else {
				// Single update
				e.handleUpdate(v)
			}
		}
	}
}

// handleSnapshot processes orderbook snapshot
func (e *SpotExchange) handleSnapshot(data []interface{}) {
	e.bookLock.Lock()
	defer e.bookLock.Unlock()

	// Clear existing orderbook
	e.bids = make(map[string]string)
	e.asks = make(map[string]string)

	for _, item := range data {
		entry, ok := item.([]interface{})
		if !ok || len(entry) < 3 {
			continue
		}

		price, priceOk := entry[0].(float64)
		_, countOk := entry[1].(float64) // count indicates number of orders at this price
		amount, amountOk := entry[2].(float64)

		if !priceOk || !countOk || !amountOk {
			continue
		}

		priceStr := strconv.FormatFloat(price, 'f', -1, 64)
		amountStr := strconv.FormatFloat(absFloat(amount), 'f', -1, 64)

		if amount > 0 {
			// Bid
			e.bids[priceStr] = amountStr
		} else {
			// Ask
			e.asks[priceStr] = amountStr
		}
	}

	// Send snapshot as update
	e.sendUpdate()
}

// handleUpdate processes single orderbook update
func (e *SpotExchange) handleUpdate(entry []interface{}) {
	if len(entry) < 3 {
		return
	}

	price, priceOk := entry[0].(float64)
	count, countOk := entry[1].(float64)
	amount, amountOk := entry[2].(float64)

	if !priceOk || !countOk || !amountOk {
		return
	}

	priceStr := strconv.FormatFloat(price, 'f', -1, 64)

	e.bookLock.Lock()
	defer e.bookLock.Unlock()

	if count == 0 {
		// Remove price level
		// count == 0 means delete the price level
		// The sign of amount indicates side (bid=positive, ask=negative)
		if amount > 0 {
			delete(e.bids, priceStr)
		} else {
			delete(e.asks, priceStr)
		}
	} else {
		// Update price level
		amountStr := strconv.FormatFloat(absFloat(amount), 'f', -1, 64)
		if amount > 0 {
			e.bids[priceStr] = amountStr
		} else {
			e.asks[priceStr] = amountStr
		}
	}

	e.sendUpdate()
}

// sendUpdate sends current orderbook state as update
func (e *SpotExchange) sendUpdate() {
	bids := make([]exchange.PriceLevel, 0, len(e.bids))
	for price, amount := range e.bids {
		bids = append(bids, exchange.PriceLevel{
			Price:    price,
			Quantity: amount,
		})
	}

	asks := make([]exchange.PriceLevel, 0, len(e.asks))
	for price, amount := range e.asks {
		asks = append(asks, exchange.PriceLevel{
			Price:    price,
			Quantity: amount,
		})
	}

	e.lastUpdateID++

	update := &exchange.DepthUpdate{
		Exchange:      e.GetName(),
		Symbol:        e.symbol,
		EventTime:     time.Now(),
		FirstUpdateID: e.lastUpdateID,
		FinalUpdateID: e.lastUpdateID,
		PrevUpdateID:  e.lastUpdateID - 1,
		Bids:          bids,
		Asks:          asks,
	}

	select {
	case e.updateChan <- update:
	case <-e.ctx.Done():
		return
	case <-e.done:
		return
	default:
		log.Printf("[%s] Warning: update channel full, skipping update", e.GetName())
	}
}

// convertSnapshot converts Bitfinex snapshot to canonical format
func (e *SpotExchange) convertSnapshot(snapshot SnapshotResponse) *exchange.Snapshot {
	bids := make([]exchange.PriceLevel, 0)
	asks := make([]exchange.PriceLevel, 0)

	for _, item := range snapshot {
		if len(item) < 3 {
			continue
		}

		price, priceOk := item[0].(float64)
		_, countOk := item[1].(float64)
		amount, amountOk := item[2].(float64)

		if !priceOk || !countOk || !amountOk {
			continue
		}

		priceStr := strconv.FormatFloat(price, 'f', -1, 64)
		amountStr := strconv.FormatFloat(absFloat(amount), 'f', -1, 64)

		if amount > 0 {
			// Bid
			bids = append(bids, exchange.PriceLevel{
				Price:    priceStr,
				Quantity: amountStr,
			})
		} else {
			// Ask
			asks = append(asks, exchange.PriceLevel{
				Price:    priceStr,
				Quantity: amountStr,
			})
		}
	}

	return &exchange.Snapshot{
		Exchange:     e.GetName(),
		Symbol:       e.symbol,
		LastUpdateID: 0,
		Bids:         bids,
		Asks:         asks,
		Timestamp:    time.Now(),
	}
}

// absFloat returns absolute value of float64
func absFloat(x float64) float64 {
	if x < 0 {
		return -x
	}
	return x
}

// updateConnectionStatus updates the connection status in health
func (e *SpotExchange) updateConnectionStatus(connected bool) {
	status := e.Health()
	status.Connected = connected
	if !connected {
		now := time.Now()
		status.ReconnectTime = &now
	}
	e.health.Store(status)
}

// incrementMessageCount increments the message count in health
func (e *SpotExchange) incrementMessageCount() {
	status := e.Health()
	status.MessageCount++
	e.health.Store(status)
}

// incrementErrorCount increments the error count in health
func (e *SpotExchange) incrementErrorCount() {
	status := e.Health()
	status.ErrorCount++
	e.health.Store(status)
}

// updateLastPing updates the last ping time in health
func (e *SpotExchange) updateLastPing() {
	status := e.Health()
	status.LastPing = time.Now()
	e.health.Store(status)
}
