const SKILL_BRANCHES = {
  warrior: {
    id: 'warrior',
    name: '战士',
    icon: '⚔️',
    color: '#E74C3C',
    description: '近战专精，高生命、高防御，擅长群攻与护盾',
    skills: [
      {
        id: 'warrior_slash',
        name: '横扫千军',
        icon: '🗡️',
        tier: 1,
        mpCost: 15,
        description: '对敌人造成1.5倍攻击力的伤害',
        effect: { type: 'damage', multiplier: 1.5 },
        prerequisite: null
      },
      {
        id: 'warrior_shield',
        name: '钢铁护盾',
        icon: '🛡️',
        tier: 1,
        mpCost: 20,
        description: '生成吸收30%最大生命值的护盾，持续本场战斗',
        effect: { type: 'shield', hpPercent: 0.3 },
        prerequisite: null
      },
      {
        id: 'warrior_whirlwind',
        name: '旋风斩',
        icon: '🌪️',
        tier: 2,
        mpCost: 30,
        description: '对敌人造成2倍攻击力的伤害，并获得50%吸血',
        effect: { type: 'damage_lifesteal', multiplier: 2.0, lifestealPercent: 0.5 },
        prerequisite: 'warrior_slash'
      },
      {
        id: 'warrior_taunt',
        name: '战吼',
        icon: '📢',
        tier: 2,
        mpCost: 25,
        description: '本场战斗攻击力提升30%，防御力提升20%',
        effect: { type: 'buff', attackMod: 0.3, defenseMod: 0.2 },
        prerequisite: 'warrior_shield'
      },
      {
        id: 'warrior_berserk',
        name: '狂暴之力',
        icon: '💢',
        tier: 3,
        mpCost: 50,
        description: '对敌人造成3倍攻击力的伤害，自身获得20%吸血并生成护盾',
        effect: { type: 'ultimate', multiplier: 3.0, lifestealPercent: 0.2, shieldPercent: 0.2 },
        prerequisite: 'warrior_whirlwind'
      },
      {
        id: 'warrior_guardian',
        name: '守护者之躯',
        icon: '🏰',
        tier: 3,
        mpCost: 45,
        description: '生成50%最大生命值护盾，并永久提升本场战斗防御50%',
        effect: { type: 'shield_buff', hpPercent: 0.5, defenseMod: 0.5 },
        prerequisite: 'warrior_taunt'
      }
    ]
  },
  mage: {
    id: 'mage',
    name: '法师',
    icon: '🔮',
    color: '#3498DB',
    description: '魔法专精，高爆发、高控制，擅长元素魔法',
    skills: [
      {
        id: 'mage_fireball',
        name: '火球术',
        icon: '🔥',
        tier: 1,
        mpCost: 12,
        description: '释放火球造成1.8倍攻击力的火焰伤害',
        effect: { type: 'damage', multiplier: 1.8 },
        prerequisite: null
      },
      {
        id: 'mage_frost',
        name: '冰霜护甲',
        icon: '❄️',
        tier: 1,
        mpCost: 18,
        description: '生成吸收25%最大生命值的冰霜护盾',
        effect: { type: 'shield', hpPercent: 0.25 },
        prerequisite: null
      },
      {
        id: 'mage_lightning',
        name: '闪电链',
        icon: '⚡',
        tier: 2,
        mpCost: 28,
        description: '召唤闪电造成2.2倍伤害，有30%概率使敌人眩晕（跳过一回合）',
        effect: { type: 'damage_stun', multiplier: 2.2, stunChance: 0.3 },
        prerequisite: 'mage_fireball'
      },
      {
        id: 'mage_drain',
        name: '生命汲取',
        icon: '💚',
        tier: 2,
        mpCost: 22,
        description: '造成1.5倍伤害并获得100%吸血效果',
        effect: { type: 'damage_lifesteal', multiplier: 1.5, lifestealPercent: 1.0 },
        prerequisite: 'mage_frost'
      },
      {
        id: 'mage_meteor',
        name: '陨石坠落',
        icon: '☄️',
        tier: 3,
        mpCost: 55,
        description: '召唤陨石造成3.5倍攻击力的毁灭性伤害',
        effect: { type: 'damage', multiplier: 3.5 },
        prerequisite: 'mage_lightning'
      },
      {
        id: 'mage_arcane',
        name: '奥术爆发',
        icon: '✨',
        tier: 3,
        mpCost: 48,
        description: '奥术能量爆发：造成2.5倍伤害+100%吸血+生成30%最大生命护盾',
        effect: { type: 'ultimate', multiplier: 2.5, lifestealPercent: 1.0, shieldPercent: 0.3 },
        prerequisite: 'mage_drain'
      }
    ]
  },
  assassin: {
    id: 'assassin',
    name: '刺客',
    icon: '🗡️',
    color: '#9B59B6',
    description: '敏捷专精，高暴击、高吸血，擅长速攻与暗杀',
    skills: [
      {
        id: 'assassin_backstab',
        name: '背刺',
        icon: '🔪',
        tier: 1,
        mpCost: 12,
        description: '从背后偷袭造成1.6倍伤害，必暴击',
        effect: { type: 'damage_crit', multiplier: 1.6 },
        prerequisite: null
      },
      {
        id: 'assassin_poison',
        name: '淬毒',
        icon: '☠️',
        tier: 1,
        mpCost: 16,
        description: '武器淬毒造成1.3倍伤害，下3回合每回合额外受到伤害',
        effect: { type: 'damage_dot', multiplier: 1.3, dotTurns: 3, dotPercent: 0.2 },
        prerequisite: null
      },
      {
        id: 'assassin_shadowstep',
        name: '影步',
        icon: '👤',
        tier: 2,
        mpCost: 24,
        description: '瞬移到敌人身后造成2倍伤害，并获得40%吸血',
        effect: { type: 'damage_lifesteal', multiplier: 2.0, lifestealPercent: 0.4 },
        prerequisite: 'assassin_backstab'
      },
      {
        id: 'assassin_smoke',
        name: '烟雾弹',
        icon: '💨',
        tier: 2,
        mpCost: 20,
        description: '释放烟雾：下回合敌人攻击无效，并生成20%最大生命护盾',
        effect: { type: 'dodge_shield', dodgeTurns: 1, hpPercent: 0.2 },
        prerequisite: 'assassin_poison'
      },
      {
        id: 'assassin_deathmark',
        name: '死亡印记',
        icon: '💀',
        tier: 3,
        mpCost: 50,
        description: '印记敌人造成2.8倍伤害+80%吸血，若敌人生命<30%则造成5倍伤害',
        effect: { type: 'execute', multiplier: 2.8, executeMultiplier: 5.0, lifestealPercent: 0.8, executeHpPercent: 0.3 },
        prerequisite: 'assassin_shadowstep'
      },
      {
        id: 'assassin_phantom',
        name: '幻影连击',
        icon: '👥',
        tier: 3,
        mpCost: 52,
        description: '召唤幻影连续攻击3次，每次造成1.2倍伤害，最后一击必暴击+60%吸血',
        effect: { type: 'multi_strike', hits: 3, multiplier: 1.2, finalCrit: true, lifestealPercent: 0.6 },
        prerequisite: 'assassin_smoke'
      }
    ]
  }
};

