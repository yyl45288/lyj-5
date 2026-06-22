class LeaderboardManager {
  constructor() {
    this.sseClient = null;
    this.topScores = [];
    this.highlightedRecordId = null;
    this.newRecordAnimationTimeout = null;
    this.isInitialized = false;
  }

  init() {
    if (this.isInitialized) return;

    this.sseClient = new SSEClient('/api/scores/stream', {
      maxReconnectAttempts: 10,
      reconnectDelay: 3000,
      heartbeatInterval: 20000
    });

    this.sseClient.on('scoreUpdate', (data) => this._handleScoreUpdate(data));
    this.sseClient.on('heartbeat', (data) => this._handleHeartbeat(data));
    this.sseClient.on('connect', (data) => this._handleConnect(data));
    this.sseClient.on('disconnect', () => this._handleDisconnect());
    this.sseClient.on('reconnecting', (data) => this._handleReconnecting(data));
    this.sseClient.on('error', (error) => this._handleError(error));

    this.sseClient.connect();
    this.isInitialized = true;
    this._bindEvents();
  }

  destroy() {
    if (this.sseClient) {
      this.sseClient.disconnect();
      this.sseClient = null;
    }
    this.isInitialized = false;
  }

  _bindEvents() {
    const scoresBtn = document.getElementById('scores-btn');
    if (scoresBtn) {
      scoresBtn.addEventListener('click', () => {
        this.renderScoresList();
      });
    }
  }

  _handleScoreUpdate(data) {
    console.log('[Leaderboard] Score update received:', data);

    const oldScores = [...this.topScores];
    this.topScores = data.topScores || [];

    this._updateOnlineCount(data.onlinePlayers);

    if (data.type === 'new_record') {
      this.highlightedRecordId = data.record.id;
      this._showNewRecordNotification(data);
      this._animateNewRecord(data.record, data.rank);
    }

    this.renderScoresList();
    this.renderLiveLeaderboard();
  }

  _handleHeartbeat(data) {
    this._updateOnlineCount(data.onlinePlayers);
  }

  _handleConnect(data) {
    this._updateConnectionStatus(true);
    this._updateOnlineCount(data.onlinePlayers);
  }

  _handleDisconnect() {
    this._updateConnectionStatus(false);
  }

  _handleReconnecting(data) {
    this._updateConnectionStatus(false, data.attempt);
  }

  _handleError(error) {
    console.error('[Leaderboard] Error:', error);
    if (error.type === 'max_reconnect') {
      this._showNotification('⚠️ 无法连接到排行榜服务器', 'error');
    }
  }

  _updateOnlineCount(count) {
    const onlineEl = document.getElementById('online-count');
    if (onlineEl) {
      onlineEl.textContent = count || 0;
    }

    const liveOnlineEl = document.getElementById('live-online-count');
    if (liveOnlineEl) {
      liveOnlineEl.textContent = count || 0;
    }
  }

  _updateConnectionStatus(connected, attempt = null) {
    const statusEl = document.getElementById('connection-status');
    if (!statusEl) return;

    if (connected) {
      statusEl.innerHTML = '<span class="status-dot connected"></span> 实时同步';
      statusEl.title = '已连接到排行榜服务器';
    } else {
      if (attempt) {
        statusEl.innerHTML = `<span class="status-dot reconnecting"></span> 重连中 (${attempt})`;
      } else {
        statusEl.innerHTML = '<span class="status-dot disconnected"></span> 已断开';
      }
      statusEl.title = '与排行榜服务器连接中断';
    }
  }

  _showNewRecordNotification(data) {
    const rank = data.rank;
    const score = data.record.score;
    const message = rank <= 3
      ? `🎉 恭喜！新纪录！第 ${rank} 名！积分 ${score.toLocaleString()}`
      : `📊 排行榜更新！第 ${rank} 名，积分 ${score.toLocaleString()}`;

    this._showNotification(message, 'success');
  }

  _animateNewRecord(record, rank) {
    if (this.newRecordAnimationTimeout) {
      clearTimeout(this.newRecordAnimationTimeout);
    }

    setTimeout(() => {
      const scoreRow = document.querySelector(`.score-row[data-record-id="${record.id}"]`);
      if (scoreRow) {
        scoreRow.classList.add('new-record');
        this.newRecordAnimationTimeout = setTimeout(() => {
          scoreRow.classList.remove('new-record');
          this.highlightedRecordId = null;
        }, 5000);
      }
    }, 100);
  }

  _showNotification(message, type = 'info') {
    if (typeof game !== 'undefined' && game.showNotification) {
      game.showNotification(message);
      return;
    }

    const notification = document.getElementById('notification');
    if (notification) {
      notification.textContent = message;
      notification.className = `notification ${type}`;
      notification.classList.remove('hidden');
      setTimeout(() => {
        notification.classList.add('hidden');
      }, 3000);
    }
  }

  renderScoresList() {
    const container = document.getElementById('scores-list');
    if (!container) return;

    if (!this.topScores || this.topScores.length === 0) {
      container.innerHTML = `
        <div class="empty-scores">
          <div class="empty-icon">🏆</div>
          <p>暂无排行记录</p>
          <p class="empty-hint">成为第一个上榜的玩家吧！</p>
        </div>
      `;
      return;
    }

    let html = '<div class="scores-list-inner">';
    this.topScores.forEach((record, index) => {
      const rank = index + 1;
      const rankIcon = this._getRankIcon(rank);
      const isHighlighted = record.id === this.highlightedRecordId;
      const highlightClass = isHighlighted ? 'new-record' : '';
      const date = new Date(record.date);
      const formattedDate = `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;

      html += `
        <div class="score-row ${highlightClass}" data-record-id="${record.id}" data-rank="${rank}">
          <div class="score-rank ${rank <= 3 ? 'top-rank' : ''}">
            <span class="rank-icon">${rankIcon}</span>
            <span class="rank-number">${rank}</span>
          </div>
          <div class="score-info">
            <div class="score-main">
              <span class="score-value">${record.score.toLocaleString()}</span>
              <span class="score-label">积分</span>
            </div>
            <div class="score-stats">
              <span class="score-stat">⚔️ ${record.kills} 击杀</span>
              <span class="score-stat">🏰 ${record.floor} 层</span>
              <span class="score-date">${formattedDate}</span>
            </div>
          </div>
        </div>
      `;
    });
    html += '</div>';

    container.innerHTML = html;
  }

  renderLiveLeaderboard() {
    const container = document.getElementById('live-leaderboard-list');
    if (!container) return;

    if (!this.topScores || this.topScores.length === 0) {
      container.innerHTML = '<div class="live-empty">暂无记录</div>';
      return;
    }

    const top5 = this.topScores.slice(0, 5);
    let html = '';

    top5.forEach((record, index) => {
      const rank = index + 1;
      const rankIcon = this._getRankIcon(rank);
      const isHighlighted = record.id === this.highlightedRecordId;
      const highlightClass = isHighlighted ? 'live-new-record' : '';

      html += `
        <div class="live-score-row ${highlightClass}" data-record-id="${record.id}">
          <span class="live-rank ${rank <= 3 ? 'live-top-rank' : ''}">${rankIcon}${rank}</span>
          <span class="live-score">${record.score.toLocaleString()}</span>
          <span class="live-floor">${record.floor}层</span>
        </div>
      `;
    });

    container.innerHTML = html;
  }

  _getRankIcon(rank) {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return '';
    }
  }

  getTopScores() {
    return [...this.topScores];
  }

  getOnlineCount() {
    return this.sseClient ? this.sseClient.getOnlineCount() : 0;
  }

  isConnected() {
    return this.sseClient ? this.sseClient.isConnectedToServer() : false;
  }
}

window.LeaderboardManager = LeaderboardManager;
window.leaderboardManager = new LeaderboardManager();
