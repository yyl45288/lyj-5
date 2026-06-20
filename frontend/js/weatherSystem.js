const WEATHER_TYPES = {
  CLEAR: 'clear',
  ACID_RAIN: 'acid_rain',
  GRAVITY_ANOMALY: 'gravity_anomaly',
  EXTREME_COLD: 'extreme_cold',
  MAGMA_HEAT: 'magma_heat',
  THICK_FOG: 'thick_fog',
  THUNDERSTORM: 'thunderstorm',
  DIVINE_LIGHT: 'divine_light',
  UNDEAD_FOG: 'undead_fog'
};

const WEATHER_DATA = {
  [WEATHER_TYPES.CLEAR]: {
    id: WEATHER_TYPES.CLEAR,
    name: '晴朗',
    icon: '☀️',
    description: '地牢内天气正常，没有特殊效果。',
    color: '#FFD700',
    rarity: 0,
    effects: {
      mapClass: 'weather-clear',
      moveHpChange: 0,
      moveBlockChance: 0,
      viewRangeMod: 0,
      attackMod: 0,
      defenseMod: 0,
      critChanceMod: 0,
      enemyAttackMod: 0,
      enemyDefenseMod: 0,
      expBonus: 0,
      damageChance: 0,
      damageAmount: 0
    }
  },
  [WEATHER_TYPES.ACID_RAIN]: {
    id: WEATHER_TYPES.ACID_RAIN,
    name: '酸雨',
    icon: '🌧️',
    description: '腐蚀性酸雨持续滴落，每步损失1点生命，防御力略微下降。',
    color: '#27AE60',
    rarity: 0.10,
    effects: {
      mapClass: 'weather-acid-rain',
      moveHpChange: -1,
      moveBlockChance: 0,
      viewRangeMod: 0,
      attackMod: 0,
      defenseMod: -1,
      critChanceMod: 0,
      enemyAttackMod: 0,
      enemyDefenseMod: -1,
      expBonus: 0.05,
      damageChance: 0,
      damageAmount: 0
    }
  },
  [WEATHER_TYPES.GRAVITY_ANOMALY]: {
    id: WEATHER_TYPES.GRAVITY_ANOMALY,
    name: '重力异常',
    icon: '🌀',
    description: '空间扭曲导致重力异常，移动小概率失败，攻击力略微下降。',
    color: '#9B59B6',
    rarity: 0.08,
    effects: {
      mapClass: 'weather-gravity',
      moveHpChange: 0,
      moveBlockChance: 0.08,
      viewRangeMod: 0,
      attackMod: -1,
      defenseMod: 0,
      critChanceMod: 0,
      enemyAttackMod: -2,
      enemyDefenseMod: 0,
      expBonus: 0.08,
      damageChance: 0,
      damageAmount: 0
    }
  },
  [WEATHER_TYPES.EXTREME_COLD]: {
    id: WEATHER_TYPES.EXTREME_COLD,
    name: '极寒',
    icon: '❄️',
    description: '刺骨寒气侵袭，暴击率略微降低，移动极小概率被冰冻。敌人行动也变迟缓。',
    color: '#3498DB',
    rarity: 0.08,
    effects: {
      mapClass: 'weather-extreme-cold',
      moveHpChange: 0,
      moveBlockChance: 0.05,
      viewRangeMod: 0,
      attackMod: 0,
      defenseMod: 0,
      critChanceMod: -0.02,
      enemyAttackMod: -1,
      enemyDefenseMod: 1,
      expBonus: 0.05,
      damageChance: 0,
      damageAmount: 0
    }
  },
  [WEATHER_TYPES.MAGMA_HEAT]: {
    id: WEATHER_TYPES.MAGMA_HEAT,
    name: '熔岩热浪',
    icon: '🔥',
    description: '地热涌动，每步轻微灼伤，但攻击力显著提升，经验获取增加。',
    color: '#E74C3C',
    rarity: 0.06,
    effects: {
      mapClass: 'weather-magma-heat',
      moveHpChange: -1,
      moveBlockChance: 0,
      viewRangeMod: 0,
      attackMod: 3,
      defenseMod: 0,
      critChanceMod: 0.02,
      enemyAttackMod: 1,
      enemyDefenseMod: 0,
      expBonus: 0.15,
      damageChance: 0,
      damageAmount: 0
    }
  },
  [WEATHER_TYPES.THICK_FOG]: {
    id: WEATHER_TYPES.THICK_FOG,
    name: '迷雾',
    icon: '💨',
    description: '浓雾弥漫，视野范围略有缩小，但敌人也难以瞄准。',
    color: '#7F8C8D',
    rarity: 0.10,
    effects: {
      mapClass: 'weather-thick-fog',
      moveHpChange: 0,
      moveBlockChance: 0,
      viewRangeMod: -1,
      attackMod: 0,
      defenseMod: 0,
      critChanceMod: 0,
      enemyAttackMod: -1,
      enemyDefenseMod: 0,
      expBonus: 0.1,
      damageChance: 0,
      damageAmount: 0
    }
  },
  [WEATHER_TYPES.THUNDERSTORM]: {
    id: WEATHER_TYPES.THUNDERSTORM,
    name: '雷电风暴',
    icon: '⚡',
    description: '雷电交加，极小概率被雷击。暴击率大幅提升，经验奖励丰厚。',
    color: '#F39C12',
    rarity: 0.06,
    effects: {
      mapClass: 'weather-thunderstorm',
      moveHpChange: 0,
      moveBlockChance: 0,
      viewRangeMod: 0,
      attackMod: 3,
      defenseMod: 0,
      critChanceMod: 0.06,
      enemyAttackMod: 0,
      enemyDefenseMod: -1,
      expBonus: 0.2,
      damageChance: 0.05,
      damageAmount: 3
    }
  },
  [WEATHER_TYPES.DIVINE_LIGHT]: {
    id: WEATHER_TYPES.DIVINE_LIGHT,
    name: '神圣光辉',
    icon: '🌿',
    description: '神圣光芒照耀，每步恢复生命，防御和视野提升，敌人变弱。',
    color: '#2ECC71',
    rarity: 0.04,
    effects: {
      mapClass: 'weather-divine-light',
      moveHpChange: 2,
      moveBlockChance: 0,
      viewRangeMod: 1,
      attackMod: 1,
      defenseMod: 2,
      critChanceMod: 0.03,
      enemyAttackMod: -2,
      enemyDefenseMod: -1,
      expBonus: 0.2,
      damageChance: 0,
      damageAmount: 0
    }
  },
  [WEATHER_TYPES.UNDEAD_FOG]: {
    id: WEATHER_TYPES.UNDEAD_FOG,
    name: '亡灵之雾',
    icon: '👻',
    description: '亡灵雾气弥漫，敌人变强，但击杀经验和掉落率大幅提升。',
    color: '#8E44AD',
    rarity: 0.05,
    effects: {
      mapClass: 'weather-undead-fog',
      moveHpChange: 0,
      moveBlockChance: 0,
      viewRangeMod: -1,
      attackMod: 0,
      defenseMod: 0,
      critChanceMod: 0,
      enemyAttackMod: 1,
      enemyDefenseMod: 1,
      expBonus: 0.35,
      damageChance: 0,
      damageAmount: 0
    }
  }
};