class SkillSystem {
  static createSkillState() {
    return {
      skillPoints: 1,
      learnedSkills: [],
      currentBranch: null,
      combatEffects: {
        shield: 0,
        attackMod: 0,
        defenseMod: 0,
        stunTurns: 0,
        dodgeTurns: 0,
        dotTurns: 0,
        dotDamage: 0
      }
    };
  }

  static ensureSkillCompatibility(gameState) {
    if (gameState.player.skills === undefined || gameState.player.skills === null) {
      gameState.player.skills = this.createSkillState();
    }
    if (gameState.player.skills.skillPoints === undefined) {
      gameState.player.skills.skillPoints = Math.max(0, (gameState.player.stats.level || 1) - 1);
    }
    if (!gameState.player.skills.learnedSkills) {
      gameState.player.skills.learnedSkills = [];
    }
    if (!gameState.player.skills.combatEffects) {
      gameState.player.skills.combatEffects = {
        shield: 0,
        attackMod: 0,
        defenseMod: 0,
        stunTurns: 0,
        dodgeTurns: 0,
        dotTurns: 0,
        dotDamage: 0
      };
    }
    if (gameState.player.stats.maxMp === undefined) {
      gameState.player.stats.maxMp = 50 + ((gameState.player.stats.level || 1) - 1) * 10;
    }
    if (gameState.player.stats.currentMp === undefined) {
      gameState.player.stats.currentMp = gameState.player.stats.maxMp;
    }
    return gameState;
  }

  static addMaxMpToNewPlayer(player) {
    player.stats.maxMp = 50;
    player.stats.currentMp = 50;
    player.skills = this.createSkillState();
    return player;
  }

  static getAllSkills() {
    const all = [];
    Object.values(SKILL_BRANCHES).forEach(branch => {
      branch.skills.forEach(skill => {
        all.push({ ...skill, branchId: branch.id, branchName: branch.name, branchIcon: branch.icon });
      });
    });
    return all;
  }

  static getSkillById(skillId) {
    const all = this.getAllSkills();
    return all.find(s => s.id === skillId);
  }

