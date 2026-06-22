class CharacterSystem {
  static createNewPlayer() {
    const inventory = [];
    for (let i = 0; i < 3; i++) {
      inventory.push(getRandomEquipment(1));
    }
    
    const healthPotion = createStackableItem(CONSUMABLES[0], 5);
    const manaPotion = createStackableItem(CONSUMABLES[3], 3);
    inventory.push(healthPotion, manaPotion);

    let player = {
      stats: {
        maxHp: 100,
        currentHp: 100,
        maxMp: 50,
        currentMp: 50,
        attack: 10,
        defense: 5,
        level: 1,
        exp: 0,
        expToNext: 100
      },
      gold: 50,
      position: { x: 0, y: 0 },
      equipment: {
        weapon: null,
        armor: null,
        accessory: null
      },
      inventory: inventory,
      skills: SkillSystem.createSkillState()
    };
    return player;
  }

  static ensureGameStateCompatibility(gameState) {
    if (!gameState.player.gold) {
      gameState.player.gold = 50;
    }
    if (gameState.comboKills === undefined) gameState.comboKills = 0;
    if (gameState.lastKillTime === undefined) gameState.lastKillTime = 0;
    if (gameState.totalGoldCollected === undefined) gameState.totalGoldCollected = 0;
    if (gameState.merchantsVisited === undefined) gameState.merchantsVisited = 0;
    if (!gameState.quests) {
      gameState.quests = generateFloorQuests(gameState.dungeon.floor || 1, 2);
    }
    
    if (gameState.dungeon && gameState.dungeon.tiles) {
      for (let y = 0; y < gameState.dungeon.tiles.length; y++) {
        for (let x = 0; x < gameState.dungeon.tiles[y].length; x++) {
          const tile = gameState.dungeon.tiles[y][x];
          if (tile.merchant === undefined) {
            tile.merchant = null;
          }
        }
      }
    }
    
    if (!gameState.player.stats.critChance) {
      gameState.player.stats.critChance = 0;
    }
    
    this.ensureAllEquipmentAffixes(gameState);

    gameState = SkillSystem.ensureSkillCompatibility(gameState);
    
    gameState = DifficultySystem.ensureGameStateCompatibility(gameState);
    
    return gameState;
  }

  static async createNewGameState() {
    const player = this.createNewPlayer();
    const difficultyState = DifficultySystem.createEmptyDifficultyState();
    const gameState = {
      player: player,
      dungeon: { floor: 1 },
      weatherState: null,
      difficultyState: difficultyState,
      combat: {
        active: false,
        enemy: null,
        playerTurn: true,
        log: []
      },
      gameLog: ['🎮 欢迎来到 Roguelike 地牢！'],
      score: 0,
      kills: 0,
      comboKills: 0,
      lastKillTime: 0,
      totalGoldCollected: 0,
      merchantsVisited: 0,
      quests: null
    };

    DifficultySystem.loadHistoryToGameState(gameState);
    await DifficultySystem.updateDifficulty(gameState);

    const dungeon = generateDungeon(50, 50, 1, gameState);
    player.position = { ...dungeon.playerPosition };
    const weatherState = WeatherSystem.generateWeatherForFloor(1, gameState);
    const floor = 1;

    gameState.dungeon = dungeon;
    gameState.weatherState = weatherState;
    gameState.quests = generateFloorQuests(floor, 2);

    const activeWeathers = WeatherSystem.getActiveWeatherDescriptions(weatherState);
    if (activeWeathers.length > 0) {
      activeWeathers.forEach(w => {
        gameState.gameLog.push(`${w.icon} 本层触发【${w.name}】天气：${w.description}`);
      });
    }

    if (dungeon.merchantCount > 0) {
      gameState.gameLog.push(`🛒 第 ${floor} 层出现了 ${dungeon.merchantCount} 位商人！寻找他们进行交易吧！`);
    }
    gameState.gameLog.push(`📜 新任务已发布，完成任务可获得金币奖励！`);

    const diffState = gameState.difficultyState;
    if (diffState && diffState.history && diffState.history.gamesPlayed > 0) {
      const history = diffState.history;
      gameState.gameLog.push(`📊 历史战绩：已通关 ${history.gamesPlayed} 局，最高第 ${history.highestFloor} 层，累计击杀 ${history.totalKills} 只敌人`);
    }

    const difficultyInfo = DifficultySystem.getDifficultyDescription(gameState);
    gameState.gameLog.push(`⚖️ 初始难度：${difficultyInfo.icon} ${difficultyInfo.name}（评分：${Math.round(difficultyInfo.score)}）- ${difficultyInfo.description}`);
    
    if (dungeon.elitePlaced) {
      gameState.gameLog.push(`💎 警告：本层出现了精英怪物！`);
    }

    this.exploreArea(dungeon, player.position.x, player.position.y, gameState);

    return gameState;
  }

  static movePlayer(gameState, direction) {
    const player = gameState.player;
    const dungeon = gameState.dungeon;

    const weatherMoveResult = WeatherSystem.applyMoveEffects(gameState);
    if (weatherMoveResult.messages) {
      weatherMoveResult.messages.forEach(msg => gameState.gameLog.push(msg));
    }
    if (weatherMoveResult.blocked) {
      WeatherSystem.tickWeatherDuration(gameState.weatherState, 1);
      if (player.stats.currentHp <= 0) {
        return { type: 'death' };
      }
      return { type: 'blocked', reason: 'weather' };
    }

    let newX = player.position.x;
    let newY = player.position.y;

    switch (direction) {
      case 'up':
      case 'w':
      case 'ArrowUp':
        newY--;
        break;
      case 'down':
      case 's':
      case 'ArrowDown':
        newY++;
        break;
      case 'left':
      case 'a':
      case 'ArrowLeft':
        newX--;
        break;
      case 'right':
      case 'd':
      case 'ArrowRight':
        newX++;
        break;
      default:
        return null;
    }

    if (newX < 0 || newX >= dungeon.width || newY < 0 || newY >= dungeon.height) {
      return { type: 'blocked', reason: 'boundary' };
    }

    const tile = dungeon.tiles[newY][newX];

    if (tile.type === 'wall') {
      return { type: 'blocked', reason: 'wall' };
    }

    this.exploreArea(dungeon, newX, newY, gameState);

    if (tile.type === 'enemy' && tile.enemy) {
      player.position = { x: newX, y: newY };
      WeatherSystem.tickWeatherDuration(gameState.weatherState, 1);
      const expiredWeathers = WeatherSystem.tickWeatherDuration(gameState.weatherState, 0);
      this.handleExpiredWeathers(gameState, expiredWeathers);
      if (player.stats.currentHp <= 0) {
        return { type: 'death' };
      }
      return { type: 'encounter', enemy: tile.enemy, position: { x: newX, y: newY } };
    }

    if (tile.type === 'merchant' && tile.merchant) {
      player.position = { x: newX, y: newY };
      WeatherSystem.tickWeatherDuration(gameState.weatherState, 1);
      const expiredWeathers = WeatherSystem.tickWeatherDuration(gameState.weatherState, 0);
      this.handleExpiredWeathers(gameState, expiredWeathers);
      if (player.stats.currentHp <= 0) {
        return { type: 'death' };
      }
      return { type: 'merchant', merchant: tile.merchant, position: { x: newX, y: newY } };
    }

    if (tile.type === 'item' && tile.item) {
      player.position = { x: newX, y: newY };
      const item = tile.item;
      const quantity = item.quantity || 1;
      
      const result = this.addItemToInventory(player.inventory, item, quantity);
      if (result.success) {
        tile.type = 'floor';
        tile.item = null;
        const quantityText = isStackableItem(item) && quantity > 1 ? ` x${quantity}` : '';
        gameState.gameLog.push(`📦 你拾取了 ${item.icon} ${item.name}${quantityText}！`);
        gameState.score += 10;
      } else {
        gameState.gameLog.push(`❌ ${result.message}`);
      }
      
      WeatherSystem.tickWeatherDuration(gameState.weatherState, 1);
      const expiredWeathers = WeatherSystem.tickWeatherDuration(gameState.weatherState, 0);
      this.handleExpiredWeathers(gameState, expiredWeathers);
      if (player.stats.currentHp <= 0) {
        return { type: 'death' };
      }
      return { type: 'item', item: item, success: result.success };
    }

    if (tile.type === 'stairs') {
      player.position = { x: newX, y: newY };
      WeatherSystem.tickWeatherDuration(gameState.weatherState, 1);
      const expiredWeathers = WeatherSystem.tickWeatherDuration(gameState.weatherState, 0);
      this.handleExpiredWeathers(gameState, expiredWeathers);
      if (player.stats.currentHp <= 0) {
        return { type: 'death' };
      }
      return { type: 'stairs' };
    }

    player.position = { x: newX, y: newY };
    dungeon.playerPosition = { x: newX, y: newY };

    WeatherSystem.tickWeatherDuration(gameState.weatherState, 1);
    const expiredWeathers2 = WeatherSystem.tickWeatherDuration(gameState.weatherState, 0);
    this.handleExpiredWeathers(gameState, expiredWeathers2);
    
    this.tickMapBuffs(gameState);

    const randomWeatherResult = this.tryRandomWeatherEvent(gameState);
    if (randomWeatherResult) {
      gameState.gameLog.push(randomWeatherResult.message);
    }

    if (player.stats.currentHp <= 0) {
      return { type: 'death' };
    }

    return { type: 'move', position: { x: newX, y: newY }, weatherEffects: weatherMoveResult };
  }

  static exploreArea(dungeon, x, y, gameState = null) {
    let viewRange = 5;
    if (gameState) {
      viewRange = WeatherSystem.getModifiedViewRange(gameState, viewRange);
    }
    for (let dy = -viewRange; dy <= viewRange; dy++) {
      for (let dx = -viewRange; dx <= viewRange; dx++) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx >= 0 && nx < dungeon.width && ny >= 0 && ny < dungeon.height) {
          const distance = Math.sqrt(dx * dx + dy * dy);
          if (distance <= viewRange) {
            dungeon.tiles[ny][nx].explored = true;
          }
        }
      }
    }
  }

  static handleExpiredWeathers(gameState, expiredIds) {
    if (!expiredIds || expiredIds.length === 0) return;
    expiredIds.forEach(id => {
      const data = WEATHER_DATA[id];
      if (data) {
        gameState.gameLog.push(`${data.icon} 天气【${data.name}】已消散。`);
      }
    });
  }

  static tryRandomWeatherEvent(gameState) {
    if (!gameState.moveCount) gameState.moveCount = 0;
    gameState.moveCount++;

    const triggerChance = 0.01 + gameState.dungeon.floor * 0.002;
    if (Math.random() > triggerChance) return null;
    if (gameState.weatherState.activeWeathers.length >= 2) return null;

    const floor = gameState.dungeon.floor;
    const isLowHp = gameState.player.stats.currentHp / gameState.player.stats.maxHp < 0.3;
    const hasWeatherProtection = this.hasWeatherProtection(gameState);
    
    if (hasWeatherProtection && Math.random() < 0.7) {
      gameState.gameLog.push('🛡️ 你的护符抵御了异常天气！');
      return null;
    }

    let positiveBias = 0.5;
    let negativeBias = 0;

    if (isLowHp && Math.random() < 0.5) {
      positiveBias = 2;
      negativeBias = -0.5;
    }

    const result = WeatherSystem.triggerRandomWeather(gameState.weatherState, floor, {
      positiveBias,
      negativeBias,
      durationMultiplier: 0.5,
      allowDuplicate: false
    });

    if (!result) return null;

    const data = result.weatherData;
    if (result.stacked) {
      return {
        success: true,
        message: `${data.icon} 天气【${data.name}】加剧了！持续时间延长。`,
        weather: data
      };
    } else {
      return {
        success: true,
        message: `🌟 突发天气！${data.icon}【${data.name}】来袭：${data.description}`,
        weather: data
      };
    }
  }

  static hasWeatherProtection(gameState) {
    const accessory = gameState.player.equipment.accessory;
    if (!accessory) return false;
    return accessory.weatherProtection || false;
  }

  static async nextFloor(gameState) {
    const newFloor = gameState.dungeon.floor + 1;
    
    DifficultySystem.updateHistory(gameState, false);
    DifficultySystem.resetFloorStats(gameState);
    
    await DifficultySystem.updateDifficulty(gameState);
    
    const newDungeon = generateDungeon(50, 50, newFloor, gameState);
    gameState.dungeon = newDungeon;
    gameState.player.position = { ...newDungeon.playerPosition };
    gameState.score += 100 * newFloor;
    gameState.gameLog.push(`🚪 你进入了第 ${newFloor} 层！获得 ${100 * newFloor} 积分！`);

    gameState.weatherState = WeatherSystem.generateWeatherForFloor(newFloor, gameState);
    const activeWeathers = WeatherSystem.getActiveWeatherDescriptions(gameState.weatherState);
    if (activeWeathers.length > 0) {
      activeWeathers.forEach(w => {
        gameState.gameLog.push(`${w.icon} 本层触发【${w.name}】天气：${w.description}`);
      });
    } else {
      gameState.gameLog.push(`☀️ 本层天气晴朗。`);
    }

    const difficultyInfo = DifficultySystem.getDifficultyDescription(gameState);
    gameState.gameLog.push(`⚖️ 当前难度：${difficultyInfo.icon} ${difficultyInfo.name}（难度评分：${Math.round(difficultyInfo.score)}）`);
    
    if (newDungeon.elitePlaced) {
      gameState.gameLog.push(`💎 警告：本层出现了精英怪物！`);
    }

    this.exploreArea(newDungeon, gameState.player.position.x, gameState.player.position.y, gameState);

    return newDungeon;
  }

  static equipItem(gameState, itemId) {
    if (gameState.combat && gameState.combat.active) {
      gameState.gameLog.push('⚠️ 战斗中无法更换装备！');
      return { success: false, message: '战斗中无法更换装备！' };
    }

    const player = gameState.player;
    const itemIndex = player.inventory.findIndex(item => item.id === itemId);

    if (itemIndex === -1) return { success: false, message: '物品不存在！' };

    const item = player.inventory[itemIndex];
    const slot = item.type;

    const oldMaxHp = this.getPlayerTotalStats(gameState).maxHp;

    if (player.equipment[slot]) {
      player.inventory.push(player.equipment[slot]);
    }

    player.equipment[slot] = item;
    player.inventory.splice(itemIndex, 1);

    const newMaxHp = this.getPlayerTotalStats(gameState).maxHp;
    if (player.stats.currentHp > newMaxHp) {
      player.stats.currentHp = newMaxHp;
    }

    const hpChange = newMaxHp - oldMaxHp;
    if (hpChange > 0) {
      player.stats.currentHp = Math.min(player.stats.currentHp + hpChange, newMaxHp);
    }

    gameState.gameLog.push(`⚔️ 你装备了 ${item.icon} ${item.name}！`);

    return { success: true, item, hpChange };
  }

  static unequipItem(gameState, slot) {
    if (gameState.combat && gameState.combat.active) {
      gameState.gameLog.push('⚠️ 战斗中无法卸下装备！');
      return { success: false, message: '战斗中无法卸下装备！' };
    }

    const player = gameState.player;
    if (!player.equipment[slot]) return { success: false, message: '该部位没有装备！' };

    const oldMaxHp = this.getPlayerTotalStats(gameState).maxHp;
    const item = player.equipment[slot];

    player.inventory.push(item);
    player.equipment[slot] = null;

    const newMaxHp = this.getPlayerTotalStats(gameState).maxHp;
    if (player.stats.currentHp > newMaxHp) {
      player.stats.currentHp = newMaxHp;
    }

    gameState.gameLog.push(`📤 你卸下了 ${item.icon} ${item.name}！`);

    return { success: true, item };
  }

  static discardItem(gameState, itemId, quantity = 1) {
    const player = gameState.player;
    
    const removeResult = this.removeItemFromInventory(player.inventory, itemId, quantity);
    if (!removeResult.success) {
      return removeResult;
    }

    const item = removeResult.item;
    const quantityText = isStackableItem(item) && quantity > 1 ? ` x${quantity}` : '';
    gameState.gameLog.push(`🗑️ 你丢弃了 ${item.icon} ${item.name}${quantityText}！`);

    return { success: true, item, quantity };
  }

  static calculateScore(gameState) {
    const floorScore = gameState.dungeon.floor * 100;
    const killScore = gameState.kills * 50;
    const levelScore = gameState.player.stats.level * 200;
    const equipmentScore = this.calculateEquipmentScore(gameState.player);

    return floorScore + killScore + levelScore + equipmentScore + gameState.score;
  }

  static calculateEquipmentScore(player) {
    let score = 0;
    const rarityScore = { common: 10, uncommon: 25, rare: 50, epic: 100, legendary: 250 };

    const allEquipment = [
      player.equipment.weapon,
      player.equipment.armor,
      player.equipment.accessory,
      ...player.inventory
    ].filter(Boolean);

    allEquipment.forEach(item => {
      score += rarityScore[item.rarity] || 0;
    });

    return score;
  }

  static useHealthPotion(gameState) {
    const player = gameState.player;
    const playerStats = this.getPlayerTotalStats(gameState);
    
    const healPotionIndex = player.inventory.findIndex(item => 
      item.type === 'potion' && item.effect && item.effect.type === 'heal'
    );
    
    if (healPotionIndex === -1) {
      const healAmount = Math.floor(playerStats.maxHp * 0.2);
      player.stats.currentHp = Math.min(player.stats.currentHp + healAmount, playerStats.maxHp);
      const mpRecover = SkillSystem.restRecoverMp(gameState);
      gameState.gameLog.push(`💚 你休息了一下，恢复了 ${healAmount} 点生命值和 ${mpRecover} 点魔法值！`);
      if (gameState.combat && gameState.combat.active) {
        gameState.combat.log.push(`💚 休息恢复了 ${healAmount} 点生命值和 ${mpRecover} 点魔法值！`);
      }
      return { healed: healAmount, mpRecovered: mpRecover, usedPotion: false };
    }

    const potion = player.inventory[healPotionIndex];
    return this.useConsumable(gameState, potion.id);
  }

  static useWeatherScroll(gameState, itemId) {
    const player = gameState.player;
    const itemIndex = player.inventory.findIndex(item => item.id === itemId);
    
    if (itemIndex === -1) return null;
    
    const item = player.inventory[itemIndex];
    
    if (item.type === 'weather_scroll') {
      player.inventory.splice(itemIndex, 1);
      const result = WeatherSystem.triggerWeatherById(
        gameState.weatherState,
        item.weatherId,
        item.duration
      );
      
      if (result) {
        const data = result.weatherData;
        const message = result.stacked
          ? `📜 使用 ${item.name}，${data.icon}【${data.name}】天气加剧！`
          : `📜 使用 ${item.name}，召唤出 ${data.icon}【${data.name}】天气！`;
        gameState.gameLog.push(message);
        return { success: true, message, weather: data };
      }
    } else if (item.type === 'weather_clear') {
      player.inventory.splice(itemIndex, 1);
      const removed = WeatherSystem.clearAllWeathers(gameState.weatherState);
      const message = removed.length > 0
        ? `🧿 使用 ${item.name}，清除了 ${removed.length} 个天气效果！`
        : `🧿 使用 ${item.name}，但当前没有天气效果。`;
      gameState.gameLog.push(message);
      return { success: true, message, removedCount: removed.length };
    } else if (item.type === 'weather_resist') {
      player.inventory.splice(itemIndex, 1);
      WeatherSystem.addWeatherResist(gameState.weatherState, item.duration);
      const message = `🧪 使用 ${item.name}，接下来 ${item.duration} 步内免疫天气伤害，负面效果减半！`;
      gameState.gameLog.push(message);
      return { success: true, message, duration: item.duration };
    } else if (item.type === 'weather_shield') {
      player.inventory.splice(itemIndex, 1);
      WeatherSystem.addWeatherShield(gameState.weatherState, item.duration);
      const message = `📜 使用 ${item.name}，接下来 ${item.duration} 步内完全免疫负面天气！`;
      gameState.gameLog.push(message);
      return { success: true, message, duration: item.duration };
    } else if (item.type === 'weather_lure') {
      player.inventory.splice(itemIndex, 1);
      let convertedCount = 0;
      const toRemove = [];
      
      gameState.weatherState.activeWeathers.forEach(w => {
        const data = WEATHER_DATA[w.id];
        const isNegative = data.effects.moveHpChange < 0 || 
          data.effects.attackMod < 0 || 
          data.effects.defenseMod < 0 ||
          data.effects.moveBlockChance > 0;
        
        if (isNegative) {
          toRemove.push(w.id);
          convertedCount++;
        }
      });
      
      toRemove.forEach(id => {
        WeatherSystem.removeWeather(gameState.weatherState, id);
      });
      
      if (convertedCount > 0) {
        for (let i = 0; i < convertedCount; i++) {
          WeatherSystem.triggerRandomWeather(gameState.weatherState, gameState.dungeon.floor, {
            positiveBias: 3,
            durationMultiplier: 0.8
          });
        }
        const message = `💎 使用 ${item.name}，将 ${convertedCount} 个负面天气转化为正面天气！`;
        gameState.gameLog.push(message);
        return { success: true, message, convertedCount };
      } else {
        const message = `💎 使用 ${item.name}，但当前没有负面天气需要转化。`;
        gameState.gameLog.push(message);
        return { success: true, message, convertedCount: 0 };
      }
    }
    
    return null;
  }

  static isUsableItem(item) {
    return item && (
      (item.type === 'potion' && item.effect) || 
      item.type === 'weather_scroll' || 
      item.type === 'weather_clear' ||
      item.type === 'weather_resist' ||
      item.type === 'weather_shield' ||
      item.type === 'weather_lure'
    );
  }

  static getPlayerTotalStats(gameState) {
    const player = gameState.player;
    let attack = player.stats.attack;
    let defense = player.stats.defense;
    let maxHp = player.stats.maxHp;
    let critChance = player.stats.critChance || 0;

    const addEquipmentStats = (equipment) => {
      if (equipment && equipment.stats) {
        attack += equipment.stats.attack || 0;
        defense += equipment.stats.defense || 0;
        maxHp += equipment.stats.maxHp || 0;
        critChance += equipment.stats.critChance || 0;
      }
    };

    addEquipmentStats(player.equipment.weapon);
    addEquipmentStats(player.equipment.armor);
    addEquipmentStats(player.equipment.accessory);

    const baseStats = { attack, defense, maxHp, critChance };
    return this.getBuffedStats(gameState, baseStats);
  }

  static ensureEquipmentAffixes(equipment) {
    if (!equipment) return equipment;
    if (!equipment.affixes) {
      equipment.affixes = { prefixes: [], suffixes: [], specials: [] };
    }
    if (!equipment.slotName) {
      const slotNames = { weapon: '武器', armor: '护甲', accessory: '饰品' };
      equipment.slotName = slotNames[equipment.type] || equipment.type;
    }
    if (!equipment.baseName) {
      equipment.baseName = equipment.name;
    }
    if (!equipment.baseStats) {
      equipment.baseStats = { ...equipment.stats };
    }
    return equipment;
  }

  static ensureAllEquipmentAffixes(gameState) {
    const player = gameState.player;
    
    player.equipment.weapon = this.ensureEquipmentAffixes(player.equipment.weapon);
    player.equipment.armor = this.ensureEquipmentAffixes(player.equipment.armor);
    player.equipment.accessory = this.ensureEquipmentAffixes(player.equipment.accessory);
    
    player.inventory = player.inventory.map(item => {
      if (item.type === 'weapon' || item.type === 'armor' || item.type === 'accessory') {
        return this.ensureEquipmentAffixes(item);
      }
      return item;
    });
    
    return gameState;
  }

  static buyItem(gameState, merchant, itemId, quantity = 1) {
    const player = gameState.player;
    const itemIndex = merchant.inventory.findIndex(item => item.id === itemId);
    
    if (itemIndex === -1) {
      return { success: false, message: '商品不存在！' };
    }

    const item = merchant.inventory[itemIndex];
    const unitPrice = item.buyPrice;
    const totalPrice = unitPrice * quantity;

    if (player.gold < totalPrice) {
      return { success: false, message: '金币不足！' };
    }

    const merchantQuantity = item.quantity || 1;
    if (merchantQuantity < quantity) {
      return { success: false, message: `商人只有 ${merchantQuantity} 个该物品！` };
    }

    const purchasedItem = { ...item };
    delete purchasedItem.buyPrice;
    delete purchasedItem.sellPrice;

    const addResult = this.addItemToInventory(player.inventory, purchasedItem, quantity);
    if (!addResult.success) {
      return { success: false, message: addResult.message };
    }

    player.gold -= totalPrice;

    if (merchantQuantity === quantity) {
      merchant.inventory.splice(itemIndex, 1);
    } else {
      item.quantity = merchantQuantity - quantity;
    }

    const quantityText = isStackableItem(item) && quantity > 1 ? ` x${quantity}` : '';
    gameState.gameLog.push(`💰 购买了 ${item.icon} ${item.name}${quantityText}，花费 ${totalPrice} 金币！`);
    return { success: true, item: purchasedItem, price: totalPrice, quantity, message: `购买成功！花费 ${totalPrice} 金币。` };
  }

  static buyAttribute(gameState, merchant, attrType) {
    const player = gameState.player;
    const purchasedCount = merchant.attributePurchased[attrType] || 0;
    const price = calculateAttributePrice(attrType, gameState.dungeon.floor, purchasedCount);
    const value = calculateAttributeValue(attrType, gameState.dungeon.floor);

    if (player.gold < price) {
      return { success: false, message: '金币不足！' };
    }

    player.gold -= price;
    player.stats[attrType] += value;
    
    if (attrType === 'maxHp') {
      player.stats.currentHp += value;
    }

    merchant.attributePurchased[attrType] = purchasedCount + 1;

    const attrData = ATTRIBUTE_TYPES.find(a => a.id === attrType);
    gameState.gameLog.push(`💪 购买了 ${attrData.icon} ${attrData.name} +${value}，花费 ${price} 金币！`);
    return { success: true, attrType, value, price, message: `购买成功！${attrData.name} +${value}，花费 ${price} 金币。` };
  }

  static sellItem(gameState, merchant, itemId, quantity = 1) {
    const player = gameState.player;
    const itemIndex = player.inventory.findIndex(item => item.id === itemId);
    
    if (itemIndex === -1) {
      return { success: false, message: '物品不存在！' };
    }

    const item = player.inventory[itemIndex];
    const itemQuantity = item.quantity || 1;
    
    if (itemQuantity < quantity) {
      return { success: false, message: `数量不足！当前数量：${itemQuantity}` };
    }

    const unitPrice = calculateItemSellPrice(item, gameState.dungeon.floor);
    const totalPrice = unitPrice * quantity;

    const removeResult = this.removeItemFromInventory(player.inventory, itemId, quantity);
    if (!removeResult.success) {
      return { success: false, message: removeResult.message };
    }

    player.gold += totalPrice;

    const quantityText = isStackableItem(item) && quantity > 1 ? ` x${quantity}` : '';
    gameState.gameLog.push(`💰 出售了 ${item.icon} ${item.name}${quantityText}，获得 ${totalPrice} 金币！`);
    return { success: true, item, price: totalPrice, quantity, message: `出售成功！获得 ${totalPrice} 金币。` };
  }

  static stealFromMerchant(gameState, merchant) {
    const player = gameState.player;
    
    const baseSuccessChance = 0.3;
    const levelMod = player.stats.level * 0.02;
    const luckMod = Math.random() * 0.2;
    const successChance = Math.min(0.6, baseSuccessChance + levelMod + luckMod);

    if (Math.random() < successChance) {
      const goldAmount = Math.floor(merchant.goldReward * (0.5 + Math.random() * 0.5));
      player.gold += goldAmount;
      
      gameState.gameLog.push(`🗡️ 盗窃成功！获得 ${goldAmount} 金币！商人逃走了。`);
      
      const dungeon = gameState.dungeon;
      for (let y = 0; y < dungeon.height; y++) {
        for (let x = 0; x < dungeon.width; x++) {
          if (dungeon.tiles[y][x].merchant && dungeon.tiles[y][x].merchant.id === merchant.id) {
            dungeon.tiles[y][x].type = 'floor';
            dungeon.tiles[y][x].merchant = null;
            break;
          }
        }
      }
      
      return { success: true, gold: goldAmount, combat: false, message: `盗窃成功！获得 ${goldAmount} 金币！` };
    } else {
      gameState.gameLog.push(`❌ 盗窃失败！商人发现了你，愤怒地发起攻击！`);
      
      const scaleFactor = 1 + (gameState.dungeon.floor - 1) * 0.15;
      const merchantEnemy = {
        id: `merchant_enemy_${Date.now()}`,
        name: `愤怒的${merchant.name}`,
        icon: merchant.icon,
        maxHp: Math.floor(60 * scaleFactor),
        currentHp: Math.floor(60 * scaleFactor),
        attack: Math.floor(12 * scaleFactor),
        defense: Math.floor(5 * scaleFactor),
        expReward: merchant.expReward,
        dropRate: 0.5,
        goldReward: merchant.goldReward
      };

      const dungeon = gameState.dungeon;
      for (let y = 0; y < dungeon.height; y++) {
        for (let x = 0; x < dungeon.width; x++) {
          if (dungeon.tiles[y][x].merchant && dungeon.tiles[y][x].merchant.id === merchant.id) {
            dungeon.tiles[y][x].type = 'floor';
            dungeon.tiles[y][x].merchant = null;
            break;
          }
        }
      }
      
      return { success: false, combat: true, enemy: merchantEnemy, message: '盗窃失败！商人发起攻击！' };
    }
  }

  static getGoldDropFromEnemy(enemy, floor = 1) {
    if (enemy.goldReward) {
      const floorBonus = 1 + (floor - 1) * 0.15;
      return Math.floor(enemy.goldReward * floorBonus);
    }
    const rarity = enemy.rarity || this.getEnemyRarity(enemy);
    return getRandomGoldAmount(floor, rarity);
  }

  static getEnemyRarity(enemy) {
    const expReward = enemy.expReward || 15;
    if (expReward >= 150) return 'legendary';
    if (expReward >= 80) return 'epic';
    if (expReward >= 50) return 'rare';
    if (expReward >= 30) return 'uncommon';
    return 'common';
  }

  static addItemToInventory(inventory, item, quantity = 1) {
    if (!item) return { success: false, message: '无效的物品！' };
    
    if (isStackableItem(item)) {
      const existingIndex = inventory.findIndex(i => 
        isStackableItem(i) && i.baseId === item.baseId
      );
      
      if (existingIndex !== -1) {
        const existingItem = inventory[existingIndex];
        const maxStack = existingItem.maxStack || 99;
        const newQuantity = existingItem.quantity + quantity;
        
        if (newQuantity > maxStack) {
          const overflow = newQuantity - maxStack;
          existingItem.quantity = maxStack;
          
          if (inventory.length >= 20) {
            return { success: false, message: '背包已满，无法放入更多物品！', added: quantity - overflow, overflow };
          }
          
          const newStack = createStackableItem(item, overflow);
          inventory.push(newStack);
          return { success: true, added: quantity, overflow: 0, stacked: true };
        } else {
          existingItem.quantity = newQuantity;
          return { success: true, added: quantity, overflow: 0, stacked: true };
        }
      } else {
        if (inventory.length >= 20) {
          return { success: false, message: '背包已满！' };
        }
        
        const newItem = quantity > 1 ? createStackableItem(item, quantity) : createStackableItem(item, 1);
        inventory.push(newItem);
        return { success: true, added: quantity, overflow: 0, stacked: false, newStack: true };
      }
    } else {
      if (inventory.length >= 20) {
        return { success: false, message: '背包已满！' };
      }
      inventory.push(item);
      return { success: true, added: 1, overflow: 0, stacked: false, newStack: true };
    }
  }

  static removeItemFromInventory(inventory, itemId, quantity = 1) {
    const itemIndex = inventory.findIndex(i => i.id === itemId);
    
    if (itemIndex === -1) {
      return { success: false, message: '物品不存在！' };
    }
    
    const item = inventory[itemIndex];
    
    if (isStackableItem(item)) {
      if (item.quantity < quantity) {
        return { success: false, message: `数量不足！当前数量：${item.quantity}` };
      }
      
      if (item.quantity === quantity) {
        inventory.splice(itemIndex, 1);
        return { success: true, removed: quantity, item };
      } else {
        item.quantity -= quantity;
        return { success: true, removed: quantity, item: { ...item, quantity } };
      }
    } else {
      inventory.splice(itemIndex, 1);
      return { success: true, removed: 1, item };
    }
  }

  static useConsumable(gameState, itemId, quantity = 1) {
    const player = gameState.player;
    const itemIndex = player.inventory.findIndex(i => i.id === itemId);
    
    if (itemIndex === -1) {
      return { success: false, message: '物品不存在！' };
    }
    
    const item = player.inventory[itemIndex];
    
    if (!this.isUsableItem(item)) {
      return { success: false, message: '该物品无法使用！' };
    }
    
    const inCombat = gameState.combat && gameState.combat.active;
    
    if (inCombat && !item.useInCombat) {
      return { success: false, message: '该物品无法在战斗中使用！' };
    }
    
    if (!inCombat && !item.useOutOfCombat) {
      return { success: false, message: '该物品只能在战斗中使用！' };
    }
    
    const availableQuantity = isStackableItem(item) ? item.quantity : 1;
    const useQuantity = Math.min(quantity, availableQuantity);
    
    if (useQuantity <= 0) {
      return { success: false, message: '数量无效！' };
    }
    
    const result = this.applyConsumableEffect(gameState, item, useQuantity);
    
    if (result.success) {
      this.removeItemFromInventory(player.inventory, itemId, useQuantity);
    }
    
    return result;
  }

  static applyConsumableEffect(gameState, item, quantity = 1) {
    const player = gameState.player;
    const playerStats = this.getPlayerTotalStats(gameState);
    
    if (item.type === 'potion' && item.effect) {
      const effect = item.effect;
      
      switch (effect.type) {
        case 'heal': {
          let healAmount = effect.isPercent 
            ? Math.floor(playerStats.maxHp * effect.value) * quantity
            : effect.value * quantity;
          const oldHp = player.stats.currentHp;
          player.stats.currentHp = Math.min(player.stats.currentHp + healAmount, playerStats.maxHp);
          healAmount = player.stats.currentHp - oldHp;
          
          if (healAmount > 0) {
            const quantityText = quantity > 1 ? ` x${quantity}` : '';
            gameState.gameLog.push(`🧪 使用了 ${item.icon} ${item.name}${quantityText}，恢复了 ${healAmount} 点生命值！`);
            if (gameState.combat && gameState.combat.active) {
              gameState.combat.log.push(`🧪 使用了 ${item.name}${quantityText}，恢复了 ${healAmount} 点生命值！`);
            }
            return { success: true, effect: 'heal', value: healAmount, quantity };
          }
          return { success: false, message: '生命值已满！' };
        }
        
        case 'mana': {
          let manaAmount = effect.isPercent 
            ? Math.floor(player.stats.maxMp * effect.value) * quantity
            : effect.value * quantity;
          const oldMp = player.stats.currentMp;
          player.stats.currentMp = Math.min(player.stats.currentMp + manaAmount, player.stats.maxMp);
          manaAmount = player.stats.currentMp - oldMp;
          
          if (manaAmount > 0) {
            const quantityText = quantity > 1 ? ` x${quantity}` : '';
            gameState.gameLog.push(`💙 使用了 ${item.icon} ${item.name}${quantityText}，恢复了 ${manaAmount} 点魔法值！`);
            if (gameState.combat && gameState.combat.active) {
              gameState.combat.log.push(`💙 使用了 ${item.name}${quantityText}，恢复了 ${manaAmount} 点魔法值！`);
            }
            return { success: true, effect: 'mana', value: manaAmount, quantity };
          }
          return { success: false, message: '魔法值已满！' };
        }
        
        case 'buff': {
          const totalValue = effect.value * quantity;
          if (!gameState.combat.active) {
            if (!player.mapBuffs) player.mapBuffs = [];
            player.mapBuffs.push({
              stat: effect.stat,
              value: totalValue,
              duration: effect.duration
            });
          } else {
            if (!gameState.combat.playerBuffs) gameState.combat.playerBuffs = [];
            gameState.combat.playerBuffs.push({
              stat: effect.stat,
              value: totalValue,
              duration: effect.duration
            });
          }
          
          const statNames = { attack: '攻击力', defense: '防御力' };
          const statName = statNames[effect.stat] || effect.stat;
          const durationType = gameState.combat.active ? '回合' : '步';
          const quantityText = quantity > 1 ? ` x${quantity}` : '';
          
          gameState.gameLog.push(`✨ 使用了 ${item.icon} ${item.name}${quantityText}，${statName}+${totalValue}，持续${effect.duration}${durationType}！`);
          if (gameState.combat && gameState.combat.active) {
            gameState.combat.log.push(`✨ 使用了 ${item.name}${quantityText}，${statName}+${totalValue}，持续${effect.duration}回合！`);
          }
          return { success: true, effect: 'buff', stat: effect.stat, value: totalValue, duration: effect.duration, quantity };
        }
      }
    }
    
    if (item.type === 'weather_scroll' || item.type === 'weather_clear' || 
        item.type === 'weather_resist' || item.type === 'weather_shield' || 
        item.type === 'weather_lure') {
      return this.useWeatherScroll(gameState, item.id);
    }
    
    return { success: false, message: '无法使用该物品！' };
  }

  static sortInventory(inventory) {
    const categoryOrder = ['equipment', 'consumable', 'material', 'other'];
    
    return inventory.sort((a, b) => {
      const categoryA = getItemCategory(a);
      const categoryB = getItemCategory(b);
      
      const categoryDiff = categoryOrder.indexOf(categoryA) - categoryOrder.indexOf(categoryB);
      if (categoryDiff !== 0) return categoryDiff;
      
      if (categoryA === 'equipment') {
        const typeOrder = ['weapon', 'armor', 'accessory'];
        const typeDiff = typeOrder.indexOf(a.type) - typeOrder.indexOf(b.type);
        if (typeDiff !== 0) return typeDiff;
      }
      
      const rarityDiff = getRarityIndex(b.rarity) - getRarityIndex(a.rarity);
      if (rarityDiff !== 0) return rarityDiff;
      
      if (a.name < b.name) return -1;
      if (a.name > b.name) return 1;
      return 0;
    });
  }

  static filterInventory(inventory, category = 'all') {
    if (category === 'all') return [...inventory];
    
    return inventory.filter(item => {
      const itemCategory = getItemCategory(item);
      return itemCategory === category;
    });
  }

  static getInventorySummary(inventory) {
    const summary = {
      total: inventory.length,
      equipment: 0,
      consumable: 0,
      material: 0,
      other: 0,
      maxSlots: 20
    };
    
    inventory.forEach(item => {
      const category = getItemCategory(item);
      summary[category]++;
    });
    
    return summary;
  }

  static tickMapBuffs(gameState) {
    const player = gameState.player;
    if (!player.mapBuffs || player.mapBuffs.length === 0) return;
    
    const expiredBuffs = [];
    player.mapBuffs = player.mapBuffs.filter(buff => {
      buff.duration--;
      if (buff.duration <= 0) {
        expiredBuffs.push(buff);
        return false;
      }
      return true;
    });
    
    if (expiredBuffs.length > 0) {
      const statNames = { attack: '攻击力', defense: '防御力' };
      expiredBuffs.forEach(buff => {
        const statName = statNames[buff.stat] || buff.stat;
        gameState.gameLog.push(`⏱️ ${statName}增益效果已消失。`);
      });
    }
  }

  static getBuffedStats(gameState, baseStats) {
    const player = gameState.player;
    const stats = { ...baseStats };
    
    if (gameState.combat && gameState.combat.active && gameState.combat.playerBuffs) {
      gameState.combat.playerBuffs.forEach(buff => {
        if (stats[buff.stat] !== undefined) {
          stats[buff.stat] += buff.value;
        }
      });
    }
    
    if (player.mapBuffs) {
      player.mapBuffs.forEach(buff => {
        if (stats[buff.stat] !== undefined) {
          stats[buff.stat] += buff.value;
        }
      });
    }
    
    return stats;
  }
}
