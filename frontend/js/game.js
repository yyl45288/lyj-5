class Game {
    constructor() {
        this.gameState = null;
        this.combatSystem = null;
        this.selectedItem = null;
        this.autoSaveTimer = null;
        this.currentMerchant = null;
        this.activeTab = 'buy';
        this.isMinimapMaximized = false;
        this.inventoryFilter = 'all';
        this.itemQuantity = 1;
        this.shopQuantity = 1;
    }

    async startNewGame() {
        this.resetMinimapState();
        this.gameState = await CharacterSystem.createNewGameState();
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

    async movePlayer(direction) {
        if (!this.gameState || this.gameState.combat.active) return;

        const result = CharacterSystem.movePlayer(this.gameState, direction);
        if (!result) return;

        if (result.type === 'death') {
            await this.gameOver();
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
            await CharacterSystem.nextFloor(this.gameState);
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

            const difficultyInfo = DifficultySystem.getDifficultyDescription(this.gameState);
            setTimeout(() => {
                this.showNotification(`${difficultyInfo.icon} ${difficultyInfo.name} 难度`);
            }, 3600);
        }

        this.render();
    }

    removeEnemyFromMap(position) {
        const tile = this.gameState.dungeon.tiles[position.y][position.x];
        tile.type = 'floor';
        tile.enemy = null;
    }

    async combatAction(action) {
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
            await this.gameOver();
            return;
        }

        if (result && result.type === 'fleeSuccess') {
            this.render();
            return;
        }

        if (result && result.type === 'victory') {
            if (result.levelUp && result.levelUp.length > 0) {
                const totalPoints = result.levelUp.reduce((s, l) => s + (l.skillPoints || 0), 0);
                if (totalPoints > 0) {
                    setTimeout(() => {
                        this.showNotification(`🎊 升级获得 ${totalPoints} 技能点！点击"技能树"学习新技能！`);
                    }, 500);
                }
            }
            this.showNotification('🎉 战斗胜利！');
            this.render();
            return;
        }

        setTimeout(async () => {
            if (this.gameState.combat.active && !this.gameState.combat.playerTurn) {
                const enemyResult = this.combatSystem.enemyTurn();
                this.render();

                if (enemyResult && enemyResult.type === 'defeat') {
                    await this.gameOver();
                }
            }
        }, 800);
    }

    async combatSkillAction(skillId) {
        if (!this.gameState || !this.gameState.combat.active) return;

        const result = this.combatSystem.playerUseSkill(skillId);
        if (!result) return;

        if (result.type === 'skillFailed') {
            this.showNotification(`❌ ${result.message}`);
            return;
        }

        this.render();

        if (result && result.type === 'victory') {
            if (result.levelUp && result.levelUp.length > 0) {
                const totalPoints = result.levelUp.reduce((s, l) => s + (l.skillPoints || 0), 0);
                if (totalPoints > 0) {
                    setTimeout(() => {
                        this.showNotification(`🎊 升级获得 ${totalPoints} 技能点！点击"技能树"学习新技能！`);
                    }, 500);
                }
            }
            this.showNotification('🎉 战斗胜利！');
            this.render();
            return;
        }

        if (result.type === 'skillUsed') {
            const skill = SkillSystem.getSkillById(skillId);
            setTimeout(() => {
                this.showNotification(`${skill.icon} 施放【${skill.name}】！`);
            }, 100);
        }

        setTimeout(async () => {
            if (this.gameState.combat.active && !this.gameState.combat.playerTurn) {
                const enemyResult = this.combatSystem.enemyTurn();
                this.render();

                if (enemyResult && enemyResult.type === 'defeat') {
                    await this.gameOver();
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
            const hasAffixes = item.affixes && 
                (item.affixes.prefixes?.length > 0 || 
                 item.affixes.suffixes?.length > 0 || 
                 item.affixes.specials?.length > 0);
            const affixIndicator = hasAffixes ? '✨' : '';
            const isStackable = isStackableItem(item);
            const quantityText = isStackable && item.quantity > 1 
                ? `<span class="item-quantity">x${item.quantity}</span>` 
                : '';
            
            html += `
                <div class="merchant-item ${rarityClass} ${disabledClass}" data-index="${index}" data-action="view-buy">
                    <div class="merchant-item-icon">${item.icon}${affixIndicator}${quantityText}</div>
                    <div class="merchant-item-name">${item.name}</div>
                    <div class="merchant-item-price">💰 ${item.buyPrice}</div>
                    <div class="merchant-item-stats">
                        ${item.effect?.type === 'heal' ? `<span>❤️+${item.effect.value}${item.effect.isPercent ? '%' : ''}</span>` : ''}
                        ${item.effect?.type === 'mana' ? `<span>💧+${item.effect.value}${item.effect.isPercent ? '%' : ''}</span>` : ''}
                        ${item.effect?.type === 'buff' ? `<span>⚔️+${item.effect.value}</span>` : ''}
                        ${item.stats?.attack ? `<span>⚔️+${item.stats.attack}</span>` : ''}
                        ${item.stats?.defense ? `<span>🛡️+${item.stats.defense}</span>` : ''}
                        ${item.stats?.maxHp ? `<span>❤️+${item.stats.maxHp}</span>` : ''}
                        ${item.stats?.critChance ? `<span>🎯+${Math.round(item.stats.critChance * 100)}%</span>` : ''}
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
            const hasAffixes = item.affixes && 
                (item.affixes.prefixes?.length > 0 || 
                 item.affixes.suffixes?.length > 0 || 
                 item.affixes.specials?.length > 0);
            const affixIndicator = hasAffixes ? '✨' : '';
            const isStackable = isStackableItem(item);
            const quantityText = isStackable && item.quantity > 1 
                ? `<span class="item-quantity">x${item.quantity}</span>` 
                : '';
            
            html += `
                <div class="merchant-item ${rarityClass}" data-index="${index}" data-action="view-sell">
                    <div class="merchant-item-icon">${item.icon}${affixIndicator}${quantityText}</div>
                    <div class="merchant-item-name">${item.name}</div>
                    <div class="merchant-item-price" style="color: #2ECC71;">💰 ${sellPrice}</div>
                    <div class="merchant-item-stats">
                        ${item.effect?.type === 'heal' ? `<span>❤️+${item.effect.value}${item.effect.isPercent ? '%' : ''}</span>` : ''}
                        ${item.effect?.type === 'mana' ? `<span>💧+${item.effect.value}${item.effect.isPercent ? '%' : ''}</span>` : ''}
                        ${item.effect?.type === 'buff' ? `<span>⚔️+${item.effect.value}</span>` : ''}
                        ${item.stats?.attack ? `<span>⚔️+${item.stats.attack}</span>` : ''}
                        ${item.stats?.defense ? `<span>🛡️+${item.stats.defense}</span>` : ''}
                        ${item.stats?.maxHp ? `<span>❤️+${item.stats.maxHp}</span>` : ''}
                        ${item.stats?.critChance ? `<span>🎯+${Math.round(item.stats.critChance * 100)}%</span>` : ''}
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
        this.shopQuantity = 1;
        const isBuy = action === 'buy';
        const floor = this.gameState.dungeon.floor;
        const unitPrice = isBuy ? item.buyPrice : calculateItemSellPrice(item, floor);
        const isStackable = isStackableItem(item);
        const maxQuantity = isStackable ? (isBuy ? Math.min(item.quantity, 99) : item.quantity) : 1;

        document.getElementById('shop-item-name').textContent = item.name;
        document.getElementById('shop-item-icon').textContent = item.icon;
        
        const rarityElement = document.getElementById('shop-item-rarity');
        const rarityNames = { common: '普通', uncommon: '优秀', rare: '稀有', epic: '史诗', legendary: '传说' };
        rarityElement.textContent = rarityNames[item.rarity] || '普通';
        rarityElement.style.background = RARITY_COLORS[item.rarity] || '#95A5A6';
        rarityElement.style.color = '#fff';

        const quantitySelector = document.getElementById('shop-quantity-selector');
        const qtyValue = document.getElementById('shop-qty-value');
        const qtyMax = document.getElementById('shop-qty-max');
        
        if (isStackable) {
            quantitySelector.classList.remove('hidden');
            qtyValue.textContent = this.shopQuantity;
            qtyMax.textContent = `/ ${maxQuantity}`;
        } else {
            quantitySelector.classList.add('hidden');
        }

        const totalPrice = unitPrice * this.shopQuantity;
        const priceElement = document.getElementById('shop-item-price');
        priceElement.textContent = isBuy ? `💰 ${totalPrice} (${unitPrice}/个)` : `💰 +${totalPrice} (${unitPrice}/个)`;
        priceElement.style.color = isBuy ? '#F1C40F' : '#2ECC71';

        const statsContainer = document.getElementById('shop-item-stats');
        statsContainer.innerHTML = '';
        
        if (isStackable && item.quantity > 1) {
            statsContainer.innerHTML += `<div class="modal-stat"><span>📦 库存数量</span><span>${item.quantity}</span></div>`;
        }
        
        if (item.effect) {
            const effect = item.effect;
            const statNames = { attack: '攻击力', defense: '防御力', speed: '速度' };
            if (effect.type === 'heal') {
                statsContainer.innerHTML += `<div class="modal-stat"><span>❤️ 恢复生命</span><span style="color: #2ECC71;">+${effect.value}${effect.isPercent ? '%' : ''}</span></div>`;
            } else if (effect.type === 'mana') {
                statsContainer.innerHTML += `<div class="modal-stat"><span>💧 恢复魔法</span><span style="color: #3498DB;">+${effect.value}${effect.isPercent ? '%' : ''}</span></div>`;
            } else if (effect.type === 'buff') {
                const statName = statNames[effect.stat] || effect.stat;
                statsContainer.innerHTML += `<div class="modal-stat"><span>⚔️ ${statName}提升</span><span style="color: #E74C3C;">+${effect.value}</span></div>`;
                if (effect.duration) {
                    statsContainer.innerHTML += `<div class="modal-stat"><span>⏱️ 持续时间</span><span>${effect.duration} 回合/步</span></div>`;
                }
            }
        }
        
        const isEquipmentItem = item.type && ['weapon', 'armor', 'accessory'].includes(item.type);
        const slotNames = { weapon: '武器', armor: '护甲', accessory: '饰品' };
        const slotName = item.slotName || slotNames[item.type] || item.type;
        
        if (isEquipmentItem) {
            statsContainer.innerHTML += `<div class="modal-stat"><span>📍 穿戴部位</span><span>${slotName}</span></div>`;
        }
        
        const equippedItem = isEquipmentItem ? this.gameState.player.equipment[item.type] : null;
        
        if (isEquipmentItem && equippedItem) {
            statsContainer.innerHTML += `<div style="margin-top: 6px; padding: 4px 0; border-top: 1px solid rgba(255,255,255,0.1);">
                <div style="color: var(--text-secondary); font-size: 0.8rem;">📌 当前装备: ${equippedItem.name}</div>
            </div>`;
        }
        
        if (item.stats && item.stats.attack) {
            const compareText = this.getStatCompareText(item, equippedItem, 'attack');
            statsContainer.innerHTML += `<div class="modal-stat"><span>⚔️ 攻击力</span><span style="color: #2ECC71;">+${item.stats.attack}${compareText}</span></div>`;
        }
        if (item.stats && item.stats.defense) {
            const compareText = this.getStatCompareText(item, equippedItem, 'defense');
            statsContainer.innerHTML += `<div class="modal-stat"><span>🛡️ 防御力</span><span style="color: #2ECC71;">+${item.stats.defense}${compareText}</span></div>`;
        }
        if (item.stats && item.stats.maxHp) {
            const compareText = this.getStatCompareText(item, equippedItem, 'maxHp');
            statsContainer.innerHTML += `<div class="modal-stat"><span>❤️ 生命值上限</span><span style="color: #2ECC71;">+${item.stats.maxHp}${compareText}</span></div>`;
        }
        if (item.stats && item.stats.critChance) {
            const compareText = this.getStatCompareText(item, equippedItem, 'critChance', true);
            statsContainer.innerHTML += `<div class="modal-stat"><span>🎯 暴击率</span><span style="color: #F39C12;">+${Math.round(item.stats.critChance * 100)}%${compareText}</span></div>`;
        }
        
        if (item.affixes && (item.affixes.prefixes?.length > 0 || item.affixes.suffixes?.length > 0 || item.affixes.specials?.length > 0)) {
            statsContainer.innerHTML += `<div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.1);">`;
            statsContainer.innerHTML += `<div style="color: var(--accent-gold); font-weight: bold; margin-bottom: 6px; font-size: 0.9rem;">✨ 词缀属性</div>`;
            
            const allAffixes = [
                ...(item.affixes.prefixes || []),
                ...(item.affixes.suffixes || []),
                ...(item.affixes.specials || [])
            ];
            
            allAffixes.forEach(affix => {
                const affixColor = affix.minRarity === 'legendary' ? '#F1C40F' : 
                                  affix.minRarity === 'epic' ? '#9B59B6' :
                                  affix.minRarity === 'rare' ? '#3498DB' :
                                  affix.minRarity === 'uncommon' ? '#2ECC71' : '#95A5A6';
                statsContainer.innerHTML += `<div style="color: ${affixColor}; margin-bottom: 4px; font-size: 0.85rem;">${affix.description}</div>`;
            });
            
            statsContainer.innerHTML += `</div>`;
        }

        const descContainer = document.getElementById('shop-item-desc');
        descContainer.innerHTML = '';
        if (item.description) {
            descContainer.innerHTML = `<div class="shop-item-desc-text">${item.description}</div>`;
        }
        descContainer.innerHTML += `<div class="shop-item-desc-text" style="color: #95A5A6; margin-top: 8px; font-size: 0.9rem;">${isBuy ? '点击"确认购买"完成交易' : '点击"确认出售"获得金币'}</div>`;

        const confirmBtn = document.getElementById('shop-confirm-btn');
        confirmBtn.textContent = isBuy ? `确认购买 x${this.shopQuantity}` : `确认出售 x${this.shopQuantity}`;
        confirmBtn.style.background = isBuy ? '#3498DB' : '#2ECC71';

        const canAfford = !isBuy || this.gameState.player.gold >= totalPrice;
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
        const quantity = this.shopQuantity;
        
        if (action === 'buy') {
            const result = CharacterSystem.buyItem(this.gameState, this.currentMerchant, item.id, quantity);
            if (result.success) {
                this.showNotification(`✅ ${result.message}`);
            } else {
                this.showNotification(`❌ ${result.message}`);
            }
        } else {
            const result = CharacterSystem.sellItem(this.gameState, this.currentMerchant, item.id, quantity);
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
        merchant.inventory = generateMerchantInventory(floor, merchant, this.gameState);
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
        const result = CharacterSystem.equipItem(this.gameState, itemId);
        if (result && !result.success) {
            this.showNotification(`❌ ${result.message}`);
        }
        this.render();
        this.closeItemModal();
    }

    unequipItem(slot) {
        if (!this.gameState) return;
        
        if (this.gameState.combat && this.gameState.combat.active) {
            this.showNotification('❌ 战斗中无法卸下装备！');
            return;
        }
        
        const result = CharacterSystem.unequipItem(this.gameState, slot);
        if (result && !result.success) {
            this.showNotification(`❌ ${result.message}`);
        }
        this.render();
    }

    discardItem(itemId) {
        if (!this.gameState) return;
        const quantity = this.itemQuantity;
        const result = CharacterSystem.discardItem(this.gameState, itemId, quantity);
        if (result && !result.success) {
            this.showNotification(`❌ ${result.message}`);
        }
        this.render();
        this.closeItemModal();
    }
    
    useItem(itemId) {
        if (!this.gameState) return;
        const quantity = this.itemQuantity;
        const item = this.gameState.player.inventory.find(i => i.id === itemId);
        if (!item) return;
        
        for (let i = 0; i < quantity; i++) {
            const result = CharacterSystem.useConsumable(this.gameState, itemId);
            if (!result.success) {
                this.showNotification(`❌ ${result.message}`);
                break;
            } else if (i === 0) {
                this.showNotification(`✅ ${result.message}`);
            }
        }
        
        this.render();
        this.closeItemModal();
    }

    showItemModal(item) {
        this.selectedItem = item;
        this.itemQuantity = 1;
        document.getElementById('modal-item-name').textContent = item.name;
        document.getElementById('modal-item-icon').textContent = item.icon;
        
        const rarityElement = document.getElementById('modal-item-rarity');
        rarityElement.textContent = RARITY_NAMES[item.rarity] || '普通';
        rarityElement.style.background = RARITY_COLORS[item.rarity] || '#95A5A6';
        rarityElement.style.color = '#fff';

        const quantitySelector = document.getElementById('item-quantity-selector');
        const qtyValue = document.getElementById('item-qty-value');
        const qtyMax = document.getElementById('item-qty-max');
        const isStackable = isStackableItem(item);
        
        if (isStackable) {
            quantitySelector.classList.remove('hidden');
            qtyValue.textContent = this.itemQuantity;
            qtyMax.textContent = `/ ${item.quantity}`;
        } else {
            quantitySelector.classList.add('hidden');
        }

        const statsContainer = document.getElementById('modal-item-stats');
        statsContainer.innerHTML = '';
        
        if (isStackable && item.quantity > 1) {
            statsContainer.innerHTML += `<div class="modal-stat"><span>📦 数量</span><span>${item.quantity}</span></div>`;
        }
        
        if (item.effect) {
            const effect = item.effect;
            const statNames = { attack: '攻击力', defense: '防御力', speed: '速度' };
            if (effect.type === 'heal') {
                statsContainer.innerHTML += `<div class="modal-stat"><span>❤️ 恢复生命</span><span style="color: #2ECC71;">+${effect.value}${effect.isPercent ? '%' : ''}</span></div>`;
            } else if (effect.type === 'mana') {
                statsContainer.innerHTML += `<div class="modal-stat"><span>💧 恢复魔法</span><span style="color: #3498DB;">+${effect.value}${effect.isPercent ? '%' : ''}</span></div>`;
            } else if (effect.type === 'buff') {
                const statName = statNames[effect.stat] || effect.stat;
                statsContainer.innerHTML += `<div class="modal-stat"><span>⚔️ ${statName}提升</span><span style="color: #E74C3C;">+${effect.value}</span></div>`;
                if (effect.duration) {
                    statsContainer.innerHTML += `<div class="modal-stat"><span>⏱️ 持续时间</span><span>${effect.duration} 回合/步</span></div>`;
                }
            }
        }
        
        const slotNames = { weapon: '武器', armor: '护甲', accessory: '饰品' };
        const slotName = item.slotName || slotNames[item.type] || item.type;
        if (item.type && ['weapon', 'armor', 'accessory'].includes(item.type)) {
            statsContainer.innerHTML += `<div class="modal-stat"><span>📍 穿戴部位</span><span>${slotName}</span></div>`;
        }
        
        if (item.baseName && item.baseName !== item.name) {
            statsContainer.innerHTML += `<div class="modal-stat"><span>📦 基础装备</span><span>${item.baseName}</span></div>`;
        }
        
        const isEquipmentItem = item.type && ['weapon', 'armor', 'accessory'].includes(item.type);
        const equippedItem = isEquipmentItem ? this.gameState.player.equipment[item.type] : null;
        
        if (isEquipmentItem && equippedItem) {
            statsContainer.innerHTML += `<div style="margin-top: 8px; padding: 6px 0; border-top: 1px solid rgba(255,255,255,0.1);">
                <div style="color: var(--text-secondary); font-size: 0.85rem; margin-bottom: 6px;">📌 当前装备: ${equippedItem.name}</div>
            </div>`;
        }
        
        if (item.stats && item.stats.attack) {
            const compareText = this.getStatCompareText(item, equippedItem, 'attack');
            statsContainer.innerHTML += `<div class="modal-stat"><span>⚔️ 攻击力</span><span style="color: #2ECC71;">+${item.stats.attack}${compareText}</span></div>`;
        }
        if (item.stats && item.stats.defense) {
            const compareText = this.getStatCompareText(item, equippedItem, 'defense');
            statsContainer.innerHTML += `<div class="modal-stat"><span>🛡️ 防御力</span><span style="color: #2ECC71;">+${item.stats.defense}${compareText}</span></div>`;
        }
        if (item.stats && item.stats.maxHp) {
            const compareText = this.getStatCompareText(item, equippedItem, 'maxHp');
            statsContainer.innerHTML += `<div class="modal-stat"><span>❤️ 生命值</span><span style="color: #2ECC71;">+${item.stats.maxHp}${compareText}</span></div>`;
        }
        if (item.stats && item.stats.critChance) {
            const compareText = this.getStatCompareText(item, equippedItem, 'critChance', true);
            statsContainer.innerHTML += `<div class="modal-stat"><span>🎯 暴击率</span><span style="color: #F39C12;">+${Math.round(item.stats.critChance * 100)}%${compareText}</span></div>`;
        }

        if (item.affixes && (item.affixes.prefixes?.length > 0 || item.affixes.suffixes?.length > 0 || item.affixes.specials?.length > 0)) {
            statsContainer.innerHTML += `<div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid rgba(255,255,255,0.1);">`;
            statsContainer.innerHTML += `<div style="color: var(--accent-gold); font-weight: bold; margin-bottom: 8px;">✨ 词缀属性</div>`;
            
            const allAffixes = [
                ...(item.affixes.prefixes || []),
                ...(item.affixes.suffixes || []),
                ...(item.affixes.specials || [])
            ];
            
            allAffixes.forEach(affix => {
                const affixColor = affix.minRarity === 'legendary' ? '#F1C40F' : 
                                  affix.minRarity === 'epic' ? '#9B59B6' :
                                  affix.minRarity === 'rare' ? '#3498DB' :
                                  affix.minRarity === 'uncommon' ? '#2ECC71' : '#95A5A6';
                statsContainer.innerHTML += `<div style="color: ${affixColor}; margin-bottom: 6px;">${affix.description}</div>`;
            });
            
            statsContainer.innerHTML += `</div>`;
        }

        if (item.sellPrice) {
            const sellTotal = isStackable ? item.sellPrice * this.itemQuantity : item.sellPrice;
            statsContainer.innerHTML += `<div class="modal-stat"><span>💰 出售价格</span><span>${item.sellPrice} 金币${isStackable ? ` (共${sellTotal})` : ''}</span></div>`;
        }

        if (item.useInCombat || item.useOutOfCombat) {
            const useText = [];
            if (item.useInCombat) useText.push('战斗中可使用');
            if (item.useOutOfCombat) useText.push('非战斗可使用');
            statsContainer.innerHTML += `<div class="modal-stat"><span>💡 使用场景</span><span>${useText.join('，')}</span></div>`;
        }

        if (item.description) {
            statsContainer.innerHTML += `<div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid rgba(255,255,255,0.1); color: var(--text-secondary); font-size: 0.9rem;">${item.description}</div>`;
        }

        if (this.gameState.combat && this.gameState.combat.active && !CharacterSystem.isUsableItem(item)) {
            statsContainer.innerHTML += `<div style="margin-top: 10px; padding: 8px; background: rgba(231, 76, 60, 0.2); border-radius: 4px; color: #E74C3C; font-size: 0.9rem;">⚠️ 战斗中无法更换装备</div>`;
        }

        const equipBtn = document.getElementById('equip-btn');
        const useBtn = document.getElementById('use-btn');
        const discardBtn = document.getElementById('discard-btn');
        
        if (CharacterSystem.isUsableItem(item)) {
            equipBtn.classList.add('hidden');
            useBtn.classList.remove('hidden');
            const inCombat = this.gameState.combat && this.gameState.combat.active;
            const canUse = (inCombat && item.useInCombat) || (!inCombat && item.useOutOfCombat);
            useBtn.disabled = !canUse;
            useBtn.textContent = canUse ? `使用 x${this.itemQuantity}` : (inCombat ? '战斗中不可使用' : '无法使用');
        } else {
            equipBtn.classList.remove('hidden');
            useBtn.classList.add('hidden');
            
            if (this.gameState.combat && this.gameState.combat.active) {
                equipBtn.disabled = true;
                equipBtn.style.opacity = '0.5';
                equipBtn.style.cursor = 'not-allowed';
            } else {
                equipBtn.disabled = false;
                equipBtn.style.opacity = '1';
                equipBtn.style.cursor = 'pointer';
            }
            
            if (equippedItem) {
                equipBtn.textContent = '🔄 替换装备';
            } else {
                equipBtn.textContent = '⚔️ 装备';
            }
        }

        if (isStackable) {
            discardBtn.textContent = `丢弃 x${this.itemQuantity}`;
        } else {
            discardBtn.textContent = '丢弃';
        }
        discardBtn.disabled = isEquipmentItem && equippedItem && equippedItem.id === item.id;

        document.getElementById('item-modal').classList.remove('hidden');
    }
    
    getStatCompareText(newItem, equippedItem, statName, isPercent = false) {
        if (!equippedItem || !equippedItem.stats) return '';
        
        const newVal = newItem.stats?.[statName] || 0;
        const oldVal = equippedItem.stats?.[statName] || 0;
        const diff = newVal - oldVal;
        
        if (diff === 0) return '';
        
        const formatValue = (val) => isPercent ? `${Math.round(val * 100)}%` : val;
        
        if (diff > 0) {
            return ` <span style="color: #2ECC71; font-size: 0.85rem;">(+${formatValue(diff)})</span>`;
        } else {
            return ` <span style="color: #E74C3C; font-size: 0.85rem;">(${formatValue(diff)})</span>`;
        }
    }

    useSelectedItem() {
        if (!this.selectedItem) return;
        
        if (this.selectedItem.subType === 'weather_scroll') {
            const result = CharacterSystem.useWeatherScroll(this.gameState, this.selectedItem.id);
            if (result && result.success) {
                this.showNotification(result.message);
            }
        } else if (this.selectedItem.subType === 'consumable') {
            this.useItem(this.selectedItem.id);
            return;
        }
        
        this.closeItemModal();
        this.render();
    }
    
    sortInventory() {
        if (!this.gameState) return;
        CharacterSystem.sortInventory(this.gameState.player.inventory);
        this.showNotification('📦 背包已整理！');
        this.render();
    }
    
    filterInventory(category) {
        this.inventoryFilter = category;
        document.querySelectorAll('.inventory-filter-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === category);
        });
        this.renderInventory();
    }
    
    changeItemQuantity(delta) {
        if (!this.selectedItem || !isStackableItem(this.selectedItem)) return;
        const maxQty = this.selectedItem.quantity;
        this.itemQuantity = Math.max(1, Math.min(maxQty, this.itemQuantity + delta));
        document.getElementById('item-qty-value').textContent = this.itemQuantity;
        this.showItemModal(this.selectedItem);
    }
    
    changeShopQuantity(delta) {
        if (!this.pendingShopItem) return;
        const { item, action } = this.pendingShopItem;
        if (!isStackableItem(item)) return;
        const isBuy = action === 'buy';
        const maxQty = isBuy ? Math.min(item.quantity, 99) : item.quantity;
        this.shopQuantity = Math.max(1, Math.min(maxQty, this.shopQuantity + delta));
        this.showShopItemModal(item, action);
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

        DifficultySystem.updateHistory(this.gameState, true);
        DifficultySystem.submitDifficultyData(this.gameState);

        StorageManager.clearLocalSave();

        document.getElementById('final-score').textContent = finalScore.toLocaleString();
        document.getElementById('final-kills').textContent = this.gameState.kills;
        document.getElementById('final-floor').textContent = this.gameState.dungeon.floor;
        document.getElementById('final-level').textContent = this.gameState.player.stats.level;

        const difficultyInfo = DifficultySystem.getDifficultyDescription(this.gameState);
        const finalDifficultyEl = document.getElementById('final-difficulty');
        if (finalDifficultyEl) {
            finalDifficultyEl.textContent = `${difficultyInfo.icon} ${difficultyInfo.name}`;
        }

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
        this.renderDifficultyPanel();
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

    renderDifficultyPanel() {
        const panel = document.getElementById('difficulty-panel');
        if (!panel) return;

        const diffInfo = DifficultySystem.getDifficultyDescription(this.gameState);
        
        document.getElementById('difficulty-name').textContent = `${diffInfo.icon} ${diffInfo.name}`;
        document.getElementById('difficulty-name').style.color = diffInfo.color;
        
        const scorePercent = Math.max(0, Math.min(100, (diffInfo.score + 50) / 1.5));
        document.getElementById('difficulty-score-fill').style.width = `${scorePercent}%`;
        document.getElementById('difficulty-score-fill').style.background = diffInfo.color;
        document.getElementById('difficulty-score-text').textContent = `难度评分: ${Math.round(diffInfo.score)}`;
        
        const diffStats = document.getElementById('difficulty-stats');
        if (diffStats) {
            diffStats.innerHTML = `
                <div style="font-size: 0.85rem; color: var(--text-secondary);">
                    <div>敌人强度: ${Math.round((diffInfo.enemyHpMod - 1) * 100) >= 0 ? '+' : ''}${Math.round((diffInfo.enemyHpMod - 1) * 100)}%</div>
                    <div>掉落倍率: ${diffInfo.dropRateMod.toFixed(2)}x</div>
                    <div>精英概率: ${diffInfo.eliteChanceMod.toFixed(1)}x</div>
                    <div>经验倍率: ${diffInfo.expMod.toFixed(2)}x</div>
                </div>
            `;
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

        const mpPercent = (player.stats.currentMp / player.stats.maxMp) * 100;
        document.getElementById('mp-text').textContent = `${player.stats.currentMp}/${player.stats.maxMp}`;
        document.getElementById('mp-fill').style.width = `${mpPercent}%`;

        const expPercent = (player.stats.exp / player.stats.expToNext) * 100;
        document.getElementById('exp-text').textContent = `${player.stats.exp}/${player.stats.expToNext}`;
        document.getElementById('exp-fill').style.width = `${expPercent}%`;

        document.getElementById('skill-points-text').textContent = player.skills?.skillPoints || 0;

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
        
        const critChanceElement = document.getElementById('player-crit-chance');
        if (critChanceElement && totalStats.critChance !== undefined) {
            const critPercent = Math.round(totalStats.critChance * 100);
            critChanceElement.innerHTML = `${critPercent}%`;
        }

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
        const slotNames = { weapon: '武器', armor: '护甲', accessory: '饰品' };
        
        ['weapon', 'armor', 'accessory'].forEach(slot => {
            const slotElement = document.querySelector(`[data-slot="${slot}"]`);
            const contentElement = document.getElementById(`equip-${slot}`);
            
            if (equipment[slot]) {
                const item = equipment[slot];
                slotElement.classList.add('equipped');
                
                const rarityClass = `rarity-${item.rarity}`;
                const hasAffixes = item.affixes && 
                    (item.affixes.prefixes?.length > 0 || 
                     item.affixes.suffixes?.length > 0 || 
                     item.affixes.specials?.length > 0);
                const affixIndicator = hasAffixes ? '✨' : '';
                
                let tooltip = `${item.name}\n`;
                tooltip += `部位: ${slotNames[slot]}\n`;
                if (item.stats) {
                    if (item.stats.attack) tooltip += `攻击+${item.stats.attack}\n`;
                    if (item.stats.defense) tooltip += `防御+${item.stats.defense}\n`;
                    if (item.stats.maxHp) tooltip += `生命+${item.stats.maxHp}\n`;
                    if (item.stats.critChance) tooltip += `暴击+${Math.round(item.stats.critChance * 100)}%\n`;
                }
                tooltip = tooltip.trim();
                
                contentElement.innerHTML = `
                    <span title="${tooltip}" style="cursor: pointer;" class="${rarityClass}">
                        ${item.icon}${affixIndicator}
                    </span>
                `;
                contentElement.onclick = () => this.unequipItem(slot);
            } else {
                slotElement.classList.remove('equipped');
                contentElement.innerHTML = `
                    <span title="${slotNames[slot]}栏位（空）" style="cursor: default; opacity: 0.5;">
                        -
                    </span>
                `;
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
        const filteredInventory = CharacterSystem.filterInventory(inventory, this.inventoryFilter);
        const gridElement = document.getElementById('inventory-grid');
        const summaryElement = document.getElementById('inventory-summary');
        
        if (summaryElement) {
            const summary = CharacterSystem.getInventorySummary(inventory);
            summaryElement.innerHTML = `
                <span class="summary-item" title="装备">⚔️ ${summary.equipment}</span>
                <span class="summary-item" title="消耗品">🧪 ${summary.consumable}</span>
                <span class="summary-item" title="素材">📦 ${summary.material}</span>
                <span class="summary-item total" title="总数">${summary.total}/${summary.maxSlots}</span>
            `;
        }
        
        let html = '';
        const maxSlots = 20;
        
        for (let i = 0; i < maxSlots; i++) {
            if (i < filteredInventory.length) {
                const item = filteredInventory[i];
                const hasAffixes = item.affixes && 
                    (item.affixes.prefixes?.length > 0 || 
                     item.affixes.suffixes?.length > 0 || 
                     item.affixes.specials?.length > 0);
                const affixIndicator = hasAffixes ? '✨' : '';
                const quantityText = isStackableItem(item) && item.quantity > 1 
                    ? `<span class="item-quantity">${item.quantity}</span>` 
                    : '';
                const categoryIcon = getItemCategory(item) === 'consumable' ? '🧪' : 
                                     getItemCategory(item) === 'material' ? '📦' : '';
                
                html += `
                    <div class="inventory-slot rarity-${item.rarity}" 
                         data-item-id="${item.id}"
                         title="${item.name}${isStackableItem(item) ? ` (x${item.quantity})` : ''}">
                        ${item.icon}${affixIndicator}
                        ${quantityText}
                    </div>
                `;
            } else {
                html += '<div class="inventory-slot empty"></div>';
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
        
        const enemyHpPercent = (combat.enemy.currentHp / combat.enemy.maxHp) * 100;
        document.getElementById('enemy-hp-text').textContent = `${combat.enemy.currentHp}/${combat.enemy.maxHp}`;
        document.getElementById('enemy-hp-fill').style.width = `${enemyHpPercent}%`;

        const player = this.gameState.player;
        const totalStats = CharacterSystem.getPlayerTotalStats(this.gameState);
        
        const combatHpPercent = (player.stats.currentHp / totalStats.maxHp) * 100;
        document.getElementById('combat-hp-text').textContent = `${player.stats.currentHp}/${totalStats.maxHp}`;
        document.getElementById('combat-hp-fill').style.width = `${combatHpPercent}%`;

        const combatMpPercent = (player.stats.currentMp / player.stats.maxMp) * 100;
        document.getElementById('combat-mp-text').textContent = `${player.stats.currentMp}/${player.stats.maxMp}`;
        document.getElementById('combat-mp-fill').style.width = `${combatMpPercent}%`;

        this.renderCombatEffects();
        this.renderCombatSkills();

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

    renderCombatEffects() {
        const display = document.getElementById('combat-effects-display');
        if (!display) return;

        const effects = this.gameState.player.skills?.combatEffects;
        if (!effects) {
            display.innerHTML = '';
            return;
        }

        let html = '';
        if (effects.shield > 0) {
            html += `<div class="combat-effect-item effect-shield" title="护盾">🛡️ 护盾: ${effects.shield}</div>`;
        }
        if (effects.attackMod > 0) {
            html += `<div class="combat-effect-item effect-buff" title="攻击增强">💪 攻击+${Math.floor(effects.attackMod * 100)}%</div>`;
        }
        if (effects.defenseMod > 0) {
            html += `<div class="combat-effect-item effect-buff" title="防御增强">🛡️ 防御+${Math.floor(effects.defenseMod * 100)}%</div>`;
        }
        if (effects.dodgeTurns > 0) {
            html += `<div class="combat-effect-item effect-dodge" title="闪避">💨 闪避(${effects.dodgeTurns}回合)</div>`;
        }
        if (effects.dotTurns > 0) {
            html += `<div class="combat-effect-item effect-dot" title="中毒效果">☠️ 毒伤(${effects.dotDamage}x${effects.dotTurns}回合)</div>`;
        }
        if (this.gameState.combat.enemyStunned) {
            html += `<div class="combat-effect-item effect-stun" title="敌人眩晕">⚡ 敌人眩晕中</div>`;
        }

        display.innerHTML = html;
    }

    renderCombatSkills() {
        const grid = document.getElementById('combat-skills-grid');
        const skillsContainer = document.getElementById('combat-skills');
        if (!grid || !skillsContainer) return;

        const learnedSkills = SkillSystem.getLearnedSkillsForCombat(this.gameState);
        
        if (learnedSkills.length === 0) {
            skillsContainer.classList.add('hidden');
            return;
        }
        skillsContainer.classList.remove('hidden');

        const combat = this.gameState.combat;
        const player = this.gameState.player;

        let html = '';
        learnedSkills.forEach(skill => {
            const branch = SkillSystem.getBranchBySkillId(skill.id);
            const canUse = player.stats.currentMp >= skill.mpCost && combat.playerTurn;
            const disabledClass = canUse ? '' : 'skill-btn-disabled';
            const color = branch?.color || '#95A5A6';

            html += `
                <button class="combat-skill-btn ${disabledClass}" 
                        data-skill-id="${skill.id}"
                        style="border-color: ${color}; color: ${color};"
                        title="${skill.description}&#10;消耗 MP: ${skill.mpCost}">
                    <div class="skill-btn-icon">${skill.icon}</div>
                    <div class="skill-btn-name">${skill.name}</div>
                    <div class="skill-btn-mp">💙 ${skill.mpCost}</div>
                </button>
            `;
        });
        grid.innerHTML = html;

        grid.querySelectorAll('.combat-skill-btn:not(.skill-btn-disabled)').forEach(btn => {
            btn.addEventListener('click', () => {
                const skillId = btn.dataset.skillId;
                this.combatSkillAction(skillId);
            });
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

    openSkillTree() {
        if (this.gameState.combat.active) {
            this.showNotification('❌ 战斗中无法打开技能树！');
            return;
        }
        this.currentSkillBranch = 'warrior';
        document.getElementById('skill-tree-overlay').classList.remove('hidden');
        this.renderSkillTree();
    }

    closeSkillTree() {
        document.getElementById('skill-tree-overlay').classList.add('hidden');
        this.render();
    }

    switchSkillBranch(branchId) {
        this.currentSkillBranch = branchId;
        document.querySelectorAll('.skill-tree-tab').forEach(tab => {
            if (tab.dataset.branch === branchId) {
                tab.classList.add('active');
                const branch = SKILL_BRANCHES[branchId];
                if (branch) {
                    tab.style.borderColor = branch.color;
                    tab.style.color = branch.color;
                }
            } else {
                tab.classList.remove('active');
                tab.style.borderColor = '';
                tab.style.color = '';
            }
        });
        this.renderSkillTree();
    }

    renderSkillTree() {
        if (!this.gameState) return;

        const branchId = this.currentSkillBranch || 'warrior';
        const branch = SKILL_BRANCHES[branchId];
        if (!branch) return;

        document.getElementById('skill-tree-points').textContent = this.gameState.player.skills?.skillPoints || 0;
        document.getElementById('skill-tree-points').style.color = 
            (this.gameState.player.skills?.skillPoints || 0) > 0 ? '#2ECC71' : '#95A5A6';

        const descEl = document.getElementById('skill-tree-branch-desc');
        descEl.innerHTML = `
            <div class="branch-desc-icon" style="color: ${branch.color};">${branch.icon}</div>
            <div class="branch-desc-text">
                <div class="branch-desc-name" style="color: ${branch.color};">${branch.name}</div>
                <div class="branch-desc-detail">${branch.description}</div>
            </div>
        `;

        const content = document.getElementById('skill-tree-content');
        const learned = this.gameState.player.skills?.learnedSkills || [];
        const skillPoints = this.gameState.player.skills?.skillPoints || 0;

        let html = '';
        for (let tier = 1; tier <= 3; tier++) {
            const tierSkills = branch.skills.filter(s => s.tier === tier);
            html += `<div class="skill-tier">
                <div class="skill-tier-title" style="color: ${branch.color};">第 ${tier} 阶</div>
                <div class="skill-tier-grid">`;
            
            tierSkills.forEach(skill => {
                const isLearned = learned.includes(skill.id);
                const prereqOk = !skill.prerequisite || learned.includes(skill.prerequisite);
                const canLearn = !isLearned && prereqOk && skillPoints > 0;
                
                let statusClass = 'skill-card';
                if (isLearned) statusClass += ' skill-learned';
                else if (!prereqOk) statusClass += ' skill-locked';
                else if (skillPoints <= 0) statusClass += ' skill-no-points';

                const borderColor = isLearned ? branch.color : (!prereqOk ? '#555' : '#666');
                let prereqText = '';
                if (skill.prerequisite && !prereqOk) {
                    const prereqSkill = SkillSystem.getSkillById(skill.prerequisite);
                    prereqText = `<div class="skill-prereq">🔒 前置: ${prereqSkill?.name || skill.prerequisite}</div>`;
                }

                html += `
                    <div class="${statusClass}" 
                         data-skill-id="${skill.id}"
                         style="border-color: ${borderColor};">
                        <div class="skill-card-header">
                            <div class="skill-icon" style="color: ${isLearned ? branch.color : '#aaa'};">${skill.icon}</div>
                            <div class="skill-info">
                                <div class="skill-name" style="color: ${isLearned ? branch.color : 'var(--text-primary)'};">${skill.name}</div>
                                <div class="skill-mp-cost">💙 消耗 MP: ${skill.mpCost}</div>
                            </div>
                            ${isLearned ? '<div class="skill-learned-tag">✓ 已学</div>' : ''}
                        </div>
                        <div class="skill-description">${skill.description}</div>
                        ${prereqText}
                        <div class="skill-actions">
                            ${isLearned 
                                ? `<button class="learned-btn" disabled>已掌握</button>`
                                : canLearn 
                                    ? `<button class="learn-btn" style="background: ${branch.color};" data-learn-skill="${skill.id}">🌟 学习 (1技能点)</button>`
                                    : `<button class="learn-btn disabled" disabled>无法学习</button>`
                            }
                        </div>
                    </div>
                `;
            });
            html += '</div></div>';
        }

        content.innerHTML = html;

        content.querySelectorAll('[data-learn-skill]').forEach(btn => {
            btn.addEventListener('click', () => {
                const skillId = btn.dataset.learnSkill;
                this.learnSkillAction(skillId);
            });
        });
    }

    learnSkillAction(skillId) {
        const result = SkillSystem.learnSkill(this.gameState, skillId);
        if (result.success) {
            this.showNotification(`✅ ${result.message}`);
            this.renderSkillTree();
        } else {
            this.showNotification(`❌ ${result.message}`);
        }
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

        const sortBtn = document.getElementById('sort-inventory-btn');
        if (sortBtn) {
            sortBtn.addEventListener('click', () => {
                this.sortInventory();
            });
        }

        document.querySelectorAll('.inventory-filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const filter = btn.dataset.filter;
                this.filterInventory(filter);
            });
        });

        const itemQtyMinus = document.getElementById('item-qty-minus');
        const itemQtyPlus = document.getElementById('item-qty-plus');
        if (itemQtyMinus) {
            itemQtyMinus.addEventListener('click', () => {
                this.changeItemQuantity(-1);
            });
        }
        if (itemQtyPlus) {
            itemQtyPlus.addEventListener('click', () => {
                this.changeItemQuantity(1);
            });
        }

        const shopQtyMinus = document.getElementById('shop-qty-minus');
        const shopQtyPlus = document.getElementById('shop-qty-plus');
        if (shopQtyMinus) {
            shopQtyMinus.addEventListener('click', () => {
                this.changeShopQuantity(-1);
            });
        }
        if (shopQtyPlus) {
            shopQtyPlus.addEventListener('click', () => {
                this.changeShopQuantity(1);
            });
        }

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

        const openSkillTreeBtn = document.getElementById('open-skill-tree-btn');
        if (openSkillTreeBtn) {
            openSkillTreeBtn.addEventListener('click', () => this.openSkillTree());
        }

        const closeSkillTreeBtn = document.getElementById('close-skill-tree-btn');
        if (closeSkillTreeBtn) {
            closeSkillTreeBtn.addEventListener('click', () => this.closeSkillTree());
        }

        const skillTreeOverlay = document.getElementById('skill-tree-overlay');
        if (skillTreeOverlay) {
            skillTreeOverlay.addEventListener('click', (e) => {
                if (e.target.id === 'skill-tree-overlay') {
                    this.closeSkillTree();
                }
            });
        }

        document.querySelectorAll('.skill-tree-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                const branchId = tab.dataset.branch;
                if (branchId) {
                    this.switchSkillBranch(branchId);
                }
            });
        });

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
