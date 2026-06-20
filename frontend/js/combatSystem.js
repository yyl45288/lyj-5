class CombatSystem {
  constructor(gameState) {
    this.gameState = gameState;
  }

  startCombat(enemy) {
    this.gameState.combat = {
      active: true,
      enemy: { ...enemy },
      playerTurn: true,
      log: [`遭遇了 ${enemy.name}！`]
    };
    this.addCombatLog(`${enemy.icon} ${enemy.name} 出现了！`);
    return this.gameState.combat;
  }

  calculateDamage(attacker, defender, isPlayerAttacker) {
    let attackValue = WeatherSystem.applyCombatAttackMods(this.gameState, attacker.attack, isPlayerAttacker);
    let defenseValue = WeatherSystem.applyCombatDefenseMods(this.gameState, defender.defense, !isPlayerAttacker);
    const baseDamage = Math.max(1, attackValue - defenseValue);
    const variance = Math.floor(Math.random() * 5) - 2;
    const baseCritChance = 0.1;
    const adjustedCritChance = WeatherSystem.applyCritChanceMod(this.gameState, baseCritChance);
    const critRoll = Math.random();
    const isCrit = critRoll < adjustedCritChance;
    const finalDamage = Math.max(1, baseDamage + variance) * (isCrit ? 2 : 1);
    return { damage: finalDamage, isCrit };
  }

  getPlayerTotalStats() {
    const player = this.gameState.player;
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

  playerAttack() {
    if (!this.gameState.combat.active || !this.gameState.combat.playerTurn) return null;

    const playerStats = this.getPlayerTotalStats();
    const enemy = this.gameState.combat.enemy;
    const attacker = { attack: playerStats.attack };
    const defender = { defense: enemy.defense };

    const { damage, isCrit } = this.calculateDamage(attacker, defender, true);
    enemy.currentHp -= damage;

    const critText = isCrit ? '【暴击！】' : '';
    this.addCombatLog(`⚔️ 你对 ${enemy.name} 造成了 ${critText}${damage} 点伤害！`);

    if (enemy.currentHp <= 0) {
      return this.enemyDefeated();
    }

    this.gameState.combat.playerTurn = false;
    return { type: 'playerAttack', damage, isCrit, enemyHp: enemy.currentHp };
  }

  playerDefend() {
    if (!this.gameState.combat.active || !this.gameState.combat.playerTurn) return null;

    this.addCombatLog('🛡️ 你进入防御姿态，减少受到的伤害！');
    this.gameState.combat.playerTurn = false;
    this.gameState.combat.defending = true;
    return { type: 'playerDefend' };
  }

  playerFlee() {
    if (!this.gameState.combat.active || !this.gameState.combat.playerTurn) return null;

    const fleeChance = 0.4 + (this.gameState.player.stats.level * 0.05);
    if (Math.random() < fleeChance) {
      this.addCombatLog('🏃 你成功逃离了战斗！');
      this.endCombat(false);
      return { type: 'fleeSuccess' };
    } else {
      this.addCombatLog('❌ 逃跑失败！');
      this.gameState.combat.playerTurn = false;
      return { type: 'fleeFailed' };
    }
  }

  enemyTurn() {
    if (!this.gameState.combat.active || this.gameState.combat.playerTurn) return null;

    const enemy = this.gameState.combat.enemy;
    const playerStats = this.getPlayerTotalStats();
    const attacker = { attack: enemy.attack };
    const defender = { defense: playerStats.defense };

    if (this.gameState.combat.defending) {
      defender.defense = Math.floor(defender.defense * 2);
      this.gameState.combat.defending = false;
    }

    const { damage, isCrit } = this.calculateDamage(attacker, defender, false);
    this.gameState.player.stats.currentHp -= damage;

    const critText = isCrit ? '【暴击！】' : '';
    this.addCombatLog(`💥 ${enemy.name} 对你造成了 ${critText}${damage} 点伤害！`);

    if (this.gameState.player.stats.currentHp <= 0) {
      this.gameState.player.stats.currentHp = 0;
      return this.playerDefeated();
    }

    this.gameState.combat.playerTurn = true;
    return { type: 'enemyAttack', damage, isCrit, playerHp: this.gameState.player.stats.currentHp };
  }

  enemyDefeated() {
    const enemy = this.gameState.combat.enemy;
    const baseExpGain = enemy.expReward;
    const expGain = WeatherSystem.applyExpBonus(this.gameState, baseExpGain);
    const scoreGain = expGain * 2;
    const expBonus = expGain - baseExpGain;

    this.gameState.player.stats.exp += expGain;
    this.gameState.score += scoreGain;
    this.gameState.kills++;

    this.addCombatLog(`🎉 你击败了 ${enemy.name}！`);
    if (expBonus > 0) {
      this.addCombatLog(`✨ 获得 ${expGain} 经验值（天气加成 +${expBonus}），${scoreGain} 积分！`);
    } else {
      this.addCombatLog(`✨ 获得 ${expGain} 经验值，${scoreGain} 积分！`);
    }

    const weatherTriggerResult = this.tryWeatherOnKill(enemy);
    if (weatherTriggerResult) {
      this.addCombatLog(weatherTriggerResult.message);
      this.gameState.gameLog.push(weatherTriggerResult.message);
    }

    let droppedItem = null;
    if (Math.random() < enemy.dropRate) {
      droppedItem = getRandomEquipment(this.gameState.dungeon.floor);
      this.gameState.player.inventory.push(droppedItem);
      this.addCombatLog(`📦 ${enemy.name} 掉落了 ${droppedItem.icon} ${droppedItem.name}！`);
    }

    const levelResult = this.checkLevelUp();

    this.endCombat(true);
    return {
      type: 'victory',
      expGain,
      scoreGain,
      droppedItem,
      levelUp: levelResult,
      weatherTriggered: weatherTriggerResult
    };
  }

  tryWeatherOnKill(enemy) {
    const floor = this.gameState.dungeon.floor;
    const isElite = enemy.expReward >= 80 * (1 + (floor - 1) * 0.15);
    const isBoss = enemy.expReward >= 150 * (1 + (floor - 1) * 0.15);
    
    let triggerChance = 0.08;
    let positiveBias = 0.3;
    let durationMultiplier = 0.4;

    if (isElite) {
      triggerChance = 0.25;
      positiveBias = 0.7;
      durationMultiplier = 0.5;
    }
    
    if (isBoss) {
      triggerChance = 0.5;
      positiveBias = 1.2;
      durationMultiplier = 0.8;
    }

    if (this.gameState.weatherState.activeWeathers.length >= 2) {
      triggerChance *= 0.2;
    }

    const hasWeatherProtection = CharacterSystem.hasWeatherProtection(this.gameState);
    if (hasWeatherProtection && !isBoss && Math.random() < 0.6) {
      return null;
    }

    if (Math.random() > triggerChance) return null;

    const result = WeatherSystem.triggerRandomWeather(
      this.gameState.weatherState,
      floor,
      {
        positiveBias,
        durationMultiplier,
        allowDuplicate: isBoss
      }
    );

    if (!result) return null;

    const data = result.weatherData;
    if (result.stacked) {
      return {
        success: true,
        message: `🔮 击杀引发气场波动！${data.icon}【${data.name}】天气加剧！`,
        weather: data
      };
    } else {
      return {
        success: true,
        message: `🔮 击杀引发气场变化！${data.icon}【${data.name}】天气降临：${data.description}`,
        weather: data
      };
    }
  }

  playerDefeated() {
    this.addCombatLog('💀 你被击败了...');
    this.gameState.combat.active = false;
    return { type: 'defeat' };
  }

  checkLevelUp() {
    const player = this.gameState.player;
    const levelUps = [];

    while (player.stats.exp >= player.stats.expToNext) {
      player.stats.exp -= player.stats.expToNext;
      player.stats.level++;
      player.stats.expToNext = Math.floor(player.stats.expToNext * 1.5);

      const hpGain = 10 + Math.floor(Math.random() * 10);
      const atkGain = 2 + Math.floor(Math.random() * 3);
      const defGain = 1 + Math.floor(Math.random() * 2);

      player.stats.maxHp += hpGain;
      player.stats.currentHp = Math.min(player.stats.currentHp + hpGain, player.stats.maxHp);
      player.stats.attack += atkGain;
      player.stats.defense += defGain;

      levelUps.push({ level: player.stats.level, hpGain, atkGain, defGain });
      this.addCombatLog(`🎊 升级！你现在是 ${player.stats.level} 级了！`);
      this.addCombatLog(`   HP +${hpGain}, ATK +${atkGain}, DEF +${defGain}`);
    }

    return levelUps.length > 0 ? levelUps : null;
  }

  endCombat(victory) {
    this.gameState.combat.active = false;
    this.gameState.combat.enemy = null;
    this.gameState.combat.log = [];
    return victory;
  }

  addCombatLog(message) {
    this.gameState.combat.log.push(message);
    this.gameState.gameLog.push(message);
    if (this.gameState.combat.log.length > 50) {
      this.gameState.combat.log.shift();
    }
    if (this.gameState.gameLog.length > 100) {
      this.gameState.gameLog.shift();
    }
  }
}