  static getBranchBySkillId(skillId) {
    for (const [branchId, branch] of Object.entries(SKILL_BRANCHES)) {
      if (branch.skills.some(s => s.id === skillId)) {
        return branch;
      }
    }
    return null;
  }

  static canLearnSkill(gameState, skillId) {
    const skill = this.getSkillById(skillId);
    if (!skill) return { canLearn: false, reason: '技能不存在' };

    const learned = gameState.player.skills.learnedSkills;
    if (learned.includes(skillId)) {
      return { canLearn: false, reason: '已学习该技能' };
    }

    if (gameState.player.skills.skillPoints < 1) {
      return { canLearn: false, reason: '技能点不足' };
    }

    if (skill.prerequisite && !learned.includes(skill.prerequisite)) {
      const prereq = this.getSkillById(skill.prerequisite);
      return { canLearn: false, reason: `需先学习【${prereq ? prereq.name : skill.prerequisite}】` };
    }

    return { canLearn: true };
  }

  static learnSkill(gameState, skillId) {
    const result = this.canLearnSkill(gameState, skillId);
    if (!result.canLearn) {
      return { success: false, message: result.reason };
    }

    const skill = this.getSkillById(skillId);
    const branch = this.getBranchBySkillId(skillId);

    gameState.player.skills.skillPoints -= 1;
    gameState.player.skills.learnedSkills.push(skillId);

    if (!gameState.player.skills.currentBranch) {
      gameState.player.skills.currentBranch = branch.id;
    }

    if (gameState.gameLog) {
      gameState.gameLog.push(`📚 学习了${branch.icon}【${skill.name}】技能！消耗1技能点。`);
    }

    return {
      success: true,
      skill: skill,
      branch: branch,
      message: `学习成功！学会了${branch.icon}【${skill.name}】`
    };
  }

  static getLearnedSkillsForCombat(gameState) {
    const learned = gameState.player.skills.learnedSkills;
    return learned.map(id => this.getSkillById(id)).filter(Boolean);
  }

  static canUseSkill(gameState, skillId) {
    const skill = this.getSkillById(skillId);
    if (!skill) return { canUse: false, reason: '技能不存在' };

    const learned = gameState.player.skills.learnedSkills;
    if (!learned.includes(skillId)) {
      return { canUse: false, reason: '未学习该技能' };
    }

    if (gameState.player.stats.currentMp < skill.mpCost) {
      return { canUse: false, reason: `MP不足（需要${skill.mpCost}）` };
    }

    return { canUse: true };
  }

  static consumeMp(gameState, amount) {
    gameState.player.stats.currentMp = Math.max(0, gameState.player.stats.currentMp - amount);
  }

  static recoverMp(gameState, amount) {
    const maxMp = gameState.player.stats.maxMp;
    gameState.player.stats.currentMp = Math.min(maxMp, gameState.player.stats.currentMp + amount);
  }

  static applyShield(gameState, hpPercent) {
    const playerStats = this.getPlayerTotalForSkill(gameState);
    const shieldAmount = Math.floor(playerStats.maxHp * hpPercent);
    gameState.player.skills.combatEffects.shield += shieldAmount;
    return shieldAmount;
  }

  static getPlayerTotalForSkill(gameState) {
    const player = gameState.player;
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

    return { attack, defense, maxHp };
  }

  static resetCombatEffects(gameState) {
    if (gameState.player.skills && gameState.player.skills.combatEffects) {
      gameState.player.skills.combatEffects = {
        shield: 0,
        attackMod: 0,
        defenseMod: 0,
        stunTurns: 0,
        dodgeTurns: 0,
        dotTurns: 0,
        dotDamage: 0
      };
    }
  }

  static tickCombatEffects(gameState) {
    const effects = gameState.player.skills?.combatEffects;
    if (!effects) return;

    if (effects.stunTurns > 0) effects.stunTurns--;
    if (effects.dodgeTurns > 0) effects.dodgeTurns--;
  }

  static addLevelUpSkillPoint(gameState, levelUpsCount) {
    if (!gameState.player.skills) {
      gameState.player.skills = this.createSkillState();
    }
    gameState.player.skills.skillPoints += levelUpsCount;

    const mpGain = levelUpsCount * 10;
    gameState.player.stats.maxMp += mpGain;
    gameState.player.stats.currentMp = Math.min(
      gameState.player.stats.currentMp + mpGain,
      gameState.player.stats.maxMp
    );

    return { skillPoints: levelUpsCount, maxMpGain: mpGain };
  }

  static restRecoverMp(gameState) {
    const maxMp = gameState.player.stats.maxMp;
    const recoverAmount = Math.floor(maxMp * 0.1);
    this.recoverMp(gameState, recoverAmount);
    return recoverAmount;
  }
}