class WeatherSystem {
  static createEmptyWeather() {
    return {
      activeWeathers: [],
      weatherTimers: {},
      shields: {
        weatherResist: 0,
        weatherShield: 0
      }
    };
  }

  static tickWeatherShields(weatherState, moves = 1) {
    if (!weatherState.shields) return;
    
    if (weatherState.shields.weatherResist > 0) {
      weatherState.shields.weatherResist = Math.max(0, weatherState.shields.weatherResist - moves);
    }
    if (weatherState.shields.weatherShield > 0) {
      weatherState.shields.weatherShield = Math.max(0, weatherState.shields.weatherShield - moves);
    }
  }

  static hasWeatherResist(weatherState) {
    return weatherState.shields && weatherState.shields.weatherResist > 0;
  }

  static hasWeatherShield(weatherState) {
    return weatherState.shields && weatherState.shields.weatherShield > 0;
  }

  static addWeatherResist(weatherState, duration) {
    if (!weatherState.shields) weatherState.shields = { weatherResist: 0, weatherShield: 0 };
    weatherState.shields.weatherResist = Math.max(weatherState.shields.weatherResist, duration);
  }

  static addWeatherShield(weatherState, duration) {
    if (!weatherState.shields) weatherState.shields = { weatherResist: 0, weatherShield: 0 };
    weatherState.shields.weatherShield = Math.max(weatherState.shields.weatherShield, duration);
  }

