class CharacterSystem {
  static createNewPlayer() {
    const inventory = [];
    for (let i = 0; i < 3; i++) {
      inventory.push(getRandomEquipment(1));
    }

    return {
      stats: {
        maxHp: 100,
        currentHp: 100,
        attack: 10,
        defense: 5,
        level: 1,
        exp: 0,
        expToNext: 100
      },
      position: { x: 0, y: 0 },
      equipment: {
        weapon: null,
        armor: null,
        accessory: null
      },
      inventory: inventory
    };
  }

  static createNewGameState() {
    const player = this.createNewPlayer();
    const dungeon = generateDungeon(50, 50, 1);
    player.position = { ...dungeon.playerPosition };
    const weatherState = WeatherSystem.generateWeatherForFloor(1);

    const gameState = {
      player: player,
      dungeon: dungeon,
      weatherState: weatherState,
      combat: {
        active: false,
        enemy: null,
        playerTurn: true,
        log: []
      },
      gameLog: ['🎮 欢迎来到 Roguelike 地牢！'],
      score: 0,
      kills: 0
    };

    const activeWeathers = WeatherSystem.getActiveWeatherDescriptions(weatherState);
    if (activeWeathers.length > 0) {
      activeWeathers.forEach(w => {
        gameState.gameLog.push(`${w.icon} 本层触发【${w.name}】天气：${w.description}`);
      });
    }

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

    if (tile.type === 'item' && tile.item) {
      player.position = { x: newX, y: newY };
      const item = tile.item;
      player.inventory.push(item);
      tile.type = 'floor';
      tile.item = null;
      gameState.gameLog.push(`📦 你拾取了 ${item.icon} ${item.name}！`);
      gameState.score += 10;
      WeatherSystem.tickWeatherDuration(gameState.weatherState, 1);
      const expiredWeathers = WeatherSystem.tickWeatherDuration(gameState.weatherState, 0);
      this.handleExpiredWeathers(gameState, expiredWeathers);
      if (player.stats.currentHp <= 0) {
        return { type: 'death' };
      }
      return { type: 'item', item: item };
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

    const triggerChance = 0.03 + gameState.dungeon.floor * 0.005;
    if (Math.random() > triggerChance) return null;
    if (gameState.weatherState.activeWeathers.length >= 3) return null;

    const floor = gameState.dungeon.floor;
    const isLowHp = gameState.player.stats.currentHp / gameState.player.stats.maxHp < 0.3;
    
    let positiveBias = 0;
    let negativeBias = 0;

    if (isLowHp && Math.random() < 0.3) {
      positiveBias = 2;
    }

    const result = WeatherSystem.triggerRandomWeather(gameState.weatherState, floor, {
      positiveBias,
      negativeBias,
      durationMultiplier: 0.6,
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

  static nextFloor(gameState) {
    const newFloor = gameState.dungeon.floor + 1;
    const newDungeon = generateDungeon(50, 50, newFloor);
    gameState.dungeon = newDungeon;
    gameState.player.position = { ...newDungeon.playerPosition };
    gameState.score += 100 * newFloor;
    gameState.gameLog.push(`🚪 你进入了第 ${newFloor} 层！获得 ${100 * newFloor} 积分！`);

    gameState.weatherState = WeatherSystem.generateWeatherForFloor(newFloor);
    const activeWeathers = WeatherSystem.getActiveWeatherDescriptions(gameState.weatherState);
    if (activeWeathers.length > 0) {
      activeWeathers.forEach(w => {
        gameState.gameLog.push(`${w.icon} 本层触发【${w.name}】天气：${w.description}`);
      });
    } else {
      gameState.gameLog.push(`☀️ 本层天气晴朗。`);
    }

    this.exploreArea(newDungeon, gameState.player.position.x, gameState.player.position.y, gameState);

    return newDungeon;
  }

  static equipItem(gameState, itemId) {
    const player = gameState.player;
    const itemIndex = player.inventory.findIndex(item => item.id === itemId);

    if (itemIndex === -1) return null;

    const item = player.inventory[itemIndex];
    const slot = item.type;

    if (player.equipment[slot]) {
      player.inventory.push(player.equipment[slot]);
    }

    player.equipment[slot] = item;
    player.inventory.splice(itemIndex, 1);

    gameState.gameLog.push(`⚔️ 你装备了 ${item.icon} ${item.name}！`);

    return item;
  }

  static unequipItem(gameState, slot) {
    const player = gameState.player;
    if (!player.equipment[slot]) return null;

    const item = player.equipment[slot];
    player.inventory.push(item);
    player.equipment[slot] = null;

    gameState.gameLog.push(`📤 你卸下了 ${item.icon} ${item.name}！`);

    return item;
  }

  static discardItem(gameState, itemId) {
    const player = gameState.player;
    const itemIndex = player.inventory.findIndex(item => item.id === itemId);

    if (itemIndex === -1) return null;

    const item = player.inventory[itemIndex];
    player.inventory.splice(itemIndex, 1);

    gameState.gameLog.push(`🗑️ 你丢弃了 ${item.icon} ${item.name}！`);

    return item;
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
    const healAmount = Math.floor(playerStats.maxHp * 0.3);

    const potionIndex = player.inventory.findIndex(item => item.type === 'potion');
    if (potionIndex === -1) {
      const healAmount = Math.floor(playerStats.maxHp * 0.2);
      player.stats.currentHp = Math.min(player.stats.currentHp + healAmount, playerStats.maxHp);
      gameState.gameLog.push(`💚 你休息了一下，恢复了 ${healAmount} 点生命值！`);
      return { healed: healAmount, usedPotion: false };
    }

    const potion = player.inventory[potionIndex];
    player.inventory.splice(potionIndex, 1);
    player.stats.currentHp = Math.min(player.stats.currentHp + healAmount, playerStats.maxHp);

    gameState.gameLog.push(`🧪 你使用了 ${potion.icon} ${potion.name}，恢复了 ${healAmount} 点生命值！`);
    return { healed: healAmount, usedPotion: true, potion };
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
    }
    
    return null;
  }

  static isUsableItem(item) {
    return item && (item.type === 'potion' || item.type === 'weather_scroll' || item.type === 'weather_clear');
  }

  static getPlayerTotalStats(gameState) {
    const player = gameState.player;
    let attack = player.stats.attack;
    let defense = player.stats.defense;
    let maxHp = player.stats.maxHp;

    if (player.equipment.weapon) {
      attack += player.equipment.weapon.stats.attack || 0;
      defense += player.equipment.weapon.stats.defense || 0;
      maxHp += player.equipment.weapon.stats.maxHp || 0;
    }
    if (player.equipment.armor) {
      attack += player.equipment.armor.stats.attack || 0;
      defense += player.equipment.armor.stats.defense || 0;
      maxHp += player.equipment.armor.stats.maxHp || 0;
    }
    if (player.equipment.accessory) {
      attack += player.equipment.accessory.stats.attack || 0;
      defense += player.equipment.accessory.stats.defense || 0;
      maxHp += player.equipment.accessory.stats.maxHp || 0;
    }

    return { attack, defense, maxHp };
  }
}
