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

    return {
      player: player,
      dungeon: dungeon,
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
  }

  static movePlayer(gameState, direction) {
    const player = gameState.player;
    const dungeon = gameState.dungeon;

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

    this.exploreArea(dungeon, newX, newY);

    if (tile.type === 'enemy' && tile.enemy) {
      player.position = { x: newX, y: newY };
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
      return { type: 'item', item: item };
    }

    if (tile.type === 'stairs') {
      player.position = { x: newX, y: newY };
      return { type: 'stairs' };
    }

    player.position = { x: newX, y: newY };
    dungeon.playerPosition = { x: newX, y: newY };

    return { type: 'move', position: { x: newX, y: newY } };
  }

  static exploreArea(dungeon, x, y) {
    const viewRange = 5;
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

  static nextFloor(gameState) {
    const newFloor = gameState.dungeon.floor + 1;
    const newDungeon = generateDungeon(50, 50, newFloor);
    gameState.dungeon = newDungeon;
    gameState.player.position = { ...newDungeon.playerPosition };
    gameState.score += 100 * newFloor;
    gameState.gameLog.push(`🚪 你进入了第 ${newFloor} 层！获得 ${100 * newFloor} 积分！`);
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
