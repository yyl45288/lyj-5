class CombatSystem {
  constructor(gameState) {
    this.gameState = gameState;
  }

  startCombat(enemy) {
    this.gameState.combat = {
      active: true,
      enemy: { ...enemy },
      playerTurn: true,
      log: [`遭遇了 ${enemy.name}！`],
      enemyStunned: false,
      defending: false
    };
    SkillSystem.resetCombatEffects(this.gameState);
    this.addCombatLog(`${enemy.icon} ${enemy.name} 出现了！`);
    return this.gameState.combat;
  }

  getPlayerTotalStats() {
    const player = this.gameState.player;
    let attack = player.stats.attack;
    let defense = player.stats.defense;
    let maxHp = player.stats.maxHp;

    if (player.equipment.weapon) {
      attack += player.equipment.weapon.stats?.attack || 0;
      defense += player.equipment.weapon.stats?.defense || 0;
      maxHp += player.equipment.weapon.stats?.maxHp || 0;
    }
    if (player.equipment.armor) {
      attack += player.equipment.armor.stats?.attack || 0;
      defense += player.equipment.armor.stats?.defense || 0;
      maxHp += player.equipment.armor.stats?.maxHp || 0;
    }
    if (player.equipment.accessory) {
      attack += player.equipment.accessory.stats?.attack || 0;
      defense += player.equipment.accessory.stats?.defense || 0;
      maxHp += player.equipment.accessory.stats?.maxHp || 0;
    }

    const effects = player.skills?.combatEffects;
    if (effects) {
      if (effects.attackMod) {
        attack = Math.floor(attack * (1 + effects.attackMod));
      }
      if (effects.defenseMod) {
        defense = Math.floor(defense * (1 + effects.defenseMod));
      }
    }

    return { attack, defense, maxHp };
  }

  calculateDamage(attacker, defender, isPlayerAttacker, overrideMultiplier = 1, forceCrit = false) {
    let attackValue = WeatherSystem.applyCombatAttackMods(this.gameState, attacker.attack, isPlayerAttacker);
    let defenseValue = WeatherSystem.applyCombatDefenseMods(this.gameState, defender.defense, !isPlayerAttacker);
    attackValue = Math.floor(attackValue * overrideMultiplier);
    const baseDamage = Math.max(1, attackValue - defenseValue);
    const variance = Math.floor(Math.random() * 5) - 2;
    const baseCritChance = 0.1;
    const adjustedCritChance = forceCrit ? 1.0 : WeatherSystem.applyCritChanceMod(this.gameState, baseCritChance);
    const critRoll = Math.random();
    const isCrit = critRoll < adjustedCritChance;
    const finalDamage = Math.max(1, baseDamage + variance) * (isCrit ? 2 : 1);
    return { damage: finalDamage, isCrit };
  }

  applyDamageToPlayer(amount) {
    const player = this.gameState.player;
    const effects = player.skills?.combatEffects;
    let remaining = amount;

    if (effects && effects.shield > 0) {
      const absorbed = Math.min(effects.shield, remaining);
      effects.shield -= absorbed;
      remaining -= absorbed;
      if (absorbed > 0) {
        this.addCombatLog(`🛡️ 护盾吸收了 ${absorbed} 点伤害！${effects.shield > 0 ? `（剩余护盾: ${effects.shield}）` : '（护盾已破碎）'}`);
      }
    }

    if (remaining > 0) {
      player.stats.currentHp -= remaining;
    }

    return amount - remaining;
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

    this.applyDotDamage();

    if (enemy.currentHp <= 0) {
      return this.enemyDefeated();
    }

    SkillSystem.tickCombatEffects(this.gameState);
    this.gameState.combat.playerTurn = false;
    return { type: 'playerAttack', damage, isCrit, enemyHp: enemy.currentHp };
  }

  playerUseSkill(skillId) {
    if (!this.gameState.combat.active || !this.gameState.combat.playerTurn) return null;

    const canUse = SkillSystem.canUseSkill(this.gameState, skillId);
    if (!canUse.canUse) {
      return { type: 'skillFailed', message: canUse.reason };
    }

    const skill = SkillSystem.getSkillById(skillId);
    const effect = skill.effect;
    SkillSystem.consumeMp(this.gameState, skill.mpCost);

    const playerStats = this.getPlayerTotalStats();
    const enemy = this.gameState.combat.enemy;
    let totalDamage = 0;
    let totalHeal = 0;
    let logs = [];
    logs.push(`${skill.icon} 施放【${skill.name}】！消耗 ${skill.mpCost} MP`);

    switch (effect.type) {
      case 'damage': {
        const attacker = { attack: playerStats.attack };
        const defender = { defense: enemy.defense };
        const { damage, isCrit } = this.calculateDamage(attacker, defender, true, effect.multiplier);
        enemy.currentHp -= damage;
        totalDamage = damage;
        const critText = isCrit ? '【暴击！】' : '';
        logs.push(`💥 对 ${enemy.name} 造成了 ${critText}${damage} 点伤害！`);
        break;
      }
      case 'damage_crit': {
        const attacker = { attack: playerStats.attack };
        const defender = { defense: enemy.defense };
        const { damage } = this.calculateDamage(attacker, defender, true, effect.multiplier, true);
        enemy.currentHp -= damage;
        totalDamage = damage;
        logs.push(`💥 对 ${enemy.name} 造成了 【必暴击！】${damage} 点伤害！`);
        break;
      }
      case 'damage_lifesteal': {
        const attacker = { attack: playerStats.attack };
        const defender = { defense: enemy.defense };
        const { damage, isCrit } = this.calculateDamage(attacker, defender, true, effect.multiplier);
        enemy.currentHp -= damage;
        totalDamage = damage;
        const heal = Math.floor(damage * effect.lifestealPercent);
        const actualHeal = Math.min(heal, playerStats.maxHp - this.gameState.player.stats.currentHp);
        this.gameState.player.stats.currentHp += actualHeal;
        totalHeal = actualHeal;
        const critText = isCrit ? '【暴击！】' : '';
        logs.push(`💥 对 ${enemy.name} 造成了 ${critText}${damage} 点伤害！`);
        logs.push(`💚 吸血恢复了 ${actualHeal} 点生命值！`);
        break;
      }
      case 'damage_stun': {
        const attacker = { attack: playerStats.attack };
        const defender = { defense: enemy.defense };
        const { damage, isCrit } = this.calculateDamage(attacker, defender, true, effect.multiplier);
        enemy.currentHp -= damage;
        totalDamage = damage;
        const critText = isCrit ? '【暴击！】' : '';
        logs.push(`💥 对 ${enemy.name} 造成了 ${critText}${damage} 点伤害！`);
        if (Math.random() < effect.stunChance) {
          this.gameState.combat.enemyStunned = true;
          logs.push(`⚡ ${enemy.name} 被眩晕了！下回合无法行动！`);
        }
        break;
      }
      case 'damage_dot': {
        const attacker = { attack: playerStats.attack };
        const defender = { defense: enemy.defense };
        const { damage, isCrit } = this.calculateDamage(attacker, defender, true, effect.multiplier);
        enemy.currentHp -= damage;
        totalDamage = damage;
        const critText = isCrit ? '【暴击！】' : '';
        logs.push(`💥 对 ${enemy.name} 造成了 ${critText}${damage} 点伤害！`);
        const playerEffects = this.gameState.player.skills.combatEffects;
        playerEffects.dotTurns = effect.dotTurns;
        playerEffects.dotDamage = Math.floor(damage * effect.dotPercent);
        logs.push(`☠️ 敌人中毒！接下来 ${effect.dotTurns} 回合每回合额外受到 ${playerEffects.dotDamage} 点伤害！`);
        break;
      }
      case 'execute': {
        const hpPercent = enemy.currentHp / enemy.maxHp;
        const useExecute = hpPercent < effect.executeHpPercent;
        const multiplier = useExecute ? effect.executeMultiplier : effect.multiplier;
        const attacker = { attack: playerStats.attack };
        const defender = { defense: enemy.defense };
        const { damage } = this.calculateDamage(attacker, defender, true, multiplier, useExecute);
        enemy.currentHp -= damage;
        totalDamage = damage;
        if (useExecute) {
          logs.push(`💀【处决！】敌人生命值低于 ${Math.floor(effect.executeHpPercent * 100)}%，造成毁灭性 ${damage} 点伤害！`);
        } else {
          logs.push(`💥 对 ${enemy.name} 造成了 ${damage} 点伤害！`);
        }
        const heal = Math.floor(damage * effect.lifestealPercent);
        const actualHeal = Math.min(heal, playerStats.maxHp - this.gameState.player.stats.currentHp);
        this.gameState.player.stats.currentHp += actualHeal;
        totalHeal = actualHeal;
        if (actualHeal > 0) {
          logs.push(`💚 吸血恢复了 ${actualHeal} 点生命值！`);
        }
        break;
      }
      case 'multi_strike': {
        for (let i = 0; i < effect.hits; i++) {
          const isFinal = i === effect.hits - 1;
          const attacker = { attack: playerStats.attack };
          const defender = { defense: enemy.defense };
          const { damage, isCrit } = this.calculateDamage(
            attacker, defender, true, effect.multiplier,
            isFinal && effect.finalCrit
          );
          enemy.currentHp -= damage;
          totalDamage += damage;
          const critText = isCrit ? '【暴击！】' : '';
          logs.push(`👥 第 ${i + 1} 击！对 ${enemy.name} 造成了 ${critText}${damage} 点伤害！`);
          if (isFinal && effect.lifestealPercent) {
            const heal = Math.floor(damage * effect.lifestealPercent);
            const actualHeal = Math.min(heal, playerStats.maxHp - this.gameState.player.stats.currentHp);
            this.gameState.player.stats.currentHp += actualHeal;
            totalHeal += actualHeal;
            if (actualHeal > 0) {
              logs.push(`💚 最后一击吸血恢复了 ${actualHeal} 点生命值！`);
            }
          }
          if (enemy.currentHp <= 0) break;
        }
        break;
      }
      case 'shield': {
        const shieldAmount = SkillSystem.applyShield(this.gameState, effect.hpPercent);
        logs.push(`🛡️ 生成了 ${shieldAmount} 点护盾！`);
        break;
      }
      case 'buff': {
        const playerEffects = this.gameState.player.skills.combatEffects;
        if (effect.attackMod) playerEffects.attackMod += effect.attackMod;
        if (effect.defenseMod) playerEffects.defenseMod += effect.defenseMod;
        const parts = [];
        if (effect.attackMod) parts.push(`攻击+${Math.floor(effect.attackMod * 100)}%`);
        if (effect.defenseMod) parts.push(`防御+${Math.floor(effect.defenseMod * 100)}%`);
        logs.push(`💪 战斗状态提升：${parts.join('，')}！`);
        break;
      }
      case 'ultimate': {
        const attacker = { attack: playerStats.attack };
        const defender = { defense: enemy.defense };
        const { damage, isCrit } = this.calculateDamage(attacker, defender, true, effect.multiplier);
        enemy.currentHp -= damage;
        totalDamage = damage;
        const critText = isCrit ? '【暴击！】' : '';
        logs.push(`💥 终极技能！对 ${enemy.name} 造成了 ${critText}${damage} 点伤害！`);
        if (effect.lifestealPercent) {
          const heal = Math.floor(damage * effect.lifestealPercent);
          const actualHeal = Math.min(heal, playerStats.maxHp - this.gameState.player.stats.currentHp);
          this.gameState.player.stats.currentHp += actualHeal;
          totalHeal = actualHeal;
          if (actualHeal > 0) logs.push(`💚 吸血恢复了 ${actualHeal} 点生命值！`);
        }
        if (effect.shieldPercent) {
          const shieldAmount = SkillSystem.applyShield(this.gameState, effect.shieldPercent);
          logs.push(`🛡️ 额外生成了 ${shieldAmount} 点护盾！`);
        }
        break;
      }
      case 'shield_buff': {
        const shieldAmount = SkillSystem.applyShield(this.gameState, effect.hpPercent);
        logs.push(`🛡️ 生成了 ${shieldAmount} 点护盾！`);
        const playerEffects = this.gameState.player.skills.combatEffects;
        if (effect.defenseMod) {
          playerEffects.defenseMod += effect.defenseMod;
          logs.push(`💪 防御力永久提升 +${Math.floor(effect.defenseMod * 100)}%！`);
        }
        break;
      }
      case 'dodge_shield': {
        const playerEffects = this.gameState.player.skills.combatEffects;
        if (effect.dodgeTurns) {
          playerEffects.dodgeTurns = effect.dodgeTurns;
          logs.push(`💨 下 ${effect.dodgeTurns} 回合将闪避敌人攻击！`);
        }
        if (effect.hpPercent) {
          const shieldAmount = SkillSystem.applyShield(this.gameState, effect.hpPercent);
          logs.push(`🛡️ 生成了 ${shieldAmount} 点护盾！`);
        }
        break;
      }
    }

    logs.forEach(l => this.addCombatLog(l));

    this.applyDotDamage();

    if (enemy.currentHp <= 0) {
      return this.enemyDefeated();
    }

    SkillSystem.tickCombatEffects(this.gameState);
    this.gameState.combat.playerTurn = false;
    return {
      type: 'skillUsed',
      skill: skill,
      damage: totalDamage,
      heal: totalHeal,
      enemyHp: enemy.currentHp
    };
  }

  applyDotDamage() {
    const effects = this.gameState.player.skills?.combatEffects;
    if (!effects || effects.dotTurns <= 0 || effects.dotDamage <= 0) return;

    const enemy = this.gameState.combat.enemy;
    enemy.currentHp -= effects.dotDamage;
    this.addCombatLog(`☠️ 毒素造成 ${effects.dotDamage} 点持续伤害！`);
    effects.dotTurns--;
    if (effects.dotTurns <= 0) {
      effects.dotDamage = 0;
    }
  }

  playerDefend() {
    if (!this.gameState.combat.active || !this.gameState.combat.playerTurn) return null;

    this.addCombatLog('🛡️ 你进入防御姿态，减少受到的伤害！');
    SkillSystem.recoverMp(this.gameState, Math.floor(this.gameState.player.stats.maxMp * 0.1));
    this.addCombatLog(`💙 防御姿态恢复了 ${Math.floor(this.gameState.player.stats.maxMp * 0.1)} 点MP！`);
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
    const effects = this.gameState.player.skills?.combatEffects;

    if (this.gameState.combat.enemyStunned) {
      this.addCombatLog(`⚡ ${enemy.name} 处于眩晕状态，无法行动！`);
      this.gameState.combat.enemyStunned = false;
      this.gameState.combat.playerTurn = true;
      return { type: 'enemyStunned' };
    }

    if (effects && effects.dodgeTurns > 0) {
      this.addCombatLog(`💨 你成功闪避了 ${enemy.name} 的攻击！`);
      this.gameState.combat.playerTurn = true;
      return { type: 'dodged' };
    }

    const attacker = { attack: enemy.attack };
    const defender = { defense: playerStats.defense };

    if (this.gameState.combat.defending) {
      defender.defense = Math.floor(defender.defense * 2);
      this.gameState.combat.defending = false;
    }

    const { damage, isCrit } = this.calculateDamage(attacker, defender, false);
    this.applyDamageToPlayer(damage);

    const critText = isCrit ? '【暴击！】' : '';
    this.addCombatLog(`💥 ${enemy.name} 对你造成了 ${critText}${damage} 点伤害！`);

    const diffUpdate = DifficultySystem.updateDifficultyScoreRealtime(this.gameState, 'damage_taken', damage);
    if (Math.abs(diffUpdate.scoreDelta) >= 1) {
      this.addCombatLog(`⚖️ 难度评分 ${diffUpdate.scoreDelta > 0 ? '+' : ''}${diffUpdate.scoreDelta.toFixed(1)}，当前：${Math.round(diffUpdate.score)}`);
    }

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

    if (!this.gameState.comboKills) this.gameState.comboKills = 0;
    this.gameState.comboKills++;
    this.gameState.lastKillTime = Date.now();

    const comboBonus = Math.floor(this.gameState.comboKills / 3);
    const enemyRarity = enemy.rarity || 'common';
    let goldDrop = CharacterSystem.getGoldDropFromEnemy(enemy, this.gameState.dungeon.floor);
    if (comboBonus > 0) {
      const comboGold = Math.floor(goldDrop * comboBonus * 0.2);
      goldDrop += comboGold;
    }
    const totalGoldCollected = (this.gameState.totalGoldCollected || 0) + goldDrop;
    this.gameState.totalGoldCollected = totalGoldCollected;

    this.addCombatLog(`🎉 你击败了 ${enemy.name}！`);
    if (expBonus > 0) {
      this.addCombatLog(`✨ 获得 ${expGain} 经验值（天气加成 +${expBonus}），${scoreGain} 积分！`);
    } else {
      this.addCombatLog(`✨ 获得 ${expGain} 经验值，${scoreGain} 积分！`);
    }

    if (goldDrop > 0) {
      this.gameState.player.gold += goldDrop;
      let goldMsg = `💰 获得 ${goldDrop} 金币`;
      if (comboBonus > 0) goldMsg += `（连击奖励 x${comboBonus + 1}）`;
      if (enemyRarity !== 'common') goldMsg += `[${enemyRarity}]`;
      this.addCombatLog(goldMsg + '！');
    }

    const killDiffUpdate = DifficultySystem.updateDifficultyScoreRealtime(this.gameState, 'kill', 1);
    if (this.gameState.comboKills === 5 || this.gameState.comboKills === 10) {
      DifficultySystem.updateDifficultyScoreRealtime(this.gameState, 'combo', this.gameState.comboKills);
    }

    Game.updateQuestProgress(this.gameState, 'kill_enemies', 1);
    Game.updateQuestProgress(this.gameState, 'collect_gold', goldDrop);
    if (this.gameState.comboKills >= 2) {
      Game.updateQuestProgress(this.gameState, 'complete_combo', this.gameState.comboKills);
    }

    const weatherTriggerResult = this.tryWeatherOnKill(enemy);
    if (weatherTriggerResult) {
      this.addCombatLog(weatherTriggerResult.message);
      this.gameState.gameLog.push(weatherTriggerResult.message);
    }

    let droppedItem = null;
    const adjustedDropRate = DifficultySystem.getAdjustedDropRate(enemy.dropRate, this.gameState, false);
    const isRareDrop = Math.random() < DifficultySystem.getAdjustedDropRate(0.15, this.gameState, true);
    
    if (Math.random() < adjustedDropRate) {
      if (isRareDrop) {
        let attempts = 0;
        do {
          droppedItem = getRandomEquipment(this.gameState.dungeon.floor);
          attempts++;
        } while ((droppedItem.rarity === 'common' || droppedItem.rarity === 'uncommon') && attempts < 10);
      } else {
        droppedItem = getRandomEquipment(this.gameState.dungeon.floor);
      }
      this.gameState.player.inventory.push(droppedItem);
      const rareText = isRareDrop ? '【稀有掉落】' : '';
      this.addCombatLog(`📦 ${enemy.name} ${rareText}掉落了 ${droppedItem.icon} ${droppedItem.name}！`);
      DifficultySystem.updateFloorStats(this.gameState, 'item_found', 1);
    }

    const levelResult = this.checkLevelUp();

    this.endCombat(true);
    return {
      type: 'victory',
      expGain,
      scoreGain,
      goldDrop,
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

      const skillResult = SkillSystem.addLevelUpSkillPoint(this.gameState, 1);

      levelUps.push({
        level: player.stats.level,
        hpGain,
        atkGain,
        defGain,
        skillPoints: skillResult.skillPoints,
        maxMpGain: skillResult.maxMpGain
      });
      this.addCombatLog(`🎊 升级！你现在是 ${player.stats.level} 级了！`);
      this.addCombatLog(`   HP +${hpGain}, ATK +${atkGain}, DEF +${defGain}, MP +${skillResult.maxMpGain}, 技能点 +${skillResult.skillPoints}`);

      DifficultySystem.updateDifficultyScoreRealtime(this.gameState, 'level_up', 1);
    }

    return levelUps.length > 0 ? levelUps : null;
  }

  endCombat(victory) {
    this.gameState.combat.active = false;
    this.gameState.combat.enemy = null;
    this.gameState.combat.log = [];
    SkillSystem.resetCombatEffects(this.gameState);
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