  static generateWeatherForFloor(floor, gameState = null) {
    const weatherState = this.createEmptyWeather();

    let baseChance = 0.15 + floor * 0.02;
    
    if (gameState) {
      const kills = gameState.kills || 0;
      const moveCount = gameState.moveCount || 0;
      if (kills > 10) baseChance += 0.05;
      if (kills > 25) baseChance += 0.05;
      if (moveCount > 100) baseChance += 0.03;
      if (moveCount > 200) baseChance += 0.03;
    }
    
    const weatherChance = Math.min(baseChance, 0.45);
    
    if (Math.random() >= weatherChance) {
      return weatherState;
    }

    const availableWeathers = Object.values(WEATHER_DATA).filter(w => w.rarity > 0);
    const totalRarity = availableWeathers.reduce((sum, w) => sum + w.rarity, 0);

    const multiWeatherChance = Math.min(0.08 + floor * 0.005, 0.20);
    const numWeathers = Math.random() < multiWeatherChance ? 2 : 1;
    const selectedWeathers = [];

    for (let i = 0; i < numWeathers; i++) {
      let roll = Math.random() * totalRarity;
      let selected = null;

      for (const weather of availableWeathers) {
        if (selectedWeathers.includes(weather.id)) continue;
        roll -= weather.rarity;
        if (roll <= 0) {
          selected = weather;
          break;
        }
      }

      if (selected && !selectedWeathers.includes(selected.id)) {
        selectedWeathers.push(selected.id);
        const dur = this.generateWeatherDuration(floor);
        weatherState.activeWeathers.push({
          id: selected.id,
          duration: dur,
          maxDuration: dur,
          startedAt: Date.now()
        });
        weatherState.weatherTimers[selected.id] = weatherState.activeWeathers[weatherState.activeWeathers.length - 1];
      }
    }

    return weatherState;
  }

  static generateWeatherDuration(floor) {
    const baseMoves = 30 + floor * 5;
    const variance = Math.floor(Math.random() * 20) - 10;
    return Math.max(15, baseMoves + variance);
  }

  static addWeather(weatherState, weatherId, duration = null) {
    if (!WEATHER_DATA[weatherId]) return false;
    if (weatherId === WEATHER_TYPES.CLEAR) return false;

    const existing = weatherState.activeWeathers.find(w => w.id === weatherId);
    if (existing) {
      const addDuration = duration || 20;
      existing.duration += addDuration;
      existing.maxDuration = existing.maxDuration
        ? Math.max(existing.maxDuration, existing.duration)
        : existing.duration;
      existing.startedAt = Date.now();
      return { added: false, stacked: true, weather: existing };
    }

    const dur = duration || this.generateWeatherDuration(1);
    const newWeather = {
      id: weatherId,
      duration: dur,
      maxDuration: dur,
      startedAt: Date.now()
    };
    weatherState.activeWeathers.push(newWeather);
    weatherState.weatherTimers[weatherId] = newWeather;
    return { added: true, stacked: false, weather: newWeather };
  }

  static removeWeather(weatherState, weatherId) {
    const index = weatherState.activeWeathers.findIndex(w => w.id === weatherId);
    if (index === -1) return false;

    weatherState.activeWeathers.splice(index, 1);
    delete weatherState.weatherTimers[weatherId];
    return true;
  }

  static clearAllWeathers(weatherState) {
    const removed = [...weatherState.activeWeathers];
    weatherState.activeWeathers = [];
    weatherState.weatherTimers = {};
    return removed;
  }

  static tickWeatherDuration(weatherState, moves = 1) {
    const expired = [];
    for (let i = weatherState.activeWeathers.length - 1; i >= 0; i--) {
      const weather = weatherState.activeWeathers[i];
      weather.duration -= moves;
      if (weather.duration <= 0) {
        expired.push(weather.id);
        weatherState.activeWeathers.splice(i, 1);
        delete weatherState.weatherTimers[weather.id];
      }
    }
    return expired;
  }

