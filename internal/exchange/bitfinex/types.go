package bitfinex

// Config holds Bitfinex exchange configuration
type Config struct {
	Symbol string
}

// SnapshotResponse represents the orderbook snapshot from Bitfinex
type SnapshotResponse [][]interface{}

// WSSubscribeMessage represents subscription message
type WSSubscribeMessage struct {
	Event   string `json:"event"`
	Channel string `json:"channel"`
	Symbol  string `json:"symbol"`
	Prec    string `json:"prec,omitempty"`
	Freq    string `json:"freq,omitempty"`
	Len     string `json:"len,omitempty"`
}

// WSEventMessage represents event messages (subscribed, info, etc)
type WSEventMessage struct {
	Event   string `json:"event"`
	Code    int    `json:"code,omitempty"`
	Msg     string `json:"msg,omitempty"`
	Channel string `json:"channel,omitempty"`
	ChanID  int    `json:"chanId,omitempty"`
	Symbol  string `json:"symbol,omitempty"`
	Pair    string `json:"pair,omitempty"`
	Prec    string `json:"prec,omitempty"`
	Freq    string `json:"freq,omitempty"`
	Len     string `json:"len,omitempty"`
}

// WSUpdateMessage represents orderbook update messages
// Format: [CHANNEL_ID, DATA]
// Snapshot: [CHANNEL_ID, [[PRICE, COUNT, AMOUNT], ...]]
// Update: [CHANNEL_ID, [PRICE, COUNT, AMOUNT]]
type WSUpdateMessage []interface{}
