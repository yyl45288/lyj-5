class Game {
    constructor() {
        this.gameState = null;
        this.combatSystem = null;
        this.selectedItem = null;
        this.autoSaveTimer = null;
    }

    async startNewGame() {
        this.gameState = CharacterSystem.createNewGameState();
        this.combatSystem = new CombatSystem(this.gameState);
        this.startAutoSave();
        this.showScreen('game-screen');
        this.render();
        this.showNotification('🎮 新游戏开始！祝你好运！');
    }

    async continueGame() {
        const result = await StorageManager.loadFromLocal();
        if (result.success) {
            this.gameState = result.gameState;
            this.combatSystem = new CombatSystem(this.gameState);
            this.startAutoSave();
            this.showScreen('game-screen');
            this.render();
            this.showNotification('📂 游戏已加载！');
        } else {
            this.showNotification('❌ 没有找到存档！');
        }
    }

    startAutoSave() {
        if (this.autoSaveTimer) {
            clearInterval(this.autoSaveTimer);
        }
        this.autoSaveTimer = setInterval(() => {
            this.saveGame();
        }, 30000);
    }

    stopAutoSave() {
        if (this.autoSaveTimer) {
            clearInterval(this.autoSaveTimer);
            this.autoSaveTimer = null;
        }
    }

    async saveGame() {
        if (!this.gameState) return;
        const result = await StorageManager.saveToLocal(this.gameState);
        if (result.success) {
            console.log('Game saved successfully');
        }
    }

    movePlayer(direction) {
        if (!this.gameState || this.gameState.combat.active) return;

        const result = CharacterSystem.movePlayer(this.gameState, direction);
        if (!result) return;

        if (result.type === 'death') {
            this.gameOver();
            return;
        }

        if (result.type === 'encounter') {
            this.combatSystem.startCombat(result.enemy);
            this.removeEnemyFromMap(result.position);
            this.render();
            return;
        }

        if (result.type === 'stairs') {
            CharacterSystem.nextFloor(this.gameState);
            this.showNotification(`🚪 进入第 ${this.gameState.dungeon.floor} 层！`);
            const activeWeathers = WeatherSystem.getActiveWeatherDescriptions(this.gameState.weatherState);
            if (activeWeathers.length > 0) {
                setTimeout(() => {
                    this.showNotification(`${activeWeathers.map(w => w.icon + w.name).join(' ')} 天气生效！`);
                }, 1500);
            }
        }

        this.render();
    }

    removeEnemyFromMap(position) {
        const tile = this.gameState.dungeon.tiles[position.y][position.x];
        tile.type = 'floor';
        tile.enemy = null;
    }

    combatAction(action) {
        if (!this.gameState || !this.gameState.combat.active) return;

        let result;
        switch (action) {
            case 'attack':
                result = this.combatSystem.playerAttack();
                break;
            case 'defend':
                result = this.combatSystem.playerDefend();
                break;
            case 'heal':
                CharacterSystem.useHealthPotion(this.gameState);
                this.gameState.combat.playerTurn = false;
                result = { type: 'heal' };
                break;
            case 'flee':
                result = this.combatSystem.playerFlee();
                break;
        }

        this.render();

        if (result && result.type === 'defeat') {
            this.gameOver();
            return;
        }

        if (result && result.type === 'fleeSuccess') {
            this.render();
            return;
        }

        if (result && result.type === 'victory') {
            this.showNotification('🎉 战斗胜利！');
            this.render();
            return;
        }

        setTimeout(() => {
            if (this.gameState.combat.active && !this.gameState.combat.playerTurn) {
                const enemyResult = this.combatSystem.enemyTurn();
                this.render();

                if (enemyResult && enemyResult.type === 'defeat') {
                    this.gameOver();
                }
            }
        }, 800);
    }

    equipItem(itemId) {
        if (!this.gameState) return;
        CharacterSystem.equipItem(this.gameState, itemId);
        this.render();
        this.closeItemModal();
    }

    unequipItem(slot) {
        if (!this.gameState) return;
        CharacterSystem.unequipItem(this.gameState, slot);
        this.render();
    }

    discardItem(itemId) {
        if (!this.gameState) return;
        CharacterSystem.discardItem(this.gameState, itemId);
        this.render();
        this.closeItemModal();
    }

    showItemModal(item) {
        this.selectedItem = item;
        document.getElementById('modal-item-name').textContent = item.name;
        document.getElementById('modal-item-icon').textContent = item.icon;
        
        const rarityElement = document.getElementById('modal-item-rarity');
        rarityElement.textContent = RARITY_NAMES[item.rarity] || '普通';
        rarityElement.style.background = RARITY_COLORS[item.rarity] || '#95A5A6';
        rarityElement.style.color = '#fff';

        const statsContainer = document.getElementById('modal-item-stats');
        statsContainer.innerHTML = '';
        
        if (item.stats && item.stats.attack) {
            statsContainer.innerHTML += `<div class="modal-stat"><span>⚔️ 攻击力</span><span>+${item.stats.attack}</span></div>`;
        }
        if (item.stats && item.stats.defense) {
            statsContainer.innerHTML += `<div class="modal-stat"><span>🛡️ 防御力</span><span>+${item.stats.defense}</span></div>`;
        }
        if (item.stats && item.stats.maxHp) {
            statsContainer.innerHTML += `<div class="modal-stat"><span>❤️ 生命值</span><span>+${item.stats.maxHp}</span></div>`;
        }

        if (item.description) {
            statsContainer.innerHTML += `<div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid rgba(255,255,255,0.1); color: var(--text-secondary); font-size: 0.9rem;">${item.description}</div>`;
        }

        const equipBtn = document.getElementById('equip-btn');
        const useBtn = document.getElementById('use-btn');
        
        if (CharacterSystem.isUsableItem(item)) {
            equipBtn.classList.add('hidden');
            useBtn.classList.remove('hidden');
        } else {
            equipBtn.classList.remove('hidden');
            useBtn.classList.add('hidden');
        }

        document.getElementById('item-modal').classList.remove('hidden');
    }

    useSelectedItem() {
        if (!this.selectedItem) return;
        
        const result = CharacterSystem.useWeatherScroll(this.gameState, this.selectedItem.id);
        if (result && result.success) {
            this.showNotification(result.message);
        }
        
        this.closeItemModal();
        this.render();
    }

    closeItemModal() {
        this.selectedItem = null;
        document.getElementById('item-modal').classList.add('hidden');
    }

    async gameOver() {
        this.stopAutoSave();
        const finalScore = CharacterSystem.calculateScore(this.gameState);
        
        await StorageManager.saveScore(
            finalScore,
            this.gameState.kills,
            this.gameState.dungeon.floor
        );

        StorageManager.clearLocalSave();

        document.getElementById('final-score').textContent = finalScore.toLocaleString();
        document.getElementById('final-kills').textContent = this.gameState.kills;
        document.getElementById('final-floor').textContent = this.gameState.dungeon.floor;
        document.getElementById('final-level').textContent = this.gameState.player.stats.level;

        let medal = '🥉';
        if (finalScore >= 10000) medal = '🥇';
        else if (finalScore >= 5000) medal = '🥈';
        else if (finalScore >= 2000) medal = '🥉';
        else medal = '🏅';

        document.getElementById('medal-display').textContent = medal;

        this.showScreen('gameover-screen');
    }

    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        document.getElementById(screenId).classList.add('active');
    }

    showNotification(message) {
        const notification = document.getElementById('notification');
        notification.textContent = message;
        notification.classList.remove('hidden');
        
        setTimeout(() => {
            notification.classList.add('hidden');
        }, 3000);
    }

    render() {
        if (!this.gameState) return;

        this.renderPlayerStats();
        this.renderWeatherPanel();
        this.renderMap();
        this.renderInventory();
        this.renderGameLog();
        
        if (this.gameState.combat.active) {
            this.renderCombat();
        } else {
            document.getElementById('combat-overlay').classList.add('hidden');
        }
    }

    renderPlayerStats() {
        const player = this.gameState.player;
        const totalStats = CharacterSystem.getPlayerTotalStats(this.gameState);
        const weatherEffects = WeatherSystem.getCombinedEffects(this.gameState.weatherState);

        document.getElementById('player-level').textContent = player.stats.level;
        document.getElementById('player-score').textContent = this.gameState.score.toLocaleString();
        document.getElementById('player-kills').textContent = this.gameState.kills;
        document.getElementById('player-floor').textContent = this.gameState.dungeon.floor;

        const hpPercent = (player.stats.currentHp / totalStats.maxHp) * 100;
        document.getElementById('hp-text').textContent = `${player.stats.currentHp}/${totalStats.maxHp}`;
        document.getElementById('hp-fill').style.width = `${hpPercent}%`;

        const expPercent = (player.stats.exp / player.stats.expToNext) * 100;
        document.getElementById('exp-text').textContent = `${player.stats.exp}/${player.stats.expToNext}`;
        document.getElementById('exp-fill').style.width = `${expPercent}%`;

        const displayAttack = totalStats.attack + weatherEffects.attackMod;
        const displayDefense = totalStats.defense + weatherEffects.defenseMod;
        const attackText = weatherEffects.attackMod !== 0
            ? `${displayAttack} <span style="color:${weatherEffects.attackMod > 0 ? '#2ECC71' : '#E74C3C'}">(${weatherEffects.attackMod > 0 ? '+' : ''}${weatherEffects.attackMod})</span>`
            : totalStats.attack;
        const defenseText = weatherEffects.defenseMod !== 0
            ? `${displayDefense} <span style="color:${weatherEffects.defenseMod > 0 ? '#2ECC71' : '#E74C3C'}">(${weatherEffects.defenseMod > 0 ? '+' : ''}${weatherEffects.defenseMod})</span>`
            : totalStats.defense;

        document.getElementById('player-attack').innerHTML = attackText;
        document.getElementById('player-defense').innerHTML = defenseText;

        this.renderEquipment();
    }

    renderWeatherPanel() {
        const panel = document.getElementById('weather-panel');
        const grid = document.getElementById('weather-grid');
        const activeWeathers = WeatherSystem.getActiveWeatherDescriptions(this.gameState.weatherState);

        if (activeWeathers.length === 0) {
            panel.classList.add('hidden');
            return;
        }

        panel.classList.remove('hidden');

        let html = '';
        activeWeathers.forEach(w => {
            const urgentClass = w.isUrgent ? ' urgent' : '';
            const progressColor = w.isUrgent ? '#E74C3C' : w.color;
            html += `
                <div class="weather-item${urgentClass}" title="${w.description}" style="border-left-color: ${w.color}">
                    <div class="weather-icon">${w.icon}</div>
                    <div class="weather-info">
                        <div class="weather-name">${w.name}</div>
                        <div class="weather-duration">剩余 ${w.duration} 步 / ${w.maxDuration} 步</div>
                        <div class="weather-progress">
                            <div class="weather-progress-bar" style="width: ${w.percent}%; background: ${progressColor}"></div>
                        </div>
                    </div>
                </div>
            `;
        });
        grid.innerHTML = html;
    }

    renderEquipment() {
        const equipment = this.gameState.player.equipment;
        
        ['weapon', 'armor', 'accessory'].forEach(slot => {
            const slotElement = document.querySelector(`[data-slot="${slot}"]`);
            const contentElement = document.getElementById(`equip-${slot}`);
            
            if (equipment[slot]) {
                slotElement.classList.add('equipped');
                contentElement.innerHTML = `
                    <span title="${equipment[slot].name}" style="cursor: pointer;">
                        ${equipment[slot].icon}
                    </span>
                `;
                contentElement.onclick = () => this.unequipItem(slot);
            } else {
                slotElement.classList.remove('equipped');
                contentElement.textContent = '-';
                contentElement.onclick = null;
            }
        });
    }

    renderMap() {
        const dungeon = this.gameState.dungeon;
        const player = this.gameState.player;
        const mapElement = document.getElementById('game-map');
        const mapContainer = document.getElementById('map-container');
        const weatherClasses = WeatherSystem.getWeatherMapClasses(this.gameState.weatherState);

        mapContainer.className = 'map-container';
        if (weatherClasses.length > 0) {
            weatherClasses.forEach(cls => mapContainer.classList.add(cls));
        }

        const baseViewRange = 5;
        const viewRange = WeatherSystem.getModifiedViewRange(this.gameState, baseViewRange);
        
        let html = '';
        const viewRadius = 15;
        const startY = Math.max(0, player.position.y - viewRadius);
        const endY = Math.min(dungeon.height, player.position.y + viewRadius + 1);
        const startX = Math.max(0, player.position.x - viewRadius);
        const endX = Math.min(dungeon.width, player.position.x + viewRadius + 1);

        for (let y = startY; y < endY; y++) {
            html += '<div class="map-row">';
            for (let x = startX; x < endX; x++) {
                const tile = dungeon.tiles[y][x];
                const isPlayer = x === player.position.x && y === player.position.y;
                const distance = Math.sqrt(Math.pow(x - player.position.x, 2) + Math.pow(y - player.position.y, 2));
                const isVisible = distance <= viewRange;

                let cellClass = 'map-cell';
                let cellContent = '';

                if (!tile.explored && !isVisible) {
                    cellClass += ' unexplored';
                    cellContent = ' ';
                } else {
                    cellClass += ` ${tile.type}`;
                    if (tile.explored) cellClass += ' explored';
                    if (!isVisible && tile.explored) cellClass += ' dimmed';
                    
                    if (isPlayer) {
                        cellClass += ' player';
                        cellContent = '🧙';
                    } else if (isVisible || tile.explored) {
                        switch (tile.type) {
                            case 'wall':
                                cellContent = '█';
                                break;
                            case 'floor':
                                cellContent = '·';
                                break;
                            case 'enemy':
                                cellContent = tile.enemy ? tile.enemy.icon : '?';
                                if (!isVisible) cellContent = '·';
                                break;
                            case 'item':
                                cellContent = tile.item ? tile.item.icon : '?';
                                if (!isVisible) cellContent = '·';
                                break;
                            case 'stairs':
                                cellContent = '🚪';
                                break;
                            default:
                                cellContent = ' ';
                        }
                    }
                }

                html += `<div class="${cellClass}">${cellContent}</div>`;
            }
            html += '</div>';
        }

        mapElement.innerHTML = html;
    }

    renderInventory() {
        const inventory = this.gameState.player.inventory;
        const gridElement = document.getElementById('inventory-grid');
        
        let html = '';
        const maxSlots = 20;
        
        for (let i = 0; i < maxSlots; i++) {
            if (i < inventory.length) {
                const item = inventory[i];
                html += `
                    <div class="inventory-slot rarity-${item.rarity}" 
                         data-item-id="${item.id}"
                         title="${item.name}">
                        ${item.icon}
                    </div>
                `;
            } else {
                html += '<div class="inventory-slot"></div>';
            }
        }
        
        gridElement.innerHTML = html;

        gridElement.querySelectorAll('.inventory-slot[data-item-id]').forEach(slot => {
            slot.addEventListener('click', () => {
                const itemId = slot.dataset.itemId;
                const item = inventory.find(i => i.id === itemId);
                if (item) {
                    this.showItemModal(item);
                }
            });
        });
    }

    renderGameLog() {
        const logElement = document.getElementById('game-log');
        const log = this.gameState.gameLog.slice(-20);
        
        logElement.innerHTML = log.map(message => {
            let className = 'log-entry';
            if (message.includes('⚔️') || message.includes('💥') || message.includes('遭遇')) {
                className += ' combat';
            } else if (message.includes('📦') || message.includes('拾取')) {
                className += ' item';
            } else if (message.includes('🎊') || message.includes('升级')) {
                className += ' level';
            } else if (message.includes('🚪') || message.includes('🎮') || message.includes('欢迎')) {
                className += ' system';
            }
            return `<div class="${className}">${message}</div>`;
        }).join('');
        
        logElement.scrollTop = logElement.scrollHeight;
    }

    renderCombat() {
        const combat = this.gameState.combat;
        const overlay = document.getElementById('combat-overlay');
        
        overlay.classList.remove('hidden');

        document.getElementById('enemy-icon').textContent = combat.enemy.icon;
        document.getElementById('enemy-name').textContent = combat.enemy.name;
        
        const hpPercent = (combat.enemy.currentHp / combat.enemy.maxHp) * 100;
        document.getElementById('enemy-hp-text').textContent = `${combat.enemy.currentHp}/${combat.enemy.maxHp}`;
        document.getElementById('enemy-hp-fill').style.width = `${hpPercent}%`;

        const logElement = document.getElementById('combat-log');
        logElement.innerHTML = combat.log.map(msg => 
            `<div class="combat-log-entry">${msg}</div>`
        ).join('');
        logElement.scrollTop = logElement.scrollHeight;

        const buttons = document.querySelectorAll('.combat-btn');
        buttons.forEach(btn => {
            btn.disabled = !combat.playerTurn;
        });
    }

    async loadScores() {
        const result = await StorageManager.getScores();
        const scoresList = document.getElementById('scores-list');
        
        if (result.success && result.scores && result.scores.length > 0) {
            scoresList.innerHTML = result.scores.sort((a, b) => b.score - a.score).slice(0, 10).map((record, index) => {
                const rankIcon = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}`;
                const date = new Date(record.date).toLocaleDateString('zh-CN');
                return `
                    <div class="score-item">
                        <span class="score-rank">${rankIcon}</span>
                        <div class="score-info">
                            <div>击杀: ${record.kills} | 层数: ${record.floor}</div>
                            <div class="score-date">${date}</div>
                        </div>
                        <span class="score-value">${record.score.toLocaleString()}</span>
                    </div>
                `;
            }).join('');
        } else {
            scoresList.innerHTML = '<p style="color: var(--text-secondary); text-align: center; padding: 40px;">暂无记录，开始游戏创造你的记录吧！</p>';
        }
    }

    quitToMenu() {
        this.stopAutoSave();
        this.saveGame();
        this.gameState = null;
        this.combatSystem = null;
        this.showScreen('main-menu');
        this.showNotification('👋 已保存游戏，返回主菜单');
    }

    init() {
        document.getElementById('new-game-btn').addEventListener('click', () => {
            this.startNewGame();
        });

        document.getElementById('continue-btn').addEventListener('click', () => {
            if (StorageManager.hasLocalSave()) {
                this.continueGame();
            } else {
                this.showNotification('❌ 没有找到存档！');
            }
        });

        document.getElementById('scores-btn').addEventListener('click', () => {
            this.loadScores();
            this.showScreen('scores-screen');
        });

        document.getElementById('back-to-menu-btn').addEventListener('click', () => {
            this.showScreen('main-menu');
        });

        document.getElementById('restart-btn').addEventListener('click', () => {
            this.startNewGame();
        });

        document.getElementById('menu-btn').addEventListener('click', () => {
            this.showScreen('main-menu');
        });

        document.getElementById('save-btn').addEventListener('click', () => {
            this.saveGame();
            this.showNotification('💾 游戏已保存！');
        });

        document.getElementById('quit-btn').addEventListener('click', () => {
            if (confirm('确定要退出到主菜单吗？游戏会自动保存。')) {
                this.quitToMenu();
            }
        });

        document.querySelectorAll('.combat-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const action = btn.dataset.action;
                this.combatAction(action);
            });
        });

        document.getElementById('equip-btn').addEventListener('click', () => {
            if (this.selectedItem) {
                this.equipItem(this.selectedItem.id);
            }
        });

        document.getElementById('use-btn').addEventListener('click', () => {
            if (this.selectedItem) {
                this.useSelectedItem();
            }
        });

        document.getElementById('discard-btn').addEventListener('click', () => {
            if (this.selectedItem && confirm(`确定要丢弃 ${this.selectedItem.name} 吗？`)) {
                this.discardItem(this.selectedItem.id);
            }
        });

        document.getElementById('close-modal-btn').addEventListener('click', () => {
            this.closeItemModal();
        });

        document.getElementById('item-modal').addEventListener('click', (e) => {
            if (e.target.id === 'item-modal') {
                this.closeItemModal();
            }
        });

        document.addEventListener('keydown', (e) => {
            if (!this.gameState) return;
            
            const activeScreen = document.querySelector('.screen.active').id;
            
            if (activeScreen === 'game-screen' && !this.gameState.combat.active) {
                const key = e.key.toLowerCase();
                if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) {
                    e.preventDefault();
                    this.movePlayer(key);
                }
            }
        });

        const continueBtn = document.getElementById('continue-btn');
        if (!StorageManager.hasLocalSave()) {
            continueBtn.style.opacity = '0.5';
            continueBtn.style.cursor = 'not-allowed';
        }
    }
}

const game = new Game();