  static hasWeather(weatherState, weatherId) {
    return weatherState.activeWeathers.some(w => w.id === weatherId);
  }

  static getCombinedEffects(weatherState) {
    const combined = {
      ...WEATHER_DATA[WEATHER_TYPES.CLEAR].effects
    };

    if (!weatherState || weatherState.activeWeathers.length === 0) {
      return combined;
    }

    for (const weather of weatherState.activeWeathers) {
      const data = WEATHER_DATA[weather.id];
      if (!data) continue;
      const eff = data.effects;

      combined.moveHpChange += eff.moveHpChange;
      combined.moveBlockChance = Math.min(0.5, combined.moveBlockChance + eff.moveBlockChance);
      combined.viewRangeMod += eff.viewRangeMod;
      combined.attackMod += eff.attackMod;
      combined.defenseMod += eff.defenseMod;
      combined.critChanceMod += eff.critChanceMod;
      combined.enemyAttackMod += eff.enemyAttackMod;
      combined.enemyDefenseMod += eff.enemyDefenseMod;
      combined.expBonus += eff.expBonus;
      combined.damageChance = Math.min(0.4, combined.damageChance + eff.damageChance);
      combined.damageAmount += eff.damageAmount;

      if (eff.mapClass && eff.mapClass !== 'weather-clear') {
        if (!combined.mapClasses) combined.mapClasses = [];
        combined.mapClasses.push(eff.mapClass);
      }
    }

    combined.critChanceMod = Math.max(-0.1, Math.min(0.2, combined.critChanceMod));
    combined.expBonus = Math.min(0.5, combined.expBonus);

    return combined;
  }

  static getActiveWeatherDescriptions(weatherState) {
    if (!weatherState || weatherState.activeWeathers.length === 0) {
      return [];
    }
    return weatherState.activeWeathers.map(w => {
      const data = WEATHER_DATA[w.id];
      const maxDur = w.maxDuration || w.duration;
      const percent = Math.max(0, Math.min(100, (w.duration / maxDur) * 100));
      const isUrgent = percent <= 25;
      return {
        id: w.id,
        name: data.name,
        icon: data.icon,
        description: data.description,
        color: data.color,
        duration: w.duration,
        maxDuration: maxDur,
        percent: percent,
        isUrgent: isUrgent
      };
    });
  }

  static applyMoveEffects(gameState) {
    const effects = this.getCombinedEffects(gameState.weatherState);
    const player = gameState.player;
    const result = {
      hpChange: 0,
      blocked: false,
      extraDamage: 0,
      messages: []
    };

    const hasShield = this.hasWeatherShield(gameState.weatherState);
    const hasResist = this.hasWeatherResist(gameState.weatherState);
    const accessory = player.equipment.accessory || {};
    const ignoreMoveBlock = accessory.ignoreWeatherMoveBlock || false;
    const weatherDamageResist = accessory.weatherDamageResist || 0;

    let moveBlockChance = effects.moveBlockChance;
    let moveHpChange = effects.moveHpChange;
    let damageChance = effects.damageChance;
    let damageAmount = effects.damageAmount;

    if (hasShield) {
      if (moveBlockChance > 0) result.messages.push('🛡️ 天气护盾抵御了移动阻碍！');
      if (moveHpChange < 0) result.messages.push('🛡️ 天气护盾抵御了天气伤害！');
      moveBlockChance = 0;
      moveHpChange = Math.max(0, moveHpChange);
      damageChance = 0;
    } else if (hasResist) {
      if (ignoreMoveBlock && moveBlockChance > 0) {
        result.messages.push('🧥 风行斗篷让你不受天气阻碍！');
        moveBlockChance = 0;
      }
      if (moveHpChange < 0) {
        const resisted = Math.ceil(-moveHpChange * 0.5);
        result.messages.push(`🧪 天气抗性药剂抵御了 ${resisted} 点伤害！`);
        moveHpChange = -Math.ceil(-moveHpChange * 0.5);
      }
      damageChance *= 0.3;
      damageAmount = Math.ceil(damageAmount * 0.5);
    } else {
      if (ignoreMoveBlock && moveBlockChance > 0) {
        result.messages.push('🧥 风行斗篷让你不受天气阻碍！');
        moveBlockChance = 0;
      }
      if (weatherDamageResist > 0 && moveHpChange < 0) {
        const resisted = Math.ceil(-moveHpChange * weatherDamageResist);
        result.messages.push(`🌟 星辰护符抵御了 ${resisted} 点伤害！`);
        moveHpChange = -Math.ceil(-moveHpChange * (1 - weatherDamageResist));
      }
      if (weatherDamageResist > 0) {
        damageAmount = Math.ceil(damageAmount * (1 - weatherDamageResist));
      }
    }

    if (moveBlockChance > 0 && Math.random() < moveBlockChance) {
      result.blocked = true;
      result.messages.push('⛔ 你被天气影响，无法移动！');
      return result;
    }

    if (moveHpChange !== 0) {
      result.hpChange = moveHpChange;
      player.stats.currentHp = Math.max(0, Math.min(
        CharacterSystem.getPlayerTotalStats(gameState).maxHp,
        player.stats.currentHp + moveHpChange
      ));
      if (moveHpChange > 0) {
        result.messages.push(`💚 天气效果恢复了 ${moveHpChange} 点生命！`);
      } else {
        result.messages.push(`💔 天气效果造成了 ${Math.abs(moveHpChange)} 点伤害！`);
      }
    }

    if (damageChance > 0 && Math.random() < damageChance) {
      result.extraDamage = damageAmount;
      player.stats.currentHp = Math.max(0, player.stats.currentHp - damageAmount);
      result.messages.push(`⚡ 闪电击中了你！造成 ${damageAmount} 点伤害！`);
    }

    this.tickWeatherShields(gameState.weatherState, 1);

    return result;
  }

