class SSEClient {
  constructor(url, options = {}) {
    this.url = url;
    this.eventSource = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = options.maxReconnectAttempts || 10;
    this.reconnectDelay = options.reconnectDelay || 3000;
    this.maxReconnectDelay = options.maxReconnectDelay || 30000;
    this.listeners = {};
    this.isConnected = false;
    this.heartbeatTimeout = null;
    this.heartbeatInterval = options.heartbeatInterval || 20000;
    this.onlinePlayers = 0;
  }

  connect() {
    try {
      this.eventSource = new EventSource(this.url);

      this.eventSource.onopen = (event) => {
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this._startHeartbeatMonitor();
        this._emit('connect', { onlinePlayers: this.onlinePlayers });
        console.log('[SSE] Connected to server');
      };

      this.eventSource.onmessage = (event) => {
        console.log('[SSE] Message received:', event.data);
      };

      this.eventSource.onerror = (error) => {
        console.warn('[SSE] Connection error:', error);
        this.isConnected = false;
        this._stopHeartbeatMonitor();

        if (this.eventSource.readyState === EventSource.CLOSED) {
          this._attemptReconnect();
        }
      };

      this.eventSource.addEventListener('score_update', (event) => {
        try {
          const data = JSON.parse(event.data);
          this.onlinePlayers = data.onlinePlayers || this.onlinePlayers;
          this._emit('scoreUpdate', data);
        } catch (e) {
          console.error('[SSE] Failed to parse score_update:', e);
        }
      });

      this.eventSource.addEventListener('heartbeat', (event) => {
        try {
          const data = JSON.parse(event.data);
          this.onlinePlayers = data.onlinePlayers || this.onlinePlayers;
          this._resetHeartbeatMonitor();
          this._emit('heartbeat', data);
        } catch (e) {
          console.error('[SSE] Failed to parse heartbeat:', e);
        }
      });

    } catch (error) {
      console.error('[SSE] Failed to connect:', error);
      this._attemptReconnect();
    }
  }

  disconnect() {
    this._stopHeartbeatMonitor();
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    this.isConnected = false;
    this._emit('disconnect', {});
    console.log('[SSE] Disconnected from server');
  }

  reconnect() {
    this.disconnect();
    this.reconnectAttempts = 0;
    this.connect();
  }

  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
    return () => this.off(event, callback);
  }

  off(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    }
  }

  _emit(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => {
        try {
          callback(data);
        } catch (e) {
          console.error(`[SSE] Error in ${event} listener:`, e);
        }
      });
    }
  }

  _startHeartbeatMonitor() {
    this._resetHeartbeatMonitor();
  }

  _resetHeartbeatMonitor() {
    this._stopHeartbeatMonitor();
    this.heartbeatTimeout = setTimeout(() => {
      console.warn('[SSE] Heartbeat timeout, reconnecting...');
      this._forceReconnect();
    }, this.heartbeatInterval + 5000);
  }

  _stopHeartbeatMonitor() {
    if (this.heartbeatTimeout) {
      clearTimeout(this.heartbeatTimeout);
      this.heartbeatTimeout = null;
    }
  }

  _attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[SSE] Max reconnect attempts reached');
      this._emit('error', { type: 'max_reconnect', message: '无法连接到服务器' });
      return;
    }

    const delay = Math.min(
      this.reconnectDelay * Math.pow(2, this.reconnectAttempts),
      this.maxReconnectDelay
    );

    this.reconnectAttempts++;
    console.log(`[SSE] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
    this._emit('reconnecting', { attempt: this.reconnectAttempts, delay });

    setTimeout(() => {
      if (!this.isConnected) {
        this.connect();
      }
    }, delay);
  }

  _forceReconnect() {
    if (this.eventSource) {
      this.eventSource.close();
    }
    this.isConnected = false;
    this._attemptReconnect();
  }

  getOnlineCount() {
    return this.onlinePlayers;
  }

  isConnectedToServer() {
    return this.isConnected;
  }
}

window.SSEClient = SSEClient;
