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
      defending: false,
      enemyDots: [],
      killsThisCombat: 0
    };
    SkillSystem.resetCombatEffects(this.gameState);
    
    const effects = this.getEquipmentsSpecialEffects();
    effects.forEach(effect => {
      if (effect.specialEffect) {
        effect.usedThisCombat = false;
      }
    });
    
    this.addCombatLog(`${enemy.icon} ${enemy.name} 出现了！`);
    
    const turnStartEffects = this.applyEquipmentOnTurnStartEffects();
    turnStartEffects.forEach(msg => this.addCombatLog(msg));
    
    return this.gameState.combat;
  }

  applyEnemyDotDamage() {
    if (!this.gameState.combat.enemyDots || this.gameState.combat.enemyDots.length === 0) return;
    
    const playerAttack = this.getPlayerTotalStats().attack;
    let totalDotDamage = 0;
    
    this.gameState.combat.enemyDots = this.gameState.combat.enemyDots.filter(dot => {
      if (dot.turns <= 0) return false;
      
      const damage = Math.floor(playerAttack * dot.damagePercent);
      this.gameState.combat.enemy.currentHp -= damage;
      totalDotDamage += damage;
      dot.turns--;
      
      const effectName = dot.type === 'burn' ? '燃烧' : (dot.type === 'curse' ? '诅咒' : '持续伤害');
      this.addCombatLog(`☠️ ${dot.name}${effectName}造成 ${damage} 点伤害！剩余 ${dot.turns} 回合`);
      
      return dot.turns > 0;
    });
    
    return totalDotDamage;
  }

  getPlayerTotalStats() {
    const baseStats = CharacterSystem.getPlayerTotalStats(this.gameState);
    const effects = this.gameState.player.skills?.combatEffects;
    
    let attack = baseStats.attack;
    let defense = baseStats.defense;
    let maxHp = baseStats.maxHp;
    let critChance = baseStats.critChance || 0;

    if (effects) {
      if (effects.attackMod) {
        attack = Math.floor(attack * (1 + effects.attackMod));
      }
      if (effects.defenseMod) {
        defense = Math.floor(defense * (1 + effects.defenseMod));
      }
    }

    return { attack, defense, maxHp, critChance };
  }

  getEquipmentsSpecialEffects() {
    const effects = [];
    const equipment = this.gameState.player.equipment;
    
    if (equipment.weapon) {
      effects.push(...getEquipmentSpecialEffects(equipment.weapon));
    }
    if (equipment.armor) {
      effects.push(...getEquipmentSpecialEffects(equipment.armor));
    }
    if (equipment.accessory) {
      effects.push(...getEquipmentSpecialEffects(equipment.accessory));
    }
    
    return effects;
  }

  getEquipmentDamageReduction() {
    const effects = this.getEquipmentsSpecialEffects();
    let reduction = 0;
    
    effects.forEach(effect => {
      if (effect.type === 'eternity' || effect.type === 'divine_blessing') {
        reduction += effect.damageReduction || 0;
      }
    });
    
    return Math.min(0.5, reduction);
  }

  getEquipmentDamageBoost() {
    const effects = this.getEquipmentsSpecialEffects();
    let boost = 0;
    
    effects.forEach(effect => {
      if (effect.type === 'divine_blessing') {
        boost += effect.damageBoost || 0;
      }
      if (effect.type === 'wolf_pack') {
        const kills = this.gameState.combat.killsThisCombat || 0;
        const stacks = Math.min(5, kills);
        boost += stacks * (effect.damageMultiplier || 0.1);
      }
      if (effect.type === 'blood_moon') {
        const hpPercent = this.gameState.player.stats.currentHp / this.gameState.player.stats.maxHp;
        const maxBoost = effect.damageBoost || 0.3;
        boost += (1 - hpPercent) * maxBoost;
      }
    });
    
    return boost;
  }

  applyEquipmentOnHitEffects(damage, targetIsEnemy = true) {
    if (!targetIsEnemy) return { damage, extraEffects: [] };
    
    const effects = this.getEquipmentsSpecialEffects();
    const extraEffects = [];
    let finalDamage = damage;
    let lifestealAmount = 0;

    effects.forEach(effect => {
      const roll = Math.random();
      
      switch (effect.type) {
        case 'burn':
        case 'curse':
          if (roll < (effect.chance || 0.1)) {
            extraEffects.push({
              type: 'dot',
              name: effect.affixName,
              damagePercent: effect.damagePercent,
              turns: effect.turns,
              dotType: effect.type
            });
          }
          break;
          
        case 'freeze':
          if (roll < (effect.chance || 0.1)) {
            extraEffects.push({
              type: 'stun',
              name: effect.affixName,
              turns: effect.turns
            });
          }
          break;
          
        case 'chain_lightning':
        case 'dragon_breath':
          if (roll < (effect.chance || 0.1)) {
            const extraDamage = Math.floor(this.gameState.player.stats.attack * (effect.damagePercent || 0.5));
            finalDamage += extraDamage;
            extraEffects.push({
              type: 'extra_damage',
              name: effect.affixName,
              damage: extraDamage
            });
          }
          break;
          
        case 'destruction':
          if (roll < (effect.chance || 0.05)) {
            finalDamage = Math.floor(damage * (effect.damageMultiplier || 3));
            extraEffects.push({
              type: 'multiplier',
              name: effect.affixName,
              multiplier: effect.damageMultiplier
            });
          }
          break;
          
        case 'execute':
          if (this.gameState.combat.enemy.currentHp / this.gameState.combat.enemy.maxHp < (effect.threshold || 0.2)) {
            finalDamage = Math.floor(damage * (effect.damageMultiplier || 2));
            extraEffects.push({
              type: 'execute',
              name: effect.affixName,
              multiplier: effect.damageMultiplier
            });
          }
          break;
          
        case 'lifesteal':
        case 'vampiric':
          lifestealAmount += Math.floor(damage * (effect.percent || 0.1));
          break;
          
        case 'double_strike':
          if (roll < (effect.chance || 0.05)) {
            extraEffects.push({
              type: 'double_strike',
              name: effect.affixName
            });
          }
          break;
          
        case 'holy_shield':
          if (roll < (effect.chance || 0.1)) {
            const maxHp = CharacterSystem.getPlayerTotalStats(this.gameState).maxHp;
            const shieldAmount = Math.floor(maxHp * (effect.shieldPercent || 0.1));
            extraEffects.push({
              type: 'shield',
              name: effect.affixName,
              amount: shieldAmount
            });
          }
          break;
      }
    });

    if (lifestealAmount > 0) {
      const maxHp = CharacterSystem.getPlayerTotalStats(this.gameState).maxHp;
      const currentHp = this.gameState.player.stats.currentHp;
      const actualHeal = Math.min(lifestealAmount, maxHp - currentHp);
      this.gameState.player.stats.currentHp += actualHeal;
      extraEffects.push({
        type: 'lifesteal',
        amount: actualHeal
      });
    }

    return { damage: finalDamage, extraEffects };
  }

  applyEquipmentOnTurnStartEffects() {
    const effects = this.getEquipmentsSpecialEffects();
    const messages = [];

    effects.forEach(effect => {
      if (effect.type === 'celestial_blessing') {
        const maxHp = CharacterSystem.getPlayerTotalStats(this.gameState).maxHp;
        const healAmount = Math.floor(maxHp * (effect.healPercent || 0.05));
        const currentHp = this.gameState.player.stats.currentHp;
        const actualHeal = Math.min(healAmount, maxHp - currentHp);
        if (actualHeal > 0) {
          this.gameState.player.stats.currentHp += actualHeal;
          messages.push(`✨ ${effect.affixName}：恢复了 ${actualHeal} 点生命值！`);
        }
      }
    });

    return messages;
  }

  checkEquipmentRevive() {
    const effects = this.getEquipmentsSpecialEffects();
    
    for (const effect of effects) {
      if (effect.type === 'phoenix_revive') {
        if (!effect.usedThisCombat && Math.random() < (effect.chance || 0.03)) {
          const maxHp = CharacterSystem.getPlayerTotalStats(this.gameState).maxHp;
          const healAmount = Math.floor(maxHp * (effect.healPercent || 0.5));
          this.gameState.player.stats.currentHp = healAmount;
          effect.usedThisCombat = true;
          return { success: true, amount: healAmount, name: effect.affixName };
        }
      }
      
      if (effect.type === 'guardian_angel') {
        if (!effect.usedThisCombat && effect.reviveOnce) {
          const maxHp = CharacterSystem.getPlayerTotalStats(this.gameState).maxHp;
          const healAmount = Math.floor(maxHp * (effect.healPercent || 0.3));
          this.gameState.player.stats.currentHp = healAmount;
          effect.usedThisCombat = true;
          return { success: true, amount: healAmount, name: effect.affixName };
        }
      }
    }
    
    return { success: false };
  }

  checkEquipmentExtraTurn() {
    const effects = this.getEquipmentsSpecialEffects();
    
    for (const effect of effects) {
      if (effect.type === 'time_warp') {
        if (Math.random() < (effect.extraTurnChance || 0.15)) {
          return { success: true, name: effect.affixName };
        }
      }
    }
    
    return { success: false };
  }

  calculateDamage(attacker, defender, isPlayerAttacker, overrideMultiplier = 1, forceCrit = false) {
    let attackValue = WeatherSystem.applyCombatAttackMods(this.gameState, attacker.attack, isPlayerAttacker);
    let defenseValue = WeatherSystem.applyCombatDefenseMods(this.gameState, defender.defense, !isPlayerAttacker);
    
    const damageBoost = isPlayerAttacker ? this.getEquipmentDamageBoost() : 0;
    attackValue = Math.floor(attackValue * (1 + damageBoost) * overrideMultiplier);
    
    const damageReduction = !isPlayerAttacker ? this.getEquipmentDamageReduction() : 0;
    defenseValue = Math.floor(defenseValue * (1 + damageReduction));
    
    const baseDamage = Math.max(1, attackValue - defenseValue);
    const variance = Math.floor(Math.random() * 5) - 2;
    
    const baseCritChance = isPlayerAttacker ? (attacker.critChance || 0.1) : 0.1;
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
    const attacker = { attack: playerStats.attack, critChance: playerStats.critChance };
    const defender = { defense: enemy.defense };

    const { damage, isCrit } = this.calculateDamage(attacker, defender, true);
    
    const equipResult = this.applyEquipmentOnHitEffects(damage, true);
    let finalDamage = equipResult.damage;
    
    enemy.currentHp -= finalDamage;

    const critText = isCrit ? '【暴击！】' : '';
    this.addCombatLog(`⚔️ 你对 ${enemy.name} 造成了 ${critText}${finalDamage} 点伤害！`);
    
    equipResult.extraEffects.forEach(effect => {
      switch (effect.type) {
        case 'dot':
          if (!this.gameState.combat.enemyDots) this.gameState.combat.enemyDots = [];
          this.gameState.combat.enemyDots.push({
            type: effect.dotType,
            name: effect.name,
            damagePercent: effect.damagePercent,
            turns: effect.turns
          });
          const dotDamage = Math.floor(this.getPlayerTotalStats().attack * effect.damagePercent);
          this.addCombatLog(`🔥 ${effect.name}：敌人陷入${effect.dotType === 'burn' ? '燃烧' : '诅咒'}状态，${effect.turns}回合每回合受到${dotDamage}点伤害！`);
          break;
        case 'stun':
          this.gameState.combat.enemyStunned = true;
          this.addCombatLog(`❄️ ${effect.name}：敌人被冻结${effect.turns}回合！`);
          break;
        case 'extra_damage':
          this.addCombatLog(`⚡ ${effect.name}：额外造成 ${effect.damage} 点伤害！`);
          break;
        case 'multiplier':
          this.addCombatLog(`💥 ${effect.name}：造成 ${effect.multiplier} 倍毁灭伤害！`);
          break;
        case 'execute':
          this.addCombatLog(`💀 ${effect.name}：处决！敌人血量低于阈值，伤害翻倍！`);
          break;
        case 'lifesteal':
          if (effect.amount > 0) {
            this.addCombatLog(`💚 吸血恢复了 ${effect.amount} 点生命值！`);
          }
          break;
        case 'shield':
          if (!this.gameState.player.skills.combatEffects) {
            this.gameState.player.skills.combatEffects = SkillSystem.createSkillState().combatEffects;
          }
          this.gameState.player.skills.combatEffects.shield += effect.amount;
          this.addCombatLog(`🛡️ ${effect.name}：生成了 ${effect.amount} 点护盾！`);
          break;
        case 'double_strike':
          this.addCombatLog(`⚡ ${effect.name}：触发双击！`);
          break;
      }
    });

    this.applyDotDamage();
    this.applyEnemyDotDamage();

    if (enemy.currentHp <= 0) {
      return this.enemyDefeated();
    }

    const hasDoubleStrike = equipResult.extraEffects.some(e => e.type === 'double_strike');
    if (hasDoubleStrike && enemy.currentHp > 0) {
      const { damage: secondDamage, isCrit: secondCrit } = this.calculateDamage(attacker, defender, true);
      enemy.currentHp -= secondDamage;
      const secondCritText = secondCrit ? '【暴击！】' : '';
      this.addCombatLog(`⚡ 第二击！对 ${enemy.name} 造成了 ${secondCritText}${secondDamage} 点伤害！`);
      
      if (enemy.currentHp <= 0) {
        return this.enemyDefeated();
      }
    }

    SkillSystem.tickCombatEffects(this.gameState);
    
    const extraTurn = this.checkEquipmentExtraTurn();
    if (extraTurn.success) {
      this.addCombatLog(`⏰ ${extraTurn.name}：获得额外行动回合！`);
    } else {
      this.gameState.combat.playerTurn = false;
    }
    
    return { type: 'playerAttack', damage: finalDamage, isCrit, enemyHp: enemy.currentHp };
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

    const attacker = { attack: playerStats.attack, critChance: playerStats.critChance };
    const defender = { defense: enemy.defense };

    const applySkillDamageWithAffixes = (damage, isCrit) => {
      const equipResult = this.applyEquipmentOnHitEffects(damage, true);
      let finalDamage = equipResult.damage;
      enemy.currentHp -= finalDamage;
      
      const critText = isCrit ? '【暴击！】' : '';
      logs.push(`💥 对 ${enemy.name} 造成了 ${critText}${finalDamage} 点伤害！`);
      
      equipResult.extraEffects.forEach(effect => {
        switch (effect.type) {
          case 'dot':
            if (!this.gameState.combat.enemyDots) this.gameState.combat.enemyDots = [];
            this.gameState.combat.enemyDots.push({
              type: effect.dotType,
              name: effect.name,
              damagePercent: effect.damagePercent,
              turns: effect.turns
            });
            const dotDamage = Math.floor(this.getPlayerTotalStats().attack * effect.damagePercent);
            logs.push(`🔥 ${effect.name}：敌人陷入${effect.dotType === 'burn' ? '燃烧' : '诅咒'}状态，${effect.turns}回合每回合受到${dotDamage}点伤害！`);
            break;
          case 'stun':
            this.gameState.combat.enemyStunned = true;
            logs.push(`❄️ ${effect.name}：敌人被冻结${effect.turns}回合！`);
            break;
          case 'extra_damage':
            logs.push(`⚡ ${effect.name}：额外造成 ${effect.damage} 点伤害！`);
            break;
          case 'multiplier':
            logs.push(`💥 ${effect.name}：造成 ${effect.multiplier} 倍毁灭伤害！`);
            break;
          case 'execute':
            logs.push(`💀 ${effect.name}：处决！敌人血量低于阈值，伤害翻倍！`);
            break;
          case 'lifesteal':
            if (effect.amount > 0) {
              totalHeal += effect.amount;
              logs.push(`💚 吸血恢复了 ${effect.amount} 点生命值！`);
            }
            break;
          case 'shield':
            if (!this.gameState.player.skills.combatEffects) {
              this.gameState.player.skills.combatEffects = SkillSystem.createSkillState().combatEffects;
            }
            this.gameState.player.skills.combatEffects.shield += effect.amount;
            logs.push(`🛡️ ${effect.name}：生成了 ${effect.amount} 点护盾！`);
            break;
        }
      });
      
      return finalDamage;
    };

    switch (effect.type) {
      case 'damage': {
        const { damage, isCrit } = this.calculateDamage(attacker, defender, true, effect.multiplier);
        totalDamage = applySkillDamageWithAffixes(damage, isCrit);
        break;
      }
      case 'damage_crit': {
        const { damage, isCrit } = this.calculateDamage(attacker, defender, true, effect.multiplier, true);
        totalDamage = applySkillDamageWithAffixes(damage, isCrit);
        logs.push(`💥 对 ${enemy.name} 造成了 【必暴击！】${totalDamage} 点伤害！`);
        break;
      }
      case 'damage_lifesteal': {
        const { damage, isCrit } = this.calculateDamage(attacker, defender, true, effect.multiplier);
        totalDamage = applySkillDamageWithAffixes(damage, isCrit);
        const heal = Math.floor(totalDamage * effect.lifestealPercent);
        const actualHeal = Math.min(heal, playerStats.maxHp - this.gameState.player.stats.currentHp);
        this.gameState.player.stats.currentHp += actualHeal;
        totalHeal += actualHeal;
        if (actualHeal > 0) {
          logs.push(`💚 技能吸血恢复了 ${actualHeal} 点生命值！`);
        }
        break;
      }
      case 'damage_stun': {
        const { damage, isCrit } = this.calculateDamage(attacker, defender, true, effect.multiplier);
        totalDamage = applySkillDamageWithAffixes(damage, isCrit);
        if (Math.random() < effect.stunChance) {
          this.gameState.combat.enemyStunned = true;
          logs.push(`⚡ ${enemy.name} 被眩晕了！下回合无法行动！`);
        }
        break;
      }
      case 'damage_dot': {
        const { damage, isCrit } = this.calculateDamage(attacker, defender, true, effect.multiplier);
        totalDamage = applySkillDamageWithAffixes(damage, isCrit);
        const playerEffects = this.gameState.player.skills.combatEffects;
        playerEffects.dotTurns = effect.dotTurns;
        playerEffects.dotDamage = Math.floor(totalDamage * effect.dotPercent);
        logs.push(`☠️ 敌人中毒！接下来 ${effect.dotTurns} 回合每回合额外受到 ${playerEffects.dotDamage} 点伤害！`);
        break;
      }
      case 'execute': {
        const hpPercent = enemy.currentHp / enemy.maxHp;
        const useExecute = hpPercent < effect.executeHpPercent;
        const multiplier = useExecute ? effect.executeMultiplier : effect.multiplier;
        const { damage } = this.calculateDamage(attacker, defender, true, multiplier, useExecute);
        if (useExecute) {
          logs.push(`💀【处决！】敌人生命值低于 ${Math.floor(effect.executeHpPercent * 100)}%！`);
        }
        totalDamage = applySkillDamageWithAffixes(damage, useExecute);
        const heal = Math.floor(totalDamage * effect.lifestealPercent);
        const actualHeal = Math.min(heal, playerStats.maxHp - this.gameState.player.stats.currentHp);
        this.gameState.player.stats.currentHp += actualHeal;
        totalHeal += actualHeal;
        if (actualHeal > 0) {
          logs.push(`💚 吸血恢复了 ${actualHeal} 点生命值！`);
        }
        break;
      }
      case 'multi_strike': {
        for (let i = 0; i < effect.hits; i++) {
          const isFinal = i === effect.hits - 1;
          const { damage, isCrit } = this.calculateDamage(
            attacker, defender, true, effect.multiplier,
            isFinal && effect.finalCrit
          );
          const equipResult = this.applyEquipmentOnHitEffects(damage, true);
          let finalDamage = equipResult.damage;
          enemy.currentHp -= finalDamage;
          totalDamage += finalDamage;
          const critText = isCrit ? '【暴击！】' : '';
          logs.push(`👥 第 ${i + 1} 击！对 ${enemy.name} 造成了 ${critText}${finalDamage} 点伤害！`);
          
          equipResult.extraEffects.forEach(effect => {
            if (effect.type === 'lifesteal' && effect.amount > 0) {
              totalHeal += effect.amount;
              logs.push(`💚 吸血恢复了 ${effect.amount} 点生命值！`);
            }
          });
          
          if (isFinal && effect.lifestealPercent) {
            const heal = Math.floor(finalDamage * effect.lifestealPercent);
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
        const { damage, isCrit } = this.calculateDamage(attacker, defender, true, effect.multiplier);
        totalDamage = applySkillDamageWithAffixes(damage, isCrit);
        logs.push(`💥 终极技能！对 ${enemy.name} 造成了 ${totalDamage} 点伤害！`);
        if (effect.lifestealPercent) {
          const heal = Math.floor(totalDamage * effect.lifestealPercent);
          const actualHeal = Math.min(heal, playerStats.maxHp - this.gameState.player.stats.currentHp);
          this.gameState.player.stats.currentHp += actualHeal;
          totalHeal += actualHeal;
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
    this.applyEnemyDotDamage();

    if (enemy.currentHp <= 0) {
      return this.enemyDefeated();
    }

    SkillSystem.tickCombatEffects(this.gameState);
    
    const extraTurn = this.checkEquipmentExtraTurn();
    if (extraTurn.success) {
      this.addCombatLog(`⏰ ${extraTurn.name}：获得额外行动回合！`);
    } else {
      this.gameState.combat.playerTurn = false;
    }
    
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
      const reviveResult = this.checkEquipmentRevive();
      if (reviveResult.success) {
        this.addCombatLog(`🌟 ${reviveResult.name}：你被复活了！恢复了 ${reviveResult.amount} 点生命值！`);
        this.gameState.player.stats.currentHp = reviveResult.amount;
      } else {
        this.gameState.player.stats.currentHp = 0;
        return this.playerDefeated();
      }
    }

    const turnStartEffects = this.applyEquipmentOnTurnStartEffects();
    turnStartEffects.forEach(msg => this.addCombatLog(msg));

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
    this.gameState.combat.killsThisCombat = (this.gameState.combat.killsThisCombat || 0) + 1;

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
          droppedItem = getRandomEquipment(this.gameState.dungeon.floor, 0, this.gameState);
          attempts++;
        } while ((droppedItem.rarity === 'common' || droppedItem.rarity === 'uncommon') && attempts < 10);
      } else {
        droppedItem = getRandomEquipment(this.gameState.dungeon.floor, 0, this.gameState);
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