  static applyCombatAttackMods(gameState, baseAttack, isPlayer) {
    const effects = this.getCombinedEffects(gameState.weatherState);
    const hasShield = this.hasWeatherShield(gameState.weatherState);
    const hasResist = this.hasWeatherResist(gameState.weatherState);
    const accessory = gameState.player.equipment.accessory || {};
    const weatherDamageResist = accessory.weatherDamageResist || 0;

    if (isPlayer) {
      let attackMod = effects.attackMod;
      if (hasShield && attackMod < 0) attackMod = 0;
      if (hasResist && attackMod < 0) attackMod = Math.ceil(attackMod * 0.5);
      return Math.max(1, baseAttack + attackMod);
    } else {
      let enemyAttackMod = effects.enemyAttackMod;
      if (hasShield && enemyAttackMod > 0) enemyAttackMod = 0;
      if (hasResist && enemyAttackMod > 0) enemyAttackMod = Math.ceil(enemyAttackMod * 0.5);
      if (weatherDamageResist > 0 && enemyAttackMod > 0) {
        enemyAttackMod = Math.ceil(enemyAttackMod * (1 - weatherDamageResist * 0.5));
      }
      return Math.max(1, baseAttack + enemyAttackMod);
    }
  }

  static applyCombatDefenseMods(gameState, baseDefense, isPlayer) {
    const effects = this.getCombinedEffects(gameState.weatherState);
    const hasShield = this.hasWeatherShield(gameState.weatherState);
    const hasResist = this.hasWeatherResist(gameState.weatherState);
    const accessory = gameState.player.equipment.accessory || {};
    const weatherDamageResist = accessory.weatherDamageResist || 0;

    if (isPlayer) {
      let defenseMod = effects.defenseMod;
      if (hasShield && defenseMod < 0) defenseMod = 0;
      if (hasResist && defenseMod < 0) defenseMod = Math.ceil(defenseMod * 0.5);
      return Math.max(0, baseDefense + defenseMod);
    } else {
      let enemyDefenseMod = effects.enemyDefenseMod;
      if (hasShield && enemyDefenseMod > 0) enemyDefenseMod = 0;
      if (hasResist && enemyDefenseMod > 0) enemyDefenseMod = Math.ceil(enemyDefenseMod * 0.5);
      if (weatherDamageResist > 0 && enemyDefenseMod > 0) {
        enemyDefenseMod = Math.ceil(enemyDefenseMod * (1 - weatherDamageResist * 0.5));
      }
      return Math.max(0, baseDefense + enemyDefenseMod);
    }
  }

