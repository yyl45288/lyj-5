class Game {
    constructor() {
        this.gameState = null;
        this.combatSystem = null;
        this.selectedItem = null;
        this.autoSaveTimer = null;
        this.currentMerchant = null;
        this.activeTab = 'buy';
        this.isMinimapMaximized = false;
    }

    async startNewGame() {
        this.resetMinimapState();
        this.gameState = CharacterSystem.createNewGameState();
        this.combatSystem = new CombatSystem(this.gameState);
        this.startAutoSave();
        this.showScreen('game-screen');
        this.render();
        this.showNotification('🎮 新游戏开始！祝你好运！');
    }

    async continueGame() {
        this.resetMinimapState();
        const result = await StorageManager.loadFromLocal();
        if (result.success) {
            this.gameState = CharacterSystem.ensureGameStateCompatibility(result.gameState);
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

        if (result.type === 'merchant') {
            this.gameState.merchantsVisited = (this.gameState.merchantsVisited || 0) + 1;
            Game.updateQuestProgress(this.gameState, 'find_merchant', 1);
            this.openMerchant(result.merchant);
            this.render();
            return;
        }

        if (result.type === 'stairs') {
            Game.updateQuestProgress(this.gameState, 'reach_stairs', 1);
            CharacterSystem.nextFloor(this.gameState);
            const floor = this.gameState.dungeon.floor;
            this.showNotification(`🚪 进入第 ${floor} 层！`);
            
            this.gameState.comboKills = 0;
            this.gameState.quests = generateFloorQuests(floor, 2);
            this.gameState.gameLog.push(`📜 第 ${floor} 层新任务已发布！`);
            
            const merchantCount = this.gameState.dungeon.merchantCount || 0;
            if (merchantCount > 0) {
                this.gameState.gameLog.push(`🛒 第 ${floor} 层出现了 ${merchantCount} 位商人！寻找他们进行交易吧！`);
                setTimeout(() => {
                    this.showNotification(`🛒 发现 ${merchantCount} 位商人！寻找金色图标交互！`);
                }, 1200);
            }
            
            const activeWeathers = WeatherSystem.getActiveWeatherDescriptions(this.gameState.weatherState);
            if (activeWeathers.length > 0) {
                setTimeout(() => {
                    this.showNotification(`${activeWeathers.map(w => w.icon + w.name).join(' ')} 天气生效！`);
                }, 2400);
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

    openMerchant(merchant) {
        this.currentMerchant = merchant;
        this.activeTab = 'buy';
        document.getElementById('merchant-overlay').classList.remove('hidden');
        this.renderMerchant();
        this.showNotification(`💼 ${merchant.name}：${merchant.greeting}`);
    }

    closeMerchant() {
        this.currentMerchant = null;
        this.selectedItem = null;
        document.getElementById('merchant-overlay').classList.add('hidden');
        this.render();
    }

    renderMerchant() {
        if (!this.currentMerchant) return;

        const merchant = this.currentMerchant;
        document.getElementById('merchant-icon').textContent = merchant.icon;
        document.getElementById('merchant-name').textContent = merchant.name;
        document.getElementById('merchant-gold').textContent = this.gameState.player.gold;

        ['buy', 'sell', 'upgrade', 'steal'].forEach(tab => {
            const btn = document.getElementById(`tab-${tab}`);
            if (tab === this.activeTab) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        this.renderMerchantContent();
    }

    renderMerchantContent() {
        const content = document.getElementById('merchant-content');
        
        switch (this.activeTab) {
            case 'buy':
                this.renderBuyTab(content);
                break;
            case 'sell':
                this.renderSellTab(content);
                break;
            case 'upgrade':
                this.renderUpgradeTab(content);
                break;
            case 'steal':
                this.renderStealTab(content);
                break;
        }
    }

    renderBuyTab(container) {
        const merchant = this.currentMerchant;
        if (merchant.inventory.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 40px;">商人的货物已经卖完了！</p>';
            return;
        }

        let html = '<div class="merchant-items-grid">';
        merchant.inventory.forEach((item, index) => {
            const canAfford = this.gameState.player.gold >= item.buyPrice;
            const rarityClass = `rarity-${item.rarity}`;
            const disabledClass = canAfford ? '' : 'disabled';
            
            html += `
                <div class="merchant-item ${rarityClass} ${disabledClass}" data-index="${index}" data-action="view-buy">
                    <div class="merchant-item-icon">${item.icon}</div>
                    <div class="merchant-item-name">${item.name}</div>
                    <div class="merchant-item-price">💰 ${item.buyPrice}</div>
                    <div class="merchant-item-stats">
                        ${item.stats?.attack ? `<span>⚔️+${item.stats.attack}</span>` : ''}
                        ${item.stats?.defense ? `<span>🛡️+${item.stats.defense}</span>` : ''}
                        ${item.stats?.maxHp ? `<span>❤️+${item.stats.maxHp}</span>` : ''}
                    </div>
                    <div class="item-view-hint">点击查看详情</div>
                </div>
            `;
        });
        html += '</div>';
        
        const refreshCost = Math.floor(10 + this.gameState.dungeon.floor * 5);
        html += `
            <div class="merchant-footer">
                <button class="refresh-btn" id="refresh-shop-btn" data-cost="${refreshCost}">
                    🔄 刷新商品 (💰 ${refreshCost})
                </button>
                <div class="refresh-count">已刷新: ${merchant.refreshCount || 0} 次</div>
            </div>
        `;
        container.innerHTML = html;

        container.querySelectorAll('.merchant-item').forEach(el => {
            el.addEventListener('click', () => {
                const index = parseInt(el.dataset.index);
                const item = this.currentMerchant.inventory[index];
                if (item) {
                    this.showShopItemModal(item, 'buy');
                }
            });
        });

        const refreshBtn = document.getElementById('refresh-shop-btn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.refreshShop();
            });
        }
    }

    renderSellTab(container) {
        const inventory = this.gameState.player.inventory;
        if (inventory.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 40px;">你的背包是空的！</p>';
            return;
        }

        let html = '<div class="merchant-items-grid">';
        inventory.forEach((item, index) => {
            const sellPrice = calculateItemSellPrice(item, this.gameState.dungeon.floor);
            const rarityClass = `rarity-${item.rarity}`;
            
            html += `
                <div class="merchant-item ${rarityClass}" data-index="${index}" data-action="view-sell">
                    <div class="merchant-item-icon">${item.icon}</div>
                    <div class="merchant-item-name">${item.name}</div>
                    <div class="merchant-item-price" style="color: #2ECC71;">💰 ${sellPrice}</div>
                    <div class="merchant-item-stats">
                        ${item.stats?.attack ? `<span>⚔️+${item.stats.attack}</span>` : ''}
                        ${item.stats?.defense ? `<span>🛡️+${item.stats.defense}</span>` : ''}
                        ${item.stats?.maxHp ? `<span>❤️+${item.stats.maxHp}</span>` : ''}
                    </div>
                    <div class="item-view-hint">点击查看详情</div>
                </div>
            `;
        });
        html += '</div>';
        container.innerHTML = html;

        container.querySelectorAll('.merchant-item').forEach(el => {
            el.addEventListener('click', () => {
                const index = parseInt(el.dataset.index);
                const item = this.gameState.player.inventory[index];
                if (item) {
                    this.showShopItemModal(item, 'sell');
                }
            });
        });
    }

    showShopItemModal(item, action) {
        this.pendingShopItem = { item, action };
        const isBuy = action === 'buy';
        const floor = this.gameState.dungeon.floor;
        const price = isBuy ? item.buyPrice : calculateItemSellPrice(item, floor);

        document.getElementById('shop-item-name').textContent = item.name;
        document.getElementById('shop-item-icon').textContent = item.icon;
        
        const rarityElement = document.getElementById('shop-item-rarity');
        const rarityNames = { common: '普通', uncommon: '优秀', rare: '稀有', epic: '史诗', legendary: '传说' };
        rarityElement.textContent = rarityNames[item.rarity] || '普通';
        rarityElement.style.background = RARITY_COLORS[item.rarity] || '#95A5A6';
        rarityElement.style.color = '#fff';

        const priceElement = document.getElementById('shop-item-price');
        priceElement.textContent = isBuy ? `💰 ${price}` : `💰 +${price}`;
        priceElement.style.color = isBuy ? '#F1C40F' : '#2ECC71';

        const statsContainer = document.getElementById('shop-item-stats');
        statsContainer.innerHTML = '';
        
        if (item.stats && item.stats.attack) {
            statsContainer.innerHTML += `<div class="modal-stat"><span>⚔️ 攻击力</span><span>+${item.stats.attack}</span></div>`;
        }
        if (item.stats && item.stats.defense) {
            statsContainer.innerHTML += `<div class="modal-stat"><span>🛡️ 防御力</span><span>+${item.stats.defense}</span></div>`;
        }
        if (item.stats && item.stats.maxHp) {
            statsContainer.innerHTML += `<div class="modal-stat"><span>❤️ 生命值上限</span><span>+${item.stats.maxHp}</span></div>`;
        }

        const descContainer = document.getElementById('shop-item-desc');
        descContainer.innerHTML = '';
        if (item.description) {
            descContainer.innerHTML = `<div class="shop-item-desc-text">${item.description}</div>`;
        }
        descContainer.innerHTML += `<div class="shop-item-desc-text" style="color: #95A5A6; margin-top: 8px; font-size: 0.9rem;">${isBuy ? '点击"确认购买"完成交易' : '点击"确认出售"获得金币'}</div>`;

        const confirmBtn = document.getElementById('shop-confirm-btn');
        confirmBtn.textContent = isBuy ? '确认购买' : '确认出售';
        confirmBtn.style.background = isBuy ? '#3498DB' : '#2ECC71';

        const canAfford = !isBuy || this.gameState.player.gold >= price;
        confirmBtn.disabled = !canAfford;
        confirmBtn.style.opacity = canAfford ? '1' : '0.5';
        confirmBtn.style.cursor = canAfford ? 'pointer' : 'not-allowed';

        document.getElementById('shop-item-modal').classList.remove('hidden');
    }

    closeShopItemModal() {
        this.pendingShopItem = null;
        document.getElementById('shop-item-modal').classList.add('hidden');
    }

    confirmShopAction() {
        if (!this.pendingShopItem) return;
        
        const { item, action } = this.pendingShopItem;
        
        if (action === 'buy') {
            const result = CharacterSystem.buyItem(this.gameState, this.currentMerchant, item.id);
            if (result.success) {
                this.showNotification(`✅ ${result.message}`);
            } else {
                this.showNotification(`❌ ${result.message}`);
            }
        } else {
            const result = CharacterSystem.sellItem(this.gameState, this.currentMerchant, item.id);
            if (result.success) {
                this.showNotification(`✅ ${result.message}`);
            } else {
                this.showNotification(`❌ ${result.message}`);
            }
        }

        this.closeShopItemModal();
        this.renderMerchant();
        this.render();
    }

    refreshShop() {
        const merchant = this.currentMerchant;
        const floor = this.gameState.dungeon.floor;
        const refreshCost = Math.floor(10 + floor * 5);
        const player = this.gameState.player;

        if (player.gold < refreshCost) {
            this.showNotification(`❌ 金币不足！需要 ${refreshCost} 金币刷新商品`);
            return;
        }

        if (!merchant.refreshCount) merchant.refreshCount = 0;
        const maxRefreshes = 3;
        if (merchant.refreshCount >= maxRefreshes) {
            this.showNotification(`❌ 本层商人已达到最大刷新次数 (${maxRefreshes}次)`);
            return;
        }

        player.gold -= refreshCost;
        merchant.refreshCount++;
        merchant.inventory = generateMerchantInventory(floor, merchant);
        merchant.inventory.forEach(item => {
            item.buyPrice = calculateItemBuyPrice(item, floor, merchant.discount);
        });

        this.showNotification(`🔄 商品已刷新！花费 ${refreshCost} 金币`);
        this.renderMerchant();
        this.render();
    }

    renderUpgradeTab(container) {
        const floor = this.gameState.dungeon.floor;
        const merchant = this.currentMerchant;
        
        let html = '<div class="upgrade-list">';
        ATTRIBUTE_TYPES.forEach(attr => {
            const purchasedCount = merchant.attributePurchased[attr.id] || 0;
            const price = calculateAttributePrice(attr.id, floor, purchasedCount);
            const value = calculateAttributeValue(attr.id, floor);
            const canAfford = this.gameState.player.gold >= price;
            const disabledClass = canAfford ? '' : 'disabled';
            
            html += `
                <div class="upgrade-item ${disabledClass}" data-attr-id="${attr.id}">
                    <div class="upgrade-icon">${attr.icon}</div>
                    <div class="upgrade-info">
                        <div class="upgrade-name">${attr.name}</div>
                        <div class="upgrade-desc">${attr.description} (当前:+${value})</div>
                        <div class="upgrade-count">已购买: ${purchasedCount} 次</div>
                    </div>
                    <div class="upgrade-price">💰 ${price}</div>
                </div>
            `;
        });
        html += '</div>';
        container.innerHTML = html;

        container.querySelectorAll('.upgrade-item:not(.disabled)').forEach(el => {
            el.addEventListener('click', () => {
                const attrId = el.dataset.attrId;
                this.buyAttribute(attrId);
            });
        });
    }

    renderStealTab(container) {
        const player = this.gameState.player;
        const baseSuccessChance = 0.3;
        const levelMod = player.stats.level * 0.02;
        const successChance = Math.min(0.6, baseSuccessChance + levelMod);
        
        container.innerHTML = `
            <div style="text-align: center; padding: 40px;">
                <div style="font-size: 3rem; margin-bottom: 20px;">🗡️</div>
                <h3 style="color: var(--accent-gold); margin-bottom: 15px;">危险操作：盗窃</h3>
                <p style="color: var(--text-secondary); margin-bottom: 15px;">
                    尝试从商人那里偷取金币。如果失败，商人会愤怒地攻击你！
                </p>
                <p style="margin-bottom: 20px;">
                    成功率: <span style="color: ${successChance > 0.4 ? '#2ECC71' : '#E74C3C'}">${Math.floor(successChance * 100)}%</span>
                </p>
                <p style="color: var(--text-secondary); font-size: 0.9rem; margin-bottom: 30px;">
                    成功可获得 ${this.currentMerchant.goldReward} 左右金币<br>
                    失败将进入战斗，击败商人可获得 ${this.currentMerchant.goldReward} 金币
                </p>
                <button id="steal-btn" class="modal-btn" style="background: var(--accent-red); color: white; padding: 12px 30px; font-size: 1.1rem;">
                    🗡️ 尝试盗窃
                </button>
            </div>
        `;

        const stealBtn = document.getElementById('steal-btn');
        if (stealBtn) {
            stealBtn.addEventListener('click', () => this.attemptSteal());
        }
    }

    switchMerchantTab(tab) {
        this.activeTab = tab;
        this.renderMerchant();
    }

    buyItem(itemId) {
        const result = CharacterSystem.buyItem(this.gameState, this.currentMerchant, itemId);
        this.showNotification(result.message);
        if (result.success) {
            this.renderMerchant();
            this.render();
        }
    }

    buyAttribute(attrId) {
        const result = CharacterSystem.buyAttribute(this.gameState, this.currentMerchant, attrId);
        this.showNotification(result.message);
        if (result.success) {
            this.renderMerchant();
            this.render();
        }
    }

    sellItem(itemId) {
        const result = CharacterSystem.sellItem(this.gameState, this.currentMerchant, itemId);
        this.showNotification(result.message);
        if (result.success) {
            this.renderMerchant();
            this.render();
        }
    }

    attemptSteal() {
        if (!confirm('确定要尝试盗窃吗？失败将触发战斗！')) return;
        
        const result = CharacterSystem.stealFromMerchant(this.gameState, this.currentMerchant);
        this.showNotification(result.message);
        
        if (result.combat) {
            this.closeMerchant();
            this.combatSystem.startCombat(result.enemy);
            this.render();
        } else {
            this.closeMerchant();
        }
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
        this.resetMinimapState();
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
        this.renderMinimap();
        this.renderInventory();
        this.renderQuests();
        this.renderCombo();
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
        document.getElementById('player-gold').textContent = player.gold;

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
        const hasShield = WeatherSystem.hasWeatherShield(this.gameState.weatherState);
        const hasResist = WeatherSystem.hasWeatherResist(this.gameState.weatherState);
        const shields = this.gameState.weatherState.shields;

        if (activeWeathers.length === 0 && !hasShield && !hasResist) {
            panel.classList.add('hidden');
            return;
        }

        panel.classList.remove('hidden');

        let html = '';
        
        if (hasShield || hasResist) {
            html += `<div style="margin-bottom: 10px; padding: 8px; background: rgba(46, 204, 113, 0.1); border-radius: 6px; border-left: 3px solid #2ECC71;">`;
            if (hasShield) {
                html += `<div style="color: #2ECC71; font-weight: bold; margin-bottom: 2px;">🛡️ 天气护盾：剩余 ${shields.weatherShield} 步</div>`;
            }
            if (hasResist) {
                html += `<div style="color: #3498DB; font-weight: bold;">🧪 天气抗性：剩余 ${shields.weatherResist} 步</div>`;
            }
            html += `</div>`;
        }

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
                            case 'merchant':
                                cellContent = tile.merchant ? tile.merchant.icon : '?';
                                if (!isVisible) cellContent = '·';
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

    renderMinimap() {
        const dungeon = this.gameState.dungeon;
        const player = this.gameState.player;
        const minimapElement = document.getElementById('minimap');
        const toggleText = document.getElementById('minimap-toggle');

        toggleText.textContent = this.isMinimapMaximized ? '✕ 点击缩小' : '🔍 点击放大';

        minimapElement.style.gridTemplateColumns = `repeat(${dungeon.width}, auto)`;

        let html = '';
        for (let y = 0; y < dungeon.height; y++) {
            for (let x = 0; x < dungeon.width; x++) {
                const tile = dungeon.tiles[y][x];
                const isPlayer = x === player.position.x && y === player.position.y;

                let cellClass = 'minimap-cell';
                let cellContent = '';

                if (isPlayer) {
                    cellClass += ' player';
                    if (tile.explored) {
                        cellClass += ' explored';
                        if (tile.type !== 'wall') cellClass += ` ${tile.type}`;
                    }
                    cellContent = this.isMinimapMaximized ? '🧙' : '';
                } else if (!tile.explored) {
                    cellClass += ' unexplored';
                } else {
                    cellClass += ` ${tile.type}`;
                    cellClass += ' explored';

                    switch (tile.type) {
                        case 'enemy':
                            if (tile.enemy) {
                                cellContent = this.isMinimapMaximized ? tile.enemy.icon : '';
                            }
                            break;
                        case 'merchant':
                            if (tile.merchant) {
                                cellContent = this.isMinimapMaximized ? tile.merchant.icon : '';
                            }
                            break;
                        case 'stairs':
                            cellContent = this.isMinimapMaximized ? '🚪' : '';
                            break;
                        case 'item':
                            if (tile.item) {
                                cellContent = this.isMinimapMaximized ? tile.item.icon : '';
                            }
                            break;
                        default:
                            break;
                    }
                }

                html += `<div class="${cellClass}">${cellContent}</div>`;
            }
        }

        minimapElement.innerHTML = html;
    }

    toggleMinimap() {
        this.isMinimapMaximized = !this.isMinimapMaximized;
        const container = document.getElementById('minimap-container');
        const overlay = document.getElementById('minimap-overlay');

        if (this.isMinimapMaximized) {
            container.classList.remove('minimap-minimized');
            container.classList.add('minimap-maximized');
            overlay.classList.add('active');
            document.body.appendChild(container);
        } else {
            container.classList.remove('minimap-maximized');
            container.classList.add('minimap-minimized');
            overlay.classList.remove('active');
            const centerPanel = document.querySelector('.center-panel');
            const mapContainer = document.getElementById('map-container');
            if (centerPanel && mapContainer) {
                centerPanel.insertBefore(container, mapContainer);
            }
        }

        this.renderMinimap();
    }

    resetMinimapState() {
        if (!this.isMinimapMaximized) return;
        this.isMinimapMaximized = false;
        const container = document.getElementById('minimap-container');
        const overlay = document.getElementById('minimap-overlay');
        if (container) {
            container.classList.remove('minimap-maximized');
            container.classList.add('minimap-minimized');
            const centerPanel = document.querySelector('.center-panel');
            const mapContainer = document.getElementById('map-container');
            if (centerPanel && mapContainer && container.parentElement !== centerPanel) {
                centerPanel.insertBefore(container, mapContainer);
            }
        }
        if (overlay) {
            overlay.classList.remove('active');
        }
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
            } else if (message.includes('📦') || message.includes('拾取') || message.includes('💰')) {
                className += ' item';
            } else if (message.includes('🎊') || message.includes('升级')) {
                className += ' level';
            } else if (message.includes('🚪') || message.includes('🎮') || message.includes('欢迎') || message.includes('🛒') || message.includes('📜') || message.includes('✅')) {
                className += ' system';
            }
            return `<div class="${className}">${message}</div>`;
        }).join('');
        
        logElement.scrollTop = logElement.scrollHeight;
    }

    renderQuests() {
        const questList = document.getElementById('quest-list');
        if (!this.gameState.quests || this.gameState.quests.length === 0) {
            questList.innerHTML = '<div class="quest-empty">暂无任务</div>';
            return;
        }

        questList.innerHTML = this.gameState.quests.map(quest => {
            const percent = Math.min(100, (quest.progress / quest.target) * 100);
            const statusClass = quest.completed ? 'quest-completed' : '';
            const icon = quest.completed ? '✅' : '🎯';
            return `
                <div class="quest-item ${statusClass}">
                    <div class="quest-header">
                        <span class="quest-icon">${icon}</span>
                        <span class="quest-name">${quest.name}</span>
                        <span class="quest-reward">💰 ${quest.reward}</span>
                    </div>
                    <div class="quest-desc">${quest.description}</div>
                    <div class="quest-progress-bar">
                        <div class="quest-progress-fill" style="width: ${percent}%"></div>
                    </div>
                    <div class="quest-progress-text">${Math.min(quest.progress, quest.target)} / ${quest.target}</div>
                </div>
            `;
        }).join('');
    }

    renderCombo() {
        const comboDisplay = document.getElementById('combo-display');
        const comboKills = this.gameState.comboKills || 0;
        const now = Date.now();
        const lastKill = this.gameState.lastKillTime || 0;
        const comboTimeout = 15000;

        if (comboKills >= 2 && (now - lastKill) < comboTimeout) {
            comboDisplay.textContent = `🔥 连击 x${comboKills}`;
            comboDisplay.classList.remove('hidden');
            comboDisplay.classList.toggle('combo-highlight', comboKills >= 5);
        } else {
            if (comboKills >= 2 && (now - lastKill) >= comboTimeout) {
                this.gameState.comboKills = 0;
            }
            comboDisplay.classList.add('hidden');
        }
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
        this.resetMinimapState();
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

        document.getElementById('close-merchant-btn').addEventListener('click', () => {
            this.closeMerchant();
        });

        document.getElementById('merchant-overlay').addEventListener('click', (e) => {
            if (e.target.id === 'merchant-overlay') {
                this.closeMerchant();
            }
        });

        document.getElementById('shop-cancel-btn').addEventListener('click', () => {
            this.closeShopItemModal();
        });

        document.getElementById('shop-confirm-btn').addEventListener('click', () => {
            this.confirmShopAction();
        });

        document.getElementById('shop-item-modal').addEventListener('click', (e) => {
            if (e.target.id === 'shop-item-modal') {
                this.closeShopItemModal();
            }
        });

        ['tab-buy', 'tab-sell', 'tab-upgrade', 'tab-steal'].forEach(tabId => {
            document.getElementById(tabId).addEventListener('click', () => {
                const tab = tabId.replace('tab-', '');
                this.switchMerchantTab(tab);
            });
        });

        const minimapContainer = document.getElementById('minimap-container');
        const minimapElement = document.getElementById('minimap');
        if (minimapContainer) {
            minimapContainer.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleMinimap();
            });
            if (minimapElement) {
                minimapElement.style.cursor = 'pointer';
            }
        }

        const minimapOverlay = document.getElementById('minimap-overlay');
        if (minimapOverlay) {
            minimapOverlay.addEventListener('click', (e) => {
                e.stopPropagation();
                if (this.isMinimapMaximized) {
                    this.toggleMinimap();
                }
            });
        }

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isMinimapMaximized) {
                e.preventDefault();
                this.toggleMinimap();
                return;
            }
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

    static updateQuestProgress(gameState, typeId, amount) {
        if (!gameState.quests) return;
        let newComplete = false;
        let completedQuestName = '';
        let totalReward = 0;

        for (const quest of gameState.quests) {
            if (quest.completed || quest.typeId !== typeId) continue;

            if (quest.typeId === 'complete_combo') {
                quest.progress = Math.max(quest.progress, amount);
            } else if (quest.typeId === 'collect_gold') {
                quest.progress = (gameState.totalGoldCollected || 0);
            } else {
                quest.progress += amount;
            }

            if (quest.progress >= quest.target) {
                quest.progress = quest.target;
                quest.completed = true;
                newComplete = true;
                completedQuestName = quest.name;
                totalReward += quest.reward;
                gameState.player.gold += quest.reward;
                if (gameState.gameLog) {
                    gameState.gameLog.push(`✅ 任务完成【${quest.name}】！获得 ${quest.reward} 金币奖励！`);
                }
            }
        }

        if (newComplete && typeof game !== 'undefined' && game.showNotification) {
            setTimeout(() => {
                game.showNotification(`✅ 任务完成！获得 ${totalReward} 金币！`);
            }, 100);
        }
    }
}

const game = new Game();