  static applyCritChanceMod(gameState, baseCritChance) {
    const effects = this.getCombinedEffects(gameState.weatherState);
    const hasShield = this.hasWeatherShield(gameState.weatherState);
    const hasResist = this.hasWeatherResist(gameState.weatherState);
    
    let critChanceMod = effects.critChanceMod;
    if (hasShield && critChanceMod < 0) critChanceMod = 0;
    if (hasResist && critChanceMod < 0) critChanceMod *= 0.5;
    
    return Math.max(0.01, Math.min(0.5, baseCritChance + critChanceMod));
  }

  static applyExpBonus(gameState, baseExp) {
    const effects = this.getCombinedEffects(gameState.weatherState);
    const hasShield = this.hasWeatherShield(gameState.weatherState);
    
    let expBonus = effects.expBonus;
    if (hasShield) expBonus *= 1.2;
    
    return Math.floor(baseExp * (1 + expBonus));
  }

  static getModifiedViewRange(gameState, baseRange) {
    const effects = this.getCombinedEffects(gameState.weatherState);
    const hasShield = this.hasWeatherShield(gameState.weatherState);
    
    let viewRangeMod = effects.viewRangeMod;
    if (hasShield && viewRangeMod < 0) viewRangeMod = 0;
    
    return Math.max(2, baseRange + viewRangeMod);
  }

  static getWeatherMapClasses(weatherState) {
    const effects = this.getCombinedEffects(weatherState);
    return effects.mapClasses || [];
  }

  static triggerRandomWeather(weatherState, floor = 1, options = {}) {
    const {
      positiveBias = 0,
      negativeBias = 0,
      durationMultiplier = 1,
      allowDuplicate = false
    } = options;

    const availableWeathers = Object.values(WEATHER_DATA).filter(w => w.rarity > 0);
    if (availableWeathers.length === 0) return null;

    const weightedWeathers = availableWeathers.map(w => {
      let weight = w.rarity;
      const isPositive = w.effects.moveHpChange > 0 || w.effects.attackMod > 0 || w.effects.defenseMod > 0 || w.effects.expBonus > 0;
      
      if (isPositive) {
        weight *= (1 + positiveBias);
      } else {
        weight *= (1 + negativeBias);
      }
      
      if (!allowDuplicate && weatherState.activeWeathers.some(aw => aw.id === w.id)) {
        weight *= 0.2;
      }
      
      return { weather: w, weight };
    });

    const totalWeight = weightedWeathers.reduce((sum, w) => sum + w.weight, 0);
    let roll = Math.random() * totalWeight;
    let selected = null;

    for (const w of weightedWeathers) {
      roll -= w.weight;
      if (roll <= 0) {
        selected = w.weather;
        break;
      }
    }

    if (!selected) return null;

    const duration = Math.floor(this.generateWeatherDuration(floor) * durationMultiplier);
    const result = this.addWeather(weatherState, selected.id, duration);
    return result ? { ...result, weatherData: selected } : null;
  }

  static triggerWeatherById(weatherState, weatherId, duration = null) {
    if (!WEATHER_DATA[weatherId]) return null;
    const result = this.addWeather(weatherState, weatherId, duration);
    return result ? { ...result, weatherData: WEATHER_DATA[weatherId] } : null;
  }

  static getRandomWeatherByType(floor = 1, type = 'any') {
    const availableWeathers = Object.values(WEATHER_DATA).filter(w => w.rarity > 0);
    let filtered = availableWeathers;

    if (type === 'positive') {
      filtered = availableWeathers.filter(w => 
        w.effects.moveHpChange > 0 || w.effects.attackMod > 0 || w.effects.defenseMod > 0 || w.effects.expBonus > 0
      );
    } else if (type === 'negative') {
      filtered = availableWeathers.filter(w => 
        w.effects.moveHpChange < 0 || w.effects.attackMod < 0 || w.effects.defenseMod < 0 || w.effects.moveBlockChance > 0
      );
    }

    if (filtered.length === 0) return availableWeathers[Math.floor(Math.random() * availableWeathers.length)];

    const totalRarity = filtered.reduce((sum, w) => sum + w.rarity, 0);
    let roll = Math.random() * totalRarity;
    
    for (const weather of filtered) {
      roll -= weather.rarity;
      if (roll <= 0) return weather;
    }

    return filtered[0];
  }
}
